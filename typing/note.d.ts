// chrome/content/zotero/xpcom/editorInstance.js

declare interface _ZoteroEditorInstance {
  [attr: string]: any;
  init: (options: {
    onNavigate?: Function;
    item?: _ZoteroItem;
    reloaded?: boolean;
    viewMode?: string;
    readOnly?: boolean;
    disableUI?: boolean;
    onReturn?: Function;
    iframeWindow?: XUL.Element;
    popup?: any;
    state?: any;
    placeholder?: any;
  }) => Promise<void>;
  uninit: () => Promise<void>;
  focus: () => void;
  notify: (event, type, ids, extraData) => Promise<void>;
  saveSync: () => void;
  insertAnnotations: (annotations: any) => Promise<void>;
  _postMessage: (message: any) => void;
  _isReadOnly: () => boolean;
  _getFont: () => { fontSize: number; fontFamily: string };
  _handleFontChange: () => void;
  _handleStyleChange: () => void;
  _handleSpellCheckChange: () => void;
  _showInLibrary: (ids: number | number[]) => void;
  importImages: (annotations: any) => Promise<void>;
  _digestItems: (ids: number[]) => string | null;
  _messageHandler: (e: MessageEvent) => Promise<void>;
  _updateCitationItems: (citationItemsList: object[]) => Promise<void>;
  _feedSubscription: (subscription: object) => Promise<void>;
  _importImage: (src: string, download: boolean) => Promise<string>;
  _openPopup: (
    x: number,
    y: number,
    pos: any,
    itemGroups: any
  ) => Promise<void>;
  _updateCitationItems: (citationItemsList: object[]) => Promise<void>;
  _getSpellChecker: () => any;
  _ensureNoteCreated: () => Promise<void>;
  _save: (noteData: object, skipDateModifiedUpdate: boolean) => Promise<void>;
  _arrayBufferToBase64: (buffer: Buffer) => string;
  _dataURLtoBlob: (dataurl: string) => Blob | null;
  _getDataURL: (item: _ZoteroItem) => Promise<string>;
  _openQuickFormatDialog: (
    nodeID: number,
    citationData: any,
    filterLibraryIDs: any,
    openedEmpty: any
  ) => Promise<void>;
  getItemFromURIs: (uris: string[]) => Promise<_ZoteroItem>;
  createNoteFromAnnotations: (
    annotations: _ZoteroItem[],
    parentID: number
  ) => Promise<_ZoteroItem>;
  _iframeWindow: XULWindow;
  _item: _ZoteroItem;
  _initPromise: Promise;
  _viewMode: string;
  _reloaded: boolean;
  _readOnly: boolean;
  _filesReadOnly: boolean;
  _disableUI: boolean;
  _onReturn: Function;
  _popup: any;
  _state: any;
  _disableSaving: boolean;
  _subscriptions: [];
  _quickFormatWindow: any;
  _citationItemsList: any;
  _prefObserverIDs: any[];
}

declare interface _ZoteroEditorInstanceConstructable {
  new (): _ZoteroEditorInstance;
}

declare class _ZoteroEditorInstanceUtilities {
  serializeAnnotations: (
    annotations: object[],
    skipEmbeddingItemData: boolean
  ) => { html: string; citationItems: _ZoteroItem[] };
  _transformTextToHTML: (text: string) => string;
  _formatCitationItemPreview: (citationItem: _ZoteroItem) => string;
  formatCitation: (citation: object) => string;
}

// chrome/content/zotero/xpcom/data/notes.js

declare class _ZoteroNotes {
  [attr: string]: any;
  AUTO_SYNC_DELAY: number = 15;
  MAX_TITLE_LENGTH: number = 120;
  defaultNote: string;
  notePrefix: string;
  noteSuffix: string;
  _editorInstances: _ZoteroEditorInstance[];
  _downloadInProgressPromise: Promise;
  registerEditorInstance: (instance: _ZoteroEditorInstance) => void;
  unregisterEditorInstance: (instance: _ZoteroEditorInstance) => Promise<void>;
  updateUser: (fromUserID: number, toUserID: number) => Promise<void>;
  replaceAllItemKeys: (
    item: _ZoteroItem,
    itemKeyMap: Map<string, string>
  ) => void;
  replaceItemKey: (
    item: _ZoteroItem,
    fromItemKey: string,
    toItemKey: string
  ) => void;
  getExportableNote: (item: _ZoteroItem) => Promise<string>;
  ensureEmbeddedImagesAreAvailable: (item: _ZoteroItem) => Promise<boolean>;
  copyEmbeddedImages: (fromItemKey: string, toItemKey: string) => Promise<void>;
  promptToIgnoreMissingImage: () => boolean;
  deleteUnusedEmbeddedImages: (item: _ZoteroItem) => Promise<void>;
  hasSchemaVersion: (note: _ZoteroItem) => boolean;
}
