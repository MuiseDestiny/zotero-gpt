import { Addon, addonName } from "./addon";
import AddonModule from "./module";

class AddonEvents extends AddonModule {
  private notifierCallback: any;
  constructor(parent: Addon) {
    super(parent);
    this.notifierCallback = {
      notify: async (
        event: string,
        type: string,
        ids: Array<string>,
        extraData: object
      ) => {
        // You can add your code to the corresponding notify type
        if (
          event == "select" &&
          type == "tab" &&
          extraData[ids[0]].type == "reader"
        ) {
          // Select a reader tab
        }
        if (event == "add" && type == "item") {
          // Add an item
        }
      },
    };
  }

  public async onInit(_Zotero) {
    // This function is the setup code of the addon
    console.log(`${addonName}: init called`);
    _Zotero.debug(`${addonName}: init called`);
    // alert(112233);

    // Reset prefs
    this.resetState();

    // Register the callback in Zotero as an item observer
    let notifierID = _Zotero.Notifier.registerObserver(this.notifierCallback, [
      "tab",
      "item",
      "file",
    ]);

    // Unregister callback when the window closes (important to avoid a memory leak)
    _Zotero.getMainWindow().addEventListener(
      "unload",
      function (e) {
        _Zotero.Notifier.unregisterObserver(notifierID);
      },
      false
    );

    this._Addon.views.initViews(_Zotero);
  }

  private resetState(): void {
    /* 
      For prefs that could be simply set to a static default value,
      Please use addon/defaults/preferences/defaults.js
      Reset other preferrences here.
      Uncomment to use the example code.
    */
    // let testPref = Zotero.Prefs.get("addonTemplate.testPref");
    // if (typeof testPref === "undefined") {
    //   Zotero.Prefs.set("addonTemplate.testPref", true);
    // }
  }

  public onUnInit(_Zotero): void {
    console.log(`${addonName}: uninit called`);
    _Zotero.debug(`${addonName}: uninit called`);
    //  Remove elements and do clean up
    this._Addon.views.unInitViews(_Zotero);
    // Remove addon object
    _Zotero.AddonTemplate = undefined;
  }
}

export default AddonEvents;
