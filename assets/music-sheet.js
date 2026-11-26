(()=>{'use strict';
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function previewUrl(value){
 const text=String(value??'').trim();if(!text)return '';
 if(text.length>2048)throw new Error('飞书链接过长，请只粘贴分享网址');
 let url;try{url=new URL(text);}catch{throw new Error('请粘贴完整的 https:// 飞书分享链接');}
 const host=url.hostname.toLowerCase(),validHost=['feishu.cn','feishu.com','larksuite.com'].some(domain=>host===domain||host.endsWith('.'+domain));
 if(url.protocol!=='https:'||!validHost||url.username||url.password||/[\u0000-\u0020]/.test(text))throw new Error('请使用飞书或Lark的HTTPS分享链接');
 return url.href;
}
function rows(wedding,assets){
 const map=new Map(assets.map(a=>[a.id,a])),out=[];
 for(const section of WeddingCore.timeline(wedding)){
  const sorted=section.music.map((m,i)=>({m,i,order:m.stepId?section.steps.findIndex(t=>t.id===m.stepId)+1:0})).sort((a,b)=>a.order-b.order||a.i-b.i);
  if(!sorted.length){out.push({index:out.length+1,start:section.start,section:section.name,step:'整个主环节',name:'待安排音乐',usage:'',cue:'',url:'',status:'未安排音乐'});continue;}
  for(const {m} of sorted){const asset=map.get(m.assetId);if(!asset)throw new Error('音乐文件不存在：'+section.name);
   let url;try{url=previewUrl(m.previewUrl||asset.previewUrl||'');}catch(e){throw new Error(section.name+' / '+asset.name+'：'+e.message);}
   out.push({index:out.length+1,start:section.start,section:section.name,step:section.steps.find(t=>t.id===m.stepId)?.name||'整个主环节',name:asset.name,usage:m.usage,cue:m.cue,url,status:url?'点击音乐名称试听':'待填写飞书链接'});
  }
 }
 return out;
}
async function create(wedding,assets,exportVersion=WeddingCore.nextExportVersion(wedding)){
 const list=rows(wedding,assets),ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main',rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
 const str=(ref,value,style=0)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
 const number=(ref,value)=>`<c r="${ref}" s="3"><v>${value}</v></c>`;
 const data=[`<row r="2" ht="36" customHeight="1">${str('A2',`${wedding.bride} & ${wedding.groom} 婚礼音乐清单`,1)}</row>`,`<row r="3" ht="25" customHeight="1">${str('A3',`${wedding.date}  ${wedding.venue}`,2)}</row>`,`<row r="4" ht="25" customHeight="1">${str('A4','点击蓝色音乐名称打开飞书试听页面。无法打开时，请联系主持人确认分享权限。',2)}</row>`];
 const headers=['序号','预计开始','流程环节','音乐名称（点击试听）','播放提示'];
 data.push(`<row r="6" ht="30" customHeight="1">${headers.map((v,i)=>str(String.fromCharCode(65+i)+'6',v,4)).join('')}</row>`);
 const links=[],rels=[];
 list.forEach((r,i)=>{const n=i+7,values=[r.index,r.start,r.section,r.name,r.cue];
  const widths=[7,13,25,46,58],height=Math.max(36,...values.map((v,j)=>Math.ceil([...String(v)].reduce((sum,c)=>sum+(c.charCodeAt(0)>255?2:1),0)/widths[j])*17+14));
  data.push(`<row r="${n}" ht="${Math.min(409,height)}" customHeight="1">${values.map((v,j)=>j===0?number('A'+n,v):str(String.fromCharCode(65+j)+n,v,j===3&&r.url?5:0)).join('')}</row>`);
  if(r.url){const id='rId'+(links.length+1);links.push(`<hyperlink ref="D${n}" r:id="${id}" display="${xml(r.name)}" tooltip="打开飞书试听页面"/>`);rels.push(`<Relationship Id="${id}" Type="${rel}/hyperlink" Target="${xml(r.url)}" TargetMode="External"/>`);}
 });
 const widths=[7,13,25,46,58],last=Math.max(6,list.length+6);
 const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${ns}" xmlns:r="${rel}"><dimension ref="A1:E${last}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"><pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${data.join('')}</sheetData><autoFilter ref="A6:E${last}"/>${links.length?'<hyperlinks>'+links.join('')+'</hyperlinks>':''}<pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;R婚礼仪式全流程&#10;流程版本 ${exportVersion}</oddFooter></headerFooter></worksheet>`;
 const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${ns}"><fonts count="5"><font><sz val="11"/><color rgb="FF273C31"/><name val="Arial"/></font><font><b/><sz val="20"/><color rgb="FF273C31"/><name val="Arial"/></font><font><sz val="11"/><color rgb="FF687469"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF334B3E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF5D8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="hair"><color rgb="FFE2E6DC"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="1" fillId="0" borderId="0" xfId="0"/><xf fontId="2" fillId="0" borderId="0" xfId="0"/><xf fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf fontId="3" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fontId="4" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
 const files={
  '[Content_Types].xml':`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
  '_rels/.rels':`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml':`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${ns}" xmlns:r="${rel}"><bookViews><workbookView/></bookViews><sheets><sheet name="婚礼音乐清单" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels':`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/></Relationships>`,
  'xl/styles.xml':styles,'xl/worksheets/sheet1.xml':sheet,
  'xl/worksheets/_rels/sheet1.xml.rels':`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`
 };
 const zip=await WZip.create(Object.entries(files).map(([name,text])=>({name,blob:new Blob([text],{type:'application/xml'})})));
 return new Blob([zip],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
window.WMusicSheet={previewUrl,rows,create};
})();
