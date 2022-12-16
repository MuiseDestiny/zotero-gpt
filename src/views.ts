import Addon from "./addon";
import AddonModule from "./module";
const { addonRef, addonID } = require("../package.json");

class AddonViews extends AddonModule {
  // You can store some element in the object attributes
  private progressWindowIcon: object;

  constructor(parent: Addon) {
    super(parent);
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: `chrome://${addonRef}/content/icons/favicon.png`,
    };
  }

  public initViews() {
    const Zotero = this._Addon.Zotero;
    // You can init the UI elements that
    // cannot be initialized with overlay.xul
    this._Addon.Utils.Tool.log("Initializing UI");
    const menuIcon =
      'url("chrome://addontemplate/content/icons/favicon@0.5x.png")';
    // item menuitem with icon
    this._Addon.Utils.UI.insertMenuItem("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: "Addon Template: Menuitem",
      oncommand: "alert('Hello World! Default Menuitem.')",
      icon: menuIcon,
    });
    // item menupopup with sub-menuitems
    this._Addon.Utils.UI.insertMenuItem(
      "item",
      {
        tag: "menu",
        label: "Addon Template: Menupopup",
        subElementOptions: [
          {
            tag: "menuitem",
            label: "Addon Template",
            oncommand: "alert('Hello World! Sub Menuitem.')",
          },
        ],
      },
      "before",
      this._Addon.Zotero.getMainWindow().document.querySelector(
        "#zotero-itemmenu-addontemplate-test"
      )
    );
    this._Addon.Utils.UI.insertMenuItem("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    this._Addon.Utils.UI.insertMenuItem("menuFile", {
      tag: "menuitem",
      label: "Addon Template: File Menuitem",
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  public initPrefs() {
    const Zotero = this._Addon.Zotero;
    this._Addon.Utils.Tool.log(this._Addon.rootURI);
    const prefOptions = {
      pluginID: addonID,
      src: this._Addon.rootURI + "chrome/content/preferences.xhtml",
      label: "Template",
      image: `chrome://${addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
      onload: (win: Window) => {
        this._Addon.prefs.initPreferences(win);
      },
    };
    if (this._Addon.Utils.Compat.isZotero7()) {
      Zotero.PreferencePanes.register(prefOptions);
    } else {
      this._Addon.Utils.Compat.registerPrefPane(prefOptions);
    }
  }

  public unInitViews() {
    const Zotero = this._Addon.Zotero;
    this._Addon.Utils.Tool.log("Uninitializing UI");
    this._Addon.Utils.UI.removeAddonElements();
    if (!this._Addon.Utils.Compat.isZotero7()) {
      this._Addon.Utils.Compat.unregisterPrefPane();
    }
  }

  public showProgressWindow(
    header: string,
    context: string,
    type: string = "default",
    t: number = 5000
  ) {
    // A simple wrapper of the Zotero ProgressWindow
    let progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
    progressWindow.changeHeadline(header);
    progressWindow.progress = new progressWindow.ItemProgress(
      this.progressWindowIcon[type],
      context
    );
    progressWindow.show();
    if (t > 0) {
      progressWindow.startCloseTimer(t);
    }
  }
}

export default AddonViews;
