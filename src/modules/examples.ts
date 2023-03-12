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
        ids: number[] | string[],
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
          oncommand: `Zotero.${config.addonInstance}.hooks.onShortcuts('smaller')`,
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
  static exampleShortcutConflictingCallback() {
    const conflictingGroups = ztoolkit.Shortcut.checkAllKeyConflicting();
    new ztoolkit.ProgressWindow("Check Key Conflicting")
      .createLine({
        text: `${conflictingGroups.length} groups of conflicting keys found. Details are in the debug output/console.`,
      })
      .show(-1);
    ztoolkit.log(
      "Conflicting:",
      conflictingGroups,
      "All keys:",
      ztoolkit.Shortcut.getAll()
    );
  }
}

export class UIExampleFactory {
  @example
  static registerStyleSheet() {
    const styles = ztoolkit.UI.createElement(document, "link", {
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/zoteroPane.css`,
      },
    });
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
      commandListener: (ev) => addon.hooks.onDialogEvents("dialogExample"),
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
        children: [
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
  static registerWindowMenuWithSeparator() {
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
    await ztoolkit.ItemTree.refresh();
  }

  @example
  static async registerCustomItemBoxRow() {
    await ztoolkit.ItemBox.register(
      "itemBoxFieldEditable",
      "Editable Custom Field",
      (field, unformatted, includeBaseMapped, item, original) => {
        return (
          ztoolkit.ExtraField.getExtraField(item, "itemBoxFieldEditable") || ""
        );
      },
      {
        editable: true,
        setFieldHook: (field, value, loadIn, item, original) => {
          window.alert("Custom itemBox value is changed and saved to extra!");
          ztoolkit.ExtraField.setExtraField(
            item,
            "itemBoxFieldEditable",
            value
          );
          return true;
        },
        index: 1,
      }
    );

    await ztoolkit.ItemBox.register(
      "itemBoxFieldNonEditable",
      "Non-Editable Custom Field",
      (field, unformatted, includeBaseMapped, item, original) => {
        return (
          "[CANNOT EDIT THIS]" + (item.getField("title") as string).slice(0, 10)
        );
      },
      {
        editable: false,
        index: 2,
      }
    );
  }

  @example
  static registerLibraryTabPanel() {
    const tabId = ztoolkit.LibraryTabPanel.register(
      getString("tabpanel.lib.tab.label"),
      (panel: XUL.Element, win: Window) => {
        const elem = ztoolkit.UI.createElement(win.document, "vbox", {
          children: [
            {
              tag: "h2",
              properties: {
                innerText: "Hello World!",
              },
            },
            {
              tag: "div",
              properties: {
                innerText: "This is a library tab.",
              },
            },
            {
              tag: "button",
              namespace: "html",
              properties: {
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
        reader: _ZoteroTypes.ReaderInstance
      ) => {
        if (!panel) {
          ztoolkit.log(
            "This reader do not have right-side bar. Adding reader tab skipped."
          );
          return;
        }
        ztoolkit.log(reader);
        const elem = ztoolkit.UI.createElement(win.document, "vbox", {
          id: `${config.addonRef}-${reader._instanceID}-extra-reader-tab-div`,
          // This is important! Don't create content for multiple times
          // ignoreIfExists: true,
          removeIfExists: true,
          children: [
            {
              tag: "h2",
              properties: {
                innerText: "Hello World!",
              },
            },
            {
              tag: "div",
              properties: {
                innerText: "This is a reader tab.",
              },
            },
            {
              tag: "div",
              properties: {
                innerText: `Reader: ${reader._title.slice(0, 20)}`,
              },
            },
            {
              tag: "div",
              properties: {
                innerText: `itemID: ${reader.itemID}.`,
              },
            },
            {
              tag: "button",
              namespace: "html",
              properties: {
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

export class PromptExampleFactory {
  @example
  static registerNormalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Normal Command Test",
        label: "Plugin Template",
        callback(prompt) {
          ztoolkit.getGlobal("alert")("Command triggered!");
        },
      },
    ]);
  }

  @example
  static registerAnonymousCommandExample() {
    ztoolkit.Prompt.register([
      {
        id: "search",
        callback: async (prompt) => {
          // https://github.com/zotero/zotero/blob/7262465109c21919b56a7ab214f7c7a8e1e63909/chrome/content/zotero/integration/quickFormat.js#L589
          function getItemDescription(item: Zotero.Item) {
            var nodes = [];
            var str = "";
            var author,
              authorDate = "";
            if (item.firstCreator) {
              author = authorDate = item.firstCreator;
            }
            var date = item.getField("date", true, true) as string;
            if (date && (date = date.substr(0, 4)) !== "0000") {
              authorDate += " (" + parseInt(date) + ")";
            }
            authorDate = authorDate.trim();
            if (authorDate) nodes.push(authorDate);

            var publicationTitle = item.getField(
              "publicationTitle",
              false,
              true
            );
            if (publicationTitle) {
              nodes.push(`<i>${publicationTitle}</i>`);
            }
            var volumeIssue = item.getField("volume");
            var issue = item.getField("issue");
            if (issue) volumeIssue += "(" + issue + ")";
            if (volumeIssue) nodes.push(volumeIssue);

            var publisherPlace = [],
              field;
            if ((field = item.getField("publisher")))
              publisherPlace.push(field);
            if ((field = item.getField("place"))) publisherPlace.push(field);
            if (publisherPlace.length) nodes.push(publisherPlace.join(": "));

            var pages = item.getField("pages");
            if (pages) nodes.push(pages);

            if (!nodes.length) {
              var url = item.getField("url");
              if (url) nodes.push(url);
            }

            // compile everything together
            for (var i = 0, n = nodes.length; i < n; i++) {
              var node = nodes[i];

              if (i != 0) str += ", ";

              if (typeof node === "object") {
                var label = document.createElement("label");
                label.setAttribute("value", str);
                label.setAttribute("crop", "end");
                str = "";
              } else {
                str += node;
              }
            }
            str.length && (str += ".");
            return str;
          }
          function filter(ids: number[]) {
            ids = ids.filter(async (id) => {
              const item = (await Zotero.Items.getAsync(id)) as Zotero.Item;
              return item.isRegularItem() && !(item as any).isFeedItem;
            });
            return ids;
          }
          const text = prompt.inputNode.value;
          prompt.showTip("Searching...");
          const s = new Zotero.Search();
          s.addCondition("quicksearch-titleCreatorYear", "contains", text);
          s.addCondition("itemType", "isNot", "attachment");
          let ids = await s.search();
          // prompt.exit will remove current container element.
          // @ts-ignore
          prompt.exit();
          const container = prompt.createCommandsContainer();
          container.classList.add("suggestions");
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length == 0) {
            const s = new Zotero.Search();
            const operators = [
              "is",
              "isNot",
              "true",
              "false",
              "isInTheLast",
              "isBefore",
              "isAfter",
              "contains",
              "doesNotContain",
              "beginsWith",
            ];
            let hasValidCondition = false;
            let joinMode: string = "all";
            if (/\s*\|\|\s*/.test(text)) {
              joinMode = "any";
            }
            text.split(/\s*(&&|\|\|)\s*/g).forEach((conditinString: string) => {
              let conditions = conditinString.split(/\s+/g);
              if (
                conditions.length == 3 &&
                operators.indexOf(conditions[1]) != -1
              ) {
                hasValidCondition = true;
                s.addCondition(
                  "joinMode",
                  joinMode as Zotero.Search.Operator,
                  ""
                );
                s.addCondition(
                  conditions[0] as string,
                  conditions[1] as Zotero.Search.Operator,
                  conditions[2] as string
                );
              }
            });
            if (hasValidCondition) {
              ids = await s.search();
            }
          }
          ids = filter(ids);
          console.log(ids.length);
          if (ids.length > 0) {
            ids.forEach((id: number) => {
              const item = Zotero.Items.get(id);
              const title = item.getField("title");
              const ele = ztoolkit.UI.createElement(document, "div", {
                namespace: "html",
                classList: ["command"],
                listeners: [
                  {
                    type: "mousemove",
                    listener: function () {
                      // @ts-ignore
                      prompt.selectItem(this);
                    },
                  },
                  {
                    type: "click",
                    listener: () => {
                      prompt.promptNode.style.display = "none";
                      Zotero_Tabs.select("zotero-pane");
                      ZoteroPane.selectItem(item.id);
                    },
                  },
                ],
                styles: {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "start",
                },
                children: [
                  {
                    tag: "span",
                    styles: {
                      fontWeight: "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerText: title,
                    },
                  },
                  {
                    tag: "span",
                    styles: {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    properties: {
                      innerHTML: getItemDescription(item),
                    },
                  },
                ],
              });
              container.appendChild(ele);
            });
          } else {
            // @ts-ignore
            prompt.exit();
            prompt.showTip("Not Found.");
          }
        },
      },
    ]);
  }

  @example
  static registerConditionalCommandExample() {
    ztoolkit.Prompt.register([
      {
        name: "Conditional Command Test",
        label: "Plugin Template",
        // The when function is executed when Prompt UI is woken up by `Shift + P`, and this command does not display when false is returned.
        when: () => {
          const items = ZoteroPane.getSelectedItems();
          return items.length > 0;
        },
        callback(prompt) {
          prompt.inputNode.placeholder = "Hello World!";
          const items = ZoteroPane.getSelectedItems();
          ztoolkit.getGlobal("alert")(
            `You select ${items.length} items!\n\n${items
              .map(
                (item, index) =>
                  String(index + 1) + ". " + item.getDisplayTitle()
              )
              .join("\n")}`
          );
        },
      },
    ]);
  }
}

export class HelperExampleFactory {
  @example
  static async dialogExample() {
    const dialogData: { [key: string | number]: any } = {
      inputValue: "test",
      checkboxValue: true,
      loadCallback: () => {
        ztoolkit.log(dialogData, "Dialog Opened!");
      },
      unloadCallback: () => {
        ztoolkit.log(dialogData, "Dialog closed!");
      },
    };
    const dialogHelper = new ztoolkit.Dialog(10, 2)
      .addCell(0, 0, {
        tag: "h1",
        properties: { innerHTML: "Helper Examples" },
      })
      .addCell(1, 0, {
        tag: "h2",
        properties: { innerHTML: "Dialog Data Binding" },
      })
      .addCell(2, 0, {
        tag: "p",
        properties: {
          innerHTML:
            "Elements with attribute 'data-bind' are binded to the prop under 'dialogData' with the same name.",
        },
        styles: {
          width: "200px",
        },
      })
      .addCell(3, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-checkbox",
        },
        properties: { innerHTML: "bind:checkbox" },
      })
      .addCell(
        3,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-checkbox",
          attributes: {
            "data-bind": "checkboxValue",
            "data-prop": "checked",
            type: "checkbox",
          },
          properties: { label: "Cell 1,0" },
        },
        false
      )
      .addCell(4, 0, {
        tag: "label",
        namespace: "html",
        attributes: {
          for: "dialog-input",
        },
        properties: { innerHTML: "bind:input" },
      })
      .addCell(
        4,
        1,
        {
          tag: "input",
          namespace: "html",
          id: "dialog-input",
          attributes: {
            "data-bind": "inputValue",
            "data-prop": "value",
            type: "text",
          },
        },
        false
      )
      .addCell(5, 0, {
        tag: "h2",
        properties: { innerHTML: "Toolkit Helper Examples" },
      })
      .addCell(
        6,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("clipboardExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:clipboard",
              },
            },
          ],
        },
        false
      )
      .addCell(
        7,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("filePickerExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:filepicker",
              },
            },
          ],
        },
        false
      )
      .addCell(
        8,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("progressWindowExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:progressWindow",
              },
            },
          ],
        },
        false
      )
      .addCell(
        9,
        0,
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
          },
          listeners: [
            {
              type: "click",
              listener: (e: Event) => {
                addon.hooks.onDialogEvents("vtableExample");
              },
            },
          ],
          children: [
            {
              tag: "div",
              styles: {
                padding: "2.5px 15px",
              },
              properties: {
                innerHTML: "example:virtualized-table",
              },
            },
          ],
        },
        false
      )
      .addButton("Confirm", "confirm")
      .addButton("Cancel", "cancel")
      .addButton("Help", "help", {
        noClose: true,
        callback: (e) => {
          dialogHelper.window?.alert(
            "Help Clicked! Dialog will not be closed."
          );
        },
      })
      .setDialogData(dialogData)
      .open("Dialog Example");
    await dialogData.unloadLock.promise;
    ztoolkit.getGlobal("alert")(
      `Close dialog with ${dialogData._lastButtonId}.\nCheckbox: ${dialogData.checkboxValue}\nInput: ${dialogData.inputValue}.`
    );
    ztoolkit.log(dialogData);
  }

  @example
  static clipboardExample() {
    new ztoolkit.Clipboard()
      .addText(
        "![Plugin Template](https://github.com/windingwind/zotero-plugin-template)",
        "text/unicode"
      )
      .addText(
        '<a href="https://github.com/windingwind/zotero-plugin-template">Plugin Template</a>',
        "text/html"
      )
      .copy();
    ztoolkit.getGlobal("alert")("Copied!");
  }

  @example
  static async filePickerExample() {
    const path = await new ztoolkit.FilePicker(
      "Import File",
      "open",
      [
        ["PNG File(*.png)", "*.png"],
        ["Any", "*.*"],
      ],
      "image.png"
    ).open();
    ztoolkit.getGlobal("alert")(`Selected ${path}`);
  }

  @example
  static progressWindowExample() {
    new ztoolkit.ProgressWindow(config.addonName)
      .createLine({
        text: "ProgressWindow Example!",
        type: "success",
        progress: 100,
      })
      .show();
  }

  @example
  static vtableExample() {
    ztoolkit.getGlobal("alert")("See src/modules/preferenceScript.ts");
  }
}
