import { splitText } from "embeddings-utils";


class Utils {
  constructor() {

  }

  /**
   * 获取PDF页面文字
   * @returns 
   */
  public getPDFSelection() {
    try {
      return ztoolkit.Reader.getSelectedText(
        Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)
      );
    } catch {
      return ""
    }
  }

  /**
   * 获取选中条目某个字段
   * @param fieldName 
   * @returns 
   */
  public getItemField(fieldName: any) {
    return ZoteroPane.getSelectedItems()[0].getField(fieldName)
  }

  public async readFullPDFText() {
    import { PDFDocument } from 'pdf-lib';

    async function extractTextFromPdf(pdfPath: string, pdfTitle: string): Promise<any> {
    const paperDict: any = { page: [], text: [], title: [] };
    const pdfBytes = await fetch(pdfPath).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageText = await page.getText();
    for (const paragraph of pageText.split('\n\n')) {
    paperDict.page.push(i + 1);
    paperDict.text.push(paragraph);
    paperDict.title.push(pdfTitle);
    }
    }
    return paperDict;
    }

  }


}