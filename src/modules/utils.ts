
import PDF from "E:/Github/zotero-reference/src/modules/pdf"
import { config } from "../../package.json";

export default class Utils {
  private cache: any = {}
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

  public async getRelatedText(host: string, queryText: string) {
    function findMostOverlap(text: string, textArr: string[]): number {
      let maxOverlapIndex = -1;
      let maxOverlap = 0;

      const textSentences = text.split(/[.!?]/).filter(Boolean);

      for (let i = 0; i < textArr.length; i++) {
        const textArrSentences = textArr[i].split(/[.!?]/).filter(Boolean);

        let overlapCount = 0;
        for (let j = 0; j < textSentences.length; j++) {
          if (textArrSentences.map(i => i.replace(/\x20+/g, "")).includes(textSentences[j].replace(/\x20+/g, ""))) {
            overlapCount++;
          }
        }

        if (overlapCount > maxOverlap) {
          maxOverlap = overlapCount;
          maxOverlapIndex = i;
        }
      }

      return maxOverlapIndex;
    }


    let pdfItem = Zotero.Items.get(
      Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number
    )
    const fullText = await this.readPDFFullText(pdfItem.key, pdfItem.key in this.cache == false)
    console.log(fullText.split("\n\n"))
    const xhr = await Zotero.HTTP.request(
      "POST",
      `http://${host}/getRelatedText`,
      {
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          queryText,
          fullText,
          id: pdfItem.key,
          secretKey: Zotero.Prefs.get(`${config.addonRef}.secretKey`) as string,
          api: Zotero.Prefs.get(`${config.addonRef}.api`) as string,
        }),
        responseType: "json"
      }
    );
    let text = ""
    let references: any[] = []
    for (let i = 0; i < xhr.response.length; i++) {
      let refText = xhr.response[i]
      // 寻找坐标
      // const mainText = refText.split(/\n+/).sort((a: string, b: string) => b.length - a.length)[0]
      let index = findMostOverlap(refText.replace(/\x20+/g, " "), this.cache[pdfItem.key].map((i: any) => i.text.replace(/\x20+/g, " ")))
      if (index >= 0) {
        const box = this.cache[pdfItem.key][index].box
        references.push({
          number: i + 1,
          box,
          text: refText
        })
      }
      text += `[${i + 1}] ${refText}`
      if (i < xhr.response.length - 1) {
        text += "\n\n"
      }  
    }
    const reader = await ztoolkit.Reader.getReader()
    let win = (reader!._iframeWindow as any).wrappedJSObject
    const outputContainer = Zotero[config.addonInstance].views.outputContainer
    outputContainer.querySelector(".reference")?.remove()
    const refDiv = ztoolkit.UI.appendElement({
      namespace: "html",
      classList: ["reference"],
      tag: "div",
      styles: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    }, outputContainer)
    console.log(references)
    references.forEach((reference: { number: number; box: any, text: string }) => {
      if (!reference.box) { return }
      ztoolkit.UI.appendElement({
        namespace: "html",
        tag: "a",
        styles: {
          margin: ".3em",
          fontSize: "0.8em",
          color: "rgba(89, 192, 188, 1)",
          cursor: "pointer"
        },
        properties: {
          innerText: `[${reference.number}]`
        },
        listeners: [ 
          {
            type: "click",
            listener: () => {
              win.eval(`
                PDFViewerApplication.pdfViewer.scrollPageIntoView({
                  pageNumber: ${reference.box.page + 1},
                  destArray: ${JSON.stringify([null, { name: "XYZ" }, reference.box.left, reference.box.top, 3.5])},
                  allowNegativeOffset: false,
                  ignoreDestinationZoom: false
                })
              `)
            }
          }
        ]
      }, refDiv)
    })
    return text
  }

  /**
   * await Zotero.ZoteroGPT.utils.readPDFFullText()
   */
  public async readPDFFullText(itemkey: string, force: boolean = false) {
    // @ts-ignore
    const OS = window.OS;
    const temp = Zotero.getTempDirectory()
    const filename = OS.Path.join(temp.path.replace(temp.leafName, ""), `${config.addonRef}-${itemkey}.json`);
    if (!force && await OS.File.exists(filename)) {
      return await Zotero.File.getContentsAsync(filename) as string
    }
    const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance
    const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
    await PDFViewerApplication.pdfLoadingTask.promise;
    await PDFViewerApplication.pdfViewer.pagesPromise;
    let pages = PDFViewerApplication.pdfViewer._pages;
    const PDFInstance = new PDF()
    let totalPageNum = pages.length
    const popupWin = new ztoolkit.ProgressWindow("[Pending] PDF", {closeTime: -1})
      .createLine({ text: `[1/${totalPageNum}] Reading`, progress: 1, type: "success"})
      .show()
    // 读取所有页面lines
    const pageLines: any = {}
    for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
      let pdfPage = pages[pageNum].pdfPage
      let textContent = await pdfPage.getTextContent()
      let items: PDFItem[] = textContent.items.filter((item: PDFItem) => item.str.trim().length)
      let lines = PDFInstance.mergeSameLine(items)
      let index = lines.findIndex(line => /(r?eferences?|acknowledgements)$/i.test(line.text.trim()))
      if (index != -1) {
        lines = lines.slice(0, index)
      }
      pageLines[pageNum] = lines
      popupWin.changeLine({ text: `[${pageNum+1}/${totalPageNum}] Reading`, progress: (pageNum+1) / totalPageNum * 100 })
      if (index != -1) {
        break
      }
    }
    console.log(pageLines)
    popupWin.changeHeadline("[Pending] PDF");
    popupWin.changeLine({ progress: 100 });
    let pdfText = ""
    totalPageNum = Object.keys(pageLines).length
    let _paragraphs: any[] | undefined
    for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
      let pdfPage = pages[pageNum].pdfPage
      const maxWidth = pdfPage._pageInfo.view[2];
      const maxHeight = pdfPage._pageInfo.view[3];
      let lines = [...pageLines[pageNum]]
      // 去除页眉页脚信息
      let removeLines = new Set()
      let removeNumber = (text: string) => {
        // 英文页码
        if (/^[A-Z]{1,3}$/.test(text)) {
          text = ""
        }
        // 正常页码1,2,3
        text = text.replace(/\x20+/g, "").replace(/\d+/g, "")
        return text
      }
      // 是否跨页同位置
      let isIntersectLines = (lineA: any, lineB: any) => {
        let rectA = {
          left: lineA.x / maxWidth,
          right: (lineA.x + lineA.width) / maxWidth,
          bottom: lineA.y / maxHeight,
          top: (lineA.y + lineA.height) / maxHeight
        }
        let rectB = {
          left: lineB.x / maxWidth,
          right: (lineB.x + lineB.width) / maxWidth,
          bottom: lineB.y / maxHeight,
          top: (lineB.y + lineB.height) / maxHeight
        }
        return PDFInstance.isIntersect(rectA, rectB)
      }
      // 是否为重复
      let isRepeat = (line: PDFLine, _line: PDFLine) => {
        let text = removeNumber(line.text)
        let _text = removeNumber(_line.text)
        return text == _text && isIntersectLines(line, _line)
      }
      // 存在于数据起始结尾的无效行
      for (let i of Object.keys(pageLines)) {
        if (Number(i) == pageNum) { continue }
        // 两个不同页，开始对比
        let _lines = pageLines[i]
        let directions = {
          forward: {
            factor: 1,
            done: false
          },
          backward: {
            factor: -1,
            done: false
          }
        }
        for (let offset = 0; offset < lines.length && offset < _lines.length; offset++) {
          ["forward", "backward"].forEach((direction: string) => {
            if (directions[direction as keyof typeof directions].done) { return }
            let factor = directions[direction as keyof typeof directions].factor
            let index = factor * offset + (factor > 0 ? 0 : -1)
            let line = lines.slice(index)[0]
            let _line = _lines.slice(index)[0]
            if (isRepeat(line, _line)) {
              // 认为是相同的
              line[direction] = true
              removeLines.add(line)
            } else {
              directions[direction as keyof typeof directions].done = true
            }
          })
        }
        // 内部的
        // 设定一个百分百正文区域防止误杀
        const content = { x: 0.2 * maxWidth, width: .6 * maxWidth, y: .2 * maxHeight, height: .6 * maxHeight }
        for (let j = 0; j < lines.length; j++) {
          let line = lines[j]
          if (isIntersectLines(content, line)) { continue }
          for (let k = 0; k < _lines.length; k++) {
            let _line = _lines[k]
            if (isRepeat(line, _line)) {
              line.repeat = line.repeat == undefined ? 1 : (line.repeat + 1)
              line.repateWith = _line
              removeLines.add(line)
            }
          }
        }  
      }
      lines = lines.filter((e: any) => !(e.forward || e.backward || (e.repeat && e.repeat > 3)));
      // 段落聚类
      // 原则：字体从大到小，合并；从小变大，断开
      let abs = (x: number) => x > 0 ? x: -x
      const paragraphs = [[lines[0]]]
      for (let i = 1; i < lines.length; i++) {
        let lastLine = paragraphs.slice(-1)[0].slice(-1)[0]
        let currentLine = lines[i]
        let nextLine = lines[i+1]
        const isNewParagraph = 
          // 达到一定行数阈值
          paragraphs.slice(-1)[0].length >= 3 && (
          // 当前行存在一个非常大的字体的文字
          currentLine._height.some((h2: number) => lastLine._height.every((h1: number) => h2 > h1)) ||
          // 是摘要自动为一段
          /abstract/i.test(currentLine.text) ||
          // 与上一行间距过大
          abs(lastLine.y - currentLine.y) > currentLine.height * 2 ||
          // 首行缩进分段
            (currentLine.x > lastLine.x && nextLine && nextLine.x < currentLine.x)
          )
        // 开新段落
        if (isNewParagraph) {
          paragraphs.push([currentLine])
        }
        // 否则纳入当前段落
        else {
          paragraphs.slice(-1)[0].push(currentLine)
        }
      }
      console.log(paragraphs)
      // 段落合并
      let pageText = ""
      for (let i = 0; i < paragraphs.length; i++) {
        let box: { page: number, left: number; top: number; right: number; bottom: number }
        /**
         * 所有line是属于一个段落的
         * 合并同时计算它的边界
         */
        let _pageText = ""
        let line, nextLine
        for (let j = 0; j < paragraphs[i].length;j++) {
          line = paragraphs[i][j]
          nextLine = paragraphs[i]?.[j+1]
          // 更新边界
          box ??= { page: pageNum, left: line.x, right: line.x + line.width, top: line.y + line.height, bottom: line.y }
          if (line.x < box.left) {
            box.left = line.x
          }
          if (line.x + line.width > box.right) {
            box.right = line.x + line.width
          }
          if (line.y < box.bottom) {
            line.y = box.bottom
          }
          if (line.y + line.height > box.top) {
            box.top = line.y + line.height
          }
          _pageText += line.text
          if (
            nextLine &&
            line.height > nextLine.height
          ) {
            _pageText = "\n"
          } else if (j < paragraphs[i].length - 1) {
            if (!line.text.endsWith("-")) {
              _pageText += " "
            }
          }
        }
        _pageText = _pageText.replace(/\x20+/g, " ");
        (this.cache[itemkey] ??= []).push({
          box: box!,
          text: _pageText
        })
        pageText += _pageText
        if (i < paragraphs.length - 1) {
          pageText += "\n\n"
        }
      }
      /**
       * _paragraphs为上一页的paragraphs
       */
      if (_paragraphs && !(
        // 两页首尾字体大小一致
        _paragraphs.slice(-1)[0].slice(-1)[0].height == paragraphs[0][0].height &&
        // 开头页没有首行缩进
        paragraphs[0][0].x == paragraphs[0][1]?.x
      )) {
        pdfText += "\n\n"
      } else {
        pdfText += " "
      }
      pdfText += pageText
      _paragraphs = paragraphs
    }
    popupWin.changeHeadline("[Done] PDF")
    popupWin.startCloseTimer(1000)
    const fullText = pdfText.replace(/\x20+/g, " ")
    await Zotero.File.putContentsAsync(filename, fullText);
    console.log(fullText)
    return fullText
  }

  /**
   * 获取剪贴板文本
   * @returns 
   */
  public getClipboardText() {
    // @ts-ignore
    const clipboardService = window.Cc['@mozilla.org/widget/clipboard;1'].getService(Ci.nsIClipboard);
    // @ts-ignore
    const transferable = window.Cc['@mozilla.org/widget/transferable;1'].createInstance(Ci.nsITransferable);
    if (!transferable) {
      window.alert('剪贴板服务错误：无法创建可传输的实例');
    }
    transferable.addDataFlavor('text/unicode');
    clipboardService.getData(transferable, clipboardService.kGlobalClipboard);
    let clipboardData = {};
    let clipboardLength = {};
    try {
      transferable.getTransferData('text/unicode', clipboardData, clipboardLength);
    } catch (err: any) {
      console.error('剪贴板服务获取失败：', err.message);
    }
    // @ts-ignore
    clipboardData = clipboardData.value.QueryInterface(Ci.nsISupportsString);
    // @ts-ignore
    return clipboardData.data
  }
}