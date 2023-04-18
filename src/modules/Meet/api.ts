import {
  getClipboardText,
  getItemField,
  getPDFSelection,
  getRelatedText
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

const Meet: any = {
  Zotero: {
    getClipboardText,
    getItemField,
    getPDFSelection,
    getRelatedText
  },
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
  }
}

export default Meet