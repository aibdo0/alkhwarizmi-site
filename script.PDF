
const DEFAULT_API = localStorage.getItem("kh_api") || "";
const DEFAULT_KEY = localStorage.getItem("kh_key") || "";
const statuses=["تم استلام المستندات","تم إنهاء الإجراءات","تم شحن السيارة","وصلت ميناء سفاجا","جاري التخليص الجمركي","تم إنهاء الفحص","تم تسجيل 46","تم إنهاء المعاينة","تم إنهاء التتمين","تم الاعتماد","تم دفع الفاتورة","تم تسليم الإخطار","تم الإفراج عن السيارة","خرجت من الميناء","تم التسليم"];
document.addEventListener("DOMContentLoaded",()=>{
 const y=document.getElementById("year"); if(y)y.textContent=new Date().getFullYear();
 const sel=document.getElementById("carStatus"); if(sel) statuses.forEach((s,i)=>{const o=document.createElement("option");o.value=i;o.textContent=(i+1)+". "+s;sel.appendChild(o)});
 const cfg=document.getElementById("apiUrl"); if(cfg)cfg.value=DEFAULT_API;
 const key=document.getElementById("adminKey"); if(key)key.value=DEFAULT_KEY;
 const save=document.getElementById("saveConfig"); if(save)save.onclick=()=>{localStorage.setItem("kh_api",cfg.value.trim());localStorage.setItem("kh_key",key.value.trim());alert("تم حفظ إعدادات الربط على هذا الجهاز");};
 const sf=document.getElementById("trackForm"); if(sf)sf.addEventListener("submit",async e=>{e.preventDefault();showTrack(document.getElementById("trackCode").value.trim())});
 const sb=document.getElementById("saveCar"); if(sb)sb.onclick=saveCar;
});
async function apiGet(params){
 const url=localStorage.getItem("kh_api"); if(!url) throw new Error("لم يتم وضع رابط قاعدة البيانات في لوحة التحكم");
 const u=new URL(url); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v)); 
 const r=await fetch(u.toString(),{method:"GET",cache:"no-store"}); return await r.json();
}
function render(data,target){
 if(!data || !data.ok){target.innerHTML='<div class="notice" style="margin-top:18px">لم يتم العثور على الملف. تأكد من رقم الملف.</div>';return;}
 const current=Number(data.statusIndex||0); let h=`<div class="card status"><h3>${escapeHtml(data.code||"")}</h3><p><b>العميل:</b> ${escapeHtml(data.clientName||"—")}<br><b>السيارة:</b> ${escapeHtml(data.carInfo||"—")}</p>`;
 statuses.forEach((s,i)=>h+=`<div class="step ${i<=current?"done":""}"><span class="dot"></span><div><strong>${i+1}. ${s}</strong>${i===current?'<div class="small">آخر مرحلة مسجلة</div>':""}</div></div>`);
 if(data.note)h+=`<div class="notice" style="margin-top:15px">${escapeHtml(data.note)}</div>`; h+="</div>"; target.innerHTML=h;
}
async function showTrack(code){
 const t=document.getElementById("trackResult"); if(!t)return; t.innerHTML='<div class="notice">جاري البحث...</div>';
 try{const data=await apiGet({action:"get",code});render(data,t)}catch(e){t.innerHTML=`<div class="notice">نظام التتبع غير مربوط بعد. افتح لوحة التحكم وأضف رابط Google Apps Script.</div>`}
}
async function saveCar(){
 const msg=document.getElementById("adminMsg"); msg.innerHTML='<div class="notice">جاري الحفظ...</div>';
 try{const data=await apiGet({action:"save",key:localStorage.getItem("kh_key")||"",code:document.getElementById("carCode").value.trim(),clientName:document.getElementById("clientName").value.trim(),carInfo:document.getElementById("carInfo").value.trim(),statusIndex:document.getElementById("carStatus").value,note:document.getElementById("carNote").value.trim()});msg.innerHTML=`<div class="notice">${escapeHtml(data.message||"تم الحفظ")}</div>`}catch(e){msg.innerHTML='<div class="notice">تعذر الاتصال. تأكد من رابط Apps Script والمفتاح.</div>'}
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
