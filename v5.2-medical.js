import { collection,doc,setDoc,addDoc,deleteDoc,onSnapshot,serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let db,uid="",onUpdate=()=>{},subscriptions=[];
let profile=null,diagnoses=[],medications=[],specialists=[];
const escapeText=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const field=(label,id,value="",type="text",required=false,limit=120)=>'<label class="stack-label" for="'+id+'">'+label+'</label><input class="stack-input" id="'+id+'" type="'+type+'" maxlength="'+limit+'" value="'+escapeText(value)+'" '+(required?"required":"")+'>';
const labelItem=(title,detail,type,id)=>'<div class="doc-row"><strong>'+escapeText(title)+'</strong><p class="tiny">'+escapeText(detail)+'</p><div class="card-actions"><button class="danger" data-med-delete="'+type+'" data-med-id="'+escapeText(id)+'">Usuń</button></div></div>';
export function beginMedical(database,userId,update){
 endMedical(); db=database;uid=userId;onUpdate=update;
 const base=["users",uid];
 subscriptions.push(onSnapshot(doc(db,...base,"medicalProfile","main"),s=>{profile=s.exists()?s.data():null;onUpdate()},e=>console.warn("medicalProfile",e.code)));
 for(const [name,assign] of [["diagnoses",x=>diagnoses=x],["medications",x=>medications=x],["specialists",x=>specialists=x]]){
  subscriptions.push(onSnapshot(collection(db,...base,name),snap=>{assign(snap.docs.map(d=>({id:d.id,...d.data()})));onUpdate()},e=>console.warn(name,e.code)));
 }
}
export function endMedical(){for(const fn of subscriptions)fn();subscriptions=[];db=null;uid="";profile=null;diagnoses=[];medications=[];specialists=[];}
export function medicalView(name){
 if(name==="passport")return '<div class="section"><h2>🩺 Paszport medyczny</h2></div><p class="sub">Informacje wprowadzone przez opiekuna — nie zastępują dokumentacji lekarskiej.</p>'
 +'<div class="card"><h3>Profil testowy</h3><form id="med-profile-form">'
 +field("Imię lub pseudonim", "med-name",profile?.name||"","text",true,80)
 +field("Data urodzenia (opcjonalnie)","med-birth",profile?.birth||"","date",false,10)
 +field("Alergie / ważne informacje","med-allergies",profile?.allergies||"","text",false,300)
 +'<button class="primary full" type="submit">Zapisz profil</button></form></div>'
 +'<div class="tiles">'
 +'<button class="tile lilac" data-go="diagnoses"><em>🧠</em><strong>Diagnozy</strong><small>'+diagnoses.length+' zapisanych</small></button>'
 +'<button class="tile orange" data-go="medications"><em>💊</em><strong>Leki</strong><small>'+medications.length+' wpisów</small></button>'
 +'<button class="tile green" data-go="specialists"><em>👩‍⚕️</em><strong>Specjaliści</strong><small>'+specialists.length+' kontaktów</small></button>'
 +'<button class="tile" data-go="docs"><em>📁</em><strong>Dokumenty</strong><small>Pliki w Supabase</small></button></div>';
 if(name==="diagnoses")return '<h2>🧠 Diagnozy</h2><p class="sub">Zapisuj wyłącznie diagnozy potwierdzone przez uprawnionego specjalistę. Podane nazwy i kody nie oznaczają rozpoznania przez aplikację.</p>'
 +'<div class="card"><form id="med-diagnosis-form">'
 +field("Nazwa rozpoznania","diag-name","","text",true,120)
 +field("Kod ICD-10 (opcjonalnie)","diag-code","","text",false,12)
 +field("Data rozpoznania (opcjonalnie)","diag-date","","date",false,10)
 +field("Specjalista / źródło informacji","diag-doctor","","text",false,120)
 +'<button class="primary full" type="submit">Dodaj rozpoznanie</button></form></div>'
 +'<div class="section"><h2>Zapisane diagnozy ('+diagnoses.length+')</h2></div>'
 +(diagnoses.length?diagnoses.map(d=>labelItem(d.name,(d.code?"ICD-10: "+d.code+" · ":"")+(d.date||"")+(d.doctor?" · "+d.doctor:""),"diagnoses",d.id)).join(""):'<div class="empty">Nie dodano rozpoznań.</div>');
 if(name==="medications")return '<h2>💊 Leki i suplementy</h2><p class="sub">Lista informacyjna, nie narzędzie do ustalania dawek. Dodawaj tylko zalecenia od specjalisty.</p>'
 +'<div class="card"><form id="med-medication-form">'
 +field("Nazwa","drug-name","","text",true,120)
 +field("Dawka według zaleceń","drug-dose","","text",true,80)
 +'<label class="stack-label">Pora</label><select id="drug-time" class="stack-input"><option>Rano</option><option>Południe</option><option>Wieczór</option><option>Według potrzeb</option></select>'
 +field("Dodatkowe uwagi","drug-notes","","text",false,300)
 +'<button class="primary full" type="submit">Dodaj lek / suplement</button></form></div>'
 +'<div class="section"><h2>Zapisane pozycje ('+medications.length+')</h2></div>'
 +(medications.length?medications.map(d=>labelItem(d.name,d.dose+" · "+d.time+(d.notes?" · "+d.notes:""),"medications",d.id)).join(""):'<div class="empty">Brak wpisów.</div>');
 if(name==="specialists")return '<h2>👩‍⚕️ Nasi specjaliści</h2><p class="sub">Twoja prywatna lista kontaktów, nie publiczna baza lekarzy ani system rezerwacji.</p>'
 +'<div class="card"><form id="med-specialist-form">'
 +field("Imię i nazwisko / nazwa placówki","spec-name","","text",true,120)
 +field("Specjalizacja","spec-role","","text",true,100)
 +field("Telefon (opcjonalnie)","spec-phone","","tel",false,35)
 +field("Placówka","spec-location","","text",false,150)
 +'<button class="primary full" type="submit">Dodaj specjalistę</button></form></div>'
 +'<div class="section"><h2>Twoje kontakty ('+specialists.length+')</h2></div>'
 +(specialists.length?specialists.map(d=>labelItem(d.name,d.role+(d.location?" · "+d.location:"")+(d.phone?" · "+d.phone:""),"specialists",d.id)).join(""):'<div class="empty">Nie dodano specjalistów.</div>');
 return "";
}
export async function submitMedical(form){
 if(!db||!uid)throw Error("Zaloguj się ponownie");
 const $=id=>document.getElementById(id)?.value?.trim()||"";
 const base=["users",uid];
 if(form==="med-profile-form"){
   await setDoc(doc(db,...base,"medicalProfile","main"),{name:$("med-name"),birth:$("med-birth"),allergies:$("med-allergies"),updatedAt:serverTimestamp()});
 }else if(form==="med-diagnosis-form"){
   await addDoc(collection(db,...base,"diagnoses"),{name:$("diag-name"),code:$("diag-code"),date:$("diag-date"),doctor:$("diag-doctor"),createdAt:serverTimestamp()});
 }else if(form==="med-medication-form"){
   await addDoc(collection(db,...base,"medications"),{name:$("drug-name"),dose:$("drug-dose"),time:$("drug-time"),notes:$("drug-notes"),createdAt:serverTimestamp()});
 }else if(form==="med-specialist-form"){
   await addDoc(collection(db,...base,"specialists"),{name:$("spec-name"),role:$("spec-role"),phone:$("spec-phone"),location:$("spec-location"),createdAt:serverTimestamp()});
 }
}
export async function deleteMedical(kind,id){
 if(!db||!uid||!["diagnoses","medications","specialists"].includes(kind))throw Error("Błędny typ wpisu");
 await deleteDoc(doc(db,"users",uid,kind,id));
}
