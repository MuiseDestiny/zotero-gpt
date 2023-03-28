import { config } from "../../package.json";

export function initLocale() {
  addon.data.locale = {
    stringBundle: Components.classes["@mozilla.org/intl/stringbundle;1"]
      .getService(Components.interfaces.nsIStringBundleService)
      .createBundle(`chrome://${config.addonRef}/locale/addon.properties`),
  };
}

export function getString(
  localString: string,
  noReload: boolean = false
): string {
  try {
    return addon.data.locale?.stringBundle.GetStringFromName(localString);
  } catch (e) {
    if (!noReload) {
      initLocale();
      return getString(localString, true);
    }
    return localString;
  }
}
