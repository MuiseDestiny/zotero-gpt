import ZoteroToolkit from "zotero-plugin-toolkit";
import { getGlobal } from "zotero-plugin-toolkit/dist/utils";
import Addon from "./addon";
import { config } from "../package.json";

if (!getGlobal("Zotero").AddonTemplate) {
  // Set global variables
  _globalThis.Zotero = getGlobal("Zotero");
  _globalThis.ZoteroPane = getGlobal("ZoteroPane");
  _globalThis.Zotero_Tabs = getGlobal("Zotero_Tabs");
  _globalThis.window = getGlobal("window");
  _globalThis.document = getGlobal("document");
  _globalThis.ztoolkit = new ZoteroToolkit();
  _globalThis.addon = new Addon();
  // The env will be replaced after esbuild
  addon.env = __env__;
  ztoolkit.Tool.logOptionsGlobal.prefix = `[${config.addonName}]`;
  ztoolkit.Tool.logOptionsGlobal.disableConsole = addon.env === "production";
  Zotero.AddonTemplate = addon;
  // Trigger addon hook for initialization
  addon.hooks.onStartup();
}
