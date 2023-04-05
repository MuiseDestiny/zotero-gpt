import PyPDF2
from tqdm import tqdm

filepath = r"E:\OneDrive\OneDrive - junblue\Zotero\JRST\6SV\Vermote et al_1997_Second Simulation of the Satellite Signal in the Solar Spectrum, 6S.pdf"
pdftext = ""
with open(filepath, 'rb') as pdfFileObj:
    pdfReader = PyPDF2.PdfReader(pdfFileObj)
    for page in tqdm(pdfReader.pages):
        pdftext += page.extract_text()
print(pdftext)