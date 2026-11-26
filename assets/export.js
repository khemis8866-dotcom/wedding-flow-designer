(()=>{'use strict';let fontPromise;
async function font(){if(!fontPromise)fontPromise=(async()=>{const data=window.OFFLINE_FONT?Uint8Array.from(atob(window.OFFLINE_FONT),c=>c.charCodeAt(0)) :new Uint8Array(await (await fetch('assets/chinese.otf')).arrayBuffer());const face=await new FontFace('WeddingExport',data).load();document.fonts.add(face);return data;})().catch(e=>{fontPromise=null;throw new Error('中文字体加载失败，请检查网络或使用免费离线版');});return fontPromise;}
const makeCanvas=()=>{const c=document.createElement('canvas');c.width=1200;c.height=1697;return c;};
function wrap(ctx,value,width,size=24,weight='normal'){ctx.font=`${weight} ${size}px WeddingExport,sans-serif`;const lines=[];for(const paragraph of String(value??'').split('\n')){let row='';for(const char of paragraph){if(row&&ctx.measureText(row+char).width>width){lines.push(row);row='';}row+=char;}lines.push(row);}return lines;}
function drawText(ctx,x,y,lines,size=24,color='#566052',weight='normal',leading=1.5){ctx.fillStyle=color;ctx.font=`${weight} ${size}px WeddingExport,sans-serif`;lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*leading));}
function flower(ctx,x,y,flip=1){ctx.save();ctx.translate(x,y);ctx.scale(flip,1);ctx.strokeStyle='#b9a47d';ctx.globalAlpha=.6;ctx.lineWidth=1.4;const branch=new Path2D('M0 0 Q-40 80 -9 160 Q15 190 38 223 M-9 155 Q-62 145 -67 99 M-15 110 Q28 90 38 45 M0 184 Q-35 190 -52 163 M-28 66 Q-84 20 -74 -4 Q-26 7 -28 66 M-33 116 Q-82 100 -83 62 Q-38 64 -33 116 M11 165 Q61 121 50 94 Q11 114 11 165 M25 207 Q83 197 90 161 Q42 163 25 207');ctx.stroke(branch);ctx.translate(39,36);for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,12,27,Math.PI*i/3,0,Math.PI*2);ctx.stroke();}ctx.restore();}
async function image(blob){if(!blob)return null;return createImageBitmap(blob);}
async function plan(p,template='romantic',logoBlob){
 await font();
 const width=2400,baseHeight=1697,margin=85,gap=100,columnWidth=(width-margin*2-gap)/2;
 const measure=makeCanvas(),ctx=measure.getContext('2d'),logo=await image(logoBlob),romantic=template==='romantic';
 const title=wrap(ctx,p.title,width-2*margin-190,64,'600'),meta=wrap(ctx,p.date+(p.venue?'  /  '+p.venue:''),width-2*margin-200,26),theme=wrap(ctx,p.theme,width-2*margin,24).filter(Boolean);
 const top=110+title.length*92+meta.length*42+theme.length*36+50;
 const logoSize=logo?WeddingCore.logoDimensions(logo.width,logo.height,p.brand.logoScale):null;
 const brandLines=[...wrap(ctx,p.brand.name,width-2*margin-420-(logoSize?logoSize.width+35:0),21),...wrap(ctx,p.brand.contact,width-2*margin-420-(logoSize?logoSize.width+35:0),21),...wrap(ctx,p.brand.signoff,width-2*margin-420-(logoSize?logoSize.width+35:0),21)].filter(Boolean);
 const footer=Math.max(115,brandLines.length*31+55,logoSize?logoSize.height+65:0);
 const rows=p.rows.map(row=>{
  const names=wrap(ctx,`${String(row.index).padStart(2,'0')}  ${row.name}`,columnWidth-175,29,'600');
  const lines=row.lines.flatMap(line=>wrap(ctx,line,columnWidth-175,23));
  const head=names.length*43+13,height=Math.max(row.start?.includes(' ')?112:84,head+lines.length*34+24);
  return {...row,names,lines,head,height};
 });
 // Keep each section intact, in reading order: down the left column, then down the right.
 const space=22,weights=rows.map(row=>row.height+space),sum=weights.reduce((a,b)=>a+b,0);
 let split=rows.length<=1?rows.length:1,best=Infinity,left=0;
 for(let i=1;i<rows.length;i++){left+=weights[i-1];const score=Math.max(left,sum-left);if(score<best){best=score;split=i;}}
 const columnHeights=[weights.slice(0,split).reduce((a,b)=>a+b,0),weights.slice(split).reduce((a,b)=>a+b,0)];
 const height=Math.max(baseHeight,Math.ceil(top+Math.max(...columnHeights,0)+footer+65));
 if(height>10000){logo?.close();throw new Error('单页内容过长，请减少导出备注或改用Word保留全文');}
 const bottom=height-footer-45;let y=top;
 rows.forEach((row,i)=>{if(i===split)y=top;row.column=i<split?0:1;row.x=margin+row.column*(columnWidth+gap);row.y=y;y+=row.height+space;});
 measure.width=measure.height=0;
 return {p,template,romantic,logo,logoSize,brandLines,bottom,top,title,meta,theme,pages:[rows],width,height,columnWidth,split};
}
function draw(layout,pageIndex=0,scale=1,omitLogo=false){
 const {p,romantic,logo,logoSize,brandLines,bottom,top,title,meta,theme,pages,width,height,columnWidth}=layout;
 const c=makeCanvas();c.width=Math.round(width*scale);c.height=Math.round(height*scale);const ctx=c.getContext('2d');ctx.scale(scale,scale);
 ctx.fillStyle=romantic?'#fbf8f0':'#fff';ctx.fillRect(0,0,width,height);
 if(romantic){ctx.strokeStyle='#d9c9aa';ctx.strokeRect(34,34,width-68,height-68);flower(ctx,width-85,85,-1);}
 else{ctx.fillStyle='#354d41';ctx.fillRect(0,0,width,20);ctx.fillStyle='#afa17f';ctx.fillRect(70,62,7,62);}
 drawText(ctx,85,135,title,64,romantic?'#4a4437':'#273f30','600');
 const metaY=135+title.length*92;drawText(ctx,85,metaY,meta,26,'#837860');drawText(ctx,85,metaY+meta.length*42,theme,24,'#987d50');
 drawText(ctx,85,top-33,[`${p.rows.length} 个环节  /  ${p.total} 分钟`],21,'#8a7c64');
 ctx.strokeStyle=romantic?'#e1d5bd':'#e2e7df';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(width/2,top-10);ctx.lineTo(width/2,bottom-5);ctx.stroke();
 for(const row of pages[pageIndex]){
  const {x,y,height:rowHeight,head}=row,clocks=(row.start||'').split(' '),contentX=x+155;
  if(romantic){ctx.strokeStyle='#d6c4a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+125,y);ctx.lineTo(x+125,y+rowHeight+22);ctx.stroke();ctx.fillStyle='#b19a6d';ctx.beginPath();ctx.arc(x+125,y+15,6,0,Math.PI*2);ctx.fill();}
  else{ctx.fillStyle=row.index%2?'#f0f1ec':'#f8f8f4';ctx.beginPath();ctx.roundRect(x-15,y-13,columnWidth+15,rowHeight+7,8);ctx.fill();ctx.strokeStyle='#d8ded4';ctx.beginPath();ctx.moveTo(x+130,y-13);ctx.lineTo(x+130,y+rowHeight-6);ctx.stroke();}
  drawText(ctx,x,y+23,clocks,23,romantic?'#977846':'#354d41',romantic?'normal':'600');
  drawText(ctx,x,y+(clocks.length>1?96:65),[`${row.duration}分钟`],21,romantic?'#9c8d72':'#6f8171');
  drawText(ctx,contentX,y+23,row.names,29,romantic?'#403b31':'#303c33','600');
  drawText(ctx,contentX,y+head+20,row.lines,23,romantic?'#70654f':'#5e705f');
 }
 ctx.strokeStyle='#ddd5c6';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(85,bottom+12);ctx.lineTo(width-85,bottom+12);ctx.stroke();
 if(logo&&!omitLogo){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(logo,85,bottom+34,logoSize.width,logoSize.height);}
 drawText(ctx,logoSize?120+logoSize.width:85,bottom+49,brandLines,21,'#80735b');
 ctx.textAlign='right';drawText(ctx,width-85,height-85,['婚礼仪式全流程',`流程版本 ${p.exportVersion||1}`],21,'#8e816c');ctx.textAlign='left';return c;
}
const blob=(canvas,type='image/png')=>new Promise((res,rej)=>canvas.toBlob(v=>v?res(v):rej(new Error('图片生成失败')),type,.94));
async function images(p,template,logo,progress=()=>{}){const layout=await plan(p,template,logo),out=[];try{for(let i=0;i<layout.pages.length;i++){const c=draw(layout,i);out.push(await blob(c));c.width=c.height=0;progress(i+1,layout.pages.length);await new Promise(r=>setTimeout(r,0));}return out;}finally{layout.logo?.close();}}
async function pdf(p,template,logo,progress=()=>{}){const layout=await plan(p,template,logo),doc=await PDFLib.PDFDocument.create();doc.setTitle(p.title);doc.setCreator('婚礼流程设计师 免费网页版');try{for(let i=0;i<layout.pages.length;i++){const c=draw(layout,i,1,true),jpg=await blob(c,'image/jpeg');c.width=c.height=0;const pic=await doc.embedJpg(await jpg.arrayBuffer());const page=doc.addPage([1190.55,1190.55*layout.height/layout.width]);page.drawImage(pic,{x:0,y:0,width:1190.55,height:1190.55*layout.height/layout.width});if(logo){const bytes=new Uint8Array(await logo.arrayBuffer()),original=bytes[0]===137?await doc.embedPng(bytes):await doc.embedJpg(bytes),factor=1190.55/layout.width;page.drawImage(original,{x:85*factor,y:(layout.height-layout.bottom-34-layout.logoSize.height)*factor,width:layout.logoSize.width*factor,height:layout.logoSize.height*factor});}progress(i+1,layout.pages.length);}return new Blob([await doc.save()],{type:'application/pdf'});}finally{layout.logo?.close();}}
async function word(p,logoBlob){const fontData=await font();const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,HeadingLevel,ImageRun,Footer}=docx;const para=(value,compact=false)=>new Paragraph({children:String(value??'').split('\n').map((text,i)=>new TextRun({text,break:i?1:0,font:{ascii:'Noto Sans CJK SC',eastAsia:'Noto Sans CJK SC',hAnsi:'Noto Sans CJK SC'},size:21})),spacing:{after:compact?30:100,line:compact?255:300}});const cell=(children,width,head=false)=>new TableCell({width:{size:width,type:WidthType.DXA},margins:{top:100,bottom:100,left:140,right:140},shading:{fill:head?'E9ECE6':'FFFFFF'},verticalAlign:'center',children});const rows=[new TableRow({tableHeader:true,children:[cell([para('预计时间',true)],1400,true),cell([para('环节与时长',true)],2500,true),cell([para('执行细节',true)],5700,true)]})];for(const row of p.rows)rows.push(new TableRow({cantSplit:row.lines.join('').length<180,children:[cell([para(row.start||'—',true)],1400),cell([para(`${row.index}. ${row.name}`,true),para(`${row.duration}分钟`,true)],2500),cell((row.lines.length?row.lines:['—']).map(line=>para(line,true)),5700)]}));const children=[new Paragraph({text:p.title,heading:HeadingLevel.TITLE}),para(p.date+'  '+p.venue),...(p.theme?[para(p.theme)]:[]),para(`${p.rows.length} 个环节 · ${p.total} 分钟`),new Table({width:{size:9600,type:WidthType.DXA},columnWidths:[1400,2500,5700],rows,borders:Object.fromEntries(['top','bottom','left','right','insideHorizontal','insideVertical'].map(k=>[k,{style:'single',size:4,color:'D9D9D9'}]))})];if(logoBlob){const logo=await image(logoBlob),size=WeddingCore.logoDimensions(logo.width,logo.height,p.brand.logoScale),data=new Uint8Array(await logoBlob.arrayBuffer());children.push(new Paragraph({children:[new ImageRun({type:data[0]===137?'png':'jpg',data,transformation:{width:Math.round(size.width),height:Math.round(size.height)}})]}));logo.close();}for(const text of [p.brand.name,p.brand.contact,p.brand.signoff].filter(Boolean))children.push(para(text));return Packer.toBlob(new Document({creator:p.brand.name||'婚礼流程设计师',title:p.title,fonts:[{name:'Noto Sans CJK SC',data:fontData}],styles:{default:{document:{run:{font:'Noto Sans CJK SC',size:21,color:'222222'}}},paragraphStyles:[{id:'Title',name:'Title',basedOn:'Normal',run:{size:52,bold:true,color:'000000'},paragraph:{spacing:{after:240}}}]},sections:[{footers:{default:new Footer({children:[new Paragraph({alignment:'right',children:[new TextRun({text:'婚礼仪式全流程',font:'Noto Sans CJK SC',size:18,color:'80735B'})]}),new Paragraph({alignment:'right',children:[new TextRun({text:`流程版本 ${p.exportVersion||1}`,font:'Noto Sans CJK SC',size:18,color:'80735B'})]})]})},properties:{page:{size:{width:11906,height:16838},margin:{top:1000,bottom:1000,left:1153,right:1153}}},children}]}));}
window.WExport={plan,draw,images,pdf,word,font};})();
