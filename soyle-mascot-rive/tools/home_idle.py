"""Add home poses to the existing painted rig; exercise clips remain compatible."""
def add_home(g):
 el,ref,track=g['el'],g['ref'],g['track']
 r,ab,root,vm,instance=[g[k] for k in ('r','ab','root','vm','instance')]
 head,body,left,right,lf,rf,gaze,neck=[g[k] for k in ('head','body','left','right','lf','rf','gaze','neck')]
 eyes,eyeMood,beaks=g['eyes'],g['eyeMood'],g['beaks']
 # A painted 3D book and the original flipper textures, never flat page polygons.
 bookAsset=el(r,'ImageAsset',file='assets/home-book-3d.png',name='Home • soft 3D book')
 book=el(root,'Node',name='Home only • little book',x=0,y=-18,opacity=0)
 root.remove(book);root.insert(1,book) # Original head stays in front of the shoulder joins.
 for side,x,angle,box,pivot in [
  ('Left',-25,-.45,(1190,268,1500,615),(1415,305)),
  ('Right',25,.5,(115,655,455,990),(200,690))]:
  hand=el(book,'Node',name=side+' reading flipper',x=x,y=-30,rotation=angle)
  painted=g['crop'](hand,side+' original reading flipper',box,pivot,.12)
  painted.set('scaleX','.138');painted.set('scaleY','.122')
 g['imagequad'](book,bookAsset,(0,60,1586,960),(-39,-22,39,22.26),dimensions=(1586,992),name='Rounded 3D open book')
 # Added transform channels need a standing reset in every existing clip.
 extras=[(body,'y',-42),(body,'rotation',0),(left,'x',-25),(left,'y',-65),(right,'x',25),(right,'y',-65),
         (lf,'x',-22),(rf,'x',22),(book,'opacity',0),(book,'y',-18),(book,'rotation',0),(left,'opacity',1),(right,'opacity',1)]
 for a in g['animations']+[g['still']]:
  d=int(a.get('duration'))
  for obj,p,v in extras:track(a,obj,p,[(0,v),(d,v)])
 # Retain complete reset tracks, including flexible wing tips from the original rig.
 base=g['base']+extras
 for side in ('Left','Right'):
  for vertex,x,y in g['wingverts'][side]:base += [(vertex,'x',x),(vertex,'y',y)]
 homeProp=el(vm,'ViewModelPropertyNumber',name='homeState')
 el(instance,'ViewModelInstanceNumber',viewModelPropertyId=ref(homeProp),propertyValue=10)
 names=['Home • Sit idle','Home • Read book','Home • Stand idle','Home • Sleepy','Home • Wake stretch','Home • Look around','Home • Small happy']
 durations=[480,600,540,600,216,540,192]
 home=el(ab,'StateMachine',name='HomeCompanion');layer=el(home,'StateMachineLayer',name='Home life and interactive reactions')
 el(layer,'AnyState',x=-200,y=-180);el(layer,'ExitState',x=900,y=-180);entry=el(layer,'EntryState',x=-200,y=0)
 homeStates=[el(layer,'AnimationState',x=(i%4)*250,y=(i//4)*230,reset='true') for i in range(13)]
 el(entry,'StateTransition',stateToId=ref(homeStates[6]),duration=700)
 values=list(range(6))+list(range(10,17))
 for i,source in enumerate(homeStates):
  for j,destination in enumerate(homeStates):
   if i==j:continue
   tr=el(source,'StateTransition',stateToId=ref(destination),duration=850 if i>=6 and j>=6 else 500,interpolationType='cubic')
   el(tr,'CubicEaseInterpolator',x1='.42',y1=0,x2='.58',y2=1)
   c=el(tr,'TransitionViewModelCondition',opValue='equal');comp=el(c,'TransitionPropertyViewModelComparator');bp=el(comp,'BindablePropertyNumber')
   el(bp,'DataBindContext',sourcePathIds=ref(vm)+'-'+ref(homeProp),propertyKey=636)
   el(c,'TransitionValueNumberComparator',value=values[j])
 for state,a in zip(homeStates,g['animations']):state.set('animationId',ref(a))
 homeAnimations=[];isolations=[]
 for k,(name,d) in enumerate(zip(names,durations)):
  sm=el(ab,'StateMachine',name=name);l=el(sm,'StateMachineLayer',name=name);e=el(l,'EntryState',x=0,y=0)
  el(l,'AnyState',x=0,y=-150);el(l,'ExitState',x=250,y=-150);st=el(l,'AnimationState',x=250,y=0,reset='true');el(e,'StateTransition',stateToId=ref(st))
  a=el(ab,'LinearAnimation',name=name,fps=60,duration=d,loopValue='oneShot' if k in (4,6) else 'loop');homeAnimations.append(a);isolations.append(sm)
  st.set('animationId',ref(a));homeStates[6+k].set('animationId',ref(a))
  keys={(ref(o),p):[(0,v),(d,v)] for o,p,v in base}
  def put(o,p,points):keys[(ref(o),p)]=points
  def constant(o,p,v):put(o,p,[(0,v),(d,v)])
  def breathe(o,p,v,amp):put(o,p,[(0,v),(d*.25,v+amp),(d*.5,v),(d*.75,v+amp),(d,v)])
  # Seated pose: lower torso and head together, feet forward, original head scale.
  constant(root,'y',194);constant(head,'y',-53);constant(body,'y',-28);constant(body,'scaleY',.97)
  constant(lf,'x',-25);constant(rf,'x',25);constant(lf,'y',0);constant(rf,'y',0);constant(lf,'rotation',-.12);constant(rf,'rotation',.12)
  constant(left,'y',-48);constant(right,'y',-48)
  breathe(body,'scaleY',.97,.012);breathe(head,'y',-53,-.7)
  put(head,'rotation',[(0,0),(d*.3,.025),(d*.7,-.02),(d,0)])
  blink=[(0,1),(164,1),(170,.06),(174,.06),(186,1),(d,1)]
  if k==1:
   constant(book,'opacity',1);breathe(book,'y',-18,-.5);constant(left,'opacity',0);constant(right,'opacity',0)
   constant(left,'rotation',-.45);constant(right,'rotation',.5)
   breathe(head,'y',-51,1);constant(gaze,'y',7)
   put(gaze,'x',[(0,-3),(120,3),(260,3),(330,-3),(470,3),(d,-3)])
   put(head,'rotation',[(0,-.025),(240,.02),(360,-.025),(d,-.025)])
  if k in (2,3,4):
   # Standing is the existing pose, with no whole-body tilt or flattened torso.
   constant(root,'x',100);constant(root,'y',205);constant(root,'rotation',0)
   constant(body,'y',-42);breathe(body,'scaleY',1.04,.012);breathe(head,'y',-69,-.6)
   constant(head,'rotation',0);constant(lf,'x',-22);constant(rf,'x',22);constant(lf,'y',-12);constant(rf,'y',-12)
   constant(lf,'rotation',0);constant(rf,'rotation',0);constant(left,'y',-65);constant(right,'y',-65)
  if k==3:
   blink=[(0,.55),(100,.18),(180,.06),(310,.10),(410,.06),(d,.55)]
   put(head,'rotation',[(0,0),(180,.015),(260,.02),(360,0),(480,.015),(d,0)])
   put(head,'y',[(0,-69),(180,-67.6),(260,-67.3),(360,-69),(480,-67.6),(d,-69)])
  if k==4:
   put(head,'y',[(0,-69),(68,-73),(106,-74),(168,-69),(d,-69)])
   put(body,'scaleY',[(0,1.04),(80,1.08),(114,1.08),(170,1.04),(d,1.04)])
   put(left,'rotation',[(0,0),(74,.62),(114,.64),(172,0),(d,0)])
   put(right,'rotation',[(0,0),(80,-.62),(114,-.64),(174,0),(d,0)])
   blink=[(0,.2),(54,.06),(100,.06),(152,1),(d,1)]
  if k==5:
   put(head,'rotation',[(0,0),(85,-.06),(176,-.06),(280,.07),(375,.07),(460,0),(d,0)])
   put(gaze,'x',[(0,0),(72,-7),(180,-7),(270,7),(390,7),(470,0),(d,0)])
   put(head,'x',[(0,0),(90,-1.5),(185,-1.5),(280,1.5),(390,1.5),(470,0),(d,0)])
  if k==6:
   put(left,'rotation',[(0,0),(36,.4),(67,.57),(97,.38),(130,.47),(167,0),(d,0)])
   put(head,'rotation',[(0,0),(40,-.045),(125,-.045),(170,0),(d,0)])
   put(beaks[0],'opacity',[(0,1),(24,1),(40,0),(144,0),(169,1),(d,1)])
   put(beaks[3],'opacity',[(0,0),(24,0),(40,1),(144,1),(169,0),(d,0)])
   blink=[(0,1),(125,1),(131,.06),(134,.06),(145,1),(d,1)]
  for eye in eyes:put(eye,'scaleY',blink)
  put(neck,'y',[(t,-62+(v+69)*.5) for t,v in keys[(ref(head),'y')]])
  seen=set()
  for obj,p,_ in base:
   key=(ref(obj),p)
   if key not in seen:track(a,obj,p,keys[key]);seen.add(key)
 # Review loop and individual artboards use the same rig, without changing Companion.
 showcase=el(ab,'StateMachine',name='HomeShowcase');l=el(showcase,'StateMachineLayer',name='Seated → read → look → stand → doze → stretch')
 e=el(l,'EntryState',x=-220,y=0);el(l,'AnyState',x=-220,y=-160);el(l,'ExitState',x=800,y=-160)
 order=[0,1,0,5,0,2,3,4,0,6]
 ss=[el(l,'AnimationState',animationId=ref(homeAnimations[k]),reset='true',x=i%5*240,y=i//5*240) for i,k in enumerate(order)]
 el(e,'StateTransition',stateToId=ref(ss[0]))
 for i,s in enumerate(ss):el(s,'StateTransition',stateToId=ref(ss[(i+1)%len(ss)]),duration=850,enableExitTime='true',exitTimeIsPercetange='true',exitTime=100)
 for i,(name,sm) in enumerate(list(zip(names,isolations))+[('Home life preview',showcase)]):
  b=el(r,'Artboard',width=200,height=220,name=name,x=i*240,y=2600)
  style=el(b,'LayoutComponentStyle');b.set('styleId',ref(style))
  nest=el(b,'NestedArtboard',artboardId=ref(ab),name='Original penguin')
  el(nest,'NestedStateMachine',animationId=ref(sm),name='Home playback')
 reviewY=3000
 for size,title in [(180,'Home motion review'),(64,'Home states • 64px'),(100,'Home states • 100px')]:
  cellw=size+40;cellh=size+42;b=el(r,'Artboard',width=4*cellw,height=2*cellh,name=title,x=0,y=reviewY);reviewY+=2*cellh+100
  style=el(b,'LayoutComponentStyle');b.set('styleId',ref(style))
  for i,(name,sm) in enumerate(zip(names,isolations)):
   nest=el(b,'NestedArtboard',artboardId=ref(ab),x=i%4*cellw+20,y=i//4*cellh,scaleX=size/220,scaleY=size/220,name=name)
   el(nest,'NestedStateMachine',animationId=ref(sm),name='Home playback')
   label=el(b,'Text',x=i%4*cellw+cellw/2,y=i//4*cellh+size+8,sizingValue='autoWidth',originX='.5',name=name+' label')
   style=el(label,'TextStylePaint',fontSize=12 if size==180 else 9,fontAssetId=ref(g['font']))
   f=el(style,'Fill');el(f,'SolidColor',colorValue='FFF5F1E7');el(label,'TextValueRun',styleId=ref(style),text=name.replace('Home • ',''))
