import { config } from "../package.json";

class AddonLocale {
  private stringBundle: any;

  public initLocale() {
    this.stringBundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
      .getService(Components.interfaces.nsIStringBundleService)
      .createBundle(`chrome://${config.addonRef}/locale/addon.properties`);
  }

  public getString(localString: string): string {
    return this.stringBundle.GetStringFromName(localString);
  }
}

export default AddonLocale;
