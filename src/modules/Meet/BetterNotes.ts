import Views from "../views";
import Meet from "./api";

/**
 * 优先返回选中文本，再返回所在span前所有文字MD
 * @param span 光标所在行，HTMLSpanElement
 * @returns 
 */
export async function getEditorText(span: HTMLSpanElement) {
  const BNEditorApi = Zotero.BetterNotes.api.editor
  const editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  let lines = [...editor._iframeWindow.document.querySelector(".primary-editor").childNodes]
  lines = lines.slice(0, lines.indexOf(span))
  const context = await Zotero.BetterNotes.api.convert.html2md(lines.map(e => e.outerHTML).join("\n"))
  let range = Zotero.BetterNotes.api.editor.getRangeAtCursor(editor)
  let selection = Zotero.BetterNotes.api.editor.getTextBetween(editor, range.from, range.to)
  ztoolkit.log(selection, range)
  if (selection.trim().length > 0) {
    ztoolkit.log("selection", selection)
    return selection
  } else {
    ztoolkit.log("context", context)
    return context
  }
}

export function reFocus(editor?: any) {
  if (!editor) {
    const BNEditorApi = Zotero.BetterNotes.api.editor
    editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  }
  editor && editor._iframeWindow.focus()
}



export function replaceEditorText(htmlString: string) {
  const BNEditorApi = Zotero.BetterNotes.api.editor
  const editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  const range = BNEditorApi.getRangeAtCursor(editor)
  // 删除原来
  window.setTimeout(async () => {
    await Meet.Global.lock
    Meet.Global.lock = Zotero.Promise.defer() as _ZoteroTypes.PromiseObject
    BNEditorApi.del(editor, range.from, range.to)
    insertEditorText(htmlString)
    Meet.Global.lock.resolve()
  })
}

/**
 * 在编辑器光标处插入文本
 * @param htmlString 
 */
export function insertEditorText(htmlString: string, editor?: any) {
  const BNEditorApi = Zotero.BetterNotes.api.editor
  if (!editor) {
    editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  }
  const to = BNEditorApi.getRangeAtCursor(editor).to
  reFocus(editor)
  BNEditorApi.insert(
    editor,
    htmlString,
    to,
    true
  )
  reFocus(editor)
}

/**
 * 让GPT UI跟随此行
 */
export function follow() {
  const views = Zotero.ZoteroGPT.views as Views
  const BNEditorApi = Zotero.BetterNotes.api.editor
  const editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  let getLine: any = (index: number) => {
    return editor._iframeWindow.document.querySelector(`.primary-editor>*:nth-child(${index})`)
  }
  let place = (reBuild: boolean = false) => {
    const lineIndex = BNEditorApi.getLineAtCursor(editor) + 1
    let line = getLine(lineIndex)
    // 光标有文字就下一行
    if (line.innerText.replace("\n", "").trim().length != 0) {
      line = getLine(lineIndex+1)
    }
    let { x, y } = line.getBoundingClientRect();
    const leftPanel = document.querySelector("#betternotes-workspace-outline-container")!
    x = leftPanel.getAttribute("collapsed") ?
      0
      :
      leftPanel.getBoundingClientRect().width
    views.show(x + 30, y + 38, reBuild)
  }
  // 第一次重建UI
  place(true)
  let id = window.setInterval(async () => {
    // await Meet.Global.lock;
    // Meet.Global.lock = Zotero.Promise.defer() as _ZoteroTypes.PromiseObject
    place()
    // Meet.Global.lock.resolve()
  }, 10)
  views._ids.push({
    type: "follow",
    id: id
  })
}