import Addon from "./addon";

if (!Zotero.AddonTemplate) {
  Zotero.AddonTemplate = new Addon();
  // @ts-ignore
  Zotero.AddonTemplate.events.onInit(Zotero, rootURI);
}
