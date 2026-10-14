from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable, KeepTogether

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'math-questions.js'
TEXT = SRC.read_text()
FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BOLD_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
pdfmetrics.registerFont(TTFont('DV', FONT_PATH))
pdfmetrics.registerFont(TTFont('DV-Bold', FONT_BOLD_PATH))
NAVY = colors.HexColor('#1B2A41')
TEAL = colors.HexColor('#176B68')
BLUE = colors.HexColor('#285A85')
MINT = colors.HexColor('#DDF6EF')
SKY = colors.HexColor('#E1F1FB')
INK = colors.HexColor('#243144')
MUTED = colors.HexColor('#526174')
GRID = colors.HexColor('#A9B8C8')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='DocTitle', parent=styles['Title'], fontName='DV-Bold', fontSize=23, leading=28, textColor=NAVY, alignment=TA_LEFT, spaceAfter=4))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontName='DV', fontSize=10, leading=14, textColor=MUTED, spaceAfter=8))
styles.add(ParagraphStyle(name='Section', parent=styles['Heading2'], fontName='DV-Bold', fontSize=14, leading=18, textColor=NAVY, spaceBefore=4, spaceAfter=8))
styles.add(ParagraphStyle(name='CellHead', parent=styles['Normal'], fontName='DV-Bold', fontSize=9, leading=12, textColor=NAVY))
styles.add(ParagraphStyle(name='CellHeadWhite', parent=styles['Normal'], fontName='DV-Bold', fontSize=9, leading=12, textColor=colors.white))
styles.add(ParagraphStyle(name='CellBody', parent=styles['Normal'], fontName='DV', fontSize=8.6, leading=12, textColor=INK))
styles.add(ParagraphStyle(name='CellSmall', parent=styles['Normal'], fontName='DV', fontSize=7.5, leading=10, textColor=INK))
styles.add(ParagraphStyle(name='Mini', parent=styles['Normal'], fontName='DV-Bold', fontSize=8, leading=10, textColor=NAVY, alignment=TA_CENTER))


def extract_cards(name):
    start = TEXT.index(f'export const {name} = [')
    end = TEXT.index('];', start)
    block = TEXT[start:end]
    found = re.findall(r"\{front:'(.*?)',back:'(.*?)'(?:\s*,visual:'(.*?)')?\}", block, flags=re.S)
    if not found:
        raise RuntimeError(f'Keine Karten gefunden: {name}')
    return [{'front': a, 'back': b, 'visual': c or ''} for a, b, c in found]


