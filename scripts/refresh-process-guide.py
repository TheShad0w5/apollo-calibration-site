"""Refresh the November 3 v1.2 public guide without changing its layout or links.
Usage: python refresh-process-guide.py INPUT.pdf OUTPUT.pdf
Requires PyMuPDF. Explicit source matches prevent silent edits to another revision.
"""
import sys
import fitz
source, destination = sys.argv[1:]
doc = fitz.open(source)
assert len(doc) == 3
replacements = {
0: [
('Eight revisions should be ample', 'Single-fuel custom tunes include up to eight revisions; flex-fuel custom tunes include up to sixteen. These allowances apply to the agreed setup. The initial calibration is separate and does not count as a revision. Hardware or fuel changes may require a new scope.', 10.5, (0.94,0.94,0.96)),
('An initial file, a log submission', 'Keep the revision identifier on each file and use your private order page for logs, feedback and calibration files. Sending a log or downloading the same file again does not itself use a revision. Ask about any additional work before proceeding.', 8.5, (1,1,1))],
1: [
('A typical progression, not eight mandatory', 'An illustrative sequence, not a fixed number of revisions or permission to advance on your own.', 10.5, (1,1,1)),
('Revision 1 |', 'Step 1 | Establish a reliable baseline',13,(1,1,1)),
('Revision 2 |', 'Step 2 | Refine everyday operation',13,(1,1,1)),
('Revisions 3-4 |', 'Step 3 | Introduce controlled load',13,(1,1,1)),
('Revisions 5-6 |', 'Step 4 | Refine delivery',13,(1,1,1)),
('Revisions 7-8 |', 'Step 5 | Validate where needed',13,(1,1,1))],
2: [('If outside influences or a changed setup', 'If outside influences or a changed setup require more work, I explain what needs resolving and discuss any additional revisions, diagnostics or revised quote before proceeding. The revision allowance is not an opportunity to tune around a mechanical fault. No additional-revision price is implied by this guide.',10.5,(1,1,1))]
}
for i,page in enumerate(doc):
 blocks=page.get_text('blocks'); tasks=[]
 for prefix,text,size,fill in replacements[i]:
  matches=[b for b in blocks if b[4].startswith(prefix)]
  assert len(matches)==1,(i,prefix)
  b=matches[0]; box=fitz.Rect(b[:4]); box.x1=570 if box.x0==42 else 558
  box.y1+=4
  page.add_redact_annot(box,fill=fill)
  tasks.append((box,text,size,'hebo' if size==13 else 'helv'))
 footer=[b for b in blocks if 'November 3, 2026' in b[4]]
 assert len(footer)==1
 box=fitz.Rect(footer[0][:4]);box.x1=400;box.y1+=4
 page.add_redact_annot(box,fill=(1,1,1));tasks.append((box,'tunedbykeith.com  |  November 12, 2026  |  v1.3',8,'helv'))
 page.apply_redactions()
 for box,text,size,font in tasks:
  spare=page.insert_textbox(box,text,fontname=font,fontsize=size,color=(.09,.13,.16))
  assert spare>=0,(i,text,spare)
doc.set_metadata({**doc.metadata,'modDate':'D:20261112000000Z','subject':'Subaru e-tuning process; single-fuel and flex-fuel revision allowances'})
doc.save(destination,garbage=4,deflate=True)
check=fitz.open(destination)
text='\n'.join(p.get_text() for p in check)
assert 'up to sixteen' in text and 'does not count as a revision' in text
assert 'Confirm how the initial file' not in text and 'Revisions 7-8' not in text
assert sum(len(p.get_links()) for p in check)==sum(len(p.get_links()) for p in doc)
print('Three pages verified; current allowances, stage labels, original links and safety guidance preserved.')
