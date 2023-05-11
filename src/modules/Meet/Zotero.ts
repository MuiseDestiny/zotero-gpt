import { config } from "../../../package.json";
import { MD5 } from "crypto-js"
import { Document } from "langchain/document";
import { similaritySearch } from "./OpenAI";
import Meet from "./api";
import ZoteroToolkit from "zotero-plugin-toolkit";

/**
 * 读取剪贴板
 * @returns string
 */
export function getClipboardText(): string {
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
    window.console.error('剪贴板服务获取失败：', err.message);
  }
  // @ts-ignore
  clipboardData = clipboardData.value.QueryInterface(Ci.nsISupportsString);
  // @ts-ignore
  return clipboardData.data
}

/**
 * 将选中条目处理成全文
 * 注意：这里目前是不储存得到向量的，因为条目一直在更新
 * @param key 
 * @returns 
 */
async function selectedItems2documents(key: string) {
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
 * https://github.com/MuiseDestiny/zotero-reference/blob/743bef7ac59d644675d8ab33a0b6c138d47fdb2f/src/modules/pdf.ts#L75
 * @param items 
 * @returns 
 */
function mergeSameLine(items: PDFItem[]) {
  let toLine = (item: PDFItem) => {
    let line: PDFLine = {
      x: parseFloat(item.transform[4].toFixed(1)),
      y: parseFloat(item.transform[5].toFixed(1)),
      text: item.str || "",
      height: item.height,
      width: item.width,
      url: item?.url,
      _height: [item.height]
    }
    if (line.width < 0) {
      line.x += line.width
      line.width = -line.width
    }
    return line
  }

  let j = 0
  let lines: PDFLine[] = [toLine(items[j])]
  for (j = 1; j < items.length; j++) {
    let line = toLine(items[j])
    let lastLine = lines.slice(-1)[0]
    // 考虑上标下标
    if (
      line.y == lastLine.y ||
      (line.y >= lastLine.y && line.y < lastLine.y + lastLine.height) ||
      (line.y + line.height > lastLine.y && line.y + line.height <= lastLine.y + lastLine.height)
    ) {
      lastLine.text += (" " + line.text)
      lastLine.width += line.width
      lastLine.url = lastLine.url || line.url
      // 记录所有高度
      lastLine._height.push(line.height)
    } else {
      // 处理已完成的行，用众数赋值高度
      let hh = lastLine._height
      // lastLine.height = hh.sort((a, b) => a - b)[parseInt(String(hh.length / 2))]
      // 用最大值
      // lastLine.height = hh.sort((a, b) => b-a)[0]
      // 众数
      const num: any = {}
      for (let i = 0; i < hh.length; i++) {
        num[String(hh[i])] ??= 0
        num[String(hh[i])] += 1
      }
      lastLine.height = Number(
        Object.keys(num).sort((h1: string, h2: string) => {
          return num[h2] - num[h1]
        })[0]
      )
      // 新的一行
      lines.push(line)
    }
  }
  return lines
}

declare type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * 判断A和B两个矩形是否几何相交
 * @param A 
 * @param B 
 * @returns 
 */
function isIntersect(A: Box, B: Box): boolean {
  if (
    B.right < A.left ||
    B.left > A.right ||
    B.bottom > A.top ||
    B.top < A.bottom
  ) {
    return false
  } else {
    return true
  }
}

/**
 * 判断两行是否是跨页同位置行
 * @param lineA 
 * @param lineB 
 * @param maxWidth 
 * @param maxHeight 
 * @returns 
 */
function isIntersectLines(lineA: any, lineB: any, maxWidth: number, maxHeight: number) {
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
  return isIntersect(rectA, rectB)
}

/**
 * 读取PDF全文，因为读取速度一般较快，所以不储存
 * 当然排除学位论文，书籍等
 * 此函数遇到reference关键词会停止读取，因为参考文献太影响最后计算相似度了
 */
async function pdf2documents(itemkey: string) {
  const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance
  const PDFViewerApplication = (reader._iframeWindow as any).wrappedJSObject.PDFViewerApplication;
  await PDFViewerApplication.pdfLoadingTask.promise;
  await PDFViewerApplication.pdfViewer.pagesPromise;
  let pages = PDFViewerApplication.pdfViewer._pages;
  let totalPageNum = pages.length
  // const popupWin = new ztoolkit.ProgressWindow("[Pending] PDF", { closeTime: -1 })
  //   .createLine({ text: `[1/${totalPageNum}] Reading`, progress: 1, type: "success" })
  //   .show()
  const popupWin = Meet.Global.popupWin.createLine({ text: `[1/${totalPageNum}] Reading PDF`, progress: 1, type: "success" })
    .show()
  // 读取所有页面lines
  const pageLines: any = {}
  let docs: Document[] = []
  for (let pageNum = 0; pageNum < totalPageNum; pageNum++) {
    let pdfPage = pages[pageNum].pdfPage
    let textContent = await pdfPage.getTextContent()
    let items: PDFItem[] = textContent.items.filter((item: PDFItem) => item.str.trim().length)
    let lines = mergeSameLine(items)
    let index = lines.findIndex(line => /(r?eferences?|acknowledgements)$/i.test(line.text.trim()))
    if (index != -1) {
      lines = lines.slice(0, index)
    }
    pageLines[pageNum] = lines
    popupWin.changeLine({ idx: popupWin.lines.length - 1, text: `[${pageNum + 1}/${totalPageNum}] Reading PDF`, progress: (pageNum + 1) / totalPageNum * 100})
    // 防止误杀
    if (index != -1 && pageNum / totalPageNum >= .9) {
      break
    }
  }
  popupWin.changeLine({ idx: popupWin.lines.length - 1, text: "Reading PDF", progress: 100 })
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
    // 是否为重复
    let isRepeat = (line: PDFLine, _line: PDFLine) => {
      let text = removeNumber(line.text)
      let _text = removeNumber(_line.text)
      return text == _text && isIntersectLines(line, _line, maxWidth, maxHeight)
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
        if (isIntersectLines(content, line, maxWidth, maxHeight)) { continue }
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
    let abs = (x: number) => x > 0 ? x : -x
    const paragraphs = [[lines[0]]]
    for (let i = 1; i < lines.length; i++) {
      let lastLine = paragraphs.slice(-1)[0].slice(-1)[0]
      let currentLine = lines[i]
      let nextLine = lines[i + 1]
      const isNewParagraph =
        // 达到一定行数阈值
        paragraphs.slice(-1)[0].length >= 5 && 
        (
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
      for (let j = 0; j < paragraphs[i].length; j++) {
        line = paragraphs[i][j]
        if (!line) { continue }
        nextLine = paragraphs[i]?.[j + 1]
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
      _pageText = _pageText.replace(/\x20+/g, " ").replace(/^\x20*\n+/g, "").replace(/\x20*\n+/g, "");
      if (_pageText.length > 0) {
        docs.push(
          new Document({
            pageContent: _pageText,
            metadata: { type: "box", box: box!, key: itemkey },
          })
        )
      }
    }
  }
  // popupWin.changeHeadline("[Done] PDF")
  // popupWin.startCloseTimer(1000)
  console.log("pdf2documents", docs)
  return docs
}

/**
 * 如果当前在主面板，根据选中条目生成文本，查找相关 - 用于搜索条目
 * 如果在PDF阅读界面，阅读PDF原文，查找返回相应段落 - 用于总结问题
 * @param queryText 
 * @returns 
 */
export async function getRelatedText(queryText: string) {
  // @ts-ignore
  const cache = (window._GPTGlobal ??= {cache: []}).cache
  let docs: Document[], key: string
  switch (Zotero_Tabs.selectedIndex) {
    case 0:
      // 只有再次选中相同条目，且条目没有更新变化，才会复用，不然会一直重复建立索引
      // TODO - 优化
      key = MD5(ZoteroPane.getSelectedItems().map(i => i.key).join("")).toString()
      docs = cache[key] || await selectedItems2documents(key)
      break;
    default:
      let pdfItem = Zotero.Items.get(
        Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number
      )
      key = pdfItem.key
      docs = cache[key] || await pdf2documents(key)
      break
  }
  cache[key] = docs
  docs = await similaritySearch(queryText, docs, { key }) as Document[]
  ztoolkit.log("docs", docs)
  Zotero[config.addonInstance].views.insertAuxiliary(docs)
  return docs.map((doc: Document, index: number) => `[${index + 1}]${doc.pageContent}`).join("\n\n")
}

/**
 * 获取选中条目某个字段
 * @param fieldName 
 * @returns 
 */
export function getItemField(fieldName: any) {
  return ZoteroPane.getSelectedItems()[0].getField(fieldName)
}

/**
 * 获取PDF页面文字
 * @returns 
 */
export function getPDFSelection() {
  try {
    return ztoolkit.Reader.getSelectedText(
      Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)
    );
  } catch {
    return ""
  }
}

export async function getPDFAnnotations(select: boolean = false) {
  let keys: string[]
  if (select) {
    // try {
      const reader = await ztoolkit.Reader.getReader() as _ZoteroTypes.ReaderInstance
      const nodes = reader._iframeWindow?.document.querySelectorAll("[id^=annotation-].selected") as any
      ztoolkit.log(nodes)
      keys = [...nodes].map(i => i.id.split("-")[1])
      ztoolkit.log(keys)
    // } catch {}
  }
  const pdfItem = Zotero.Items.get(
    Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number
  )
  const docs: Document[] = [] 
  pdfItem.getAnnotations().forEach((anno: any) => {
    if (select && keys.indexOf(anno.key) == -1) { return }
    const pos = JSON.parse(anno.annotationPosition)
    const rect = pos.rects[0]
    docs.push(
      new Document({
        pageContent: anno.annotationText,
        metadata: {
          type: "box",
          box: { page: pos.pageIndex, left: rect[0], right: rect[2], top: rect[3], bottom: rect[1] },
          key: pdfItem.key
        }
      })
    )
  })
  Zotero[config.addonInstance].views.insertAuxiliary(docs)
  return docs.map((doc: Document, index: number) => `[${index + 1}]${doc.pageContent}`).join("\n\n")
}
