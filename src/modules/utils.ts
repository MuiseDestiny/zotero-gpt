// 可以从zotero-reference仓库获取
import PDF from "zotero-reference/src/modules/pdf"
// 可以从zotero-style仓库获取
import LocalStorage from "zotero-style/src/modules/localStorage";
import { config } from "../../package.json";
import { MD5 } from "crypto-js"
import { Document } from "langchain/document";
const similarity = require('compute-cosine-similarity');

export default class Utils {
  /**
   * 与储存在本地的一个JSON文件进行交互，在Zotero储存目录下
   */
  private storage: LocalStorage;
  /**
   * 一般用于储存pdf文档
   */
  private cache: any =  {}
  constructor() {
    this.storage = new LocalStorage(config.addonRef);
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

  /**
   * 检查OpenAI Embeddings是否可用
   * @returns 
   */
  public async checkOpenAIEmbeddings() {
    const text=["test"];
    const embeddings = new OpenAIEmbeddings() as any
    try {
      const v0 = await embeddings.embedDocuments(text)
      return [true, v0]
    } catch (error : any) {
      return [false, error.message as string]
    }
  }

  /**
   * 如果当前在主面板，根据选中条目生成文本，查找相关 - 用于搜索条目
   * 如果在PDF阅读界面，阅读PDF原文，查找返回相应段落 - 用于总结问题
   * @param queryText 
   * @returns 
   */
  public async getRelatedText(queryText: string) {
    const checkResult = await this.checkOpenAIEmbeddings()
    if (!checkResult[0]) {
      return checkResult[1]
    }
    let docs: Document[], key: string
    switch (Zotero_Tabs.selectedIndex) {
      case 0:
        // 只有再次选中相同条目，且条目没有更新变化，才会复用，不然会一直重复建立索引
        // TODO - 优化
        key = MD5(ZoteroPane.getSelectedItems().map(i => i.key).join("")).toString()
        docs = this.cache[key] || await this.selectedItems2documents(key)
        break;
      default:
        let pdfItem = Zotero.Items.get(
          Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number
        )
        key = pdfItem.key
        docs = this.cache[key] || await this.pdf2documents(key)
        break
    }
    this.cache[key] = docs
    docs = await this.similaritySearch(queryText, docs, {key}) as Document[]
    ztoolkit.log("docs", docs)
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
    docs.forEach((doc: Document, index: number) => {
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
          innerText: `[${index + 1}]`
        },
        listeners: [ 
          {
            type: "click",
            listener: async () => {
              if (doc.metadata.type == "box") {
                const reader = await ztoolkit.Reader.getReader();
                (reader!._iframeWindow as any).wrappedJSObject.eval(`
                  PDFViewerApplication.pdfViewer.scrollPageIntoView({
                    pageNumber: ${doc.metadata.box.page + 1},
                    destArray: ${JSON.stringify([null, { name: "XYZ" }, doc.metadata.box.left, doc.metadata.box.top, 3.5])},
                    allowNegativeOffset: false,
                    ignoreDestinationZoom: false
                  })
                `)
              } else if (doc.metadata.type == "id") {
                await ZoteroPane.selectItem(doc.metadata.id as number)
              }
            }
          }
        ]
      }, refDiv)
    })
    return docs.map((doc: Document, index: number) => `[${index+1}]${doc.pageContent}`).join("\n\n")
  }

  /**
   * 读取PDF全文，因为读取速度一般较快，所以不储存
   * 当然排除学位论文，书籍等
   * 此函数遇到reference关键词会停止读取，因为参考文献太影响最后计算相似度了
   */
  public async pdf2documents(itemkey: string) {
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
    let docs: Document[] = []
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
    ztoolkit.log(pageLines)
    popupWin.changeHeadline("[Pending] PDF");
    popupWin.changeLine({ progress: 100 });
    totalPageNum = Object.keys(pageLines).length
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
          paragraphs.slice(-1)[0].length >= 5 && (
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
      ztoolkit.log(paragraphs)
      // 段落合并
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
        docs.push(
          new Document({
            pageContent: _pageText,
            metadata: { type: "box", box: box!, key: itemkey},
          })
        )
      }
    }
    popupWin.changeHeadline("[Done] PDF")
    popupWin.startCloseTimer(1000)
    return docs
  }

  /**
   * 将选中条目处理成全文
   * 注意：这里目前是不储存得到向量的（懒，不想写）
   * @param key 
   * @returns 
   */
  public async selectedItems2documents(key: string) {
    const docs = ZoteroPane.getSelectedItems().map((item: Zotero.Item) => {
      const text = JSON.stringify(item.toJSON());
      return new Document({
        pageContent: text.slice(0, 500),
        metadata: {
          type: "id",
          id: item.id,
          key
        }
      })
    })
    return docs
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

  /**
   * 手写的，很难受，因为没有包可以用
   * 手写需要一直优化
   * @param queryText 
   * @param docs 
   * @returns 
   */
  private async similaritySearch(queryText: string, docs: Document[], obj: {key: string}) {
    const embeddings = new OpenAIEmbeddings() as any
    // 查找本地，为节省空间，只储存向量
    // 因为随着插件更新，解析出的PDF可能会有优化，因此再此进行提取MD5值作为验证
    // 但可以预测，本地JSON文件可能会越来越大
    const id = MD5(docs.map((i: any) => i.pageContent).join("\n\n")).toString()
    const vv = this.storage.get(obj, id) ||
      await embeddings.embedDocuments(docs.map((i: any) => i.pageContent))
    window.setTimeout(async () => {
      await this.storage.set(obj, id, vv)
    })
    const v0 = await embeddings.embedQuery(queryText)
    // 从20个里面找出文本最长的几个，防止出现较短但相似度高的段落影响回答准确度
    const k = 20
    const pp = vv.map((v: any) => similarity(v0, v));
    ztoolkit.log(pp, [...pp].sort((a, b) => b - a))
    docs = [...pp].sort((a, b) => b - a).slice(0, k).map((p: number) => {
      return docs[pp.indexOf(p)]
    })
    return docs.sort((a, b) => b.pageContent.length - a.pageContent.length).slice(0, 5)
  }
}


class OpenAIEmbeddings {
  constructor() {
  }
  private async request(input: string[]) {
    const api = Zotero.Prefs.get(`${config.addonRef}.api`)
    const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`)
    let res = await Zotero.HTTP.request(
      "POST",
      `${api}/embeddings`,
      {
        responseType: "json",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: input
        })
      }
    )
    return res.response.data.map((i: any) => i.embedding)
  }

  public async embedDocuments(texts: string[]) {
    return await this.request(texts)
  }

  public async embedQuery(text: string) {
    return (await this.request([text]))![0]
  }
}