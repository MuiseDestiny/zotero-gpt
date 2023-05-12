import { config } from "../../package.json";
import Meet from "./Meet/api"
import Utils from "./utils";
import { Document } from "langchain/document";
import { help, fontFamily, defaultTags, parseTag } from "./base"
const markdown = require("markdown-it")({
  breaks: true, // 将行结束符\n转换为 <br> 标签
  xhtmlOut: true, // 使用 /> 关闭标签，而不是 >
  typographer: true,
  html: true,
});
const mathjax3 = require('markdown-it-mathjax3');
markdown.use(mathjax3);

export default class Views {
  private id = "zotero-GPT-container";
  /**
   * OpenAI接口历史消息记录，需要暴露给GPT响应函数
   */
  public messages: { role: "user" | "assistant"; content: string }[] = [];
  /**
   * 用于储存历史执行的输入，配合方向上下键来快速回退
   */
  private _history: { input: string; output: string }[] = []
  /**
   * 用于储存上一个执行的标签，配合 Ctrl + Enter 快速再次执行
   */
  private _tag: Tag | undefined;
  /**
   * 记录当前GPT输出流setInterval的id，防止终止后仍有输出，需要暴露给GPT响应函数
   */
  public _ids: {type: "follow"| "output", id: number}[] = []
  /**
   * 是否在笔记环境下
   */
  public isInNote: boolean = true
  public container!: HTMLDivElement;
  private inputContainer!: HTMLDivElement;
  private outputContainer!: HTMLDivElement;
  private dotsContainer!: HTMLDivElement;
  private tagsContainer!: HTMLDivElement;
  private utils: Utils;
  constructor() {
    this.utils = new Utils()
    this.registerKey()
    this.addStyle()
    // @ts-ignore
    window.Meet = Meet
    Meet.Global.views = this
  }

  private addStyle() {
    ztoolkit.UI.appendElement({
      tag: "style",
      id: `${config.addonRef}-style`,
      namespace: "html",
      properties: {
        innerHTML: `
          @keyframes loading {
            0%, 100%
            {
              opacity: 0.25;
            }
            50%
            {
              opacity: 0.8;
            }
          }
          #${this.id} .three-dots:hover {
            opacity: 0.8 !important;
          }
          #${this.id} .three-dots.loading .dot:nth-child(1) {
            animation-delay: 0s;
          }
          #${this.id} .three-dots.loading .dot:nth-child(2) {
            animation-delay: 0.5s;
          }
          #${this.id} .three-dots.loading .dot:nth-child(3) {
            animation-delay: 1s;
          }
          #${this.id} .three-dots.loading .dot {
            animation: loading 1.5s ease-in-out infinite;
          }
          #${this.id} ::-moz-selection {
            background: rgba(89, 192, 188, .8); 
            color: #fff;
          }
          #output-container * {
            font-family: ${fontFamily} !important;
          }
          #output-container div p, #output-container div span {
            marigin: 0;
            padding: 0;
            text-align: justify;
          }
          .gpt-menu-box .menu-item:hover, .gpt-menu-box .menu-item.selected{
            background-color: rgba(89, 192, 188, .23) !important;
          }
          #${this.id} .tag {
            position: relative;
            overflow: hidden;
          }
          #${this.id} .ripple {
            left: 0;
            top: 50%;
            position: absolute;
            background: #fff;
            transform: translate(-50%, -50%);
            pointer-events: none;
            border-radius: 50%;
            animation: ripple 1.5s linear;
          }
          @keyframes ripple {
            from {
              width: 0px;
              height: 0px;
              opacity: 0.5;
            }
            to {
              width: 500px;
              height: 500px;
              opacity: 0;
            }
          }
        `
      },
      // #output-container div.streaming span:after,  
    }, document.documentElement);

    ztoolkit.UI.appendElement({
      tag: "link",
      id: `${config.addonRef}-link`,
      properties: {
        type: "text/css",
        rel: "stylesheet",
        href: `chrome://${config.addonRef}/content/md.css`
      }
    }, document.documentElement)
  }

