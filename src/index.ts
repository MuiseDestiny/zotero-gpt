import Addon from "./addon";

/**
 * Globals: bootstrap.js > ctx
 * const ctx = {
    Zotero,
    rootURI,
    window,
    document: window.document,
    ZoteroPane: Zotero.getActiveZoteroPane(),
  };
 */
if (!Zotero.AddonTemplate) {
  Zotero.AddonTemplate = new Addon();
  // @ts-ignore
  Zotero.AddonTemplate.events.onInit();
}
