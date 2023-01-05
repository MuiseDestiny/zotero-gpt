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
    ZToolkit.Tool.log("Initializing UI");

    // register style sheet
    const styles = ZToolkit.UI.creatElementsFromJSON(document, {
      tag: "link",
      directAttributes: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/zoteroPane.css`,
      },
    }) as HTMLLinkElement;
    document.documentElement.appendChild(styles);
    document
      .getElementById("zotero-item-pane-content")
      ?.classList.add("makeItRed");

    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    // item menuitem with icon
    ZToolkit.UI.insertMenuItem("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: this._Addon.locale.getString("menuitem.label"),
      oncommand: "alert('Hello World! Default Menuitem.')",
      icon: menuIcon,
    });
    // item menupopup with sub-menuitems
    ZToolkit.UI.insertMenuItem(
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
      document.querySelector(
        "#zotero-itemmenu-addontemplate-test"
      ) as XUL.MenuItem
    );
    ZToolkit.UI.insertMenuItem("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ZToolkit.UI.insertMenuItem("menuFile", {
      tag: "menuitem",
      label: this._Addon.locale.getString("menuitem.filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
    /**
     *  Example: menu items ends
     */

    /**
     *  Example: extra column starts
     */
    // Initialize extra columns
    ZToolkit.ItemTree.register(
      "test1",
      "text column",
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        return field + String(item.id);
      },
      {
        iconPath: "chrome://zotero/skin/cross.png",
      }
    );
    ZToolkit.ItemTree.register(
      "test2",
      "custom column",
      (
        field: string,
        unformatted: boolean,
        includeBaseMapped: boolean,
        item: Zotero.Item
      ) => {
        return String(item.id);
      },
      {
        renderCellHook(index, data, column) {
          const span = document.createElementNS(
            "http://www.w3.org/1999/xhtml",
            "span"
          );
          span.style.background = "#0dd068";
          span.innerText = "⭐" + data;
          return span;
        },
      }
    );
    /**
     *  Example: extra column ends
     */

    /**
     *  Example: custom cell starts
     */
    // Customize cells
    ZToolkit.ItemTree.addRenderCellHook(
      "title",
      (index: number, data: string, column: any, original: Function) => {
        const span = original(index, data, column) as HTMLSpanElement;
        span.style.background = "rgb(30, 30, 30)";
        span.style.color = "rgb(156, 220, 240)";
        return span;
      }
    );
    /**
     *  Example: custom cell ends
     */

    /**
     *  Example: extra library tab starts
     */
    const libTabId = ZToolkit.UI.registerLibraryTabPanel(
      this._Addon.locale.getString("tabpanel.lib.tab.label"),
      (panel: XUL.Element, win: Window) => {
        const elem = ZToolkit.UI.creatElementsFromJSON(win.document, {
          tag: "vbox",
          namespace: "xul",
          subElementOptions: [
            {
              tag: "h2",
              namespace: "html",
              directAttributes: {
                innerText: "Hello World!",
              },
            },
            {
              tag: "div",
              namespace: "html",
              directAttributes: {
                innerText: "This is a library tab.",
              },
            },
            {
              tag: "button",
              namespace: "html",
              directAttributes: {
                innerText: "Unregister",
              },
              listeners: [
                {
                  type: "click",
                  listener: () => {
                    ZToolkit.UI.unregisterLibraryTabPanel(libTabId);
                  },
                },
              ],
            },
          ],
        });
        panel.append(elem);
      },
      {
        targetIndex: 1,
      }
    );
    /**
     *  Example: extra library tab ends
     */

    /**
     *  Example: extra reader tab starts
     */
    const readerTabId = `${config.addonRef}-extra-reader-tab`;
    ZToolkit.UI.registerReaderTabPanel(
      this._Addon.locale.getString("tabpanel.reader.tab.label"),
      (
        panel: XUL.Element,
        deck: XUL.Deck,
        win: Window,
        reader: _ZoteroReaderInstance
      ) => {
        if (!panel) {
          ZToolkit.Tool.log(
            "This reader do not have right-side bar. Adding reader tab skipped."
          );
          return;
        }
        ZToolkit.Tool.log(reader);
        const elem = ZToolkit.UI.creatElementsFromJSON(win.document, {
          tag: "vbox",
          id: `${config.addonRef}-${reader._instanceID}-extra-reader-tab-div`,
          namespace: "xul",
          // This is important! Don't create content for multiple times
          // ignoreIfExists: true,
          removeIfExists: true,
          subElementOptions: [
            {
              tag: "h2",
              namespace: "html",
              directAttributes: {
                innerText: "Hello World!",
              },
            },
            {
              tag: "div",
              namespace: "html",
              directAttributes: {
                innerText: "This is a reader tab.",
              },
            },
            {
              tag: "div",
              namespace: "html",
              directAttributes: {
                innerText: `Reader: ${reader._title.slice(0, 20)}`,
              },
            },
            {
              tag: "div",
              namespace: "html",
              directAttributes: {
                innerText: `itemID: ${reader.itemID}.`,
              },
            },
            {
              tag: "button",
              namespace: "html",
              directAttributes: {
                innerText: "Unregister",
              },
              listeners: [
                {
                  type: "click",
                  listener: () => {
                    ZToolkit.UI.unregisterReaderTabPanel(readerTabId);
                  },
                },
              ],
            },
          ],
        });
        panel.append(elem);
      },
      {
        tabId: readerTabId,
        targetIndex: 1,
      }
    );
    /**
     *  Example: extra reader tab ends
     */
  }

  public unInitViews() {
    ZToolkit.Tool.log("Uninitializing UI");
    ZToolkit.unregisterAll();
    // toolkit.UI.removeAddonElements();
    // // Remove extra columns
    // toolkit.ItemTree.unregister("test1");
    // toolkit.ItemTree.unregister("test2");

    // // Remove title cell patch
    // toolkit.ItemTree.removeRenderCellHook("title");

    // toolkit.UI.unregisterReaderTabPanel(
    //   `${config.addonRef}-extra-reader-tab`
    // );
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
