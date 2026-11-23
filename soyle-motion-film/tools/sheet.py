import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; out=sys.argv[1]
ims=[Image.open(f'out/stills/f{f}.png').convert('RGB') for f in fs]
w,h=ims[0].size; cols=2 if len(ims)>1 else 1; rows=(len(ims)+cols-1)//cols
s=Image.new('RGB',(w*cols,(h+4)*rows),'black'); d=ImageDraw.Draw(s)
for k,(i,f) in enumerate(zip(ims,fs)):
  x,y=(k%cols)*w,(k//cols)*(h+4); s.paste(i,(x,y)); d.text((x+8,y+8),f,fill=(255,0,0))
s.save(out,quality=82)
