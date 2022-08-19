import AddonEvents from "./events";
import AddonPrefs from "./prefs";
import AddonViews from "./views";

const { addonName } = require("../package.json");

class Addon {
  public events: AddonEvents;
  public views: AddonViews;
  public prefs: AddonPrefs;

  constructor() {
    this.events = new AddonEvents(this);
    this.views = new AddonViews(this);
    this.prefs = new AddonPrefs(this);
  }
}

export { addonName, Addon };
