(()=>{'use strict';
const DB='wedding-flow-web-v1',STORE='workspace',FILES='files';let connection;
function open(){if(!connection)connection=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(STORE);r.result.createObjectStore(FILES);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return connection;}
async function get(store,key){const db=await open();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function putFile(id,blob){const db=await open();return new Promise((res,rej)=>{const t=db.transaction(FILES,'readwrite');t.objectStore(FILES).put(blob,id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('文件保存失败'));});}
async function save(state,base,files=[]){const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction([STORE,FILES],'readwrite');const s=t.objectStore(STORE);let failure;const r=s.get('main');r.onsuccess=()=>{const current=r.result;if((current?.revision||0)!==base){failure=new Error('另一个页面已修改资料。本页草稿已保留，请先备份本页，再重新载入。');failure.code='CONFLICT';t.abort();return;}const next={...state,revision:base+1};s.put(next,'main');for(const f of files)t.objectStore(FILES).put(f.blob,f.id);};t.oncomplete=()=>resolve(base+1);t.onerror=()=>reject(failure||t.error);t.onabort=()=>reject(failure||t.error||new Error('浏览器保存失败'));});}
async function removeFile(id){const db=await open();return new Promise((res,rej)=>{const t=db.transaction(FILES,'readwrite');t.objectStore(FILES).delete(id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
function empty(){return {version:1,revision:0,weddings:[],assets:[],brand:{name:'',contact:'',signoff:'',logo:''},exports:[]};}
async function load(){return await get(STORE,'main')||empty();}
async function storage(){try{const e=await navigator.storage?.estimate();return {usage:e?.usage||0,quota:e?.quota||0,persisted:await navigator.storage?.persisted?.()};}catch{return {usage:0,quota:0};}}
async function protect(){return navigator.storage?.persist?await navigator.storage.persist():false;}
window.WStore={load,save,putFile,getFile:id=>get(FILES,id),removeFile,storage,protect,empty};
})();
