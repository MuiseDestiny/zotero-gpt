import { ZoteroCompat } from "zotero-plugin-toolkit";
import Addon from "./addon";
import { config } from "../package.json";

const compat = new ZoteroCompat();

if (!compat.getGlobal("Zotero").AddonTemplate) {
  // Set global variables
  _globalThis.Zotero = compat.getGlobal("Zotero");
  _globalThis.ZoteroPane = compat.getGlobal("ZoteroPane");
  _globalThis.Zotero_Tabs = compat.getGlobal("Zotero_Tabs");
  _globalThis.window = compat.getGlobal("window");
  _globalThis.document = compat.getGlobal("document");
  _globalThis.addon = new Addon();
  _globalThis.ztoolkit = addon.data.ztoolkit;
  ztoolkit.Tool.logOptionsGlobal.prefix = `[${config.addonName}]`;
  ztoolkit.Tool.logOptionsGlobal.disableConsole =
    addon.data.env === "production";
  Zotero.AddonTemplate = addon;
  // Trigger addon hook for initialization
  addon.hooks.onStartup();
}
