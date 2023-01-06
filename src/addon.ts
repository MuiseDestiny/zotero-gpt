import ZoteroToolkit from "zotero-plugin-toolkit";
import hooks from "./hooks";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    ztoolkit: ZoteroToolkit;
    locale?: {
      stringBundle: any;
    };
    prefs?: {
      window: Window;
    };
  };
  // Lifecycle hooks
  public hooks: typeof hooks;

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      ztoolkit: new ZoteroToolkit(),
    };
    this.hooks = hooks;
  }
}

export default Addon;
