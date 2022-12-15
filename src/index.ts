import Addon from "./addon";

const Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
  Components.interfaces.nsISupports
).wrappedJSObject;

if (!Zotero.AddonTemplate) {
  Zotero.AddonTemplate = new Addon();
  Zotero.AddonTemplate.events.onInit(Zotero);
}
