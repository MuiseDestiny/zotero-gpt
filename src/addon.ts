import AddonEvents from "./events";
import AddonPrefs from "./prefs";
import AddonViews from "./views";

const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;
  // root path to access the resources
  public rootURI: string;

  constructor() {
    this.events = new AddonEvents(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
  }
}

function getZotero(): _ZoteroConstructable {
  if (typeof Zotero === "undefined") {
    return Components.classes["@zotero.org/Zotero;1"].getService(
      Components.interfaces.nsISupports
    ).wrappedJSObject;
  }
  return Zotero;
}

function isZotero7(): boolean {
  return Zotero.platformMajorVersion >= 102;
}

function createXULElement(doc: Document, type: string): XUL.Element {
  if (isZotero7()) {
    // @ts-ignore
    return doc.createXULElement(type);
  } else {
    return doc.createElementNS(
      "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
      type
    ) as XUL.Element;
  }
}

export { addonName, Addon, getZotero, isZotero7, createXULElement };
