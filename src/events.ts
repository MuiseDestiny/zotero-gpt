import Addon from "./addon";
import AddonModule from "./module";
import { config } from "../package.json";
import ZoteroToolkit from "zotero-plugin-toolkit";

class AddonEvents extends AddonModule {
  constructor(parent: Addon) {
    super(parent);
  }

  // This function is the setup code of the addon
  public async onInit() {
    this.initGlobalVariables();
    // @ts-ignore
    const development = "development";
    const production = "production";
    // The env will be replaced after esbuild
    // @ts-ignore
    this._Addon.env = __env__;
    ZToolkit.Tool.logOptionsGlobal.disableConsole =
      this._Addon.env === "production";
    ZToolkit.Tool.log("init called");

    // Initialize locale provider
    this._Addon.locale.initLocale();
    // Initialize preference window
    this.initPrefs();
    // Initialize notifier callback
    this.initNotifier();
    // Initialize UI elements
    this._Addon.views.initViews();
  }

  public onUnInit(): void {
    ZToolkit.Tool.log("uninit called");
    this.unInitPrefs();
    //  Remove elements and do clean up
    this._Addon.views.unInitViews();
    // Remove addon object
    Zotero.AddonTemplate = undefined;
  }

  private initGlobalVariables() {
    _globalThis.ZToolkit = new ZoteroToolkit();
    ZToolkit.Tool.logOptionsGlobal.prefix = `[${config.addonName}]`;
    _globalThis.Zotero = ZToolkit.Compat.getGlobal("Zotero");
    _globalThis.ZoteroPane = ZToolkit.Compat.getGlobal("ZoteroPane");
    _globalThis.Zotero_Tabs = ZToolkit.Compat.getGlobal("Zotero_Tabs");
    _globalThis.window = ZToolkit.Compat.getGlobal("window");
    _globalThis.document = ZToolkit.Compat.getGlobal("document");
    ZToolkit.Tool.log("initializeing global variables");
  }

  private initNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: Array<string>,
        extraData: { [key: string]: any }
      ) => {
        // You can add your code to the corresponding notify type
        if (
          event == "select" &&
          type == "tab" &&
          extraData[ids[0]].type == "reader"
        ) {
          // Select a reader tab
        }
        if (event == "add" && type == "item") {
          // Add an item
        }
      },
    };

    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    Zotero.getMainWindow().addEventListener(
      "unload",
      function (e: Event) {
        Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );
  }

  private initPrefs() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: this._Addon.locale.getString("prefs.title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
      onload: (win: Window) => {
        this._Addon.prefs.initPreferences(win);
      },
    };
    if (ZToolkit.Compat.isZotero7()) {
      Zotero.PreferencePanes.register(prefOptions);
    } else {
      ZToolkit.Compat.registerPrefPane(prefOptions);
    }
  }

  private unInitPrefs() {
    if (!ZToolkit.Compat.isZotero7()) {
      ZToolkit.Compat.unregisterPrefPane();
    }
  }
}

export default AddonEvents;
