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

  const progWin = showProgressWindow(
    config.addonName,
    getString("startup.begin"),
    "default",
    -1
  );
  changeProgressWindowLine(progWin, { newProgress: 0 });

  BasicExampleFactory.registerPrefs();

  BasicExampleFactory.registerNotifier();

  await Zotero.Promise.delay(1000);
  changeProgressWindowLine(progWin, {
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
  changeProgressWindowLine(progWin, {
    newProgress: 100,
    newText: `[100%] ${getString("startup.finish")}`,
  });
  progWin.startCloseTimer(5000);
}

function onShutdown(): void {
  BasicExampleFactory.unregisterPrefs();
  UIExampleFactory.unregisterUIExamples();
  // Remove addon object
  addon.data.alive = false;
  delete Zotero.AddonTemplate;
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string>,
  extraData: { [key: string]: any }
) {
  // You can add your code to the corresponding notify type
  ztoolkit.Tool.log("notify", event, type, ids, extraData);
  if (
    event == "select" &&
    type == "tab" &&
    extraData[ids[0]].type == "reader"
  ) {
    BasicExampleFactory.exampleNotifierCallback();
  } else {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    default:
      return;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintian.

export default {
  onStartup,
  onShutdown,
  onNotify,
  onPrefsEvent,
};
