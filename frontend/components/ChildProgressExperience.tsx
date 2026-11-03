"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Check, Ear, Gamepad2, MessageCircle, RefreshCw, Star, Trophy } from "lucide-react";
import { api, type Dashboard, type Story } from "@/lib/api";
import { t, useLocale } from "@/lib/i18n";

export function ChildProgressExperience({childId,dashboard,onStories,onGames}: {childId?:number;dashboard:Dashboard|null;onStories:()=>void;onGames:()=>void}) {
  const locale=useLocale();
  const [stories,setStories]=useState<Story[]|null>(null);
  const [storyError,setStoryError]=useState(false);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true;
    if(!childId)return;
    api<Story[]>(`/api/stories/${childId}`).then(items=>{if(active){setStories(items);setStoryError(false);}}).catch(()=>{if(active)setStoryError(true);});
    return ()=>{active=false;};
  },[childId,locale,revision]);
  const completed=stories?.filter(story=>Boolean(story.completed_at)||(story.scene_count>0&&story.scene_index>=story.scene_count)).length;
  const badges=[
    {key:'step',title:t('achievements.ui1'),detail:t('achievements.ui2'),earned:(dashboard?.total_sessions||0)>0,image:'badge-first-step.webp',icon:Star},
    {key:'five',title:t('achievements.ui3'),detail:t('achievements.ui4'),earned:Boolean(dashboard?.achievements.first_five),image:'badge-five-attempts.webp',icon:Trophy},
    {key:'listen',title:t('achievements.ui5'),detail:t('achievements.ui6'),earned:Boolean(dashboard?.achievements.good_listener),image:'badge-listener.webp',icon:Ear},
    {key:'phrase',title:t('achievements.ui7'),detail:t('achievements.ui8'),earned:Boolean(dashboard?.achievements.phrase_master),image:'badge-phrase.webp',icon:MessageCircle},
    {key:'book',title:t('achievements.ui9'),detail:t('achievements.ui10'),earned:(completed||0)>0,image:'badge-story.webp',icon:BookOpen},
  ];
  const skills=dashboard?.skill_progress||[];
  const pets=[{key:'penguin',price:0},{key:'fox',price:50},{key:'bunny',price:40},{key:'kitten',price:60},{key:'dragon',price:100}] as const;
  return <div className="child-progress-experience">
    <header className="progress-welcome"><div><span className="progress-eyebrow"><Trophy size={18}/>{t('navigation.progress')}</span><h1>{t('progressNew.title')}</h1><p>{t('progressNew.hint')}</p><button className="primary-button" onClick={onGames}><Gamepad2 size={20}/>{t('ux.chooseExercise')}<ArrowRight size={18}/></button></div></header>
    <dl className="progress-totals" aria-label={t('progressNew.total')}>
      <div><dt><span className="progress-stat-icon stars"><Star/></span>{t('achievements.ui15')}</dt><dd>{dashboard?.stars??'-'}</dd></div>
      <div><dt><span className="progress-stat-icon practice"><Gamepad2/></span>{t('journey.practiceCount')}</dt><dd>{dashboard?.total_sessions??'-'}</dd></div>
      <div><dt><span className="progress-stat-icon stories"><BookOpen/></span>{t('achievements.ui16')}</dt><dd>{completed??'-'}</dd></div>
    </dl>
    {storyError&&<div className="progress-data-error" role="alert"><p>{t('progressNew.storyError')}</p><button className="small-button" onClick={()=>setRevision(value=>value+1)}><RefreshCw size={16}/>{t('common.retry')}</button></div>}
    <section className="pet-shop-preview" aria-labelledby="pet-shop-title"><header><div><span className="progress-eyebrow">{t('petShop.eyebrow')}</span><h2 id="pet-shop-title">{t('petShop.title')}</h2></div><span className="pet-shop-balance" aria-label={t('petShop.balance')}><Star size={19}/>{dashboard?.stars??'-'}</span></header><p className="pet-shop-intro">{t('petShop.hint')}</p>
      <ul className="pet-shop-grid">{pets.map(pet=><li key={pet.key} className={`pet-shop-card ${pet.price===0?'base-pet':''}`}><div className="pet-shop-portrait"><Image src={`/app-illustrations/pet-shop/${pet.key}.webp`} alt={t(`petShop.${pet.key}`)} width={400} height={400} sizes="(max-width: 420px) 50vw, (max-width: 1000px) 33vw, 20vw"/></div><div className="pet-shop-copy"><h3>{t(`petShop.${pet.key}`)}</h3><p>{t(`petShop.${pet.key}Hint`)}</p><div className="pet-shop-card-footer">{pet.price===0?<span className="pet-shop-base-label"><Check size={15}/>{t('petShop.base')}</span>:<><span className="pet-shop-price"><Star size={16}/>{pet.price}</span><span className="pet-shop-soon">{t('petShop.soon')}</span></>}</div></div></li>)}</ul>
      <p className="pet-shop-note">{t('petShop.previewNote')}</p>
    </section>
    <section className="progress-discoveries" aria-labelledby="progress-discoveries-title"><header><div><h2 id="progress-discoveries-title">{t('progressNew.discoveries')}</h2><p>{t('progressNew.discoveriesHint')}</p></div></header><div>{skills.map(skill=><article key={skill.skill}><span className="progress-skill-dot" aria-hidden="true"/><div><h3>{skill.label}</h3><p>{skill.participations?t('journey.skillPractice',{count:skill.participations}):t('journey.skillNew')}</p></div>{skill.participations>0&&<Check size={20} aria-label={t('progressNew.practiced')}/>}</article>)}</div>{!skills.length&&<p>{t(dashboard?'progressNew.emptySkills':'common.wait')}</p>}</section>
    <section className="progress-collection" aria-labelledby="progress-collection-title"><header><div><span className="progress-eyebrow">{t('progressNew.collection')}</span><h2 id="progress-collection-title">{t('nav.achievements')}</h2></div><span>{dashboard?t('progressNew.unlocked',{count:badges.filter(b=>b.earned).length,total:badges.length}):'-'}</span></header><div>{badges.map(badge=><article key={badge.key} className={badge.earned?'earned':''}><div className="progress-badge-image"><Image src={`/app-illustrations/${badge.image}`} alt="" width={132} height={132}/></div><h3>{badge.title}</h3><p>{badge.detail}</p><span>{badge.earned?<><Check size={14}/>{t('achievements.ui17')}</>:t('progressNew.ahead')}</span></article>)}</div></section>
    <section className="progress-next-step"><BookOpen size={32}/><div><h2>{t('progressNew.nextTitle')}</h2><p>{t('progressNew.nextHint')}</p></div><button className="secondary-button" onClick={onStories}>{t('nav.stories')}<ArrowRight size={18}/></button></section>
  </div>;
}
