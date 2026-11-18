import zipfile, xml.etree.ElementTree as E, re
p='output/soyle-project-overview-final.pptx'
z=zipfile.ZipFile(p)
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main'}
slides=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)],key=lambda x:int(re.search(r'slide(\d+)',x).group(1)))
notes=sorted([n for n in z.namelist() if re.fullmatch(r'ppt/notesSlides/notesSlide\d+\.xml',n)],key=lambda x:int(re.search(r'notesSlide(\d+)',x).group(1)))
print('slides',len(slides),'notes',len(notes),'media',len([n for n in z.namelist() if n.startswith('ppt/media/')]))
for n in slides:
 r=E.fromstring(z.read(n)); texts=[t.text or '' for t in r.findall('.//a:t',ns)]
 print(n,'shapes',len(r.findall('.//p:sp',ns)),'text=', ' | '.join(texts))
for n in notes:
 r=E.fromstring(z.read(n)); texts=[t.text or '' for t in r.findall('.//a:t',ns)]
 print(n,' '.join(texts))
