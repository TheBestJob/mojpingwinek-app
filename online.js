import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getBlob, deleteObject } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';
import {firebaseConfig,firebaseReady} from './firebase-config.js';

const $ = id => document.getElementById(id);
const show = (id,yes) => $(id).classList.toggle('hidden',!yes);
let auth,db,storage,currentUser=null,mode='login',stopListeners=[];
const message = (text,ok=false) => { $('message').textContent=text; $('message').classList.toggle('ok',ok); };
function errorText(err) {
 const known = {
  'auth/email-already-in-use':'Ten adres e-mail jest już zajęty.',
  'auth/invalid-email':'Nieprawidłowy adres e-mail.',
  'auth/weak-password':'Hasło musi mieć przynajmniej 6 znaków.',
  'auth/invalid-credential':'Niepoprawny adres e-mail lub hasło.',
  'auth/too-many-requests':'Zbyt wiele prób. Spróbuj później.',
  'permission-denied':'Brak uprawnień. Sprawdź reguły Firebase.',
  'storage/unauthorized':'Brak uprawnień do pliku.',
  'storage/quota-exceeded':'Limit miejsca na pliki został przekroczony.'
 };
 return known[err?.code] || 'Operacja nie powiodła się: '+(err?.message||String(err));
}
function dateText(v){return v ? String(v) : 'Brak daty'}
function text(tag,value,cls){const node=document.createElement(tag);node.textContent=value;if(cls)node.className=cls;return node}
function cleanListeners(){for(const stop of stopListeners)stop();stopListeners=[]}
function empty(el,label){el.replaceChildren(text('p',label,'muted'))}
function signedOut(){currentUser=null;cleanListeners();show('auth',firebaseReady);show('dashboard',false);show('logout',false);message('')}
function signedIn(user){
 currentUser=user;show('auth',false);show('dashboard',true);show('logout',true);$('account-email').textContent=user.email||'';$('account-detail').textContent='Zalogowano jako '+(user.email||user.uid);
 cleanListeners();
 for(const [kind,render] of [['events',renderEvents],['notes',renderNotes],['documents',renderDocs]]){
  const path=collection(db,'users',user.uid,kind);
  stopListeners.push(onSnapshot(path,snap=>{if(currentUser?.uid===user.uid)render(snap.docs.map(d=>({id:d.id,...d.data()})))},err=>message(errorText(err))));
 }
}
function row(title,subtitle,onDelete,onOpen){
 const div=text('div','','item'), body=text('div');body.append(text('h3',title),text('p',subtitle));div.append(body);
 if(onOpen){const open=text('button','Otwórz','btn alt');open.type='button';open.onclick=onOpen;div.append(open)}
 if(onDelete){const del=text('button','Usuń','btn warn');del.type='button';del.onclick=onDelete;div.append(del)}return div
}
async function removeRecord(kind,id){if(!confirm('Usunąć ten wpis?'))return;try{await deleteDoc(doc(db,'users',currentUser.uid,kind,id));message('Usunięto.',true)}catch(err){message(errorText(err))}}
function renderEvents(rows){const el=$('event-list');el.replaceChildren();rows.sort((a,b)=>((a.date||'')+' '+(a.time||'')).localeCompare((b.date||'')+' '+(b.time||'')));if(!rows.length)return empty(el,'Brak wydarzeń. Dodaj pierwszy termin.');for(const x of rows)el.append(row(x.title,dateText(x.date)+' '+(x.time||'')+(x.notes?' • '+x.notes:''),()=>removeRecord('events',x.id)))}
function renderNotes(rows){const el=$('note-list');el.replaceChildren();rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));if(!rows.length)return empty(el,'Brak obserwacji.');for(const x of rows)el.append(row(x.title,x.body,()=>removeRecord('notes',x.id)))}
async function removeFile(x){if(!confirm('Usunąć plik '+x.name+'?'))return;try{await deleteObject(ref(storage,x.storagePath));await deleteDoc(doc(db,'users',currentUser.uid,'documents',x.id));message('Plik usunięty.',true)}catch(err){message(errorText(err))}}
async function openFile(x){
 try {
  const blob=await getBlob(ref(storage,x.storagePath));
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=x.name||'plik';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 } catch(err){message(errorText(err))}
}
function renderDocs(rows){const el=$('doc-list');el.replaceChildren();rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));if(!rows.length)return empty(el,'Nie dodano żadnego pliku.');for(const x of rows)el.append(row('📄 '+x.name,Math.round((x.size||0)/1024)+' KB',()=>removeFile(x),()=>openFile(x)))}
function switchTab(id){for(const t of document.querySelectorAll('.tab'))t.classList.toggle('active',t.dataset.view===id);for(const el of document.querySelectorAll('.view'))el.classList.toggle('hidden',el.id!==id)}
for(const b of document.querySelectorAll('.tab'))b.onclick=()=>switchTab(b.dataset.view);
$('auth-toggle').onclick=()=>{mode=mode==='login'?'signup':'login';$('auth-title').textContent=mode==='signup'?'Utwórz konto':'Zaloguj się';$('auth-submit').textContent=mode==='signup'?'Zarejestruj się':'Zaloguj się';$('auth-toggle').textContent=mode==='signup'?'Mam już konto':'Utwórz konto';message('')};
$('auth-form').onsubmit=async e=>{e.preventDefault();message('');const email=$('email').value.trim(),password=$('password').value;const submit=$('auth-submit');submit.disabled=true;try{if(mode==='signup')await createUserWithEmailAndPassword(auth,email,password);else await signInWithEmailAndPassword(auth,email,password);$('password').value=''}catch(err){message(errorText(err))}finally{submit.disabled=false}};
async function resetPassword(email){if(!email){message('Podaj adres e-mail.');return}try{await sendPasswordResetEmail(auth,email);message('Jeśli konto istnieje, wiadomość resetująca została wysłana.',true)}catch(err){message(errorText(err))}}
$('reset-password').onclick=()=>resetPassword($('email').value.trim());
$('account-reset').onclick=()=>resetPassword(currentUser?.email);
$('logout').onclick=async()=>{try{await signOut(auth)}catch(err){message(errorText(err))}};
$('event-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector('button[type=submit]');button.disabled=true;try{await addDoc(collection(db,'users',currentUser.uid,'events'),{title:$('event-title').value.trim(),date:$('event-date').value,time:$('event-time').value,notes:$('event-notes').value.trim(),createdAt:serverTimestamp()});f.reset();message('Wydarzenie zapisane i zsynchronizowane.',true)}catch(err){message(errorText(err))}finally{button.disabled=false}};
$('note-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector('button[type=submit]');button.disabled=true;try{await addDoc(collection(db,'users',currentUser.uid,'notes'),{title:$('note-title').value.trim(),body:$('note-body').value.trim(),createdAt:serverTimestamp()});f.reset();message('Notatka zapisana i zsynchronizowana.',true)}catch(err){message(errorText(err))}finally{button.disabled=false}};
$('doc-form').onsubmit=async e=>{e.preventDefault();const file=$('doc-file').files[0];if(!file)return;const types=['application/pdf','image/jpeg','image/png'];if(!types.includes(file.type)||file.size>10485760||file.size===0){message('Wybierz PDF, JPG lub PNG do 10 MB.');return}const button=e.currentTarget.querySelector('button[type=submit]');button.disabled=true;const id=crypto.randomUUID().replace(/-/g,''),path='users/'+currentUser.uid+'/documents/'+id;let uploaded=false;try{await uploadBytes(ref(storage,path),file,{contentType:file.type});uploaded=true;await addDoc(collection(db,'users',currentUser.uid,'documents'),{name:file.name.slice(0,180),storagePath:path,size:file.size,createdAt:serverTimestamp()});$('doc-form').reset();message('Plik zapisany w chmurze.',true)}catch(err){message(errorText(err));if(uploaded){try{await deleteObject(ref(storage,path))}catch{}}}finally{button.disabled=false}};
if(!firebaseReady){show('setup',true);message('Najpierw podłącz Firebase w pliku firebase-config.js.')}else {
 try{
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
  onAuthStateChanged(auth,user=>user?signedIn(user):signedOut(),err=>message(errorText(err)));
 }catch(err){show('setup',true);message(errorText(err))}
}