  /**
   * 设置GPT回答区域文字
   * @param text 
   * @param isDone 
   */
  public setText(text: string, isDone: boolean = false, scrollToNewLine: boolean = true, isRecord: boolean = true,) {
    this.outputContainer.style.display = ""
    const outputDiv = this.outputContainer.querySelector(".markdown-body")! as HTMLDivElement
    outputDiv.setAttribute("pureText", text);
    outputDiv.classList.add("streaming");
    let ready = () => {
      if (outputDiv.innerHTML.trim() == "") {
        outputDiv.innerHTML = `<p></p>`
      }
    }
    ready()
    /**
     * 根据差异渲染，只为保全光标闪烁
     */
    let md2html = () => {
      let result = markdown.render(text)
        // .replace(/<mjx-assistive-mml[^>]*>.*?<\/mjx-assistive-mml>/g, "")
      /**
       * 监测差异，替换节点或文字
       * @param oldNode 
       * @param newNode 
       * @returns 
       */
      let diffRender = (oldNode: any, newNode: any) => {
        if (newNode.nodeName == "svg") {
          oldNode.parentNode.replaceChild(newNode, oldNode)
          return
        }
        if (oldNode.nodeName == "#text" && newNode.nodeName == "#text") { 
          oldNode.data = newNode.data
          return
        } else {
          if (
            oldNode.outerHTML == newNode.outerHTML &&
            oldNode.innerHTML == newNode.innerHTML
          ) {
            return
          }
        }
        // 老的比新的多要去除
        [...oldNode.childNodes].slice(newNode.childNodes.length).forEach((e: any)=>e.remove())
        for (let i = 0; i < newNode.childNodes.length; i++) {
          if (i < oldNode.childNodes.length) {
            if (oldNode.childNodes[i].tagName != newNode.childNodes[i].tagName) {
              if (oldNode.childNodes[i].tagName == "#text") {
                oldNode.childNodes[i].remove()
                oldNode.appendChild(newNode.childNodes[i])
              } else {
                oldNode.replaceChild(newNode.childNodes[i], oldNode.childNodes[i])
              }
              continue
            } else {
              diffRender(oldNode.childNodes[i], newNode.childNodes[i])
            }
          } else {
            oldNode.appendChild(newNode.childNodes[i])
          }
        }
      }
      // 纯文本本身不需要MD渲染，防止样式不一致出现变形
      let _outputDiv = outputDiv.cloneNode(true) as HTMLDivElement
      try {
        _outputDiv.innerHTML = result
        if (outputDiv.childNodes.length == 0) {
          outputDiv.innerHTML = result
        } else {
          diffRender(outputDiv, _outputDiv)
        }
      } catch {
        outputDiv.innerText = result
      }
    }
    md2html()
    ready()
    // @ts-ignore
    scrollToNewLine && this.outputContainer.scrollBy(0, this.outputContainer.scrollTopMax)
    if (isDone) {
      // 任何实时预览的错误到最后，应该因为下面这句消失
      outputDiv.innerHTML = markdown.render(text)
      if (isRecord) {
        this._history.push({ input: Meet.Global.input, output: text })
      }
      outputDiv.classList.remove("streaming")
      if (this.isInNote) {
        this.hide()
        // 下面是完成回答后写入 Better Notes 主笔记的两种方案
        Meet.BetterNotes.insertEditorText(outputDiv.innerHTML)
        // window.setTimeout(async () => {
        //   Meet.BetterNotes.insertEditorText(await Zotero.BetterNotes.api.convert.md2html(text))
        // })
      }
    }
  }

  /**
   * GPT写的
   * @param node 
   */
  private addDragEvent(node: HTMLDivElement) {
    let posX: number, posY: number
    let currentX: number, currentY: number
    let isDragging: boolean = false

    function handleMouseDown(event: MouseEvent) {
      // 如果是input或textarea元素，跳过拖拽逻辑
      if (
        event.target instanceof window.HTMLInputElement ||
        event.target instanceof window.HTMLTextAreaElement ||
        (event.target as HTMLDivElement).classList.contains("tag")
      ) {
        return
      }
      posX = node.offsetLeft - event.clientX
      posY = node.offsetTop - event.clientY
      isDragging = true
    }

    function handleMouseUp(event: MouseEvent) {
      isDragging = false
    }

    function handleMouseMove(event: MouseEvent) {
      if (isDragging) {
        currentX = event.clientX + posX
        currentY = event.clientY + posY
        node.style.left = currentX + "px"
        node.style.top = currentY + "px"
      }
    }

    // Add event listeners
    node.addEventListener("mousedown", handleMouseDown)
    node.addEventListener("mouseup", handleMouseUp)
    node.addEventListener("mousemove", handleMouseMove)
  }


  /**
   * GPT写的
   * @param inputNode 
   */
  private bindUpDownKeys(inputNode: HTMLInputElement) {
    // let currentIdx = this._history.length;
    inputNode.addEventListener("keydown", (e) => {
      this._history = this._history.filter(i=>i.input)
      let currentIdx = this._history.map(i=>i.input).indexOf(this.inputContainer!.querySelector("input")!.value)
      currentIdx = currentIdx == -1 ? this._history.length : currentIdx
      if (e.key === "ArrowUp") {
        currentIdx--;
        if (currentIdx < 0) {
          currentIdx = 0;
        }
        inputNode.value = this._history[currentIdx].input || "";
        this.setText(this._history[currentIdx].output, true, false, false)
      } else if (e.key === "ArrowDown") {
        currentIdx++;
        if (currentIdx >= this._history.length) {
          currentIdx = this._history.length;
          inputNode.value = "";
          this.outputContainer.style.display = "none"
        } else {
          inputNode.value = this._history[currentIdx].input || "";
          this.setText(this._history[currentIdx].output, true, false, false)
        }
      }
      if (["ArrowDown", "ArrowUp"].indexOf(e.key) >= 0) {
        e.stopPropagation();
        e.preventDefault();
        inputNode.setSelectionRange(inputNode.value.length, inputNode.value.length);
      }
    });
  }

  /**
   * 绑定ctrl+滚轮放大缩小
   * @param div 
   */
  private bindCtrlScrollZoom(div: HTMLDivElement) {
      // 为指定的div绑定wheel事件
    div.addEventListener('DOMMouseScroll', (event: any) => {
      // 检查是否按下了ctrl键
      if (event.ctrlKey || event.metaKey) {
        let _scale = div.style.transform.match(/scale\((.+)\)/)
        let scale = _scale ? parseFloat(_scale[1]) : 1
        let minScale = 0.5, maxScale = 2, step = 0.05
        if (div.style.bottom == "0px") {
          div.style.transformOrigin = "center bottom"
        } else {
          div.style.transformOrigin = "center center"
        }
        if (event.detail > 0) {
          // 缩小
          scale = scale - step
          div.style.transform = `scale(${scale < minScale ? minScale : scale})`;
        } else {
          // 放大
          scale = scale + step
          div.style.transform = `scale(${scale > maxScale ? maxScale : scale})`;
        }
      }
    })
  }

