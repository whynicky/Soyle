"""Home-only painted replacement poses and native, articulated transition clips."""
def add_home(g):
 el,ref,track=g['el'],g['ref'],g['track']
 r,ab,root,vm,instance=[g[k] for k in ('r','ab','root','vm','instance')]
 head,body,left,right,lf,rf,gaze,neck=[g[k] for k in ('head','body','left','right','lf','rf','gaze','neck')]
 eyes,beaks=g['eyes'],g['beaks']
 atlas=el(r,'ImageAsset',file='assets/home-pose-parts.png',name='Painted seated and reclining anatomy')
 bookAsset=el(r,'ImageAsset',file='assets/home-book-3d.png',name='Home • soft 3D book')
 def painted(name,box,target,x=0,y=0):
  n=el(root,'Node',name=name,x=x,y=y,opacity=0)
  g['imagequad'](n,atlas,box,target,dimensions=(1280,1280),name=name+' pixels')
  return n
 seat=painted('Seated pelvis • broad grounded rump',(10,210,625,655),(-53,-65,53,12))
 recline=painted('Reclining torso • horizontal anatomy',(630,245,1240,655),(-53,-58,53,12),25,0)
 soleL=painted('Left forward sole',(110,725,560,1160),(-17,-30,17,5),-32,0)
 soleR=painted('Right forward sole',(700,725,1150,1160),(-17,-30,17,5),32,0)
 # First declared objects draw in front: face, book/hands, soles, torsos, wings.
 for n in (seat,recline):root.remove(n);root.insert(2,n)
 for n in (soleL,soleR):root.remove(n);root.insert(1,n)
 book=el(root,'Node',name='Open book • held in seated lap',x=0,y=-21,opacity=0)
 root.remove(book);root.insert(1,book)
 hands=[]
 for side,x,angle,box,pivot in [('Left',-39,-.8,(1190,268,1500,615),(1415,305)),('Right',39,.8,(115,655,455,990),(200,690))]:
  hand=el(book,'Node',name=side+' holding wing',x=x,y=-12,rotation=angle);hands.append(hand)
  n=g['crop'](hand,side+' original flipper texture',box,pivot,.105)
  n.set('scaleX','.105');n.set('scaleY','.105')
 page=el(book,'Node',name='Turning textured page',opacity=0)
 im=el(page,'Image',assetId=ref(bookAsset),name='Actual cream paper texture')
 mesh=el(im,'Mesh',triangleIndexBytes='AAECAAID',name='Page bending surface')
 pageverts=[]
 for (px,py),(x,y) in zip([(800,260),(1325,140),(1390,680),(800,815)],[(0,-13),(35,-20),(36,13),(0,22)]):
  pageverts.append(el(mesh,'ContourMeshVertex',x=x,y=y,u=px/1586,v=py/992))
 g['imagequad'](book,bookAsset,(0,60,1586,960),(-44,-25,44,25),dimensions=(1586,992),name='Full rounded open book')
 # Contact shadow fixes the ground at y=212; it never moves with breathing.
 shadow=el(root,'Shape',name='Home floor contact',y=7,scaleY='.12',opacity=0)
 el(shadow,'Ellipse',width=125,height=125);f=el(shadow,'Fill');grad=el(f,'RadialGradient',startX=0,startY=0,endX=62.5,endY=0)
 for pos,color in [(0,'50344749'),(.5,'20344749'),(1,'00344749')]:el(grad,'GradientStop',position=pos,colorValue=color)
 floor=el(root,'Shape',name='Home resting surface • shared ground plane',y=4,opacity=0)
 el(floor,'Ellipse',width=148,height=8);f=el(floor,'Fill');grad=el(f,'LinearGradient',startX=0,startY=-4,endX=0,endY=4)
 for pos,color in [(0,'FFFDF6E7'),(.65,'FFE6DBC0'),(1,'FFC2B69A')]:el(grad,'GradientStop',position=pos,colorValue=color)
 extra=[(body,'y',-42),(body,'rotation',0),(body,'opacity',1),(head,'opacity',1),(neck,'opacity',1),
  (left,'x',-25),(left,'y',-65),(right,'x',25),(right,'y',-65),(left,'opacity',1),(right,'opacity',1),
  (lf,'x',-22),(rf,'x',22),(lf,'opacity',1),(rf,'opacity',1),(book,'opacity',0),(book,'y',-21),(book,'rotation',0),
  (seat,'opacity',0),(seat,'y',0),(seat,'scaleY',1),(recline,'opacity',0),(recline,'scaleY',1),
  (soleL,'opacity',0),(soleR,'opacity',0),(soleL,'x',-32),(soleR,'x',32),(soleL,'y',0),(soleR,'y',0),(soleL,'rotation',-.15),(soleR,'rotation',.15),
  (shadow,'opacity',0),(shadow,'scaleX',1),(floor,'opacity',0),(floor,'scaleX',1),(page,'opacity',0)]
 for v in pageverts:extra += [(v,'x',float(v.get('x'))),(v,'y',float(v.get('y')))]
 for hand in hands:extra += [(hand,'rotation',float(hand.get('rotation')))]
 # Preserve all legacy channel values; only introduce explicit resets for new parts.
 for a in g['animations']+[g['still']]:
  d=int(a.get('duration'))
  for obj,p,v in extra:track(a,obj,p,[(0,v),(d,v)])
 base=g['base']+extra
 for side in ('Left','Right'):
  for vertex,x,y in g['wingverts'][side]:base += [(vertex,'x',x),(vertex,'y',y)]
 objects={(ref(o),p):o for o,p,v in base};defaults={(ref(o),p):v for o,p,v in base}
 def pose(kind):
  vals=defaults.copy()
  def setv(o,**ps):
   for p,v in ps.items():vals[(ref(o),p)]=v
  setv(shadow,opacity=1);setv(floor,opacity=1)
  if kind=='stand':return vals
  setv(body,opacity=0);setv(lf,opacity=0);setv(rf,opacity=0);setv(neck,opacity=0)
  setv(seat,opacity=1);setv(soleL,opacity=1);setv(soleR,opacity=1)
  setv(head,y=-40);setv(left,x=-37,y=-40,rotation=-.25);setv(right,x=37,y=-40,rotation=.25)
  if kind=='lie':
   setv(seat,opacity=0);setv(recline,opacity=1);setv(head,x=-12,y=-15,rotation=-.65)
   setv(soleL,x=61,y=-4,rotation=.7);setv(soleR,x=73,y=-12,rotation=.9)
   setv(left,x=-31,y=-11,rotation=.75);setv(right,x=38,y=-39,rotation=.7)
   setv(shadow,scaleX=1.35);setv(floor,scaleX=1.25)
  return vals
 poses={name:pose(name) for name in ('stand','sit','lie')}
 homeProp=el(vm,'ViewModelPropertyNumber',name='homeState');el(instance,'ViewModelInstanceNumber',viewModelPropertyId=ref(homeProp),propertyValue=12)
 specs=[('Sit idle',480,'sit'),('Read book',600,'sit'),('Stand idle',540,'stand'),('Sleepy',600,'lie'),('Wake stretch',240,'lie'),('Look around',540,'sit'),('Small happy',192,'sit'),('Lie down',540,'lie'),('stand_to_sit',84,'stand'),('sit_to_stand',84,'sit'),('sit_to_lie',108,'sit')]
 home=el(ab,'StateMachine',name='HomeCompanion');layer=el(home,'StateMachineLayer',name='Grounded home poses and original reactions')
 el(layer,'AnyState',x=-200,y=-180);el(layer,'ExitState',x=1200,y=-180);entry=el(layer,'EntryState',x=-200,y=0)
 states=[el(layer,'AnimationState',x=i%5*250,y=i//5*230,reset='true') for i in range(6+len(specs))]
 el(entry,'StateTransition',stateToId=ref(states[8]),duration=0)
 def condition(tr,value):
  c=el(tr,'TransitionViewModelCondition',opValue='equal');comp=el(c,'TransitionPropertyViewModelComparator');bp=el(comp,'BindablePropertyNumber')
  el(bp,'DataBindContext',sourcePathIds=ref(vm)+'-'+ref(homeProp),propertyKey=636);el(c,'TransitionValueNumberComparator',value=value)
 def transition(source,dest,value=None,duration=500,exit=False):
  kw=dict(stateToId=ref(dest),duration=duration,interpolationType='cubic')
  if exit:kw.update(enableExitTime='true',exitTimeIsPercetange='true',exitTime=100)
  tr=el(source,'StateTransition',**kw);el(tr,'CubicEaseInterpolator',x1='.42',y1=0,x2='.58',y2=1)
  if value is not None:condition(tr,value)
  return tr
 # Route upright/seated/reclined anatomical changes through real timelines.
 special={(8,6):14,(6,8):15,(6,13):16}
 values=list(range(6))+list(range(10,18))
 for i,source in enumerate(states[:14]):
  for j,value in enumerate(values):
   if i==j:continue
   target=special.get((i,j),j)
   transition(source,states[target],value,100 if target>=14 else 650)
 for idx,dest in [(14,6),(15,8),(16,13)]:
  # A tap can interrupt a transitional clip; otherwise finish before settling.
  for j in range(6):transition(states[idx],states[j],j,400)
  transition(states[idx],states[dest],duration=100,exit=True)
 for st,a in zip(states,g['animations']):st.set('animationId',ref(a))
 animations=[];isolations=[]
 for k,(label,d,kind) in enumerate(specs):
  name='Home • '+label;sm=el(ab,'StateMachine',name=name);l=el(sm,'StateMachineLayer',name=name)
  e=el(l,'EntryState',x=0,y=0);el(l,'AnyState',x=0,y=-150);el(l,'ExitState',x=250,y=-150)
  st=el(l,'AnimationState',x=250,y=0,reset='true');el(e,'StateTransition',stateToId=ref(st))
  a=el(ab,'LinearAnimation',name=name,fps=60,duration=d,loopValue='oneShot' if k in (4,6,8,9,10) else 'loop')
  st.set('animationId',ref(a));states[k+6].set('animationId',ref(a));animations.append(a);isolations.append(sm)
  keys={key:[(0,v),(d,v)] for key,v in poses[kind].items()}
  def put(o,p,points):keys[(ref(o),p)]=points
  def constant(o,p,v):put(o,p,[(0,v),(d,v)])
  def breathe(o,p,v,amp):put(o,p,[(0,v),(d*.25,v+amp),(d*.5,v),(d*.75,v+amp),(d,v)])
  breathe(body if kind=='stand' else recline if kind=='lie' else seat,'scaleY',1.04 if kind=='stand' else 1,.012)
  hy=poses[kind][(ref(head),'y')];breathe(head,'y',hy,-.55)
  blink=[(0,1),(164,1),(170,.06),(174,.06),(186,1),(d,1)]
  if k==1:
   constant(book,'opacity',1);constant(left,'opacity',0);constant(right,'opacity',0);constant(gaze,'y',10)
   put(gaze,'x',[(0,-4),(180,4),(270,4),(360,-4),(d,-4)])
   breathe(head,'y',-39,.7)
   # Lift a real textured leaf, fold it across the spine, then settle onto the page block.
   put(page,'opacity',[(0,0),(249,0),(252,1),(345,1),(350,0),(d,0)])
   for v in (pageverts[1],pageverts[2]):
    x=float(v.get('x'));y=float(v.get('y'))
    put(v,'x',[(0,x),(250,x),(295,3),(340,-x),(d,-x)])
    put(v,'y',[(0,y),(250,y),(295,y-15),(340,y),(d,y)])
   put(hands[1],'rotation',[(0,.8),(240,.8),(280,.45),(330,.8),(d,.8)])
  if k==3:
   blink=[(0,.035),(d,.035)]
   put(head,'rotation',[(0,-.65),(240,-.665),(420,-.65),(d,-.65)])
  if k in (8,9,10,4):
   start,end=(('stand','sit') if k==8 else ('sit','stand') if k==9 else ('sit','lie') if k==10 else ('lie','sit'))
   finish=108 if k==4 else d
   for key,v in poses[start].items():
    to=poses[end][key]
    # Brief texture replacement halfway through articulated movement, not a whole-character dissolve.
    if key[1]=='opacity' and v!=to:keys[key]=[(0,v),(finish*.42,v),(finish*.62,to),(d,to)]
    else:keys[key]=[(0,v),(finish,to),(d,to)]
   if k==4:
    put(left,'rotation',[(0,.75),(108,-.25),(150,.65),(180,.65),(d,-.25)])
    put(right,'rotation',[(0,.7),(108,.25),(150,-.65),(180,-.65),(d,.25)])
    put(head,'y',[(0,-15),(108,-40),(160,-45),(190,-45),(d,-40)])
    blink=[(0,.035),(90,.035),(130,1),(d,1)]
   elif k in (8,9):
    # Lower/raise the shoulders and pelvis; soles roll forward while the heel stays grounded.
    put(body,'y',[(0,-42 if k==8 else -23),(d,-23 if k==8 else -42)])
    put(seat,'y',[(0,-15 if k==8 else 0),(d,0 if k==8 else -15)])
    blink=[(0,1),(d,1)]
  if k==5:
   put(head,'rotation',[(0,0),(100,-.09),(200,-.09),(310,.09),(410,.09),(d,0)])
   put(head,'scaleX',[(0,1),(100,.96),(200,.96),(310,.96),(410,.96),(d,1)])
   put(gaze,'x',[(0,0),(85,-9),(210,-9),(300,9),(425,9),(d,0)])
  if k==6:
   put(left,'rotation',[(0,-.25),(40,.45),(75,.6),(110,.4),(155,-.25),(d,-.25)])
   put(beaks[0],'opacity',[(0,1),(24,1),(40,0),(144,0),(169,1),(d,1)])
   put(beaks[3],'opacity',[(0,0),(24,0),(40,1),(144,1),(169,0),(d,0)])
   blink=[(0,1),(125,1),(131,.06),(134,.06),(145,1),(d,1)]
  for eye in eyes:put(eye,'scaleY',blink)
  for key,points in keys.items():track(a,objects[key],key[1],points)
 # Native live review walks through transitions rather than simply crossfading poses.
 showcase=el(ab,'StateMachine',name='HomeShowcase');l=el(showcase,'StateMachineLayer',name='Stand → sit → read → lie → sleep → stretch')
 e=el(l,'EntryState',x=-220,y=0);el(l,'AnyState',x=-220,y=-160);el(l,'ExitState',x=800,y=-160)
 order=[2,8,0,1,5,10,7,3,4,0,9,2]
 ss=[el(l,'AnimationState',animationId=ref(animations[k]),reset='true',x=i%5*240,y=i//5*240) for i,k in enumerate(order)]
 el(e,'StateTransition',stateToId=ref(ss[0]))
 for i,s in enumerate(ss):transition(s,ss[(i+1)%len(ss)],duration=100 if order[i] in (8,9,10,4) or order[(i+1)%len(ss)] in (8,9,10) else 650,exit=True)
 for i,(name,sm) in enumerate([(f'Home • {label}',sm) for (label,_,_),sm in zip(specs,isolations)]+[('Home life preview',showcase)]):
  b=el(r,'Artboard',width=200,height=220,name=name,x=i*240,y=2600);style=el(b,'LayoutComponentStyle');b.set('styleId',ref(style))
  nest=el(b,'NestedArtboard',artboardId=ref(ab),name='Original penguin with home anatomy');el(nest,'NestedStateMachine',animationId=ref(sm),name='Home playback')
 reviewY=3000
 for size,title in [(180,'Home motion review'),(64,'Home states • 64px'),(100,'Home states • 100px')]:
  cellw=size+40;cellh=size+42;b=el(r,'Artboard',width=4*cellw,height=2*cellh,name=title,x=0,y=reviewY);reviewY+=2*cellh+100
  style=el(b,'LayoutComponentStyle');b.set('styleId',ref(style))
  for i,k in enumerate([2,0,1,7,3,4,5,6]):
   name='Home • '+specs[k][0];nest=el(b,'NestedArtboard',artboardId=ref(ab),x=i%4*cellw+20,y=i//4*cellh,scaleX=size/220,scaleY=size/220,name=name)
   el(nest,'NestedStateMachine',animationId=ref(isolations[k]),name='Home playback')
   label=el(b,'Text',x=i%4*cellw+cellw/2,y=i//4*cellh+size+8,sizingValue='autoWidth',originX='.5',name=name+' label')
   style=el(label,'TextStylePaint',fontSize=12 if size==180 else 9,fontAssetId=ref(g['font']));f=el(style,'Fill');el(f,'SolidColor',colorValue='FFF5F1E7');el(label,'TextValueRun',styleId=ref(style),text=specs[k][0])
