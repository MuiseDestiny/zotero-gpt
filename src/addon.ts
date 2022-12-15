import AddonEvents from "./events";
import AddonPrefs from "./prefs";
import AddonUtils from "./utils";
import AddonViews from "./views";

class Addon {
  public Zotero: _ZoteroConstructable;
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;
  public Utils: AddonUtils;
  // root path to access the resources
  public rootURI: string;

  constructor() {
    this.events = new AddonEvents(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
    this.Utils = new AddonUtils(this);
  }
}

export default Addon;
