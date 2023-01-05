declare const _globalThis: {
  [key: string]: any;
  Zotero: _ZoteroConstructable;
  ZoteroPane: _ZoteroPaneConstructable;
  Zotero_Tabs: typeof Zotero_Tabs;
  window: Window;
  document: Document;
  ZToolkit: typeof ZToolkit;
};

declare const ZToolkit: import("zotero-plugin-toolkit").ZoteroToolkit;

declare const rootURI: string;
