import { Addon } from "./addon";

Zotero.AddonTemplate = new Addon();

window.addEventListener(
  "load",
  async function (e) {
    Zotero.AddonTemplate.events.onInit();
  },
  false
);
