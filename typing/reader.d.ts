// chrome/content/zotero/xpcom/reader.js

declare interface _ZoteroReaderState {
  pageIndex: number;
  scale: string;
  rotation: number;
  top: number;
  left: number;
  sidebarView: number;
  sidebarWidth: number;
  scrollMode: number;
  spreadMode: number;
}

declare interface _ZoteroReaderLocation {
  annotationKey: String;
  pageIndex: number;
}

declare class _ZoteroReaderInstance {
  [attr: string]: any;
  constructor();
  pdfStateFileName: string = ".zotero-pdf-state";
  annotationItemIDs: number[];
  itemID: number;
  state: _ZoteroReaderState;
  _instanceID: string;
  _window: Window;
  _iframeWindow: Window;
  _title: string;
  _isReaderInitialized: boolean;
  _showItemPaneToggle: boolean;
  _initPromise: Promise;
  focus: () => void;
  open: (options: {
    itemID: number;
    state: _ZoteroReaderState;
    location: _ZoteroReaderLocation;
  }) => Promise<boolean>;
  updateTitle: () => void;
  setAnnotations: (items: _ZoteroItem[]) => void;
  unsetAnnotations(keys: number[] | string[]);
  navigate: (location: _ZoteroReaderLocation) => Promise<void>;
  enableAddToNote: (enable: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarOpen: (open: boolean) => void;
  focusLastToolbarButton: () => void;
  tabToolbar: (reverse: any) => void;
  focusFirst: () => void;
  setBottomPlaceholderHeight: (height: number) => Promise<void>;
  setToolbarPlaceholderWidth: (height: number) => Promise<void>;
  isHandToolActive: () => boolean;
  isZoomAutoActive: () => boolean;
  isZoomPageWidthActive: () => boolean;
  isZoomPageHeightActive: () => boolean;
  allowNavigateFirstPage: () => boolean;
  allowNavigateLastPage: () => boolean;
  allowNavigateBack: () => boolean;
  allowNavigateForward: () => boolean;
  promptToTransferAnnotations: () => boolean;
  promptToDeletePages: (num: number) => boolean;
  reload: () => void;
  menuCmd: (
    cmd: "transferFromPDF" | "export" | "showInLibrary"
  ) => Promise<void>;
  _initIframeWindow: () => boolean;
  _setState: (state: _ZoteroReaderState) => Promise<void>;
  _getState: () => Promise<_ZoteroReaderState>;
  _isReadOnly: () => boolean;
  _dataURLtoBlob: (dataurl: string) => Blob;
  _getColorIcon: (color: string, selected: boolean) => string;
  _openTagsPopup: (item: _ZoteroItem, selector: string) => void;
  _openPagePopup: (data: any) => void;
  _openAnnotationPopup: (data: any) => void;
  _openColorPopup: (data: any) => void;
  _openThumbnailPopup: (data: any) => void;
  _openSelectorPopup: (data: any) => void;
  _postMessage: (message: object, transfer?: any) => Promise<void>;
  _handleMessage: (event: MessageEvent) => Promise<void>;
  _waitForReader: () => Promise<void>;
  _getAnnotation: (item: _ZoteroItem) => JSON | null;
}

declare class _ZoteroReaderTab extends _ZoteroReaderInstance {
  constructor(options: {
    itemID: number;
    title: startCloseTimer;
    sidebarWidth: number;
    sidebarOpen: boolean;
    bottomPlaceholderHeight: number;
    index: number;
    tabID: string;
    background: boolean;
  });
  close: () => void;
  _toggleNoteSidebar: (isToggled?: boolean) => void;
  _setTitleValue: (title: string) => void;
  _addToNote: (annotations: any) => void;
}

declare class _ZoteroReaderWindow extends _ZoteroReaderInstance {
  constructor(options: {
    sidebarWidth: number;
    sidebarOpen: boolean;
    bottomPlaceholderHeigh: number;
  });
  init: () => void;
  close: () => void;
  _setTitleValue: (title: string) => void;
  _handleKeyPress: (event: KeyboardEvent) => void;
  _onViewMenuOpen: () => void;
  _onGoMenuOpen: () => void;
}

declare class _ZoteroReader {
  [attr: string]: any;
  constructor();
  _readers: Array<_ZoteroReaderInstance>;
  _sidebarWidth: number;
  _sidebarOpen: boolean;
  _bottomPlaceholderHeight: number;
  _notifierID: string;
  onChangeSidebarWidth: (width: number) => void;
  onChangeSidebarOpen: (open: boolean) => void;
  getSidebarWidth: () => number;
  init: () => Promise<void>;
  _loadSidebarState: () => void;
  _setSidebarState: () => void;
  getSidebarOpen: () => boolean;
  setSidebarWidth: (width: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setBottomPlaceholderHeight: (height: number) => void;
  notify: (event, type, ids, extraData) => void;
  getByTabID: (tabID: string) => _ZoteroReaderInstance;
  getWindowStates: () => { type: "reader"; itemID: number; title: string }[];
  openURI: (
    itemURI: string,
    location: _ZoteroReaderLocation,
    options: any
  ) => Promise<void>;
  open: (
    itemID: number,
    location: _ZoteroReaderLocation,
    options: {
      title: string;
      tabIndex: number;
      tabID: string;
      openInBackground: boolean;
      openInWindow: boolean;
      allowDuplicate: boolean;
    } = {}
  ) => Promise<void>;
  triggerAnnotationsImportCheck: (itemID: number) => Promise<void>;
}
