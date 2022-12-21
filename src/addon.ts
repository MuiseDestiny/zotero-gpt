import AddonEvents from "./events";
import AddonPrefs from "./prefs";
import AddonViews from "./views";

import ZoteroToolkit from "zotero-plugin-toolkit";

class Addon {
  public Zotero!: _ZoteroConstructable;
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;
  public toolkit: ZoteroToolkit;
  // root path to access the resources
  public rootURI!: string;

  constructor() {
    this.events = new AddonEvents(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
    this.toolkit = new ZoteroToolkit();
  }
}

export default Addon;
