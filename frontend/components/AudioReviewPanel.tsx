"use client";

import { t, useLocale, formatDate, getLocale, languageOf } from "@/lib/i18n";

import { useEffect, useRef, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { playSpeechClip, stopCurrentSpeech, unlockSpeechPlayback } from "@/lib/speech";

type Item = {key:string; text:string; language:"ru"|"kk"; phrase_type:"question"|"statement"|"exclamation"|"instruction"; mode:"normal"|"slow"; recording:null|{digest:string; source:string; approved_by:number|null; approved_at:string|null}};
type Manifest = {scope_id:number;items:Item[];ready:boolean};
const kinds = {get question() { return t("audioReviewPanel.ui1"); },get statement() { return t("audioReviewPanel.ui2"); },get exclamation() { return t("audioReviewPanel.ui3"); },get instruction() { return t("audioReviewPanel.ui4"); }};

function RecordingList({url,onReady}:{url:string;onReady?:(ready:boolean)=>void}) {
  useLocale();
  const [data,setData]=useState<Manifest|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [heard,setHeard]=useState<Record<string,string>>({});
  const [filter,setFilter]=useState("");
  const [limit,setLimit]=useState(12);
  const alive=useRef(true);
  const request=useRef<AbortController|null>(null);
  const readyCallback=useRef(onReady);
  useEffect(()=>{readyCallback.current=onReady;},[onReady]);
  useEffect(()=>{
    alive.current=true; const abort=new AbortController(); request.current=abort;
    readyCallback.current?.(false);
    api<Manifest>(url,{signal:abort.signal}).then(value=>{if(!abort.signal.aborted){setData(value);readyCallback.current?.(value.ready);}}).catch(cause=>{if(!abort.signal.aborted)setError(String(cause.message));});
    return()=>{alive.current=false;abort.abort();request.current?.abort();stopCurrentSpeech();};
  },[url]);
  const reload=async()=>{const value=await api<Manifest>(url);if(alive.current){setData(value);readyCallback.current?.(value.ready);}};
  const base=(item:Item)=>`/api/admin/audio/${data!.scope_id}/${item.key}/${item.mode}`;
  const action=async(run:()=>Promise<void>)=>{
    if(busy)return;setBusy(true);setError("");readyCallback.current?.(false);
    try{await run();}catch(cause){if(alive.current)setError(cause instanceof Error?cause.message:t("audioReviewPanel.ui5"));}
    finally{if(alive.current){try{await reload();}catch{setError(t("audioReviewPanel.ui6"));}setBusy(false);}}
  };
  const prepare=(item:Item,source:string,file?:File)=>void action(async()=>{
    let encoded:string|undefined;
    if(file){
      if(file.size>2_000_000)throw new Error(t("audioReviewPanel.ui7"));
      encoded=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(new Error(t("audioReviewPanel.ui8")));reader.readAsDataURL(file);});
    }
    await api(`${base(item)}/prepare`,{method:"POST",body:JSON.stringify({source,audio_base64:encoded,expected_digest:item.recording?.digest||null})});
    setHeard(values=>({...values,[`${item.key}:${item.mode}`]:""}));
  });
  const listen=(item:Item)=>{
    unlockSpeechPlayback();
    void action(async()=>{
      const controller=new AbortController();request.current=controller;
      const timer=setTimeout(()=>controller.abort(),12000);
      let response:Response;
      try{response=await fetch(`${API_URL}${base(item)}/clip`,{credentials:"include",signal:controller.signal});}finally{clearTimeout(timer);}
      if(!response.ok)throw new Error(t("audioReviewPanel.ui9"));
      const digest=response.headers.get("X-Soyle-Audio-Digest");
      if(digest!==item.recording?.digest)throw new Error(t("audioReviewPanel.ui10"));
      const blob=await response.blob();if(controller.signal.aborted||!alive.current)return;
      const objectUrl=URL.createObjectURL(blob);
      try{
        if(!await playSpeechClip(objectUrl))throw new Error(t("audioReviewPanel.ui11"));
        if(!alive.current)return;
        await api(`${base(item)}/review`,{method:"POST",body:JSON.stringify({digest,action:"listened"})});
        setHeard(values=>({...values,[`${item.key}:${item.mode}`]:digest!}));
      }finally{URL.revokeObjectURL(objectUrl);}
    });
  };
  const filtered=data?.items.filter(item=>item.text.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))||[];
  return <div>
    <p>{t("audioReviewPanel.ui12")}</p>
    {error&&<p role="alert">{error}</p>}
    {!data?<p role="status">{t("audioReviewPanel.ui13")}</p>:<>
      <p role="status">{t("audioReviewPanel.ui14")} {data.items.filter(item=>item.recording?.approved_by).length}  {t("audioReviewPanel.ui15")} {data.items.length}</p>
      <label>{t("audioReviewPanel.ui16")}<input value={filter} onChange={event=>{setFilter(event.target.value);setLimit(12);}}/></label>
      <div className="scenario-review-list">{filtered.slice(0,limit).map(item=><article key={`${item.key}:${item.mode}`}>
        <header><div><strong>{item.text}</strong><p>{item.language.toUpperCase()} · {kinds[item.phrase_type]} · {item.mode==="slow"?t("audioReviewPanel.ui17"):t("audioReviewPanel.ui18")}</p></div></header>
        <div className="review-actions">
          <button className="small-button" disabled={busy} onClick={()=>prepare(item,"azure")}>{t("audioReviewPanel.ui19")}</button>
          {item.mode==="normal"&&<button className="small-button" disabled={busy} onClick={()=>prepare(item,"bundled")}>{t("audioReviewPanel.ui20")}</button>}
          <label className="small-button">{t("audioReviewPanel.ui21")}<input type="file" accept=".wav,audio/wav" disabled={busy} aria-label={t("audioReviewPanel.replace", { text: item.text, mode: item.mode === "slow" ? t("audioReviewPanel.ui17") : t("audioReviewPanel.ui18") })} onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)prepare(item,"manual",file);}}/></label>
          <button className="small-button" disabled={busy||!item.recording} onClick={()=>listen(item)}>{t("audioReviewPanel.ui22")}</button>
          <button className="small-button" disabled={!busy} onClick={()=>{request.current?.abort();stopCurrentSpeech();}}>{t("audioReviewPanel.ui23")}</button>
          <button className="primary-button" disabled={busy||!item.recording||heard[`${item.key}:${item.mode}`]!==item.recording.digest||!!item.recording.approved_by} onClick={()=>void action(async()=>{await api(`${base(item)}/review`,{method:"POST",body:JSON.stringify({digest:item.recording!.digest,action:"approved"})});})}>{item.recording?.approved_by?t("audioReviewPanel.ui14"):t("audioReviewPanel.ui24")}</button>
        </div>
        {item.recording&&<small>{t("audioReviewPanel.ui25")} {({azure:t("audioReviewPanel.source.azure"),manual:t("audioReviewPanel.source.manual"),bundled:t("audioReviewPanel.source.bundled")} as Record<string,string>)[item.recording.source] || item.recording.source}{item.recording.approved_at?t("audioReviewPanel.approvedAt", { date: formatDate(item.recording.approved_at, {dateStyle: "short", timeStyle: "short"}) }):t("audioReviewPanel.ui26")}</small>}
      </article>)}</div>
      {filtered.length>limit&&<button className="small-button" onClick={()=>setLimit(limit+12)}>{t("audioReviewPanel.ui27")}</button>}
      <small>{t("audioReviewPanel.ui28")}</small>
    </>}
  </div>;
}

