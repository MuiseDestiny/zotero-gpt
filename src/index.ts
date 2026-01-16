import { BasicTool } from "zotero-plugin-toolkit/dist/basic";
import ToolkitGlobal from "zotero-plugin-toolkit/dist/managers/toolkitGlobal";
import Addon from "./addon";
import { config } from "../package.json";

const originalGetGlobal = BasicTool.prototype.getGlobal;
BasicTool.prototype.getGlobal = function (key: string) {
  const result = originalGetGlobal.call(this, key);
  if (
    key === "setTimeout" ||
    key === "clearTimeout" ||
    key === "setInterval" ||
    key === "clearInterval"
  ) {
    const win = originalGetGlobal.call(this, "window") as Window | undefined;
    const method = win ? (win as any)[key] : undefined;
    if (typeof method === "function") {
      return method.bind(win);
    }
  }
  return result;
};

const basicTool = new BasicTool();

if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
  // Set global variables
  let window: Window
  _globalThis.Zotero = basicTool.getGlobal("Zotero");
  _globalThis.ZoteroPane = basicTool.getGlobal("ZoteroPane");
  _globalThis.Zotero_Tabs = basicTool.getGlobal("Zotero_Tabs");
  _globalThis.window = window = basicTool.getGlobal("window");
  _globalThis.URL = basicTool.getGlobal("window").URL;
  _globalThis.setTimeout = window.setTimeout.bind(window);
  _globalThis.clearTimeout = window.clearTimeout.bind(window);
  _globalThis.setInterval = window.setInterval.bind(window);
  _globalThis.clearInterval = window.clearInterval.bind(window);
  _globalThis.URLSearchParams = basicTool.getGlobal("window").URLSearchParams;
  _globalThis.Headers = basicTool.getGlobal("window").Headers;
  _globalThis.AbortSignal = basicTool.getGlobal("window").AbortSignal;
  _globalThis.Request = basicTool.getGlobal("window").Request;
  _globalThis.AbortSignal.timeout = (ms: number) => {
    // @ts-ignore
    const controller = new window.AbortController();
    const timer = window.setTimeout(() => controller.abort(), ms);
    controller.signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
    });
    return controller.signal;
  }

  _globalThis.document = basicTool.getGlobal("document");
  try {
    const toolkitGlobal = ToolkitGlobal.getInstance() as any;
    toolkitGlobal.fieldHooks ||= {
      _ready: false,
      getFieldHooks: {},
      setFieldHooks: {},
      isFieldOfBaseHooks: {},
    };
    toolkitGlobal.itemTree ||= {
      _ready: false,
      columns: [],
      renderCellHooks: {},
    };
    toolkitGlobal.itemBox ||= {
      _ready: false,
      fieldOptions: {},
    };
    toolkitGlobal.shortcut ||= {
      _ready: false,
      eventKeys: [],
    };
    toolkitGlobal.prompt ||= {
      _ready: false,
      instance: undefined,
    };
    toolkitGlobal.readerInstance ||= {
      _ready: false,
      initializedHooks: {},
    };
  } catch (error) {
    try {
      const zotero = basicTool.getGlobal("Zotero");
      const err = error instanceof Error ? error : new Error(String(error));
      zotero.logError(err);
    } catch {}
  }
  _globalThis.addon = new Addon();
  _globalThis.ztoolkit = addon.data.ztoolkit;
  ztoolkit.basicOptions.log.prefix = `[${config.addonName}]`;
  ztoolkit.basicOptions.log.disableConsole = addon.data.env === "production";
  ztoolkit.UI.basicOptions.ui.enableElementJSONLog = false
  ztoolkit.UI.basicOptions.ui.enableElementDOMLog = false
  ztoolkit.basicOptions.debug.disableDebugBridgePassword =
    addon.data.env === "development";
  Zotero[config.addonInstance] = addon;
  // Trigger addon hook for initialization
  addon.hooks.onStartup();
}
