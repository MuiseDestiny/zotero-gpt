declare interface ZoteroCompat {
  getZotero: () => _ZoteroConstructable;
  isZotero7: () => boolean;
  getDOMParser: () => DOMParser;
  createXULElement: (doc: Document, type: string) => XUL.Element;
}

declare interface ZoteroTool {
  getCopyHelper: () => CopyHelper;
  openFilePicker: (
    title: string,
    mode: "open" | "save" | "folder",
    filters?: [string, string][],
    suggestion?: string
  ) => Promise<string>;
  log: (...data: any[]) => void;
}

declare interface ZoteroUI {
  addonElements: Element[];
  createElement: (
    doc: Document,
    tagName: string,
    namespace: "html" | "svg" | "xul"
  ) => XUL.Element | DocumentFragment | HTMLElement | SVGAElement;
  removeAddonElements: () => void;
  creatElementsFromJSON: (
    doc: Document,
    options: ElementOptions
  ) => XUL.Element | DocumentFragment | HTMLElement | SVGAElement;
  defaultMenuPopupSelectors: {
    [key: string]: string;
  };
  insertMenuItem: (
    menuPopup: XUL.Menupopup | string,
    options: MenuitemOptions,
    insertPosition?: "before" | "after",
    anchorElement?: XUL.Element
  ) => boolean;
}

declare interface ElementOptions {
  tag: string;
  id?: string;
  namespace?: "html" | "svg" | "xul";
  styles?: { [key: string]: string };
  directAttributes?: { [key: string]: string | boolean | number };
  attributes?: { [key: string]: string | boolean | number };
  listeners?: Array<
    | [
        string,
        EventListenerOrEventListenerObject,
        boolean | AddEventListenerOptions
      ]
    | [string, EventListenerOrEventListenerObject]
  >;
  checkExistanceParent?: HTMLElement;
  ignoreIfExists?: boolean;
  removeIfExists?: boolean;
  customCheck?: () => boolean;
  subElementOptions?: Array<ElementOptions>;
}

declare interface MenuitemOptions {
  tag: "menuitem" | "menu" | "menuseparator";
  id?: string;
  label?: string;
  // data url (chrome://xxx.png) or base64 url (data:image/png;base64,xxx)
  icon?: string;
  class?: string;
  styles?: { [key: string]: string };
  hidden?: boolean;
  disabled?: boolean;
  oncommand?: string;
  commandListener?: EventListenerOrEventListenerObject;
  // Attributes below are used when type === "menu"
  popupId?: string;
  onpopupshowing?: string;
  subElementOptions?: Array<MenuitemOptions>;
}

declare class CopyHelper {
  addText: (source: string, type: "text/html" | "text/unicode") => CopyHelper;
  addImage: (source: string) => CopyHelper;
  copy: () => void;
}
