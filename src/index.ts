import { Addon } from "./addon";

var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
  Components.interfaces.nsISupports
).wrappedJSObject;
if (!_Zotero.AddonTemplate) {
  _Zotero.AddonTemplate = new Addon();
  _Zotero.AddonTemplate.events.onInit(_Zotero);
}
