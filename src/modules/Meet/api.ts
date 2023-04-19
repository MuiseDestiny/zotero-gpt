import {
  getClipboardText,
  getItemField,
  getPDFSelection,
  getRelatedText,
  getPDFAnnotations
} from "./Zotero"

import {
  getEditorText,
  insertEditorText,
  replaceEditorText,
  follow,
  reFocus
} from "./BetterNotes"

import {
  getGPTResponse
} from "./OpenAI"
import Views from "../views"

const Meet: any = {
  /**
   * 开放给用户
   * 示例：Meet.Zotero.xxx()
   */
  Zotero: {
    /**
     * 返回系统剪贴板
     */
    getClipboardText,
    /**
     * 返回选中条目的某个字段值
     * 比如摘要，Meet.Zotero.getItemField("abstractNote")
     */
    getItemField, 
    /**
     * 返回阅读PDF时选中的文字
     */
    getPDFSelection,
    /**
     * 返回相关段落，如你选中多条条目，则返回与问题最相关的5个条目
     * 如果你在PDF中则会读取整个PDF，返回与问题最相关的5个段落
     * Meet.Zotero.getItemField("本文提到的XXX是什么意思？")
     */
    getRelatedText,
    /**
     * 获取PDF注释内容
     */
    getPDFAnnotations,
  },
  /**
   * 部分开放
   * 下列函数只针对主笔记
   */
  BetterNotes: {
    getEditorText,
    insertEditorText,
    replaceEditorText,
    follow,
    reFocus
  },
  OpenAI: {
    getGPTResponse
  },
  Global: {
    lock: undefined,
    input: undefined,
    views: undefined,
  }
}

export default Meet