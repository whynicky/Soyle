import fs from 'node:fs/promises';
import path from 'node:path';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const OUT='/Users/whynicky/Desktop/Projects/Soyle';
const BUILD=path.join(OUT,'.build/soyle-slides');
const FINAL=path.join(OUT,'output/soyle-project-overview.pptx');
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={ink:'#101820',dark:'#11171D',navy:'#123041',blue:'#234E65',mid:'#5D96AE',sky:'#91C3D4',pale:'#E9EDF7',white:'#F8FAFC',gray:'#53606B',light:'#DDE5EC',mint:'#C7E0E7'};
const FONT='Arial';
function shape(slide,geom,x,y,w,h,fill='none',lineFill='none',lineWidth=0,name=''){
 return slide.shapes.add({geometry:geom,name:name||undefined,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:lineFill,width:lineWidth}});
}
function txt(slide,text,x,y,w,h,{size=28,color=C.ink,bold=false,align='left',valign='top',font=FONT,insets=0,wrap='square',name=''}={}){
 const s=shape(slide,'textbox',x,y,w,h,'none','none',0,name);
 s.text=text;
 s.text.style={fontSize:size,typeface:font,color,bold,alignment:align,verticalAlignment:valign,autoFit:'shrinkText',wrap,insets};
 return s;
}
function rect(slide,x,y,w,h,fill,opts={}){return shape(slide,opts.geometry||'rect',x,y,w,h,fill,opts.line||'none',opts.width||0,opts.name||'');}
function title(slide,text,dark=false){txt(slide,text,76,58,1128,70,{size:48,color:dark?C.white:C.ink,bold:true,name:'Заголовок'});}
function notes(slide,text){slide.speakerNotes.text=text;}
function pixelMosaic(slide,x,y,cell,dark=false,name='Пиксельная мозаика',variant=0){
 const patterns=[
  ['000100000010000','001100001110000','000010000011000','010000001000110','111000000100010','001010001100000','000001110000100','000110000011000'],
  ['0000111111000000','0001222222110000','0012222222221000','0122222222222100','1222222222222210','1333333333333331','1333333333333331','1333333333333331','1333333333333331'],
  ['110000000000','111100000000','011111000000','001111110000','000011111100','000001111110','000000011111','000000001111'],
  ['100000000010000','010000100001000','000110000100100','001000001000010','100100010000001','000011000010000','000100000001000'],
  ['00000000000111','00000000001221','00000000012221','00000000122221','00000001222221','00000012222221','00000122222221','00001222222211','00012222221100','00122221100000','01221100000000'],
  ['0000000110000000','0000001221000000','0000012222100000','0000122222210000','0001222222221000','0012222222222100','0122222222222210','1222222222222221','1333333344444441','1333333344444441','1333333344444441','1333333344444441','1333333344444441','1333333344444441','1333333344444441','1333333344444441'],
 ];
 const rows=patterns[variant%patterns.length];
 const shades=dark?['#193748','#1E4355','#26576C','#31677D']:(variant===1||variant===5?['#173849','#2D5B72','#477F99','#80B4C7']:['#D2E2EB','#C9DCE7','#C2D8E4','#D7E5ED']);
 rows.forEach((row,ri)=>[...row].forEach((bit,ci)=>{
  if(bit!=='0') rect(slide,x+ci*cell,y+ri*cell,cell-2,cell-2,shades[(Number(bit)-1)%shades.length],{name:`${name} ${ri+1}-${ci+1}`});
 }));
}

