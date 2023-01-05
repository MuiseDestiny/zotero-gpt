import { config } from "../package.json";

class AddonPrefs {
  private _window!: Window;

  public initPreferences(_window: Window) {
    // This function is called when the prefs window is opened
    // See addon/chrome/content/preferences.xul onpaneload
    this._window = _window;
    this.updatePrefsUI();
    this.bindPrefEvents();
  }

  private updatePrefsUI() {
    // You can initialize some UI elements on prefs window
    // with this._window.document
    // Or bind some events to the elements
  }

  private bindPrefEvents() {
    this._window.document
      .querySelector(`#zotero-prefpane-${config.addonRef}-enable`)
      ?.addEventListener("command", (e) => {
        ztoolkit.Tool.log(e);
        this._window.alert(
          `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`
        );
      });

    this._window.document
      .querySelector(`#zotero-prefpane-${config.addonRef}-input`)
      ?.addEventListener("change", (e) => {
        ztoolkit.Tool.log(e);
        this._window.alert(
          `Successfully changed to ${(e.target as HTMLInputElement).value}!`
        );
      });
  }
}

export default AddonPrefs;
