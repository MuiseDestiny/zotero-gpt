import { config } from "../../package.json";

const progressWindowIcon = {
  success: "chrome://zotero/skin/tick.png",
  fail: "chrome://zotero/skin/cross.png",
  default: `chrome://${config.addonRef}/content/icons/favicon.png`,
};

export function showProgressWindow(
  header: string,
  context: string,
  type: "success" | "fail" | "default" = "default",
  options: {
    closeTime?: number;
    backend?: "Zotero" | "system";
  } = {
    closeTime: 5000,
    backend: "Zotero",
  }
): _ZoteroProgressWindow | Notification {
  // Currently Zotero 7 doesn't support progress window.
  // Use system backend on Zotero 7.
  if (options.backend === "system" || ztoolkit.Compat.isZotero7()) {
    Zotero.Prefs.set("alerts.useSystemBackend", true, true);
    const notification = new (ztoolkit.Compat.getGlobal(
      "Notification"
    ) as typeof Notification)(header, {
      body: context,
      icon: progressWindowIcon[type],
      tag: config.addonName,
    });
    if (options.closeTime) {
      (ztoolkit.Compat.getGlobal("setTimeout") as typeof setTimeout)(() => {
        notification.close();
      }, options.closeTime);
    }
    return notification;
  } else {
    // A simple wrapper of the Zotero ProgressWindow
    const progressWindow = new Zotero.ProgressWindow({
      closeOnClick: true,
    }) as _ZoteroProgressWindow;
    progressWindow.changeHeadline(header);
    // @ts-ignore
    progressWindow.progress = new progressWindow.ItemProgress(
      progressWindowIcon[type],
      context
    );
    progressWindow.show();
    if (options.closeTime) {
      progressWindow.startCloseTimer(options.closeTime);
    }
    return progressWindow;
  }
}

export function changeProgressWindowLine(
  progressWindow: _ZoteroProgressWindow | Notification,
  options: {
    newText?: string;
    newIcon?: string;
    newProgress?: number;
  }
) {
  if (!isProgressWindow(progressWindow)) {
    return;
  }
  // @ts-ignore
  const progress = progressWindow.progress as _ZoteroItemProgress;
  if (!progress) {
    return;
  }
  options.newText && progress.setText(options.newText);
  options.newIcon && progress.setIcon(options.newIcon);
  options.newProgress && progress.setProgress(options.newProgress);
}

export function isProgressWindow(
  progressWindow: _ZoteroProgressWindow | Notification
) {
  return !(progressWindow as Notification).title;
}
