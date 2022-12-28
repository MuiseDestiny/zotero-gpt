import Addon from "./addon";
import AddonModule from "./module";


class AddonLocale extends AddonModule {
    private stringBundle: any;
    constructor(parent: Addon) {
        super(parent);
        this.stringBundle = Components.classes['@mozilla.org/intl/stringbundle;1']
            .getService(Components.interfaces.nsIStringBundleService)
            .createBundle('chrome://addontemplate/locale/addontemplate.properties');
    }

    public getString(localString: string): string {
        return this.stringBundle.GetStringFromName(localString);
    }
}

export default AddonLocale;