  /**
   * 绑定ctrl+滚轮放大缩小控件内的所有元素
   * @param div
   */
  private bindCtrlScrollZoomOutput(div: HTMLDivElement) {
    const styleAttributes = {
      fontSize: 'font-size',
      lineHeight: 'line-height',
      marginBottom: 'margin-bottom',
      marginTop: 'margin-top',
      paddingBottom: 'padding-bottom',
      paddingTop: 'padding-top',
    } as const;
    type StyleAttributeKeys = keyof typeof styleAttributes;
    type StyleAttributes = {
      [K in StyleAttributeKeys]: string;
    };
    // 获取子元素的初始样式
    const getChildStyles = (child: Element): StyleAttributes => {
      const style = window.getComputedStyle(child);
      const result: Partial<StyleAttributes> = {};
      for (const key in styleAttributes) {
        const typedKey = key as StyleAttributeKeys;
        result[typedKey] = style.getPropertyValue(styleAttributes[typedKey]);
      }
      return result as StyleAttributes;
    };
  
    // 更新并应用子元素的样式
    const applyNewStyles = (child: HTMLElement, style: StyleAttributes, scale: number) => {
      const newStyle = (value: string) => parseFloat(value) * scale + 'px';
  
      for (const key in styleAttributes) {
        child.style && (child.style[key as StyleAttributeKeys] = newStyle(style[key as StyleAttributeKeys]))
      }
    };
    // 为指定的div绑定wheel事件
    div.addEventListener('DOMMouseScroll', (event: any) => {
      const children = div.children[0].children;
      if (event.ctrlKey || event.metaKey) {
        const step = 0.05;
        event.preventDefault();
        // 阻止事件冒泡
        event.stopPropagation();
        const scale = event.detail > 0 ? 1 - step : 1 + step;
        Array.from(children).forEach((child) => {
          const childElement = child as HTMLElement;
          const currentStyle = getChildStyles(child);
          applyNewStyles(childElement, currentStyle, scale);
        });
      }
    });
  }

