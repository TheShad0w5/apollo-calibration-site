"""Correct the v1.3 public guide to current prospective revision policy.
Usage: python refresh-process-guide.py INPUT.pdf OUTPUT.pdf
Requires PyMuPDF. Existing customer commitments are explicitly preserved.
"""
import sys
import fitz
source, destination = sys.argv[1:]
doc = fitz.open(source)
assert len(doc) == 3
replacement = ('New Accessport tunes include up to eight revisions for single fuel or twelve for flex fuel, including the initial calibration as revision 1. Existing orders retain their agreed revision allowance and scope. Hardware or fuel changes may require a new scope.')
for i,page in enumerate(doc):
    blocks=page.get_text('blocks'); tasks=[]
    if i==0:
        matches=[b for b in blocks if b[4].startswith('Single-fuel custom tunes include')]
        assert len(matches)==1
        box=fitz.Rect(matches[0][:4]);box.x1=558;box.y1+=4
        page.add_redact_annot(box,fill=(.94,.94,.96))
        tasks.append((box,replacement,10.5))
    footer=[b for b in blocks if 'November 12, 2026' in b[4]]
    assert len(footer)==1
    box=fitz.Rect(footer[0][:4]);box.x1=400;box.y1+=4
    page.add_redact_annot(box,fill=(1,1,1))
    tasks.append((box,'tunedbykeith.com  |  November 18, 2026  |  v1.4',8))
    page.apply_redactions()
    for box,text,size in tasks:
        assert page.insert_textbox(box,text,fontname='helv',fontsize=size,color=(.09,.13,.16))>=0
original_links=sum(len(p.get_links()) for p in doc)
doc.set_metadata({**doc.metadata,'modDate':'D:20261118000000Z','subject':'Subaru e-tuning process; initial calibration counts within revision allowance'})
doc.save(destination,garbage=4,deflate=True)
check=fitz.open(destination);text=' '.join(' '.join(p.get_text().split()) for p in check)
assert 'twelve' in text and 'including the initial calibration as revision 1' in text
assert 'does not count' not in text and 'sixteen' not in text
assert 'Existing orders retain their agreed' in text
assert sum(len(p.get_links()) for p in check)==original_links
print('Three pages verified; initial calibration counted, existing order commitments preserved.')
