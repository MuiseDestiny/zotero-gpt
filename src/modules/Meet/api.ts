import {
  getClipboardText,
  getItemField,
  getPDFSelection,
  getRelatedText
} from "./Zotero"

import {
  getEditorText,
  insertEditorText
} from "./BetterNotes"

import {
  getGPTResponse
} from "./OpenAI"

const Meet = {
  Zotero: {
    getClipboardText,
    getItemField,
    getPDFSelection,
    getRelatedText
  },
  BetterNotes: {
    getEditorText,
    insertEditorText
  },
  OpenAI: {
    getGPTResponse
  }
}

export default Meet