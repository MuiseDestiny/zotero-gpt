import { Addon, getZotero } from "./addon";

const Zotero = getZotero();

if (!Zotero.AddonTemplate) {
  Zotero.AddonTemplate = new Addon();
  Zotero.AddonTemplate.events.onInit();
}
