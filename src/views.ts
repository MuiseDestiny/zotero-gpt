import { Addon } from "./addon";
import AddonModule from "./module";
const { addonRef } = require("../package.json");

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

  public initViews(_Zotero) {
    // You can init the UI elements that
    // cannot be initialized with overlay.xul
    console.log("Initializing UI");
    const _window: Window = _Zotero.getMainWindow();
    const menuitem = _window.document.createElement("menuitem");
    menuitem.id = "zotero-itemmenu-addontemplate-test";
    menuitem.setAttribute("label", "Addon Template");
    menuitem.setAttribute("oncommand", "alert('Hello World!')");
    menuitem.className = "menuitem-iconic";
    menuitem.style["list-style-image"] =
      "url('chrome://addontemplate/skin/favicon@0.5x.png')";
    _window.document.querySelector("#zotero-itemmenu").appendChild(menuitem);
  }

  public unInitViews(_Zotero) {
    console.log("Uninitializing UI");
    const _window: Window = _Zotero.getMainWindow();
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
