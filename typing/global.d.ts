declare const _globalThis: {
  [key: string]: any;
  Zotero: _ZoteroTypes.Zotero;
  ZoteroPane: _ZoteroTypes.ZoteroPane;
  Zotero_Tabs: typeof Zotero_Tabs;
  window: Window;
  document: Document;
  ztoolkit: typeof ztoolkit;
  addon: typeof addon;
};

declare const ztoolkit: import("zotero-plugin-toolkit").ZoteroToolkit;

declare const rootURI: string;

declare const addon: import("../src/addon").default;

declare const __env__: "production" | "development";


declare type PDFLine = {
  x: number,
  _x?: number,
  y: number,
  text: string,
  height: number,
  _height: number[],
  width: number,
  url?: string,
}

declare type PDFItem = {
  chars: {
    baseline: number;
    c: string;
    fontName: string;
    fontSize: number;
    rect: number[];
    rotation: number;
  }[];
  dir: string;
  fontName: string;
  height: number;
  str: string;
  transform: number[];
  width: number;
  url?: string;
}

declare type PDFAnnotation = {
  rect: number[];
  url?: string;
  unsafeUrl?: string;
}

interface Rect {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
  x: number;
  y: number;
}
interface Tag { tag: string; color: string; position: number, trigger: string, text: string }