  private buildContainer() {
    // 顶层容器
    const container = ztoolkit.UI.createElement(document, "div", {
      id: this.id,
      styles: {
        display: "none",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        position: "fixed",
        width: Zotero.Prefs.get(`${config.addonRef}.width`) as string,
        // height: "4em",
        fontSize: "18px",
        borderRadius: "10px",
        backgroundColor: "#fff",
        boxShadow: `0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2)`,
        fontFamily: fontFamily,
      }
    })
    this.addDragEvent(container)
    this.bindCtrlScrollZoom(container)
    // 输入
    const inputContainer = this.inputContainer = ztoolkit.UI.appendElement({
      tag: "div",
      id: "input-container",
      styles: {
        borderBottom: "1px solid #f6f6f6",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      },
      children: [
        {
          tag: "input",
          styles: {
            width: "calc(100% - 1.5em)",
            height: "2.5em",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            fontFamily: "Consolas",
            fontSize: ".8em",
          }
        },
        {
          tag: "textarea",
          styles: {
            display: "none",
            width: "calc(100% - 1.5em)",
            maxHeight: "20em",
            minHeight: "2em",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            resize: "vertical",
            marginTop: "0.55em",
            fontFamily: "Consolas",
            fontSize: ".8em"

          }
        }
      ]

    }, container) as HTMLDivElement
    const inputNode = inputContainer.querySelector("input")!
    this.bindUpDownKeys(inputNode)
    const textareaNode = inputContainer.querySelector("textarea")!
    const that = this;
    let lastInputText = ""
    let inputListener = function (event: KeyboardEvent) {
      // @ts-ignore
      if(this.style.display == "none") { return }
      // @ts-ignore
      let text = Meet.Global.input = this.value
      if ((event.ctrlKey || event.metaKey) && ["s", "r"].indexOf(event.key) >= 0 && textareaNode.style.display != "none") {
        // 必定保存，但未必运行
        const tag = parseTag(text)
        if (tag) {
          // @ts-ignore
          this.value = tag.text
          let tags = that.getTags()
          // 如果tags存在，可能是更新，先从tags里将其移除
          tags = tags.filter((_tag: Tag) => {
            return _tag.tag != tag.tag
          })
          tags.push(tag)
          that.setTags(tags)
          that.renderTags();
          if (event.key == "s") {
            new ztoolkit.ProgressWindow("Save Tag")
              .createLine({ text: tag.tag, type: "success" })
              .show()
            return
          }
          // 运行代码，并保存标签
          if (event.key == "r") {
            return that.execTag(tag)
          }
        }
        // 普通文本
        else {
          // 运行文本呢
          if (event.key == "r") {
            // 长文本当作未保存的命令标签执行，长文本里可以写js
            return that.execTag({tag: "Untitled", position: -1, color: "", trigger: "", text})
          }
        }
      }
      if (event.key == "Enter") { 
        ztoolkit.log(event)
        
        outputContainer.querySelector(".auxiliary")?.remove()

        // 同时按Ctrl，会点击第一个标签
        if (event.ctrlKey || event.metaKey) {
          // 查找第一个点击
          ztoolkit.log("Ctrl + Enter")
          let tag = that._tag || that.getTags()[0]
          return that.execTag(tag)
        }
        // 按住Shift，进入长文本编辑模式，此时应该通过Ctrl+R来运行
        if (event.shiftKey) {
          if (inputNode.style.display != "none") {
            inputNode.style.display = "none"
            textareaNode.style.display = ""
            textareaNode.focus()
            textareaNode.value = text + "\n"
          }
          return
        }
        // 优先级最高，防止中文输入法回车转化成英文
        if (text.length != lastInputText.length) {
          lastInputText = text
          return
        }
        if (text.startsWith("#")) {
          if (inputNode.style.display != "none") {
            inputNode.style.display = "none"
            textareaNode.style.display = ""
            textareaNode.focus()
            // 判断本地是否存在这个标签
            const tags = that.getTags();
            const tag = tags.find((tag: any) => tag.text.startsWith(text.split("\n")[0]))
            if (tag) {
              textareaNode.value = tag.text
            } else {
              textareaNode.value = text + "\n"
            }
          }
        } else if (text.startsWith("/")) {
          that._history.push(text)
          // 尝试结束其它stream的生命
          // that._id = undefined
          that.stopAlloutput()
          text = text.slice(1)
          let [key, value] = text.split(" ")
          if (key == "clear") {
            that.messages = []
            // @ts-ignore
            this.value = ""
            that.setText("success", true, false)
          } else if (key == "help"){ 
            that.setText(help, true, false)
          } else if (key == "report") { 
            const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`) as string
            // window.setTimeout(() => {
            //   Zotero.launchURL("https://platform.openai.com/account/usage")
            // }, 1000)
            return that.setText(`\`api\` ${Zotero.Prefs.get(`${config.addonRef}.api`)}\n\`secretKey\` ${secretKey.slice(0, 3) + "..." + secretKey.slice(-4)}\n\`model\` ${Zotero.Prefs.get(`${config.addonRef}.model`)}\n\`temperature\` ${Zotero.Prefs.get(`${config.addonRef}.temperature`)}`, true, false)
          } else if (["secretKey", "model", "api", "temperature", "deltaTime", "width", "tagsMore", "chatNumber", "relatedNumber"].indexOf(key) >= 0) {  
            if (value?.length > 0) {
              if (value == "default") {
                Zotero.Prefs.clear(`${config.addonRef}.${key}`)
                value = Zotero.Prefs.get(`${config.addonRef}.${key}`)
                that.setText(`${key} = ${value}`, true, false)
                return 
              }
              switch (key) {
                case "deltaTime":
                case "relatedNumber":
                case "chatNumber":
                  Zotero.Prefs.set(`${config.addonRef}.${key}`, Number(value))
                  break;
                case "width":
                  ztoolkit.log("width", value.match(/^[\d\.]+%$/))
                  if (value.match(/^[\d\.]+%$/)) {
                    that.container.style.width = value
                    Zotero.Prefs.set(`${config.addonRef}.${key}`, value)
                    break;
                  } else {
                    ztoolkit.log("width Error")
                    return that.setText(`Invalid value, ${value}, please enter a percentage, for example \`32 %\`.`, true, false)
                  }
                case "tagsMore":
                  if (["scroll", "expand"].indexOf(value) >= 0) {
                    Zotero.Prefs.set(`${config.addonRef}.${key}`, value)
                    break;
                  } else {
                    ztoolkit.log("tagsMore Error")
                    return that.setText(`Invalid value, ${value}, please enter \`expand\` or \`scroll\`.`, true, false)
                  }
                default: 
                  Zotero.Prefs.set(`${config.addonRef}.${key}`, value)
                  break
              }
            } else {
              value = Zotero.Prefs.get(`${config.addonRef}.${key}`)
            }
            that.setText(`${key} = ${value}`, true, false)
            // @ts-ignore
            this.value = ""
          } else {
            that.setText(help, true, false)
            const mdbody = that.outputContainer.querySelector(".markdown-body") as HTMLDivElement
            mdbody.innerHTML = `<center><span style="color: #D14D72;font-weight:bold;font-size:20px;">Invalid Command, Please Read this.</span></center>` + mdbody.innerHTML
          }
        } else {
          that.execText(text)
          that._history.push(text)
        }
      } else if (event.key == "Escape") {
        outputContainer.style.display = "none"
        // 退出长文编辑模式
        if (textareaNode.style.display != "none") {
          textareaNode.style.display = "none"
          inputNode.value = ""
          inputNode.style.display = ""
          inputNode.focus()
          return
        }
        if (inputNode.value.length) {
          inputNode.value = ""
          return
        }
        // 退出container
        that.hide()
        that.container!.remove()
        that.isInNote && Meet.BetterNotes.reFocus()
      } else if (event.key == "/" && text == "/" && that.container.querySelector("input")?.style.display != "none") {
        const rect = that.container.querySelector("input")!.getBoundingClientRect()
        const commands = ["clear", "help", "report", "secretKey", "model", "api", "temperature", "chatNumber", "relatedNumber" , "deltaTime", "tagsMore", "width"]
        that.createMenuNode(
          { x: rect.left, y: rect.top + rect.height, width: 200, height: 350 / 12 * commands.length  },
          commands.map(name => {
            return {
              name,
              listener: () => {
                // @ts-ignore
                this.value = `/${name}`
              }
            }
          }), [2, 6, 8]
        )
      }
      lastInputText = text
    }
    inputNode.addEventListener("keyup", inputListener)
    textareaNode.addEventListener("keyup", inputListener)
    // 输出
    const outputContainer = this.outputContainer = ztoolkit.UI.appendElement({
      tag: "div",
      id: "output-container",
      styles: {
        width: "calc(100% - 1em)",
        backgroundColor: "rgba(89, 192, 188, .08)",
        color: "#374151",
        maxHeight: document.documentElement.getBoundingClientRect().height * .5 + "px",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "0.25em 0.5em",
        display: "none",
        // resize: "vertical"
      },
      children: [
        {
          tag: "div", // Change this to 'div'
          classList: ["markdown-body"],
          styles: {
            fontSize: "0.8em",
            lineHeight: "2em",
            // margin: ".5em 0"
          },
          properties: {
            // 用于复制
            pureText: ""
          }
        }
      ],
      listeners: [
        {
          /**
           * 双击是插件的输出，可能是插入笔记
           */
          type: "dblclick",
          listener: () => {
            // 无论后面发生什么错误，都确保先复制下来
            // 目前可能用户的Better Notes版本低，不支持API
            const text = outputContainer.querySelector("[pureText]")!.getAttribute("pureText") || ""
            new ztoolkit.Clipboard()
              .addText(text, "text/unicode")
              .copy()
            const div = outputContainer.cloneNode(true) as HTMLDivElement
            div.querySelector(".auxiliary")?.remove()
            const htmlString = div.innerHTML
            if (Zotero_Tabs.selectedIndex == 1 && Zotero.BetterNotes) {
              Meet.BetterNotes.insertEditorText(htmlString)
              this.hide()
              new ztoolkit.ProgressWindow(config.addonName)
                .createLine({ text: "Insert To Main Note", type: "success" })
                .show()
              return
            }
            if (Zotero_Tabs.selectedIndex > 0) {
              const parentID = Zotero.Items.get(
                Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)!.itemID as number
              ).parentID
              
              const editor = Zotero.Notes._editorInstances.find(
                (e) =>
                  e._item.parentID === parentID && !Components.utils.isDeadWrapper(e._iframeWindow)
              );
              ztoolkit.log(editor)
              // 笔记被打开，且打开笔记视图，才触发向当前条目笔记插入
              if (editor && document.querySelector("#zotero-tb-toggle-notes-pane.toggled")) {
                Meet.BetterNotes.insertEditorText(htmlString, editor)
                new ztoolkit.ProgressWindow(config.addonName)
                  .createLine({ text: "Insert To Note", type: "success" })
                  .show()
                return
              }
            }
            new ztoolkit.ProgressWindow(config.addonName)
              .createLine({ text: "Copy Plain Text", type: "success" })
              .show()
          }
        }
      ]
    }, container) as HTMLDivElement
    this.bindCtrlScrollZoomOutput(outputContainer)
    // 命令标签
    const tagsMore = Zotero.Prefs.get(`${config.addonRef}.tagsMore`) as string
    const tagsContainer = this.tagsContainer = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["tags-container"],
      styles: {
        width: "calc(100% - .5em)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        margin: ".25em 0",
        flexWrap: tagsMore == "expand" ? "wrap" : "nowrap",
        overflow: "hidden",
        height: "1.7em"
      },
      listeners: [
        {
          type: "DOMMouseScroll",
          listener: (event: any) => {
            if (tagsMore == "expand") { return }
            const scrollSpeed = 80
            // @ts-ignore
            if (event.detail > 0) {
              tagsContainer.scrollLeft += scrollSpeed
            } else {
              tagsContainer.scrollLeft -= scrollSpeed
            }
            event.preventDefault()
            event.stopPropagation()
          }
        }
      ]
    }, container) as HTMLDivElement
    this.dotsContainer = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["three-dots"],
      styles: {
        // width: "100%",
        display: "flex",
        height: "1em",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "0.25em",
        cursor: "pointer",
        opacity: ".5",
        transition: "opacity .25s linear"
      },
      children: (() => {
          let arr = []
          for (let i = 0; i < 3; i++) {
            arr.push({
              tag: "div",
              classList: ["dot"],
              styles: {
                width: "6px",
                height: "6px",
                margin: "0 .25em",
                backgroundColor: "#ff7675",
                borderRadius: "6px",
              },
            })
          }
          return arr
        })() as any,
      listeners: [
        {
          type: "click",
          listener: () => {
            if (tagsMore == "scroll") { return }
            tagsContainer.style.height = tagsContainer.style.height == "auto" ? "1.7em" : "auto"
          }
        }
      ]
    }, container) as HTMLDivElement
    document.documentElement.append(container)
    this.renderTags()
    // 聚焦
    window.setTimeout(() => {
      container.focus()
      inputContainer.focus()
      inputNode.focus()
    })
    return container
  }

  /**
   * 渲染标签，要根据position排序
   */
  private renderTags() {
    this.tagsContainer!?.querySelectorAll("div").forEach(e=>e.remove())
    let tags = this.getTags() as Tag[]
    tags.forEach((tag: Tag, index: number) => {
      this.addTag(tag, index)
    })
  }

  /**
   * 添加一个标签
   */
  private addTag(tag: Tag, index: number) {
    let [red, green, blue] = this.utils.getRGB(tag.color)
    let timer: undefined | number;
    ztoolkit.UI.appendElement({
      tag: "div",
      id: `tag-${index}`,
      classList: ["tag"],
      styles: {
        display: "inline-block",
        flexShrink: "0",
        fontSize: "0.8em",
        height: "1.5em",
        color: `rgba(${red}, ${green}, ${blue}, 1)`,
        backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.15)`,
        borderRadius: "1em",
        border: "1px solid #fff",
        margin: ".25em",
        padding: "0 .8em",
        cursor: "pointer",
        whiteSpace: "nowrap"
      },
      properties: {
        innerHTML: tag.tag
      },
      listeners: [
        {
          type: "mousedown",
          listener: (event: any) => {
            timer = window.setTimeout(() => {
              timer = undefined
              if (event.buttons == 1) {                
                // 进入编辑模式
                const textareaNode = this.inputContainer?.querySelector("textarea")!
                const inputNode = this.inputContainer?.querySelector("input")!
                inputNode.style.display = "none";
                textareaNode.style.display = ""
                textareaNode.value = tag.text
                this.outputContainer.style!.display = "none"
              } else if (event.buttons == 2) {
                let tags = this.getTags()
                tags = tags.filter((_tag: Tag) => _tag.tag != tag.tag)
                this.setTags(tags)
                this.renderTags();
              }
            }, 1000)
          }
        },
        {
          type: "mouseup",
          listener: async () => {
            if (timer) {
              window.clearTimeout(timer)
              timer = undefined
              this.outputContainer.querySelector(".auxiliary")?.remove()
              await this.execTag(tag)
            }
          }
        }
      ]
    }, this.tagsContainer!) as HTMLDivElement
  }

  private rippleEffect(div: HTMLDivElement, color: string) {
    let [red, green, blue] = this.utils.getRGB(color)
    ztoolkit.UI.appendElement({
      tag: "div",
      styles: {
        backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.5)`
      },
      classList: ["ripple"]
    }, div)
  }
  /**
   * 执行标签
   */
  private async execTag(tag: Tag) {
    Meet.Global.input = this.inputContainer.querySelector("input")?.value as string
    this._tag = tag
    const popunWin = new ztoolkit.ProgressWindow(tag.tag, { closeTime: -1, closeOtherProgressWindows: true })
      .show()
    Meet.Global.popupWin = popunWin
    popunWin
      .createLine({ text: "Generating input content...", type: "default" })
    this.dotsContainer?.classList.add("loading")
    this.outputContainer.style.display = "none"
    ztoolkit.log(tag, this.getTags())
    const tagIndex = this.getTags().map(JSON.stringify).indexOf(JSON.stringify(tag)) as number
    this.rippleEffect(
      this.container.querySelector(`#tag-${tagIndex}`)!,
      tag.color
    )
    const outputDiv = this.outputContainer.querySelector("div")!
    outputDiv.innerHTML = ""
    outputDiv.setAttribute("pureText", "");
    let text = tag.text.replace(/^#.+\n/, "")
    // 旧版语法不宜传播，MD语法会被转义
    for (let rawString of text.match(/```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/g)! || []) {
      let codeString = rawString.match(/```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/)![1]
      try {
        text = text.replace(rawString, await window.eval(`${codeString}`))
      } catch { }
    }
    // 新版语法容易分享传播
    for (let rawString of text.match(/\$\{[\s\S]+?\}/g)! || []) {
      let codeString = rawString.match(/\$\{([\s\S]+?)\}/)![1]
      try {
        text = text.replace(rawString, await window.eval(`${codeString}`))
      } catch {  }
    }
    popunWin.createLine({ text: `Characters ${text.length}`, type: "success" })
    popunWin.createLine({ text: "Answering...", type: "default" })
    // 运行替换其中js代码
    text = await Meet.OpenAI.getGPTResponse(text) as string
    this.dotsContainer?.classList.remove("loading")
    if (text.trim().length) {
      try {
        window.eval(`
          setTimeout(async () => {
            ${text}
          })
        `)
        popunWin.createLine({ text: "Code is executed", type: "success" })
      } catch { }
      popunWin.createLine({ text: "Done", type: "success" })
    } else {
      popunWin.createLine({ text: "Done", type: "fail" })
    }
    popunWin.startCloseTimer(3000)
  }

  /**
   * 执行输入框文本
   * @param text 
   * @returns 
   */
  private async execText(text: string) {
    // 如果文本中存在某一标签预设的关键词|正则表达式，则转为执行该标签
    const tag = this.getTags()
      .filter((tag: Tag) => tag.trigger?.length > 0)
      .find((tag: Tag) => {
      const trigger = tag.trigger
      if (trigger.startsWith("/") && trigger.endsWith("/")) {
        return (window.eval(trigger) as RegExp).test(text)
      } else {
        return text.indexOf(trigger as string) >= 0
      }
    })
    if (tag) { return this.execTag(tag) }

    // 没有匹配执行文本
    this.outputContainer.style.display = "none"
    const outputDiv = this.outputContainer.querySelector("div")!
    outputDiv.innerHTML = ""
    outputDiv.setAttribute("pureText", "");
    if (text.trim().length == 0) { return }
    this.dotsContainer?.classList.add("loading")
    await Meet.OpenAI.getGPTResponse(text)
    this.dotsContainer?.classList.remove("loading")
  }

  /**
   * 从Zotero.Prefs获取所有已保存标签
   * 按照position顺序排序后返回
   */
  private getTags() {
    // 进行一个简单的处理，应该是中文/表情写入prefs.js导致的bug
    let tagsJson
    try {
      tagsJson = Zotero.Prefs.get(`${config.addonRef}.tags`) as string
    } catch {}
    if (!tagsJson) {
      tagsJson = "[]"
      Zotero.Prefs.set(`${config.addonRef}.tags`, tagsJson)
    }
    let tags = JSON.parse(tagsJson)
    for (let defaultTag of defaultTags) {
      if (!tags.find((tag: Tag) => tag.tag == defaultTag.tag)) {
        tags.push(defaultTag)
      }
    }
    return (tags.length > 0 ? tags : defaultTags).sort((a: Tag, b: Tag) => a.position - b.position)
  }

  private setTags(tags: any[]) {
    Zotero.Prefs.set(`${config.addonRef}.tags`, JSON.stringify(tags))
  }

  /**
   * 下面代码是GPT写的
   * @param x 
   * @param y 
   */
  public show(x: number = -1, y: number = -1, reBuild: boolean = true) {
    reBuild = reBuild || !this.container
    if (reBuild) {
      document.querySelectorAll(`#${this.id}`).forEach(e=>e.remove())
      this.container = this.buildContainer()
      this.container.style.display = "flex"
    }
    this.container.setAttribute("follow", "")
    if (x + y < 0) {
      const rect = document.documentElement.getBoundingClientRect()
      x = rect.width / 2 - this.container.offsetWidth / 2;
      y = rect.height / 2 - this.container.offsetHeight / 2;
    }

    // ensure container doesn't go off the right side of the screen
    if (x + this.container.offsetWidth > window.innerWidth) {
      x = window.innerWidth - this.container.offsetWidth
    }

    // ensure container doesn't go off the bottom of the screen
    if (y + this.container.offsetHeight > window.innerHeight) {
      y = window.innerHeight - this.container.offsetHeight
    }

    // ensure container doesn't go off the left side of the screen
    if (x < 0) {
      x = 0
    }

    // ensure container doesn't go off the top of the screen
    if (y < 0) {
      y = 0
    }
    // this.container.style.display = "flex"
    this.container.style.left = `${x}px`
    this.container.style.top = `${y}px`
    // reBuild && (this.container.style.display = "flex")
  }

  /**
   * 关闭界面清除所有setInterval
   */
  public hide() {
    this.container.style.display = "none"
    ztoolkit.log(this._ids)
    this._ids.map(id=>id.id).forEach(window.clearInterval)
  }

  public stopAlloutput() {
    this._ids.filter(id => id.type == "output").map(i => i.id).forEach(window.clearInterval)
  }

  /**
   * 在输出界面插入辅助按钮
   * 这是一个极具扩展性的函数
   * 帮助定位，比如定位条目，PDF段落，PDF注释
   */
  public insertAuxiliary(docs: Document[]) {
    this.outputContainer.querySelector(".auxiliary")?.remove()
    const auxDiv = ztoolkit.UI.appendElement({
      namespace: "html",
      classList: ["auxiliary"],
      tag: "div",
      styles: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }
    }, this.outputContainer)
    docs.forEach((doc: Document, index: number) => {
      ztoolkit.UI.appendElement({
        namespace: "html",
        tag: "a",
        styles: {
          margin: ".3em",
          fontSize: "0.8em",
          cursor: "pointer",
          borderRadius: "3px",
          backgroundColor: "rgba(89, 192, 188, .43)",
          width: "1.5em",
          height: "1.5em",
          textAlign: "center",
          color: "white",
          fontWeight: "bold"
        },
        properties: {
          innerText: index + 1
        },
        listeners: [
          {
            type: "click",
            listener: async () => {
              if (doc.metadata.type == "box") {
                const reader = await ztoolkit.Reader.getReader();
                (reader!._iframeWindow as any).wrappedJSObject.eval(`
                  PDFViewerApplication.pdfViewer.scrollPageIntoView({
                    pageNumber: ${doc.metadata.box.page + 1},
                    destArray: ${JSON.stringify([null, { name: "XYZ" }, doc.metadata.box.left, doc.metadata.box.top, 3.5])},
                    allowNegativeOffset: false,
                    ignoreDestinationZoom: false
                  })
                `)
              } else if (doc.metadata.type == "id") {
                await ZoteroPane.selectItem(doc.metadata.id as number)
              }
            }
          }
        ]
      }, auxDiv)
    })
  }

  /**
   * 创建选项
   */
  public createMenuNode(
    rect: { x: number, y: number, width: number, height: number },
    items: { name: string, listener: Function }[],
    separators: number[]
  ) {
    document.querySelector(".gpt-menu-box")?.remove()
    const removeNode = () => {
      document.removeEventListener("mousedown", removeNode)
      document.removeEventListener("keydown", keyDownHandler)
      window.setTimeout(() => {
        menuNode.remove()
      }, 0)
      this.inputContainer.querySelector("input")?.focus()
    }
    document.addEventListener("mousedown", removeNode)
    let menuNode = ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["gpt-menu-box"],
      styles: {
        position: "fixed",
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        display: "flex",
        height: `${rect.height}px`,
        justifyContent: "space-around",
        flexDirection: "column",
        padding: "6px",
        border: "1px solid #d4d4d4",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: `0px 1px 2px rgba(0, 0, 0, 0.028),
                                0px 3.4px 6.7px rgba(0, 0, 0, .042),
                                0px 15px 30px rgba(0, 0, 0, .07)`,
        overflow: "hidden",
        userSelect: "none",
      },
      children: (() => {
        let arr = [];
        for (let i = 0; i < items.length; i++) {
          arr.push({
            tag: "div",
            classList: ["menu-item"],
            styles: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px",
              cursor: "default",
              fontSize: "13px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            },
            listeners: [
              {
                type: "mousedown",
                listener: async (event: any) => {
                  await items[i].listener()
                }
              },
              {
                type: "mouseenter",
                listener: function () {
                  nodes.forEach(e => e.classList.remove("selected"))
                  // @ts-ignore
                  this.classList.add("selected")
                  currentIndex = i
                }
              },
            ],
            children: [
              {
                tag: "div",
                classList: ["menu-item-name"],
                styles: {
                  paddingLeft: "0.5em",
                },
                properties: {
                  innerText: items[i].name
                }
              }
            ]
          })
          if (separators.indexOf(i) != -1) {
            arr.push({
              tag: "div",
              styles: {
                height: "0",
                margin: "6px -6px",
                borderTop: ".5px solid #e0e0e0",
                borderBottom: ".5px solid #e0e0e0",
              }
            })
          }

        }
        return arr
      })() as any
    }, document.documentElement)
    
    const winRect = document.documentElement.getBoundingClientRect()
    const nodeRect = menuNode.getBoundingClientRect()
    // 避免溢出
    if (nodeRect.bottom > winRect.bottom) {
      menuNode.style.top = ""
      menuNode.style.bottom = "0px"
    }
    // menuNode.querySelector(".menu-item:first-child")?.classList.add("selected")
    const nodes = menuNode.querySelectorAll(".menu-item")
    nodes[0].classList.add("selected")
    let currentIndex = 0
    this.inputContainer.querySelector("input")?.blur()
    let keyDownHandler = (event: any) => {
      ztoolkit.log(event)
      if (event.code == "ArrowDown") {
        currentIndex += 1
        if (currentIndex >= nodes.length) {
          currentIndex = 0
        }
      } else if (event.code == "ArrowUp") {
        currentIndex -= 1
        if (currentIndex < 0) {
          currentIndex = nodes.length - 1
        }
      } else if (event.code == "Enter") {
        items[currentIndex].listener()
        
        removeNode()
      } else if (event.code == "Escape") {
        removeNode()
      }
      nodes.forEach(e => e.classList.remove("selected"))
      nodes[currentIndex].classList.add("selected")
    }
    document.addEventListener("keydown", keyDownHandler)
    return menuNode
  }

  /**
   * 绑定快捷键
   */
  private registerKey() {
    const callback = async () => {
      this.isInNote = false
      if (Zotero_Tabs.selectedIndex == 0) {
        const div = document.querySelector("#item-tree-main-default .row.selected")!
        if (div) {
          const rect = div.getBoundingClientRect()
          this.show(rect.x, rect.y + rect.height)
        } else {
          this.show()
        }
      } else {
        const reader = await ztoolkit.Reader.getReader()
        // const div = reader?._iframeWindow?.document.querySelector("#selection-menu")!
        const div = reader?._iframeWindow?.document.querySelector(".selection-popup")!
        if (div) {
          window.setTimeout(() => {
            this.messages = this.messages.concat(
              [
                {
                  role: "user",
                  content: `I am reading a PDF, and the following text is a part of the PDF. Please read it first, and I will ask you some question later: \n${Meet.Zotero.getPDFSelection()}`
                },
                {
                  role: "assistant",
                  content: "OK."
                }
              ]
            )
            const rect = div?.getBoundingClientRect()
            const windRect = document.documentElement.getBoundingClientRect()
            const ww = windRect.width *
              0.01 * Number((Zotero.Prefs.get(`${config.addonRef}.width`) as string).slice(0, -1))
            ww
            this.show(rect.left + rect.width * .5 - ww * .5, rect.bottom)
          }, 233)
        } else {
          this.show()
        }
      }
    }
    if (Zotero.isMac) {
      ztoolkit.Shortcut.register("event", {
        id: config.addonRef,
        modifiers: "meta",
        key: "/",
        callback: callback
      })
    } else {
      ztoolkit.Shortcut.register("event", {
        id: config.addonRef,
        modifiers: "control",
        key: "/",
        callback: callback
      })
    }
    
    document.addEventListener(
      "keydown",
      async (event: any) => {
        // 笔记内按空格
        if (
          Zotero_Tabs.selectedIndex == 1 &&
          event.explicitOriginalTarget.baseURI.indexOf("note-editor") >= 0 &&
          event.code == "Space" &&
          Zotero.BetterNotes.api.editor
        ) {
          this.isInNote = true
          const doc = event.explicitOriginalTarget.ownerDocument
          let selection = doc.getSelection()
          let range = selection.getRangeAt(0);
          const span = range.endContainer
          let text = await Meet.BetterNotes.getEditorText(span)
          ztoolkit.log(text)
          this.messages = [{
            role: "user",
            content: text
          }]
          if (/[\n ]+/.test(span.innerText)) {
            Meet.BetterNotes.follow(span)
            event.preventDefault();
          }
          return 
        }
        if (
          (event.shiftKey && event.key.toLowerCase() == "?") ||
          (event.key == "/" && Zotero.isMac)) {
          if (
            event.originalTarget.isContentEditable ||
            "value" in event.originalTarget
          ) {
            return;
          }
          
        }
      },
      true
    );
  }
}

