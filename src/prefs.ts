import Addon from "./addon";
import AddonModule from "./module";
import { config } from "../package.json";

class AddonPrefs extends AddonModule {
  private _window!: Window;
  constructor(parent: Addon) {
    super(parent);
  }
  public initPreferences(_window: Window) {
    // This function is called when the prefs window is opened
    // See addon/chrome/content/preferences.xul onpaneload
    this._window = _window;
    this._Addon.toolkit.Tool.log(`${config.addonName}: init preferences`);
    this.updatePrefsUI();
    this.bindPrefEvents();
  }

  private updatePrefsUI() {
    // You can initialize some UI elements on prefs window
    // with this._window.document
    // Or bind some events to the elements
    this._Addon.toolkit.Tool.log(`${config.addonName}: init preferences UI`);
  }

  private bindPrefEvents() {
    this._window.document
      .querySelector(`#zotero-prefpane-${config.addonRef}-enable`)
      ?.addEventListener("command", (e) => {
        this._Addon.toolkit.Tool.log(e);
        this._window.alert(
          `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`
        );
      });

    this._window.document
      .querySelector(`#zotero-prefpane-${config.addonRef}-input`)
      ?.addEventListener("change", (e) => {
        this._Addon.toolkit.Tool.log(e);
        this._window.alert(
          `Successfully changed to ${(e.target as HTMLInputElement).value}!`
        );
      });
  }
}

export default AddonPrefs;
