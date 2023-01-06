import { config } from "../../package.json";

const progressWindowIcon = {
  success: "chrome://zotero/skin/tick.png",
  fail: "chrome://zotero/skin/cross.png",
  default: `chrome://${config.addonRef}/content/icons/favicon.png`,
};

interface LineOptions {
  type?: keyof typeof progressWindowIcon;
  icon?: string;
  text?: string;
  progress?: number;
  idx?: number;
}

export class PopupWindow extends Zotero.ProgressWindow {
  private lines: _ZoteroItemProgress[];
  private closeTime: number | undefined;
  private originalShow: typeof Zotero.ProgressWindow.prototype.show;
  // @ts-ignore
  public show!: typeof this.showWithTimer;

  constructor(
    header: string,
    options: {
      window?: Window;
      closeOnClick?: boolean;
      closeTime?: number;
    } = {
      closeOnClick: true,
      closeTime: 5000,
    }
  ) {
    super(options);
    this.lines = [];
    this.closeTime = options.closeTime || 5000;
    this.changeHeadline(header);
    this.originalShow = this
      .show as unknown as typeof Zotero.ProgressWindow.prototype.show;
    this.show = this.showWithTimer;
  }

  createLine(options: LineOptions) {
    const icon = this.getIcon(options.type, options.icon);
    const line = new this.ItemProgress(icon || "", options.text || "");
    if (typeof options.progress === "number") {
      line.setProgress(options.progress);
    }
    this.lines.push(line);
    return this;
  }

  changeLine(options: LineOptions) {
    if (this.lines?.length === 0) {
      return this;
    }
    const idx =
      typeof options.idx !== "undefined" &&
      options.idx >= 0 &&
      options.idx < this.lines.length
        ? options.idx
        : 0;
    const icon = this.getIcon(options.type, options.icon);
    options.text && this.lines[idx].setText(options.text);
    icon && this.lines[idx].setIcon(icon);
    typeof options.progress === "number" &&
      this.lines[idx].setProgress(options.progress);
    return this;
  }

  protected showWithTimer(closeTime: number | undefined = undefined) {
    this.originalShow();
    typeof closeTime !== "undefined" && (this.closeTime = closeTime);
    if (this.closeTime && this.closeTime > 0) {
      this.startCloseTimer(this.closeTime);
    }
    return this;
  }

  protected getIcon(
    type: keyof typeof progressWindowIcon | undefined,
    defaulIcon?: string | undefined
  ) {
    return type ? progressWindowIcon[type] : defaulIcon;
  }
}
