import Addon from "./addon";
import AddonModule from "./module";
import { config } from "../package.json";

class AddonViews extends AddonModule {
  // You can store some element in the object attributes
  private progressWindowIcon: { [key: string]: string };

  constructor(parent: Addon) {
    super(parent);
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: `chrome://${config.addonRef}/content/icons/favicon.png`,
    };
  }

  public initViews() {
    // You can init the UI elements that
    // cannot be initialized with overlay.xul
    this._Addon.toolkit.Tool.log("Initializing UI");
    const menuIcon = "chrome://addontemplate/content/icons/favicon@0.5x.png";
    // item menuitem with icon
    this._Addon.toolkit.UI.insertMenuItem("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: this._Addon.locale.getString("menuitem.label"),
      oncommand: "alert('Hello World! Default Menuitem.')",
      icon: menuIcon,
    });
    // item menupopup with sub-menuitems
    this._Addon.toolkit.UI.insertMenuItem(
      "item",
      {
        tag: "menu",
        label: this._Addon.locale.getString("menupopup.label"),
        subElementOptions: [
          {
            tag: "menuitem",
            label: this._Addon.locale.getString("menuitem.submenulabel"),
            oncommand: "alert('Hello World! Sub Menuitem.')",
          },
        ],
      },
      "before",
      this._Addon.Zotero.getMainWindow().document.querySelector(
        "#zotero-itemmenu-addontemplate-test"
      )
    );
    this._Addon.toolkit.UI.insertMenuItem("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    this._Addon.toolkit.UI.insertMenuItem("menuFile", {
      tag: "menuitem",
      label: this._Addon.locale.getString("menuitem.filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });

    // Initialize extra columns
    this._Addon.toolkit.ItemTree.registerExample();
  }

  public unInitViews() {
    this._Addon.toolkit.Tool.log("Uninitializing UI");
    this._Addon.toolkit.UI.removeAddonElements();
    // Remove extra columns
    this._Addon.toolkit.ItemTree.unregister("test");
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
