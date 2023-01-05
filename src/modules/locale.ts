import { config } from "../../package.json";

export function initLocale() {
  addon.data.locale = {
    stringBundle: Components.classes["@mozilla.org/intl/stringbundle;1"]
      .getService(Components.interfaces.nsIStringBundleService)
      .createBundle(`chrome://${config.addonRef}/locale/addon.properties`),
  };
}

export function getString(localString: string): string {
  return addon.data.locale?.stringBundle.GetStringFromName(localString);
}
