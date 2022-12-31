import AddonEvents from "./events";
import AddonPrefs from "./prefs";
import AddonViews from "./views";
import AddonLocale from "./locale";

import ZoteroToolkit from "zotero-plugin-toolkit";

class Addon {
  // A global Zotero instance
  public Zotero!: _ZoteroConstructable;
  // Root path to access the resources
  public rootURI!: string;
  // Env type, see build.js
  public env!: "development" | "production";
  // Lifecycle events
  public events: AddonEvents;
  // UI operations
  public views: AddonViews;
  // Scripts for prefpane window
  public prefs: AddonPrefs;
  // Runtime locale with .properties
  public locale: AddonLocale;
  // A toolkit instance. See zotero-plugin-toolkit
  public toolkit: ZoteroToolkit;

  constructor() {
    this.events = new AddonEvents(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
    this.locale = new AddonLocale(this);
    this.toolkit = new ZoteroToolkit();
  }
}

export default Addon;
