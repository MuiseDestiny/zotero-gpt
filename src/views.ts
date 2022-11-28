import { Addon, getZotero, createXULElement } from "./addon";
import AddonModule from "./module";
const { addonRef, addonID } = require("../package.json");

class AddonViews extends AddonModule {
  // You can store some element in the object attributes
  private testButton: XUL.Button;
  private progressWindowIcon: object;

  constructor(parent: Addon) {
    super(parent);
    this.progressWindowIcon = {
      success: "chrome://zotero/skin/tick.png",
      fail: "chrome://zotero/skin/cross.png",
      default: `chrome://${addonRef}/skin/favicon.png`,
    };
  }

  public initViews() {
    const Zotero = getZotero();
    // You can init the UI elements that
    // cannot be initialized with overlay.xul
    Zotero.debug("Initializing UI");
    const _window: Window = Zotero.getMainWindow();
    const menuitem = createXULElement(_window.document, "menuitem");
    menuitem.id = "zotero-itemmenu-addontemplate-test";
    menuitem.setAttribute("label", "Addon Template");
    menuitem.setAttribute("oncommand", "alert('Hello World!')");
    // menuitem.className = "menuitem-iconic";
    // menuitem.style["list-style-image"] =
    //   "url('chrome/skin/default/addontemplate/favicon@0.5x.png')";
    _window.document.querySelector("#zotero-itemmenu").appendChild(menuitem);
  }

  public initPrefs() {
    const Zotero = getZotero();
    Zotero.PreferencePanes.register({
      pluginID: addonID,
      src: `${this._Addon.rootURI}/chrome/content/preferences.xhtml`,
      extraDTD: [`chrome://${addonRef}/locale/overlay.dtd`],
    });
  }

  public unInitViews() {
    const Zotero = getZotero();
    Zotero.debug("Uninitializing UI");
    const _window: Window = Zotero.getMainWindow();
    _window.document
      .querySelector("#zotero-itemmenu-addontemplate-test")
      ?.remove();
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
