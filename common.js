(function(){
const C=window.OPU;
const SLOTS={am:{label:'오전 10:00 ~ 12:00',short:'오전 10시',tag:'오전'},pm:{label:'오후 2:00 ~ 4:00',short:'오후 2시',tag:'오후'}};
const WD=['일','월','화','수','목','금','토'];
// 시간을 직접 입력한 예약(start·end가 있음)은 그 시간으로, 아니면 기본 칸 이름으로 표시
const t12=t=>{const[h,m]=t.split(':').map(Number);return{ap:h<12?'오전':'오후',h:h>12?h-12:h,m}};
function SL(x){
  if(!x||!x.start)return SLOTS[x&&x.slot]||SLOTS.am;
  const a=t12(x.start),b=t12(x.end),mm=t=>t.m?':'+String(t.m).padStart(2,'0'):'';
  const sh=a.ap+' '+a.h+mm(a)+'시~'+(b.ap!==a.ap?b.ap+' ':'')+b.h+mm(b)+'시';
  return{label:a.ap+' '+a.h+':'+String(a.m).padStart(2,'0')+' ~ '+(b.ap!==a.ap?b.ap+' ':'')+b.h+':'+String(b.m).padStart(2,'0'),short:sh,tag:sh};
}
const HEART='<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>';
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=k=>{const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmt=k=>{const d=parse(k);return (d.getMonth()+1)+'월 '+d.getDate()+'일('+WD[d.getDay()]+')'};
const fmtShort=k=>{const d=parse(k);return (d.getMonth()+1)+'/'+d.getDate()+' '+WD[d.getDay()]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heart=(full,cls='')=>`<svg class="hrt ${full?'full':''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${HEART}</svg>`;
const brand=sub=>`<div class="brand"><img src="logo.jpg" alt="원포인트업 로고"><div><b>ONE POINT UP</b>${sub?`<br><span>${sub}</span>`:''}</div></div>`;
const foot=()=>`<div class="foot"><span>예약이 어렵거나 변경이 필요하시면 연락 주세요</span><a class="tel" href="tel:${C.PHONE.replace(/-/g,'')}">${C.PHONE} <span>전화 걸기</span></a><span>${C.EMAIL}</span></div>`;
const loading=t=>`<div class="loading"><i></i><i></i><i></i><div style="margin-top:8px">${t||'불러오는 중입니다'}</div></div>`;
const READ=['slots','my','admin_list','admin_slots','admin_check'];
async function api(action,data,retry){
  // 구글 서버가 가끔 오류 화면을 돌려줄 때가 있어, 조회는 한 번 더 자동으로 시도
  try{return await api1(action,data)}
  catch(e){if(!retry&&READ.includes(action)&&(e.net||e.bad))return api(action,data,true);throw e}
}
async function api1(action,data){
  let r;
  try{
    r=await fetch(C.API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action},data||{}))});
  }catch(e){throw Object.assign(new Error('인터넷 연결을 확인하고 다시 시도해 주세요.'),{net:true})}
  let j;try{j=await r.json()}catch(e){throw Object.assign(new Error('서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.'),{bad:true})}
  if(!j.ok)throw Object.assign(new Error(j.error||'문제가 생겼습니다.'),j);
  return j;
}
function syncing(on){let el=document.getElementById('syncbar');if(on){if(!el){el=document.createElement('div');el.id='syncbar';el.className='syncbar';el.textContent='최신 정보 확인 중…';document.body.appendChild(el)}}else if(el)el.remove()}
function toast(t){const el=document.createElement('div');el.className='toast';el.textContent=t;document.body.appendChild(el);setTimeout(()=>el.remove(),2400)}
function copy(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('복사되었습니다'),()=>toast('길게 눌러 직접 복사해 주세요'))}
  else toast('길게 눌러 직접 복사해 주세요');
}
const store={get(k){try{return JSON.parse(localStorage.getItem('opu-'+k))}catch(e){return null}},set(k,v){try{localStorage.setItem('opu-'+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem('opu-'+k)}catch(e){}}};
window.U={C,SLOTS,SL,WD,HEART,key,parse,addDays,fmt,fmtShort,esc,heart,brand,foot,loading,api,toast,copy,store,syncing};
})();
