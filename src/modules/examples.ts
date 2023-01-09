import { config } from "../../package.json";
import { getString } from "./locale";

function example(
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any) {
    try {
      ztoolkit.log(`Calling example ${target.name}.${String(propertyKey)}`);
      return original.apply(this, args);
    } catch (e) {
      ztoolkit.log(`Error in example ${target.name}.${String(propertyKey)}`, e);
      throw e;
    }
  };
  return descriptor;
}

export class BasicExampleFactory {
  @example
  static registerNotifier() {
    const callback = {
      notify: async (
        event: string,
        type: string,
        ids: Array<string>,
        extraData: { [key: string]: any }
      ) => {
        if (!addon?.data.alive) {
          this.unregisterNotifier(notifierID);
          return;
        }
        addon.hooks.onNotify(event, type, ids, extraData);
      },
    };

    // Register the callback in Zotero as an item observer
    const notifierID = Zotero.Notifier.registerObserver(callback, [
      "tab",
      "item",
      "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    window.addEventListener(
      "unload",
      (e: Event) => {
        this.unregisterNotifier(notifierID);
      },
      false
    );
  }

  @example
  static exampleNotifierCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Open Tab Detected!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  private static unregisterNotifier(notifierID: string) {
    Zotero.Notifier.unregisterObserver(notifierID);
  }

  @example
  static registerPrefs() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs.title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      extraDTD: [`chrome://${config.addonRef}/locale/overlay.dtd`],
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);
  }
}

export class KeyExampleFactory {
  @example
  static registerShortcuts() {
    const keysetId = `${config.addonRef}-keyset`;
    const cmdsetId = `${config.addonRef}-cmdset`;
    const cmdSmallerId = `${config.addonRef}-cmd-smaller`;
    // Register an event key for Alt+L
    ztoolkit.Shortcut.register("event", {
      id: `${config.addonRef}-key-larger`,
      key: "L",
      modifiers: "alt",
      callback: (keyOptions) => {
        addon.hooks.onShortcuts("larger");
      },
    });
    // Register an element key using <key> for Alt+S
    ztoolkit.Shortcut.register("element", {
      id: `${config.addonRef}-key-smaller`,
      key: "S",
      modifiers: "alt",
      xulData: {
        document,
        command: cmdSmallerId,
        _parentId: keysetId,
        _commandOptions: {
          id: cmdSmallerId,
          document,
          _parentId: cmdsetId,
          oncommand: "Zotero.AddonTemplate.hooks.onShortcuts('smaller')",
        },
      },
    });
    // Here we register an conflict key for Alt+S
    // just to show how the confliction check works.
    // This is something you should avoid in your plugin.
    ztoolkit.Shortcut.register("event", {
      id: `${config.addonRef}-key-smaller-conflict`,
      key: "S",
      modifiers: "alt",
      callback: (keyOptions) => {
        ztoolkit.getGlobal("alert")("Smaller! This is a conflict key.");
      },
    });
    // Register an event key to check confliction
    ztoolkit.Shortcut.register("event", {
      id: `${config.addonRef}-key-check-conflict`,
      key: "C",
      modifiers: "alt",
      callback: (keyOptions) => {
        addon.hooks.onShortcuts("confliction");
      },
    });
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Example Shortcuts: Alt+L/S/C",
        type: "success",
      })
      .show();
  }

  @example
  static exampleShortcutLargerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Larger!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutSmallerCallback() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "Smaller!",
        type: "default",
      })
      .show();
  }

  @example
  static exampleShortcutConflictionCallback() {
    const conflictionGroups = ztoolkit.Shortcut.checkAllKeyConfliction();
    new ztoolkit.ProgressWindow("Check Key Confliction")
      .createLine({
        text: `${conflictionGroups.length} groups of confliction keys found. Details are in the debug output/console.`,
      })
      .show(-1);
    ztoolkit.log(
      "Conflictions:",
      conflictionGroups,
      "All keys:",
      ztoolkit.Shortcut.getAll()
    );
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet() {
    const styles = ztoolkit.UI.creatElementsFromJSON(document, {
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
  }

  @example
  static registerRightClickMenuItem() {
    const menuIcon = `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`;
    // item menuitem with icon
    ztoolkit.Menu.register("item", {
      tag: "menuitem",
      id: "zotero-itemmenu-addontemplate-test",
      label: getString("menuitem.label"),
      oncommand: "alert('Hello World! Default Menuitem.')",
      icon: menuIcon,
    });
  }

  @example
  static registerRightClickMenuPopup() {
    ztoolkit.Menu.register(
      "item",
      {
        tag: "menu",
        label: getString("menupopup.label"),
        subElementOptions: [
          {
            tag: "menuitem",
            label: getString("menuitem.submenulabel"),
            oncommand: "alert('Hello World! Sub Menuitem.')",
          },
        ],
      },
      "before",
      document.querySelector(
        "#zotero-itemmenu-addontemplate-test"
      ) as XUL.MenuItem
    );
  }

  @example
  static registerWindowMenuWithSeprator() {
    ztoolkit.Menu.register("menuFile", {
      tag: "menuseparator",
    });
    // menu->File menuitem
    ztoolkit.Menu.register("menuFile", {
      tag: "menuitem",
      label: getString("menuitem.filemenulabel"),
      oncommand: "alert('Hello World! File Menuitem.')",
    });
  }

  @example
  static async registerExtraColumn() {
    await ztoolkit.ItemTree.register(
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
  }

  @example
  static async registerExtraColumnWithCustomCell() {
    await ztoolkit.ItemTree.register(
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
  }

  @example
  static async registerCustomCellRenderer() {
    await ztoolkit.ItemTree.addRenderCellHook(
      "title",
      (index: number, data: string, column: any, original: Function) => {
        const span = original(index, data, column) as HTMLSpanElement;
        span.style.background = "rgb(30, 30, 30)";
        span.style.color = "rgb(156, 220, 240)";
        return span;
      }
    );
    // @ts-ignore
    // This is a private method. Make it public in toolkit.
    await ztoolkit.ItemTree.refresh();
  }

  @example
  static registerLibraryTabPanel() {
    const tabId = ztoolkit.LibraryTabPanel.register(
      getString("tabpanel.lib.tab.label"),
      (panel: XUL.Element, win: Window) => {
        const elem = ztoolkit.UI.creatElementsFromJSON(win.document, {
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
                    ztoolkit.LibraryTabPanel.unregister(tabId);
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
  }

  @example
  static async registerReaderTabPanel() {
    const tabId = await ztoolkit.ReaderTabPanel.register(
      getString("tabpanel.reader.tab.label"),
      (
        panel: XUL.TabPanel | undefined,
        deck: XUL.Deck,
        win: Window,
        reader: _ZoteroReaderInstance
      ) => {
        if (!panel) {
          ztoolkit.log(
            "This reader do not have right-side bar. Adding reader tab skipped."
          );
          return;
        }
        ztoolkit.log(reader);
        const elem = ztoolkit.UI.creatElementsFromJSON(win.document, {
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
                    ztoolkit.ReaderTabPanel.unregister(tabId);
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
  }
}
