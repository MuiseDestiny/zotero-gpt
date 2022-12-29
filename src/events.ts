import Addon from "./addon";
import AddonModule from "./module";
import { config } from "../package.json";

class AddonEvents extends AddonModule {
  private notifierCallback: any;
  constructor(parent: Addon) {
    super(parent);
    this.notifierCallback = {
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
  }

  public async onInit() {
    this._Addon.Zotero = Zotero;
    // @ts-ignore
    this._Addon.rootURI = rootURI;
    // This function is the setup code of the addon
    this._Addon.toolkit.Tool.log(`${config.addonName}: init called`);

    // Register the callback in Zotero as an item observer
    let notifierID = Zotero.Notifier.registerObserver(this.notifierCallback, [
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

    // Initialize preference window
    this.initPrefs();
    this._Addon.views.initViews();
  }

  public initPrefs() {
    this._Addon.toolkit.Tool.log(this._Addon.rootURI);
    const prefOptions = {
      pluginID: config.addonID,
      src: this._Addon.rootURI + "chrome/content/preferences.xhtml",
      label: this._Addon.locale.getString("prefs.title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
      onload: (win: Window) => {
        this._Addon.prefs.initPreferences(win);
      },
    };
    if (this._Addon.toolkit.Compat.isZotero7()) {
      Zotero.PreferencePanes.register(prefOptions);
    } else {
      this._Addon.toolkit.Compat.registerPrefPane(prefOptions);
    }
  }

  private unInitPrefs() {
    if (!this._Addon.toolkit.Compat.isZotero7()) {
      this._Addon.toolkit.Compat.unregisterPrefPane();
    }
  }

  public onUnInit(): void {
    const Zotero = this._Addon.Zotero;
    this._Addon.toolkit.Tool.log(`${config.addonName}: uninit called`);
    this.unInitPrefs();
    //  Remove elements and do clean up
    this._Addon.views.unInitViews();
    // Remove addon object
    Zotero.AddonTemplate = undefined;
  }
}

export default AddonEvents;
