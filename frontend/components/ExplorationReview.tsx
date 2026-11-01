"use client";

import { t, useLocale } from "@/lib/i18n";
import {useEffect,useState} from 'react';
import {api} from '@/lib/api';
import {Volume2} from 'lucide-react';
import {polygonPath,type SearchScene} from '@/lib/explorationRuntime';
export function ExplorationReview({scene,onSpeak}:{scene:SearchScene;onSpeak:(text:string,rate?:number)=>Promise<boolean>}){
  useLocale();
 const [zones,setZones]=useState(true);
 const [pending,setPending]=useState<string[]|null>(null);
 useEffect(()=>{let active=true;api<{concept_id:string;status:string}[]>('/api/admin/vocabulary-content-gaps').then(items=>{if(active)setPending(items.filter(i=>i.status==='draft').map(i=>i.concept_id));}).catch(()=>{});return()=>{active=false;};},[]);
 return <div className="exploration-review"><p>{t("explorationReview.version", { version: scene.image.version, count: scene.objects.length })}</p><label><input type="checkbox" checked={zones} onChange={e=>setZones(e.target.checked)}/>  {t("explorationReview.ui3")}</label><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" role="img" aria-label={t("explorationReview.markup", { title: scene.title })}><image href={scene.image.media_ref} width="1000" height="1000" preserveAspectRatio="none"/>{zones&&scene.objects.map((o,i)=><g key={o.id}><path d={polygonPath(o.hit_polygons)}/><text x={o.hit_point[0]*1000} y={o.hit_point[1]*1000}>{i+1}</text></g>)}</svg><div className="exploration-review-scroll"><table><caption>{t("explorationReview.ui4")}</caption><thead><tr><th>{t("explorationReview.ui5")}</th><th>{t("explorationReview.ui6")}</th><th>{t("explorationReview.ui7")}</th><th>{t("explorationReview.ui8")}</th></tr></thead><tbody>{scene.objects.map((o,i)=><tr key={o.id}><td>{i+1}. {o.label}</td><td>{o.instructions['2']}</td><td>{o.instructions['3']}</td><td><button className="small-button" aria-label={t("explorationReview.listen", { text: o.instructions["3"] })} onClick={()=>void onSpeak(o.instructions['3'],.78)}><Volume2 size={19}/></button></td></tr>)}</tbody></table></div><p>{t("explorationReview.ui9")} {pending===null?t("explorationReview.ui10"):scene.objects.filter(o=>pending.includes(o.concept_id)).map(o=>o.label).join(', ')||t("explorationReview.ui11")}.</p><p>{t("explorationReview.ui12")}</p></div>;
}
