import { config } from "../../package.json";

export function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/chrome/content/preferences.xul onpaneload
  addon.data.prefs = {
    window: _window,
  };
  updatePrefsUI();
  bindPrefEvents();
}

function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable`
    )
    ?.addEventListener("command", (e) => {
      ztoolkit.Tool.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`
      );
    });

  addon.data
    .prefs!!.window.document.querySelector(
      `#zotero-prefpane-${config.addonRef}-input`
    )
    ?.addEventListener("change", (e) => {
      ztoolkit.Tool.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as HTMLInputElement).value}!`
      );
    });
}
