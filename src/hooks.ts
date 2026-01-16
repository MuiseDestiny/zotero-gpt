import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import Views from "./modules/views";
import Utils from "./modules/utils";

let prefPaneId: string | null = null;

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);
  initLocale();
  if (Zotero.PreferencePanes?.register) {
    try {
      prefPaneId = await Zotero.PreferencePanes.register({
        pluginID: config.addonID,
        id: `${config.addonRef}-preferences`,
        label: config.addonName,
        image: `chrome://${config.addonRef}/content/icons/favicon.png`,
        src: "chrome/content/preferences.xhtml",
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      Zotero.logError(err);
    }
  }
  ztoolkit.ProgressWindow.setIconURI(
    "default",
    `chrome://${config.addonRef}/content/icons/favicon.png`
  );

  Zotero[config.addonInstance].views = new Views();

  Zotero[config.addonInstance].utils = new Utils();
}

function onShutdown(): void {
  ztoolkit.unregisterAll();
  if (prefPaneId && Zotero.PreferencePanes?.unregister) {
    try {
      Zotero.PreferencePanes.unregister(prefPaneId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      Zotero.logError(err);
    }
  }
  // Remove addon object
  addon.data.alive = false;
  delete Zotero[config.addonInstance];
}

export default {
  onStartup,
  onShutdown,
};
