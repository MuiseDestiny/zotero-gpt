import ZoteroToolkit from "zotero-plugin-toolkit/dist/index";
import { ColumnOptions } from "zotero-plugin-toolkit/dist/helpers/virtualizedTable";
import hooks from "./hooks";

class Addon {
  public data: {
    alive: boolean;
    // Env type, see build.js
    env: "development" | "production";
    // ztoolkit: MyToolkit;
    ztoolkit: ZoteroToolkit;
    locale?: {
      stringBundle: any;
    };
    prefs?: {
      window: Window;
      columns: Array<ColumnOptions>;
      rows: Array<{ [dataKey: string]: string }>;
    };
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: {};

  constructor() {
    this.data = {
      alive: true,
      env: __env__,
      // ztoolkit: new MyToolkit(),
      ztoolkit: new ZoteroToolkit(),
    };
    this.hooks = hooks;
    this.api = {};
  }
}

export default Addon;
