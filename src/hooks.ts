import { BasicExampleFactory, UIExampleFactory } from "./modules/examples";
import {
  changeProgressWindowLine,
  showProgressWindow,
} from "./modules/progressWindow";
import { config } from "../package.json";
import { getString, initLocale } from "./modules/locale";
import { registerPrefsScripts } from "./modules/preferenceScript";

async function onStartup() {
  initLocale();

  const w = showProgressWindow(
    config.addonName,
    getString("startup.begin"),
    "default",
    -1
  );
  changeProgressWindowLine(w, { newProgress: 0 });

  BasicExampleFactory.registerPrefs();

  BasicExampleFactory.registerNotifier();

  await Zotero.Promise.delay(1000);
  changeProgressWindowLine(w, {
    newProgress: 30,
    newText: `[30%] ${getString("startup.begin")}`,
  });

  UIExampleFactory.registerStyleSheet();

  UIExampleFactory.registerRightClickMenuItem();

  UIExampleFactory.registerRightClickMenuPopup();

  UIExampleFactory.registerWindowMenuWithSeprator();

  await UIExampleFactory.registerExtraColumn();

  await UIExampleFactory.registerExtraColumnWithCustomCell();

  await UIExampleFactory.registerCustomCellRenderer();

  UIExampleFactory.registerLibraryTabPanel();

  await UIExampleFactory.registerReaderTabPanel();

  await Zotero.Promise.delay(1000);
  changeProgressWindowLine(w, {
    newProgress: 100,
    newText: `[100%] ${getString("startup.finish")}`,
  });
  w.startCloseTimer(5000);
}

function onShutdown(): void {
  BasicExampleFactory.unregisterPrefs();
  UIExampleFactory.unregisterUIExamples();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero.AddonTemplate;
}

/**
 * This function is just a dispatcher for UI events.
 * Any operations should be placed in a function to keep this funcion clear
 * @param type event type
 * @param data event data
 */
function onCustomEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "prefLoad":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

export default {
  onStartup,
  onShutdown,
  onCustomEvent,
};