class Overview(Flowable):
    def __init__(self, width, height=204):
        super().__init__()
        self.width, self.height = width, height
    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        return self.width, self.height
    def _line(self, c, x1, y1, x2, y2, color=GRID, width=0.7):
        c.setStrokeColor(color); c.setLineWidth(width); c.line(x1, y1, x2, y2)
    def _plot(self, c, x, y, w, h, anti=False):
        c.saveState()
        c.setStrokeColor(colors.HexColor('#D7E0E8')); c.setLineWidth(.45)
        for i in range(1, 4):
            self._line(c, x + i*w/4, y, x + i*w/4, y+h, colors.HexColor('#D7E0E8'), .45)
            self._line(c, x, y + i*h/4, x+w, y + i*h/4, colors.HexColor('#D7E0E8'), .45)
        self._line(c, x, y, x+w, y, NAVY, 1.2); self._line(c, x, y, x, y+h, NAVY, 1.2)
        c.setFillColor(NAVY); c.setFont('DV', 6.5); c.drawString(x+w-3, y-10, 'x'); c.drawString(x-9, y+h-1, 'y'); c.drawString(x-7, y-8, '0')
        if anti:
            c.setStrokeColor(BLUE); c.setLineWidth(2.4)
            p=c.beginPath(); p.moveTo(x+4, y+h-4)
            for i in range(1, 35):
                t=i/34
                px=x+4+t*(w-8); py=y+4+(h-8)/(1+5*t)
                p.lineTo(px,py)
            c.drawPath(p)
        else:
            c.setStrokeColor(TEAL); c.setLineWidth(2.4); c.line(x, y, x+w, y+h)
        c.restoreState()
    def _apple(self,c,x,y):
        c.setFillColor(colors.HexColor('#E65757')); c.circle(x,y,5,fill=1,stroke=0); c.circle(x+5,y,5,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#4C9B68')); c.ellipse(x+1,y+6,x+7,y+10,fill=1,stroke=0)
    def _person(self,c,x,y):
        c.setFillColor(colors.HexColor('#E7B66E')); c.circle(x,y+7,3.5,fill=1,stroke=0)
        c.setStrokeColor(BLUE); c.setLineWidth(2); c.line(x,y+3,x,y-3); c.line(x,y+1,x-4,y-2); c.line(x,y+1,x+4,y-2); c.line(x,y-3,x-3,y-7); c.line(x,y-3,x+3,y-7)
    def draw(self):
        c=self.canv; w=self.width; gap=10; pw=(w-gap)/2; y=8; h=self.height-16
        for idx,(title,fill,accent,anti) in enumerate([('PROPORTIONAL',MINT,TEAL,False),('ANTIPROPORTIONAL',SKY,BLUE,True)]):
            x=idx*(pw+gap)
            c.setFillColor(fill); c.roundRect(x,y,pw,h,10,fill=1,stroke=0)
            c.setFillColor(accent); c.roundRect(x,y+h-27,pw,27,10,fill=1,stroke=0)
            c.rect(x,y+h-27,pw,9,fill=1,stroke=0)
            c.setFillColor(colors.white); c.setFont('DV-Bold',9); c.drawString(x+10,y+h-18,title)
            self._plot(c,x+13,y+60,pw-26,69,anti)
            c.setFillColor(NAVY); c.setFont('DV-Bold',8.2)
            if not anti:
                c.drawString(x+12,y+45,'Quotient gleich:  y : x = k')
                for j in range(3): self._apple(c,x+17+j*11,y+23)
                c.setFont('DV',7.1); c.drawString(x+58,y+22,'2 kg → 5 €     |     4 kg → 10 €')
            else:
                c.drawString(x+12,y+45,'Produkt gleich:  x · y = k')
                for j in range(4): self._person(c,x+17+j*11,y+25)
                c.setFont('DV',7.1); c.drawString(x+68,y+22,'4 Arbeiter · 12 h = 48')
                c.setFont('DV',7.1); c.drawString(x+68,y+11,'6 Arbeiter · 8 h = 48')


class MiniVisual(Flowable):
    def __init__(self, kind, width=190, height=54):
        super().__init__(); self.kind=kind; self.width=width; self.height=height
    def wrap(self, availWidth, availHeight): self.width=min(self.width,availWidth); return self.width,self.height
    def draw(self):
        c=self.canv; w=self.width; h=self.height
        c.saveState(); c.setFillColor(colors.HexColor('#F1F6FA')); c.roundRect(0,0,w,h,5,fill=1,stroke=0)
        if self.kind in ('prop-table','anti-table'):
            rows=(('x','1','2','3','4'),('y','3','6','9','12')) if self.kind=='prop-table' else (('Arbeiter','2','3','4','6'),('Stunden','24','16','12','8'))
            n=5; cw=w/n; rh=17; top=h-9
            c.setFont('DV-Bold',7)
            for ri,row in enumerate(rows):
                yy=top-(ri+1)*rh
                for ci,val in enumerate(row):
                    xx=ci*cw
                    c.setFillColor(colors.HexColor('#DDF6EF') if ci==0 else colors.white); c.rect(xx+1,yy,cw-2,rh-1,fill=1,stroke=0)
                    c.setFillColor(NAVY); c.drawCentredString(xx+cw/2,yy+5,val)
        elif self.kind in ('prop-graph','anti-graph'):
            x=22;y=12;pw=w-34;ph=h-22
            for i in range(1,4): self._line(c,x+i*pw/4,y,x+i*pw/4,y+ph,colors.HexColor('#D4DFE8'),.4); self._line(c,x,y+i*ph/4,x+pw,y+i*ph/4,colors.HexColor('#D4DFE8'),.4)
            self._line(c,x,y,x+pw,y,NAVY,1);self._line(c,x,y,x,y+ph,NAVY,1)
            if self.kind=='prop-graph': self._line(c,x,y,x+pw,y+ph,TEAL,2)
            else:
                c.setStrokeColor(BLUE);c.setLineWidth(2);p=c.beginPath();p.moveTo(x+2,y+ph-2)
                for i in range(1,30):
                    t=i/29;p.lineTo(x+2+t*(pw-4),y+2+(ph-4)/(1+5*t))
                c.drawPath(p)
            c.setFont('DV',6);c.setFillColor(NAVY);c.drawString(x+pw-1,y-7,'x');c.drawString(x-8,y+ph-2,'y')
        elif self.kind=='apples':
            for x0,n,label in [(17,2,'2 kg = 5 €'),(w/2+18,5,'5 kg = 12,50 €')]:
                for i in range(n): self._apple(c,x0+i*9,32)
                c.setFillColor(NAVY);c.setFont('DV-Bold',7);c.drawString(x0,9,label)
        elif self.kind=='workers':
            for x0,n,label in [(17,4,'4 Arbeiter · 12 h'),(w/2+18,6,'6 Arbeiter · 8 h')]:
                for i in range(n): self._person(c,x0+i*9,34)
                c.setFillColor(NAVY);c.setFont('DV-Bold',7);c.drawString(x0,8,label)
        c.restoreState()
    def _line(self,c,x1,y1,x2,y2,color,width):c.setStrokeColor(color);c.setLineWidth(width);c.line(x1,y1,x2,y2)
    def _apple(self,c,x,y):
        c.setFillColor(colors.HexColor('#E65757'));c.circle(x,y,4,fill=1,stroke=0);c.circle(x+4,y,4,fill=1,stroke=0);c.setFillColor(colors.HexColor('#4C9B68'));c.ellipse(x+1,y+4,x+6,y+7,fill=1,stroke=0)
    def _person(self,c,x,y):
        c.setFillColor(colors.HexColor('#E7B66E'));c.circle(x,y+5,2.5,fill=1,stroke=0);c.setStrokeColor(BLUE);c.setLineWidth(1.4);c.line(x,y+2,x,y-3);c.line(x,y+1,x-3,y-1);c.line(x,y+1,x+3,y-1);c.line(x,y-3,x-2,y-6);c.line(x,y-3,x+2,y-6)


def footer(canvas, doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor('#D6E0E8')); canvas.line(16*mm,14*mm,194*mm,14*mm)
    canvas.setFont('DV',7); canvas.setFillColor(MUTED); canvas.drawString(16*mm,9*mm,'Mathe · Klasse 7 · Realschule NRW')
    canvas.drawRightString(194*mm,9*mm,f'Seite {doc.page}'); canvas.restoreState()


def build_pdf(path, title, subtitle, cards, front_title, back_title):
    doc=SimpleDocTemplate(str(path), pagesize=A4, leftMargin=16*mm, rightMargin=16*mm, topMargin=15*mm, bottomMargin=20*mm, title=title, author='Mathe lernen · Klasse 7')
    story=[Paragraph(title,styles['DocTitle']),Paragraph(subtitle,styles['Sub']),Overview(doc.width),Spacer(1,7),Paragraph('Merke',styles['Section'])]
    summary=Table([[Paragraph('<b>Proportional:</b> gleicher Quotient y : x = k. Erst auf 1 rechnen, dann auf den Zielwert.',styles['CellBody']),Paragraph('<b>Antiproportional:</b> gleiches Produkt x · y = k. Das feste Produkt durch den neuen Wert teilen.',styles['CellBody'])]],colWidths=[doc.width/2,doc.width/2])
    summary.setStyle(TableStyle([('BACKGROUND',(0,0),(0,0),MINT),('BACKGROUND',(1,0),(1,0),SKY),('BOX',(0,0),(-1,-1),.6,GRID),('INNERGRID',(0,0),(-1,-1),.6,colors.white),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    story += [summary,Spacer(1,8),Paragraph('Darstellungen sicher lesen: Wörter → Tabelle → Regel → Graph. Prüfe immer die Größen und ihre Einheiten.',styles['Sub']),PageBreak()]
    per_page=6
    for base in range(0,len(cards),per_page):
        if base>0: story.append(PageBreak())
        subset=cards[base:base+per_page]
        story.append(Paragraph(f'{front_title} &amp; {back_title} · Karten {base+1}–{base+len(subset)}',styles['Section']))
        rows=[[Paragraph(front_title,styles['CellHeadWhite']),Paragraph(back_title,styles['CellHeadWhite'])]]
        for card in subset:
            left=Paragraph(card['front'],styles['CellBody'])
            right=[Paragraph(card['back'],styles['CellBody'])]
            if card['visual']:
                right += [Spacer(1,4),MiniVisual(card['visual'],width=doc.width/2-18)]
            rows.append([left,right])
        table=Table(rows,colWidths=[doc.width*.43,doc.width*.57],repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),colors.white),
            ('BACKGROUND',(0,1),(0,-1),colors.HexColor('#EEF4F8')),('BACKGROUND',(1,1),(1,-1),colors.white),
            ('BOX',(0,0),(-1,-1),.7,GRID),('INNERGRID',(0,0),(-1,-1),.45,GRID),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)
        ]))
        story.append(table)
    doc.build(story,onFirstPage=footer,onLaterPages=footer)

worksheet=extract_cards('PROPORTIONAL_WORKSHEET_CARDS')
flashcards=extract_cards('PROPORTIONAL_FLASH_CARDS')
if len(worksheet)!=22 or len(flashcards)!=28:
    raise SystemExit(f'Unerwartete Kartenzahl: {len(worksheet)} Arbeitsblatt, {len(flashcards)} Lernkarten')
build_pdf(ROOT/'proportional-und-antiproportional.pdf','Proportional und Antiproportional','Arbeitsblatt · Begriffe und Erklärungen zum Aufdecken · Klasse 7 NRW',worksheet,'Begriff','Erklärung')
build_pdf(ROOT/'proportional-und-antiproportional-lernkarten.pdf','Proportional und Antiproportional','Lernkarten · Frage und Antwort zum Wiederholen · Klasse 7 NRW',flashcards,'Frage','Antwort')
print(f'PDFs erstellt: {len(worksheet)} Begriffs-Karten, {len(flashcards)} Lernkarten')
