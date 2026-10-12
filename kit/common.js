(function(){
// 주소의 ?k= 값으로 각자의 구글 앱스 스크립트 서버에 연결 (사람마다 데이터가 완전히 따로 저장됨)
const qs=new URLSearchParams(location.search);
const K=(qs.get('k')||'').replace(/[^\w-]/g,'');
const C={K,API:'https://script.google.com/macros/s/'+K+'/exec',NAME:'',WORD:'상담',HON:'님',PHONE:'',EMAIL:'',PAY:null,LOGO:'',REPEAT_MAX:4,HOURS:2};
const SLOTS={};
const WD=['일','월','화','수','목','금','토'];
const HEART='<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>';
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=k=>{const[a,b,c]=k.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmt=k=>{const d=parse(k);return (d.getMonth()+1)+'월 '+d.getDate()+'일('+WD[d.getDay()]+')'};
const fmtShort=k=>{const d=parse(k);return (d.getMonth()+1)+'/'+d.getDate()+' '+WD[d.getDay()]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heart=(full,cls='')=>`<svg class="hrt ${full?'full':''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${HEART}</svg>`;
const logo=()=>C.LOGO?`<img src="${esc(C.LOGO)}" alt="">`:`<span class="mono">${esc((C.NAME||'예').trim().charAt(0))}</span>`;
const brand=sub=>`<div class="brand">${logo()}<div><b>${esc(C.NAME)}</b>${sub?`<br><span>${sub}</span>`:''}</div></div>`;
const foot=()=>`<div class="foot"><span>예약이 어렵거나 변경이 필요하시면 연락 주세요</span>${C.PHONE?`<a class="tel" href="tel:${C.PHONE.replace(/-/g,'')}">${esc(C.PHONE)} <span>전화 걸기</span></a>`:''}${C.EMAIL?`<span>${esc(C.EMAIL)}</span>`:''}</div>`;
const loading=t=>`<div class="loading"><i></i><i></i><i></i><div style="margin-top:8px">${t||'불러오는 중입니다'}</div></div>`;
const READ=['config','slots','my','admin_list','admin_slots','admin_check'];
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
function copyOld(text){try{const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok}catch(e){return false}}
function copy(text){
  const fb=()=>toast(copyOld(text)?'복사되었습니다':'길게 눌러 직접 복사해 주세요');
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('복사되었습니다'),fb)}else fb();
}
const PFX='bk-'+K.slice(-10)+'-';
const store={get(k){try{return JSON.parse(localStorage.getItem(PFX+k))}catch(e){return null}},set(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(PFX+k)}catch(e){}}};
// 서버의 [설정] 값을 화면에 반영
const h12=hm=>{let[h,m]=hm.split(':').map(Number);const pm=h>=12;const hh=h%12||12;return{ap:pm?'오후':'오전',t:hh+':'+pad(m),s:hh+'시'+(m?' '+m+'분':'')}};
function apply(cfg){
  Object.assign(C,{NAME:cfg.name||'',WORD:cfg.word||'상담',HON:cfg.hon||'님',PHONE:cfg.phone||'',EMAIL:cfg.email||'',PAY:cfg.pay||null,LOGO:cfg.logo||'',REPEAT_MAX:cfg.repeat||4});
  const sl=cfg.slots||{am:{start:'10:00',end:'12:00'},pm:{start:'14:00',end:'16:00'}};
  ['am','pm'].forEach(k=>{const a=h12(sl[k].start),b=h12(sl[k].end);const eh=+sl[k].end.split(':')[0];SLOTS[k]={label:a.ap+' '+a.t+' ~ '+(a.ap==='오전'&&eh>12?'오후 ':'')+b.t,short:a.ap+' '+a.s,tag:k==='am'?'오전':'오후'}});
  const mins=hm=>{const[h,m]=hm.split(':').map(Number);return h*60+m};
  const d=mins(sl.am.end)-mins(sl.am.start);C.HOURS=d%60?Math.round(d/6)/10:d/60;
  if(C.LOGO){['icon','apple-touch-icon'].forEach(r=>{const l=document.createElement('link');l.rel=r;l.href=C.LOGO;document.head.appendChild(l)})}
}
const ready=new Promise(res=>{
  if(!K){document.getElementById('app').innerHTML='<div class="errbox" style="margin-top:40px">주소가 올바르지 않습니다. 받으신 링크를 처음부터 끝까지 다시 열어 주세요.</div>';return}
  const cached=store.get('cfg');
  const fresh=()=>api('config').then(cfg=>{store.set('cfg',cfg);return cfg});
  if(cached){apply(cached);res();fresh().then(apply).catch(()=>{});return}
  document.getElementById('app').innerHTML=loading();
  fresh().then(cfg=>{apply(cfg);res()}).catch(e=>{document.getElementById('app').innerHTML=`<div class="errbox" style="margin-top:40px">${esc(e.message)}<br><button class="btn sm" onclick="location.reload()">다시 불러오기</button></div>`});
});
window.U={C,SLOTS,WD,HEART,key,parse,addDays,fmt,fmtShort,esc,heart,brand,foot,loading,api,toast,copy,store,syncing,ready};
})();
