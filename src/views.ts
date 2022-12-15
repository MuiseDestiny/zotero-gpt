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
      default: `chrome://${addonRef}/skin/favicon.png`,
    };
  }

  public initViews() {
    const Zotero = this._Addon.Zotero;
    // You can init the UI elements that
    // cannot be initialized with overlay.xul
    Zotero.debug("Initializing UI");
    const menuIcon =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAC9klEQVQ4jU1TzW/UZRB+Zub9fexXt7s0YG0RAlTAg6EqjfUkMYYDN2OiJngxXOBEBP0T9KY3LiQe1JgYP4BEw0laBSGgSSVIYhNLw5cuaaXdbnf39/G+73jo/hommcxhMk9m5nkeUlUU4RQkBJ25kwRHv358LmAcEUbKRNxJfRAb8kbIqip1Mw2mn4nOMJ4IVWUAuHE/e3m1748IAyt9bxZXbPDCWHiJGa37qzZcz9SUAsK1e+kJowBtAoAIAEJDVcNAKaCZYweHzjPRyORo8P1fS/apwGBqZiGpzN5JT9UiEkPFLAAa1FCos5Z4fdBG9cf5ZO7geGhOX+y+Hwq1XhwLPv234z8UhjgFTGLBACoFiir828+Xb/etTnVT3TpSZrPw2D7993L+7njdLN5q5Tfnl+3JekRwCpgPLvW/AXAYQD7YQgwTanHUowj2P4eSC+W3Stz7dXtdzjngQCSAV1gAht77obdJAxPQy9VZjywOUFKFEkBeCZNbcWjhUd9+Mde73CwzVKEAiIXghaABw/VyxfSYHD+8y7yqCpQMaSzkmYDMYWhXw7R3NsxnTMgGz1dWgBWAVUgtpKUddfllelwe1SOayz3YKWgo5uy7W739H8+uff7sSHCtHNAp9VAhwAzu9pmDbB+mC/90/Ru/t3R07xb58vpDNxkbqFOloZhzJuz4eTE5GzB1haGdVJmL2zOn2NOUq3dX/XPtxB/aVqE/AFUCGAoOGL3hEi+N1qS7pUwaCdLXJ+JPDAC1HjIc03okuLKS6EPrcX5nnf9slni+m+u+1cTLsanq4pv7GnvbqTaEYBVAJFhnAnzugW0VvpA5vLKW6sXU4dvL9+w7E03+yroNhkLZqNWQ1qohdWohdQwTmAjqVLGnwT/dXnavhUIsBLS6+tZIiW74jR9t6l0BKpIIMF5hYkO4+sCeth67zcBe7VRfmr1rPyobuJUEknv4Qu6F5AGAAVwhAJnHfgWiouEVgVUc8AqphHRzosnXC8aedPD/kPxathRorWcAAAAASUVORK5CYII=";
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
    Zotero.PreferencePanes.register({
      pluginID: addonID,
      src: `${this._Addon.rootURI}/chrome/content/preferences.xhtml`,
      extraDTD: [`chrome://${addonRef}/locale/overlay.dtd`],
    });
  }

  public unInitViews() {
    const Zotero = this._Addon.Zotero;
    Zotero.debug("Uninitializing UI");
    this._Addon.Utils.UI.removeAddonElements();
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
