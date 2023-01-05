import AddonHooks from "./hooks";
import AddonPrefs from "./prefs";
import AddonLocale from "./locale";

class Addon {
  // Env type, see build.js
  public env!: "development" | "production";
  // If addon is disabled/removed, set it false
  public alive: boolean;
  // Lifecycle events
  public hooks: AddonHooks;
  // Scripts for prefpane window
  public prefs: AddonPrefs;
  // Runtime locale with .properties
  public locale: AddonLocale;

  constructor() {
    this.alive = true;
    this.hooks = new AddonHooks();
    this.prefs = new AddonPrefs();
    this.locale = new AddonLocale();
  }
}

export default Addon;
