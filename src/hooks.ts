import { BasicExampleFactory, UIExampleFactory } from "./examples";
import { changeProgressWindowLine, showProgressWindow } from "./tools/progress";
import { config } from "../package.json";

class AddonHooks {
  public async onStartup() {
    addon.locale.initLocale();

    const w = showProgressWindow(
      config.addonName,
      addon.locale.getString("startup.begin"),
      "default",
      -1
    );
    changeProgressWindowLine(w, { newProgress: 0 });

    BasicExampleFactory.registerPrefs();

    BasicExampleFactory.registerNotifier();

    await Zotero.Promise.delay(1000);
    changeProgressWindowLine(w, {
      newProgress: 30,
      newText: `[30%] ${addon.locale.getString("startup.begin")}`,
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
      newText: `[100%] ${addon.locale.getString("startup.finish")}`,
    });
    w.startCloseTimer(5000);
  }

  public onShutdown(): void {
    BasicExampleFactory.unregisterPrefs();
    UIExampleFactory.unregisterUIExamples();
    // Remove addon object
    addon.alive = false;
    delete Zotero.AddonTemplate;
  }
}

export default AddonHooks;
