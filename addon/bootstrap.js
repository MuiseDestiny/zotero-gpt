/* Copyright 2012 Will Shanks.
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
/* global Components, Services */
/* global addon, APP_SHUTDOWN */
const { classes: Cc, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");

function install(data, reason) {}

function startup(data, reason) {
  // Load the addon to Zotero if window is ready
  const loadAddon = (window) => {
    console.log(window);
    if (window.document.readyState === "complete" && window.Zotero) {
      Services.scriptloader.loadSubScript(
        "chrome://__addonRef__/content/scripts/index.js"
      );
    } else {
      window.addEventListener("load", (e) => {
        if (window.Zotero) {
          Services.scriptloader.loadSubScript(
            "chrome://__addonRef__/content/scripts/index.js"
          );
        }
      });
    }
  };

  // Listen to windows
  var WindowListener = {
    onOpenWindow: function (xulWindow) {
      loadAddon(
        xulWindow
          .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
          .getInterface(Components.interfaces.nsIDOMWindow)
      );
    },
  };
  Services.wm.addListener(WindowListener);

  // Scan current windows
  const windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    loadAddon(
      windows.getNext().QueryInterface(Components.interfaces.nsIDOMWindow)
    );
  }
}

function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }
  var _Zotero = Components.classes["@zotero.org/Zotero;1"].getService(
    Components.interfaces.nsISupports
  ).wrappedJSObject;
  _Zotero.AddonTemplate.events.onUnInit(_Zotero);

  Cc["@mozilla.org/intl/stringbundle;1"]
    .getService(Components.interfaces.nsIStringBundleService)
    .flushBundles();

  Cu.unload("chrome://_addonRef__/scripts/index.js");
}

function uninstall(data, reason) {}
