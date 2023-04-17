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

/**
 * 在编辑器光标处插入文本
 * @param htmlString 
 */
export function insertEditorText(htmlString: string) {
  const BNEditorApi = Zotero.BetterNotes.api.editor
  const editor = BNEditorApi.getEditorInstance(Zotero.BetterNotes.data.workspace.mainId);
  editor._iframeWindow.focus()
  const to = BNEditorApi.getRangeAtCursor(editor).to
  BNEditorApi.insert(
    editor,
    htmlString,
    to,
    true
  )
  editor._iframeWindow.focus()
}