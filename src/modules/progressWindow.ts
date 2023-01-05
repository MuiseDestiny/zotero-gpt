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
  t: number = 5000
): _ZoteroProgressWindow {
  // A simple wrapper of the Zotero ProgressWindow
  let progressWindow = new Zotero.ProgressWindow({
    closeOnClick: true,
  }) as _ZoteroProgressWindow;
  progressWindow.changeHeadline(header);
  // @ts-ignore
  progressWindow.progress = new progressWindow.ItemProgress(
    progressWindowIcon[type],
    context
  );
  progressWindow.show();
  if (t > 0) {
    progressWindow.startCloseTimer(t);
  }
  return progressWindow;
}

export function changeProgressWindowLine(
  progressWindow: _ZoteroProgressWindow,
  options: {
    newText?: string;
    newIcon?: string;
    newProgress?: number;
  }
) {
  // @ts-ignore
  const progress = progressWindow.progress as _ZoteroItemProgress;
  if (!progress) {
    return;
  }
  options.newText && progress.setText(options.newText);
  options.newIcon && progress.setIcon(options.newIcon);
  options.newProgress && progress.setProgress(options.newProgress);
}