// 1 — минимальная обложка
{
 const s=p.slides.add(); s.background.fill={type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#10171D'},{offset:52000,color:'#16394B'},{offset:100000,color:'#72AFC4'}]};
 pixelMosaic(s,830,246,13,true,'Пиксели титула — рассеянный рисунок',0);
 pixelMosaic(s,1094,494,9,true,'Пиксели титула — дальние фрагменты',3);
 txt(s,'Söyle',76,210,1080,145,{size:94,color:C.white,bold:true,name:'Название проекта'});
 txt(s,'Приложение для детей с алалией',80,382,920,54,{size:33,color:C.white,bold:true,name:'Описание продукта'});
 txt(s,'Карточки общения и домашние занятия\nпо плану специалиста',80,443,900,96,{size:28,color:'#E4F0F4',name:'Краткое описание'});
 notes(s,'Söyle — веб-приложение для детей с алалией и взрослых рядом. Оно объединяет карточки общения и короткие домашние занятия, которые идут по общему плану семьи и специалиста.');
}
// 2 — проблема
{
 const s=p.slides.add(); s.background.fill={type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#DCEAF0'},{offset:52000,color:'#E9EDF7'},{offset:100000,color:'#DCE6F0'}]}; title(s,'Потребности в повседневной практике');
 pixelMosaic(s,1038,52,15,false,'Пиксельная фигура у карточек',1);
 const xs=[76,465,854], ws=350;
 const heads=['Сообщить о важном','Заниматься дома','Держать общий план'];
 const body=['Ребёнку может не хватать доступного способа сообщить о своей потребности.','Домашним занятиям нужны структура и обратная связь.','Семье и специалисту важно работать с общим планом.'];
 const fills=[
  {type:'gradient',gradientKind:'linear',angleDeg:90,stops:[{offset:0,color:'#9CCBD9'},{offset:42000,color:'#35657A'},{offset:100000,color:'#142C3A'}]},
  '#11171D',
  '#F8FAFC/82'
 ];
 for(let i=0;i<3;i++){
  rect(s,xs[i],236,ws,342,fills[i],{geometry:'roundRect',name:`Блок трудности ${i+1}`});
  const fg=i<2?C.white:C.ink;
  txt(s,`0${i+1}`,xs[i]+26,260,72,50,{size:25,color:i<2?C.mint:C.mid,bold:true,name:`Номер ${i+1}`});
  txt(s,heads[i],xs[i]+26,338,298,72,{size:30,color:fg,bold:true,name:`Трудность ${i+1}`});
  txt(s,body[i],xs[i]+26,428,298,116,{size:23,color:fg,name:`Пояснение ${i+1}`});
 }
 notes(s,'Здесь собраны три задачи, которые Söyle адресует в домашней практике. Формулировки описывают потребности, а не медицинские выводы или утверждения о том, что они одинаковы для всех семей.');
}
// 3 — решение и роли
{
 const s=p.slides.add(); s.background.fill={type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#132E3D'},{offset:100000,color:'#70AFC3'}]}; title(s,'Решение Söyle',true);
 pixelMosaic(s,420,574,16,true,'Пиксельный след внизу слайда',2);
 const blocks=[
  ['AAC-карточки','Ребёнок собирает и озвучивает сообщение'],
  ['Короткая практика','Домашние занятия на 3, 5 или 10 минут'],
  ['Общий план','Семья и специалист ориентируются на один план']
 ];
 for(let i=0;i<3;i++){
  const y=168+i*126;
  txt(s,blocks[i][0],76,y,364,42,{size:28,color:C.white,bold:true,name:`Опора ${i+1}`});
  txt(s,blocks[i][1],76,y+46,476,54,{size:22,color:'#E2F0F4',name:`Описание опоры ${i+1}`});
 }
 // Editable role relationship diagram
 txt(s,'Три роли',738,175,360,42,{size:26,color:C.white,bold:true,name:'Заголовок схемы ролей'});
 const nodes=[{x:680,t:'Ребёнок'},{x:872,t:'Родитель'},{x:1064,t:'Специалист'}];
 rect(s,822,299,50,2,'#D4EDF5',{name:'Связь ребёнок — родитель'});
 rect(s,1014,299,50,2,'#D4EDF5',{name:'Связь родитель — специалист'});
 nodes.forEach((n,i)=>{
  shape(s,'roundRect',n.x,270,142,60,'#E9EDF7','none',0,`Роль ${i+1}`);
  txt(s,n.t,n.x,280,142,40,{size:17,color:C.ink,bold:true,align:'center',valign:'middle',name:`Подпись роли ${i+1}`});
 });
 txt(s,'Доступ специалиста — только к профилям,\nкоторые открыла семья',690,446,500,80,{size:19,color:'#E3F0F4',align:'center',name:'Условие доступа'});
 notes(s,'В основе продукта три опоры: AAC-карточки, короткие занятия и общий план. Ребёнок, родитель и специалист связаны вокруг практики; специалист видит только профили, к которым семья открыла доступ.');
}
// 4 — ход занятия
{
 const s=p.slides.add(); s.background.fill={type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#D9E7EE'},{offset:52000,color:'#E9EDF7'},{offset:100000,color:'#D3E2EA'}]}; title(s,'Последовательность занятия');
 pixelMosaic(s,940,584,12,false,'Отдельные пиксели у правого края',3);
 const steps=[
  ['Выбор карточек','Ребёнок собирает сообщение'],
  ['Озвучивание','Приложение озвучивает сообщение'],
  ['Практика и наблюдение','Взрослый проводит занятие и сохраняет наблюдение']
 ];
 const y=[204,344,484];
 for(let i=0;i<3;i++){
  if(i<2)rect(s,116,y[i]+66,2,y[i+1]-y[i]-55,'#9CB7C5',{name:`Линия шага ${i+1}`});
  shape(s,'ellipse',76,y[i],82,82,i===1?C.dark:'#D7E9EF','none',0,`Этап ${i+1}`);
  txt(s,String(i+1),76,y[i]+14,82,54,{size:29,color:i===1?C.white:C.ink,bold:true,align:'center',valign:'middle',name:`Номер этапа ${i+1}`});
  txt(s,steps[i][0],202,y[i]+1,470,42,{size:30,color:C.ink,bold:true,name:`Название этапа ${i+1}`});
  txt(s,steps[i][1],202,y[i]+48,590,56,{size:23,color:C.gray,name:`Описание этапа ${i+1}`});
 }
 // Duration as one clear editable field
 rect(s,868,215,334,330,{type:'gradient',gradientKind:'linear',angleDeg:90,stops:[{offset:0,color:'#132E3D'},{offset:100000,color:'#5E9DB4'}]},{geometry:'roundRect',name:'Длительность занятия'});
 txt(s,'Длительность',904,252,260,40,{size:24,color:'#E3F0F4',bold:true,name:'Подпись длительности'});
 txt(s,'3 · 5 · 10',894,328,282,82,{size:47,color:C.white,bold:true,align:'center',name:'Варианты длительности'});
 txt(s,'минут',904,425,260,42,{size:25,color:'#E3F0F4',align:'center',name:'Единица времени'});
 notes(s,'Сначала ребёнок выбирает карточки и собирает сообщение, затем приложение озвучивает его. Взрослый проводит короткое домашнее занятие и может сохранить наблюдение; доступны варианты на 3, 5 или 10 минут.');
}
// 5 — адаптация и данные
{
 const s=p.slides.add(); s.background.fill={type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#10171D'},{offset:100000,color:'#5E9DB4'}]}; title(s,'План и контроль данных',true);
 pixelMosaic(s,556,554,14,true,'Пиксельная диагональ у нижнего края',4);
 txt(s,'Как выбирается уровень',76,157,560,44,{size:28,color:C.white,bold:true,name:'Подраздел адаптация'});
 const plan=[
  'До 8 последних сопоставимых занятий: точность, самостоятельность и объём помощи',
  'Выбирается один из 3 уровней сложности',
  'Решение можно объяснить родителю'
 ];
 const tops=[221,333,434];
 for(let i=0;i<3;i++){
  txt(s,String(i+1).padStart(2,'0'),76,tops[i],60,34,{size:20,color:C.sky,bold:true,name:`Шаг плана ${i+1}`});
  txt(s,plan[i],148,tops[i],470,i===0?82:68,{size:22,color:C.white,name:`Описание шага плана ${i+1}`});
 }
 rect(s,694,166,508,408,'#F8FAFC/84',{geometry:'roundRect',name:'Контроль семьи и данных'});
 txt(s,'Контроль семьи',732,200,420,40,{size:28,color:C.ink,bold:true,name:'Подраздел контроль данных'});
 txt(s,'Доступ специалиста — только к открытым семьёй профилям. Данные можно скачать или удалить.',732,260,420,94,{size:21,color:C.ink,name:'Доступ и действия с данными'});
 rect(s,732,370,420,1,'#C6D2DE',{name:'Разделитель'});
 txt(s,'Камера — только с согласия; кадры обрабатываются на устройстве.',732,391,420,62,{size:21,color:C.ink,name:'Использование камеры'});
 txt(s,'Внешний AI API не используется.',732,482,420,54,{size:22,color:C.blue,bold:true,name:'Внешний AI API'});
 notes(s,'Адаптация опирается максимум на восемь последних сопоставимых занятий и три наблюдаемых параметра, после чего выбирается один из трёх уровней. Алгоритм детерминированный, не обращается к внешнему AI API, а его решение можно объяснить родителю. Семья управляет доступом и данными; камера используется только с согласия, кадры обрабатываются на устройстве.');
}
// 6 — текущий статус и возможные направления
{
 const s=p.slides.add(); s.background.fill=C.pale; title(s,'Статус проекта');
 // Three-part composition with an editable pixel structure between the text panels.
 rect(s,54,172,342,424,{type:'gradient',gradientKind:'linear',angleDeg:0,stops:[{offset:0,color:'#142D3B'},{offset:100000,color:'#4D8AA3'}]},{geometry:'roundRect',name:'Панель текущего статуса'});
 rect(s,850,172,376,424,'#F2F6F9/82',{geometry:'roundRect',name:'Панель возможных направлений'});
 pixelMosaic(s,448,238,22,false,'Пиксельная фигура между панелями',5);
 txt(s,'MVP',76,190,300,112,{size:78,color:C.white,bold:true,name:'Текущий статус'});
 txt(s,'Русский и казахский языки',80,327,286,72,{size:26,color:'#C8E3EC',bold:true,name:'Поддерживаемые языки'});
 txt(s,'Söyle не ставит диагноз\nи не заменяет специалиста',80,431,286,82,{size:22,color:C.white,name:'Ограничения продукта'});
 txt(s,'Клиническая эффективность не исследована',80,538,286,46,{size:18,color:'#E3F0F4',name:'Клиническое ограничение'});
 txt(s,'Возможные направления',874,190,324,70,{size:28,color:C.ink,bold:true,name:'Будущие направления'});
 txt(s,'[уточнить]',874,254,300,34,{size:20,color:C.mid,bold:true,name:'Пометка уточнения'});
 const future=['Пилот со специалистами','Проверка эффективности','Расширение продукта'];
 future.forEach((v,i)=>{
  const yy=312+i*82;
  txt(s,v,874,yy,324,48,{size:23,color:C.ink,name:`Направление на будущее ${i+1}`});
  rect(s,874,yy+55,300,1,'#CBD5DE',{name:`Линия направления ${i+1}`});
 });
 notes(s,'Сейчас Söyle находится на стадии MVP. Интерфейс поддерживает русский и казахский; продукт не ставит диагноз и не заменяет специалиста, а клиническая эффективность не исследована. Пилот со специалистами, проверка эффективности и расширение продукта — возможные направления, которые требуют уточнения и не обозначены как запущенные.');
}

await fs.mkdir(BUILD,{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 const blob=await p.export({slide:p.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(BUILD,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const pptx=await PresentationFile.exportPptx(p);
await pptx.save(path.join(BUILD,'draft.pptx'));
console.log('created draft',p.slides.items.length);