export function AudioReviewPanel({versionId,onReady}:{versionId:number;onReady:(ready:boolean)=>void}) {
  useLocale();
  const [text,setText]=useState(t("audioReviewPanel.ui29"));
  const [language,setLanguage]=useState(() => languageOf(getLocale()));
  const [library,setLibrary]=useState("");
  const [profile,setProfile]=useState("pet");
  return <section className="review-section">
    <header><div><span className="kicker">{t("audioReviewPanel.ui30")}</span><h3>{t("audioReviewPanel.ui31")}</h3></div></header>
    <RecordingList key={versionId} url={`/api/admin/exercise-drafts/${versionId}/audio`} onReady={onReady}/>
    <details><summary>{t("audioReviewPanel.ui32")}</summary>
      <p>{t("audioReviewPanel.ui33")}</p>
      <label>{t("audioReviewPanel.ui34")}<select value={profile} onChange={event=>setProfile(event.target.value)}><option value="pet">{t("audioReviewPanel.ui35")}</option><option value="exercise">{t("audioReviewPanel.ui36")}</option></select></label>
      <label>{t("audioReviewPanel.ui37")}<input value={text} maxLength={300} onChange={event=>setText(event.target.value)}/></label>
      <label>{t("audioReviewPanel.ui38")}<select value={language} onChange={event=>setLanguage(event.target.value as "ru" | "kk")}><option value="ru">{t("audioReviewPanel.ui39")}</option><option value="kk">{t("audioReviewPanel.ui40")}</option></select></label>
      <button className="small-button" onClick={()=>setLibrary(`/api/admin/audio/library?text=${encodeURIComponent(text)}&language=${language}&profile=${profile}`)}>{t("audioReviewPanel.ui41")}</button>
      {library&&<RecordingList key={library} url={library}/>}
    </details>
  </section>;
}
