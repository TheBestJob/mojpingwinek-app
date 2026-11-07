import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,collection,addDoc,deleteDoc,doc,onSnapshot,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {firebaseConfig} from "./firebase-config.js";

const API_ROOT = "https://moj-pingwinek-api.dj-janev.workers.dev";
const $=s=>document.querySelector(s);
async function documentApi(method,path,body=null,filename=""){
 const current=auth?.currentUser;
 if(!current) throw new Error("Zaloguj się ponownie.");
 const token=await current.getIdToken();
 const headers={"Authorization":"Bearer "+token};
 if(body){headers["Content-Type"]=body.type;headers["X-File-Name"]=encodeURIComponent(filename);}
 const res=await fetch(API_ROOT+path,{method,headers,body});
 if(!res.ok){let msg="Serwer dokumentów: HTTP "+res.status;try{let data=await res.json();if(data.error)msg=data.error}catch{}throw new Error(msg)}
 if(res.status===204)return null;
 return method==="GET"&&path!=="/files"?res.blob():res.json();
}
async function refreshDocuments(){
 if(!user)return;
 try{const data=await documentApi("GET","/files");documents=data.files||[];render();}
 catch(e){documents=[];notice(errText(e),true);render();}
}

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let auth,db,storage,user=null,view='home',mode='login',events=[],notes=[],documents=[],unsubs=[],selectedDate=localDate(),month=Number(selectedDate.slice(5,7))-1,year=Number(selectedDate.slice(0,4)),filter='Wszystkie',search='';
const tabs=[['home','Pulpit','⌂'],['docs','Dokumenty','▤'],['calendar','Kalendarz','▦'],['journal','Dziennik','✎'],['more','Więcej','☰']];
const titles={home:'Dzień dobry! 👋',docs:'Dokumenty',calendar:'Kalendarz',journal:'Dziennik obserwacji',more:'Więcej możliwości',passport:'Paszport medyczny',specialists:'Specjaliści',support:'Wsparcie dla rodzica',notifications:'Powiadomienia',formalities:'Poradnik formalności',school:'Specjaliści w szkole',community:'Społeczność',settings:'Ustawienia',addnote:'Nowa obserwacja',addevent:'Dodaj wydarzenie',medical:'Dokumentacja medyczna',contacts:'Ważne kontakty',deadlines:'Terminy i formalności',account:'Moje konto'};
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function notice(msg,error=false){const e=$('#global-msg');e.textContent=msg;e.classList.toggle('error',error);e.classList.remove('hide');clearTimeout(notice.timer);notice.timer=setTimeout(()=>e.classList.add('hide'),4500)}
function errText(e){return {'auth/invalid-credential':'Niepoprawny e-mail lub hasło.','auth/email-already-in-use':'Konto z takim adresem już istnieje.','auth/weak-password':'Hasło jest za słabe.','auth/too-many-requests':'Zbyt wiele prób. Spróbuj później.','permission-denied':'Brak dostępu. Sprawdź reguły Firestore.','storage/unauthorized':'Brak dostępu do pliku. Sprawdź reguły Storage.','storage/quota-exceeded':'Wyczerpano limit przestrzeni Firebase.'}[e?.code]||'Błąd: '+(e?.message||e)}
function stop(){for(const fn of unsubs)fn();unsubs=[];events=[];notes=[];documents=[]}
function authScreen(show){$('#auth-view').classList.toggle('hide',!show);$('#app').classList.toggle('hide',show);$('#bottom').classList.toggle('hide',show);$('#bell').disabled=show}
function setUser(u){stop();user=u;if(!u){authScreen(true);$('#hero-title').textContent='Mój Pingwinek 5.1';$('#hero-sub').textContent='Zaloguj się lub utwórz konto';$('#cloud-status').textContent='Bezpieczna sesja jest wylogowana';return}
authScreen(false);$('#cloud-status').textContent='☁ Połączono · '+(u.email||'konto');view='home';render();
for(const [type,assign] of [['events',arr=>events=arr],['notes',arr=>notes=arr]]){
const subscription=onSnapshot(collection(db,'users',u.uid,type),snap=>{if(user?.uid!==u.uid)return;assign(snap.docs.map(d=>({id:d.id,...d.data()})));render()},e=>notice(errText(e),true));
unsubs.push(subscription);
}
refreshDocuments();
}
function heading(k){return '<div class="page-head"><button class="back" data-go="home">← Wróć</button><h2>'+esc(titles[k]||k)+'</h2></div>'}
function section(s){return '<div class="section"><h2>'+s+'</h2></div>'}
function warning(){return '<div class="notice">⚠️ Mój Pingwinek 5.1 jest środowiskiem testowym. Nie wprowadzaj danych dzieci ani prawdziwej dokumentacji medycznej.</div>'}
function tile(icon,title,description,page,cls=''){return '<button class="tile '+cls+'" data-go="'+page+'"><em>'+icon+'</em><strong>'+title+'</strong><small>'+description+'</small></button>'}
function card(icon,title,sub,page){return '<div class="card"><button class="item" data-go="'+page+'"><div class="card-row"><span class="card-icon">'+icon+'</span><span class="card-meta"><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></span><span class="chev">›</span></div></button></div>'}
function calendar(){let offset=(new Date(year,month,1).getDay()+6)%7,total=new Date(year,month+1,0).getDate();let h='<div class="month"><button class="secondary" data-shift="-1">‹</button><strong>'+new Date(year,month,1).toLocaleDateString('pl-PL',{month:'long',year:'numeric'})+'</strong><button class="secondary" data-shift="1">›</button></div><div class="calendar">'+['Pn','Wt','Śr','Cz','Pt','Sb','Nd'].map(d=>'<span class="weekday">'+d+'</span>').join('');for(let i=0;i<offset;i++)h+='<span></span>';for(let day=1;day<=total;day++){let date=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');h+='<button class="date '+(date===selectedDate?'selected ':'')+(date===localDate()?'current ':'')+(events.some(e=>e.date===date)?'marked':'')+'" data-date="'+date+'">'+day+'</button>'}return h+'</div>'}
function render(){if(!user)return;$('#hero-title').textContent=titles[view]||'Mój Pingwinek';$('#hero-sub').textContent=view==='home'?'Małe kroki. Wielkie możliwości.':'Twoje dane synchronizowane przez Firebase';let h='';
if(view==='home'){const next=events.filter(e=>e.date>=localDate()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,2);h='<div class="profile"><div class="avatar">🐧</div><div><strong>Twoja przestrzeń</strong><span class="cloud-email">'+esc(user.email)+'</span><span class="tag">☁ Konto online</span></div></div>'+section('Twoje centrum wsparcia')+'<div class="tiles">'+tile('📁','Dokumenty','Prywatne pliki w chmurze','docs')+tile('📅','Kalendarz','Terminy i zajęcia','calendar','green')+tile('🌱','Dziennik','Wpisy i obserwacje','journal','orange')+tile('🩺','Paszport medyczny','Widok demonstracyjny','passport','lilac')+tile('👩‍⚕️','Specjaliści','Zespół wsparcia','specialists','green')+tile('💚','Wsparcie rodzica','Pomoc na co dzień','support')+'</div>'+section('Najbliższe wydarzenia')+(next.length?next.map(e=>card('📅',e.title,e.date+' '+(e.time||''),'calendar')).join(''):card('📅','Dodaj pierwsze wydarzenie','Twój kalendarz jest pusty','addevent'))+warning()}
else if(view==='calendar'){const items=events.filter(e=>e.date===selectedDate).sort((a,b)=>(a.time||'').localeCompare(b.time||''));h=heading(view)+'<p class="sub">Terminy zapisują się na koncie i pojawią się po zalogowaniu na innym urządzeniu.</p><div class="card">'+calendar()+'</div>'+section('Wydarzenia · '+esc(selectedDate))+(items.length?items.map(e=>'<div class="doc-row"><strong>📅 '+esc(e.title)+'</strong><small>'+esc(e.time||'Cały dzień')+'</small>'+(e.notes?'<p class="tiny">'+esc(e.notes)+'</p>':'')+'<div class="card-actions"><button class="danger" data-delete="events" data-id="'+esc(e.id)+'">Usuń</button></div></div>').join(''):'<div class="empty">Brak wydarzeń tego dnia.</div>')+'<button class="primary full" data-go="addevent">＋ Dodaj wydarzenie</button>'+warning()}
else if(view==='addevent'){h=heading(view)+'<form id="event-form" class="card"><label class="stack-label">Tytuł</label><input class="stack-input" id="event-title" required maxlength="150" placeholder="np. Wizyta u specjalisty"><label class="stack-label">Data</label><input class="stack-input" id="event-date" type="date" value="'+esc(selectedDate)+'" required><label class="stack-label">Godzina</label><input class="stack-input" id="event-time" type="time"><label class="stack-label">Uwagi (opcjonalnie)</label><textarea class="stack-input" id="event-notes" maxlength="1500" rows="3"></textarea><div class="card-actions"><button type="submit" class="primary full">Zapisz w chmurze</button></div></form>'+warning()}
else if(view==='journal'){h=heading(view)+'<p class="sub">Wpisy są prywatne i synchronizowane z Twoim kontem.</p><div class="stat-grid"><div class="stat"><strong>'+notes.length+'</strong><small>Zapisane wpisy</small></div><div class="stat"><strong>☁</strong><small>Synchronizacja</small></div></div>'+section('Moje wpisy')+(notes.length?notes.slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).map(n=>'<div class="doc-row"><strong>🌱 '+esc(n.title)+'</strong><p class="sub">'+esc(n.body)+'</p><div class="card-actions"><button class="danger" data-delete="notes" data-id="'+esc(n.id)+'">Usuń</button></div></div>').join(''):'<div class="empty">Nie ma jeszcze obserwacji.</div>')+'<button class="primary full" data-go="addnote">＋ Nowa obserwacja</button>'+warning()}
else if(view==='addnote'){h=heading(view)+'<form id="note-form" class="card"><label class="stack-label">Tytuł</label><input class="stack-input" id="note-title" required maxlength="150"><label class="stack-label">Opis</label><textarea class="stack-input" id="note-body" required maxlength="5000" rows="6"></textarea><div class="card-actions"><button type="submit" class="primary full">Zapisz w chmurze</button></div></form>'+warning()}
else if(view==='docs'){h=heading(view)+'<p class="sub">Pliki PDF, JPG i PNG (maks. 5 MB). Pliki trafiają do prywatnego Supabase przez zabezpieczony Cloudflare Worker (maks. 5 MB).</p><form id="doc-form" class="card"><label class="stack-label">Wybierz fikcyjny dokument testowy</label><input class="stack-input" id="doc-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required><button type="submit" class="primary full" style="margin-top:12px">＋ Prześlij dokument</button></form><label class="stack-label" for="doc-search">Szukaj</label><input class="stack-input" id="doc-search" placeholder="Nazwa pliku" value="'+esc(search)+'">'+section('Moje pliki ('+documents.length+')')+'<div id="doc-list"></div>'+warning()}
else if(view==='more'){h=heading(view)+[['🩺','Paszport medyczny','passport'],['👩‍⚕️','Specjaliści','specialists'],['💚','Wsparcie rodzica','support'],['📖','Poradnik formalności','formalities'],['🔔','Powiadomienia','notifications'],['👤','Moje konto','account'],['⚙️','Ustawienia','settings']].map(([i,t,p])=>card(i,t,'Otwórz sekcję',p)).join('')+warning()}
else if(view==='account'||view==='settings'){h=heading(view)+'<div class="card"><strong>👤 Konto Firebase</strong><p class="cloud-email">'+esc(user.email)+'</p><p class="tiny">Kalendarz, dziennik i dokumenty należą do zalogowanego użytkownika. Rozbudowane funkcje profilu i usuwania konta będą dodane przed publikacją produkcyjną.</p><div class="card-actions"><button class="secondary" id="reset-password">Zresetuj hasło</button><button class="danger" id="logout">Wyloguj</button></div></div>'+warning()}
else{const labels={passport:'Przykładowy profil',specialists:'Przykładowi specjaliści',support:'Materiały dla rodziców',formalities:'Ważne formalności',notifications:'Powiadomienia',medical:'Informacje medyczne'};h=heading(view)+'<p class="sub">Ta część zachowuje wygląd oryginalnego Demo 3.0. Funkcjonalność zostanie rozszerzona po testach podstawowych modułów.</p>'+card('🐧',labels[view]||'Mój Pingwinek','Treści demonstracyjne','home')+warning()}
$('#app').innerHTML=h;$('#bottom').innerHTML=tabs.map(t=>'<button class="'+(view===t[0]?'active':'')+'" data-go="'+t[0]+'"><b>'+t[2]+'</b>'+t[1]+'</button>').join('');if(view==='docs')renderDocuments()}
function renderDocuments(){const target=$('#doc-list');if(!target)return;const subset=documents.filter(d=>(d.name||'').toLocaleLowerCase().includes(search.toLocaleLowerCase()));target.innerHTML=subset.length?subset.map(d=>'<div class="doc-row"><strong>📄 '+esc(d.name)+'</strong><small>'+Math.round((d.size||0)/1024)+' KB</small><div class="card-actions"><button class="secondary" data-open="'+esc(d.id)+'">Pobierz</button><button class="danger" data-delete="documents" data-id="'+esc(d.id)+'">Usuń</button></div></div>').join(''):'<div class="empty">Brak plików.</div>'}
function go(k){view=k;render();window.scrollTo(0,0)}
async function remove(kind,id){
 if(!confirm("Czy na pewno usunąć?"))return;
 try{
  if(kind==="documents"){await documentApi("DELETE","/files/"+encodeURIComponent(id));await refreshDocuments();}
  else await deleteDoc(doc(db,"users",user.uid,kind,id));
  notice("Usunięto.");
 }catch(e){notice(errText(e),true)}
}
async function download(id){
 const d=documents.find(x=>x.id===id);if(!d)return;
 try{
  const blob=await documentApi("GET","/files/"+encodeURIComponent(id));
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=d.name||"dokument";document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){notice(errText(e),true)}
}
async function submitEvent(e){e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const date=$('#event-date').value;await addDoc(collection(db,'users',user.uid,'events'),{title:$('#event-title').value.trim(),date,time:$('#event-time').value,notes:$('#event-notes').value.trim(),createdAt:serverTimestamp()});selectedDate=date;year=+date.slice(0,4);month=+date.slice(5,7)-1;go('calendar');notice('Wydarzenie zapisane w chmurze')}catch(e){notice(errText(e),true)}finally{button.disabled=false}}
async function submitNote(e){e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await addDoc(collection(db,'users',user.uid,'notes'),{title:$('#note-title').value.trim(),body:$('#note-body').value.trim(),createdAt:serverTimestamp()});go('journal');notice('Zapisano obserwację')}catch(e){notice(errText(e),true)}finally{button.disabled=false}}
async function submitDocument(e){
 e.preventDefault();
 const file=$("#doc-file").files[0];if(!file)return;
 if(!["application/pdf","image/png","image/jpeg"].includes(file.type)||file.size<=0||file.size>5*1024*1024){notice("Wybierz PDF, JPG lub PNG maks. 5 MB.",true);return}
 const button=e.target.querySelector("[type=submit]");button.disabled=true;
 try{await documentApi("POST","/files",file,file.name);await refreshDocuments();go("docs");notice("Plik przesłany do Supabase")}
 catch(err){notice(errText(err),true)}
 finally{button.disabled=false}
}
async function passwordReset(email){if(!email){notice('Wpisz adres e-mail.',true);return}try{await sendPasswordResetEmail(auth,email);notice('Jeśli konto istnieje, link resetowania został wysłany.')}catch(e){notice(errText(e),true)}}
$('#auth-toggle').addEventListener('click',()=>{mode=mode==='login'?'signup':'login';$('#auth-title').textContent=mode==='signup'?'Utwórz konto':'Zaloguj się';$('#auth-submit').textContent=mode==='signup'?'Zarejestruj się':'Zaloguj się';$('#auth-toggle').textContent=mode==='signup'?'Mam już konto':'Utwórz konto';$('#auth-error').classList.add('hide')});
$('#auth-reset').addEventListener('click',()=>passwordReset($('#auth-email').value.trim()));
$('#auth-form').addEventListener('submit',async e=>{e.preventDefault();let button=$('#auth-submit');button.disabled=true;$('#auth-error').classList.add('hide');try{const email=$('#auth-email').value.trim(),pwd=$('#auth-password').value;await (mode==='signup'?createUserWithEmailAndPassword(auth,email,pwd):signInWithEmailAndPassword(auth,email,pwd));$('#auth-password').value=''}catch(err){$('#auth-error').textContent=errText(err);$('#auth-error').classList.remove('hide')}finally{button.disabled=false}});
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.go)go(b.dataset.go);if(b.dataset.shift){month+=Number(b.dataset.shift);if(month<0){month=11;year--}if(month>11){month=0;year++}render()}if(b.dataset.date){selectedDate=b.dataset.date;render()}if(b.dataset.delete)await remove(b.dataset.delete,b.dataset.id);if(b.dataset.open)await download(b.dataset.open);if(b.id==='logout')await signOut(auth);if(b.id==='reset-password')await passwordReset(user?.email)});
document.addEventListener('input',e=>{if(e.target.id==='doc-search'){search=e.target.value;renderDocuments()}});
document.addEventListener('submit',e=>{if(e.target.id==='event-form')submitEvent(e);if(e.target.id==='note-form')submitNote(e);if(e.target.id==='doc-form')submitDocument(e)});
$('#bell').onclick=()=>{if(user)go('notifications')};
try{const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);onAuthStateChanged(auth,u=>setUser(u),e=>notice(errText(e),true))}catch(e){$('#cloud-status').textContent='Błąd konfiguracji Firebase';notice(errText(e),true)}
