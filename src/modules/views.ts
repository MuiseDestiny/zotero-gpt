import { config } from "../../package.json";
import Meet from "./Meet/api"
import Utils from "./utils";
import { help, fontFamily, defaultTags } from "./base"
const markdown = require("markdown-it")({
  breaks: true, // 将行结束符\n转换为 <br> 标签
  xhtmlOut: true, // 使用 /> 关闭标签，而不是 >
  typographer: true,
  
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
  private _history: string[] = []
  /**
   * 用于储存上一个执行的标签，配合 Ctrl + Enter 快速再次执行
   */
  private _tag: Tag | undefined;
  /**
   * 记录当前GPT输出流setInterval的id，防止终止后仍有输出，需要暴露给GPT响应函数
   */
  public _id: number | undefined
  /**
   * 是否在笔记环境下
   */
  private isInNote: boolean = true
  private container!: HTMLDivElement;
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
  public setText(text: string, isDone: boolean = false, scrollToNewLine : boolean = true) {
    this.outputContainer.style.display = ""
    const outputDiv = this.outputContainer.querySelector(".markdown-body")!
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
      _outputDiv.innerHTML = result
      if (outputDiv.childNodes.length == 0) {
        outputDiv.innerHTML = result
      } else {
        diffRender(outputDiv, _outputDiv)
      }
    }
    md2html()
    ready()
    // @ts-ignore
    scrollToNewLine && this.outputContainer.scrollBy(0, this.outputContainer.scrollTopMax)
    if (isDone) {
      // 任何实时预览的错误到最后，应该因为下面这句消失
      outputDiv.innerHTML = markdown.render(text)
      outputDiv.classList.remove("streaming")
      if (this.isInNote) {
        this.container.style.display = "none"
        // Meet.BetterNotes.insertEditorText(outputDiv.innerHTML)
        window.setTimeout(async () => {
          Meet.BetterNotes.insertEditorText(await Zotero.BetterNotes.api.convert.md2html(text))
        })
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

      let currentIdx = this._history.indexOf(this.inputContainer!.querySelector("input")!.value)
      currentIdx = currentIdx == -1 ? this._history.length : currentIdx

      if (e.key === "ArrowUp") {
        currentIdx--;
        if (currentIdx < 0) {
          currentIdx = 0;
        }
        inputNode.value = this._history[currentIdx];

      } else if (e.key === "ArrowDown") {
        currentIdx++;
        if (currentIdx >= this._history.length) {
          currentIdx = this._history.length;
          inputNode.value = "";
        } else {
          inputNode.value = this._history[currentIdx];
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
      if (event.ctrlKey) {
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
      if (event.ctrlKey) {
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
      let text = this.value
      if (event.ctrlKey && ["s", "r"].indexOf(event.key) >= 0 && textareaNode.style.display != "none") {
        const tagString = text.match(/^#(.+)\n/)
        function randomColor() {
          var letters = '0123456789ABCDEF';
          var color = '#';
          for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }
        let tag = {
          tag: Zotero.randomString(),
          color: randomColor(),
          position: 9,
          text: text
        }
        // 标签文本
        if (tagString) {
          tag.tag = tagString[0].match(/^#([^\[\n]+)/)[1]
          let color = tagString[0].match(/\[c(?:olor)?="?(#.+?)"?\]/)
          tag.color = color?.[1] || tag.color
          let position = tagString[0].match(/\[pos(?:ition)?="?(\d+?)"?\]/)
          tag.position = Number(position?.[1] || tag.position)
          tag.text = `#${tag.tag}[position=${tag.position}][color=${tag.color}]` + "\n" + text.replace(/^#.+\n/, "")
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
            return that.execTag({tag: "Untitled", position: -1, color: "", text})
          }
        }
      }
      if (event.key == "Enter") { 
        ztoolkit.log(event)
        outputContainer.querySelector(".reference")?.remove()

        // 同时按Ctrl，会点击第一个标签
        if (event.ctrlKey) {
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
          that._id = undefined
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
            window.setTimeout(() => {
              Zotero.launchURL("https://platform.openai.com/account/usage")
            }, 1000)
            return that.setText(`\`api\` ${Zotero.Prefs.get(`${config.addonRef}.api`)}\n\`secretKey\` ${secretKey.slice(0, 3) + "..." + secretKey.slice(-4)}\n\`model\` ${Zotero.Prefs.get(`${config.addonRef}.model`)}\n\`temperature\` ${Zotero.Prefs.get(`${config.addonRef}.temperature`)}`, true, false)
          } else if (["secretKey", "model", "api", "temperature", "deltaTime", "width", "tagsMore"].indexOf(key) >= 0) {  
            if (value?.length > 0) {
              if (value == "default") {
                Zotero.Prefs.clear(`${config.addonRef}.${key}`)
                value = Zotero.Prefs.get(`${config.addonRef}.${key}`)
                that.setText(`${key} = ${value}`, true, false)
                return 
              }
              switch (key) {
                case "deltaTime":
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
        that.container!.remove()
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
          type: "dblclick",
          listener: () => {
            const text = outputContainer.querySelector("[pureText]")!.getAttribute("pureText") || ""
            new ztoolkit.Clipboard()
              .addText(text, "text/unicode")
              .copy()
            
            new ztoolkit.ProgressWindow("Copy Text")
              .createLine({ text, type: "success" })
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
    tags.forEach(tag => {
      this.addTag(tag)
    })
  }

  /**
   * 添加一个标签
   */
  private addTag(tag: Tag) {
    let [red, green, blue] = this.utils.getRGB(tag.color)
    let timer: undefined | number;
    ztoolkit.UI.appendElement({
      tag: "div",
      classList: ["tag"],
      styles: {
        display: "inline-block",
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
              this.outputContainer.querySelector(".reference")?.remove()
              await this.execTag(tag)
            }
          }
        }
      ]
    }, this.tagsContainer!) as HTMLDivElement
  }

  /**
   * 执行标签
   */
  private async execTag(tag: Tag) {
    this._tag = tag
    const popunWin = new ztoolkit.ProgressWindow(tag.tag, { closeTime: -1, closeOtherProgressWindows: true })
      .show()
    popunWin
      .createLine({ text: "Plugin is generating content...", type: "default" })
    this.dotsContainer?.classList.add("loading")
    this.outputContainer.style.display = "none"
    const outputDiv = this.outputContainer.querySelector("div")!
    outputDiv.innerHTML = ""
    outputDiv.setAttribute("pureText", "");
    let text = tag.text.replace(/^#.+\n/, "")
    for (let rawString of text.match(/```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/g)! || []) {
      let codeString = rawString.match(/```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/)![1]
      text = text.replace(rawString, await window.eval(`${codeString}`))
    }
    ztoolkit.log(text)
    popunWin.createLine({text: `Text total length is ${text.length}`, type: "success"})
    popunWin.createLine({ text: "GPT is answering...", type: "default" })
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
  private show(x: number = -1, y: number = -1, reBuild: boolean = true) {
    if (reBuild) {
      document.querySelectorAll(`#${this.id}`).forEach(e=>e.remove())
      this.container = this.buildContainer()
      this.container.style.display = "flex"
    }
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

    this.container.style.left = `${x}px`
    this.container.style.top = `${y}px`
  }

  /**
   * 绑定快捷键
   */
  private registerKey() {
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
            let { x, y } = span.getBoundingClientRect();
            const leftPanel = document.querySelector("#betternotes-workspace-outline-container")!
            x = leftPanel.getAttribute("collapsed") ?
              0
              :
              Number(leftPanel.getAttribute("width") as string)
            this.show(x + 30, y + 38)
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
          this.isInNote = false
          if (Zotero_Tabs.selectedIndex == 0) {
            const div = document.querySelector("#item-tree-main-default .row.selected")!
            if (div) {
              const rect = div.getBoundingClientRect()
              this.show(rect.x, rect.y+rect.height)
            } else {
              this.show()
            }
          } else {
            const reader = await ztoolkit.Reader.getReader()
            const div = reader!._iframeWindow?.document.querySelector("#selection-menu")!
            if (div) {
              const rect = div?.getBoundingClientRect()
              this.show(rect.x, rect.y)
            } else {
              this.show()
            }
          }
        }
      },
      true
    );
  }
}

interface Tag { tag: string; color: string; position: number, text: string }