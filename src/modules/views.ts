import { config } from "../../package.json";


export default class Views {
  private id = "zotero-GPT-container";
  private container?: HTMLDivElement;
  private inputContainer?: HTMLDivElement;
  private outputContainer?: HTMLDivElement;
  private threeDotsContainer?: HTMLDivElement;

  private tagContainer?: HTMLDivElement;

  constructor() {
    this.registerKey()
    this.addStyle()
  }

  private addStyle() {
    const styles = ztoolkit.UI.createElement(document, "style", {
      id: `${config.addonRef}-style`,
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
        `
      },
    });
    document.documentElement.appendChild(styles);
  }
  private async getGPTResponseText(requestText: string) {
    const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`)
    const xhr = await Zotero.HTTP.request(
      "POST",
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ "role": "user", "content": requestText }],
        }),
        responseType: "json",
      }
    );
    if (xhr?.status !== 200) {
      throw `Request error: ${xhr?.status}`;
    }
    return xhr.response.choices[0].message.content.replace(/^\n*/, "")
  }

  /**
   * 下面的代码是chatGPT写的
   * @param node 
   */
  private addDragEvent(node: HTMLDivElement) {
    let posX: number, posY: number
    let currentX: number, currentY: number
    let isDragging: boolean = false

    function handleMouseDown(event: MouseEvent) {
      // 如果是input或textarea元素，跳过拖拽逻辑
      if (event.target instanceof window.HTMLInputElement || event.target instanceof window.HTMLTextAreaElement) {
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

        // Ensure node doesn't move out of bounds
        const windowWidth = window.innerWidth - node.offsetWidth
        const windowHeight = window.innerHeight - node.offsetHeight

        if (currentX >= 0 && currentX <= windowWidth) {
          node.style.left = currentX + "px"
        }

        if (currentY >= 0 && currentY <= windowHeight) {
          node.style.top = currentY + "px"
        }
      }
    }

    // Add event listeners
    node.addEventListener("mousedown", handleMouseDown)
    node.addEventListener("mouseup", handleMouseUp)
    node.addEventListener("mousemove", handleMouseMove)
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
        width: "32%",
        // height: "4em",
        fontSize: "18px",
        borderRadius: "10px",
        backgroundColor: "#fff",
        boxShadow: `0px 1.8px 7.3px rgba(0, 0, 0, 0.071),
                    0px 6.3px 24.7px rgba(0, 0, 0, 0.112),
                    0px 30px 90px rgba(0, 0, 0, 0.2)`,
        fontFamily: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Microsoft YaHei Light", sans-serif`,
      }
    })
    this.addDragEvent(container)
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
            width: "93%",
            height: "2em",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            fontSize: "18px"
          }
        },
        {
          tag: "textarea",
          styles: {
            display: "none",
            width: "93%",
            maxHeight: "10em",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            fontSize: "18px",
            resize: "vertical",
            marginTop: "0.75em",
            fontFamily: "Consolas"
          }
        }
      ]

    }, container) as HTMLDivElement
    const inputNode = inputContainer.querySelector("input")!
    
    const textareaNode = inputContainer.querySelector("textarea")!
    const that = this;
    let inputListener = function (event: KeyboardEvent) {
      // @ts-ignore
      if(this.style.display == "none") { return }
      // @ts-ignore
      let text = this.value
      
      if (event.ctrlKey && ["s", "r"].indexOf(event.key) >= 0 && textareaNode.style.display != "none") {
        const tagString = text.match(/^#(.+)\n/)
        let tag = {
          tag: Zotero.randomString(),
          color: "#d35230",
          position: 0,
          text
        }
        if (tagString) {
          tag.tag = tagString[0].match(/^#([^\[\n]+)/)[1]
          let color = tagString[0].match(/\[c[olor]?="?(#.+?)"?\]/)
          tag.color = color?.[1] || tag.color
          let position = tagString[0].match(/\[pos[ition]?="?(\d+?)"?\]/)
          tag.position = Number(position?.[1] || tag.position)
        }
        let tags = that.getTags()
        // 如果tags存在，可能是更新，先从tags里将其移除
        console.log(tag, tags)
        tags = tags.filter((_tag: Tag) => {
          console.log(_tag.tag, tag.tag)
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
          that.execTag(tag)
          return
        }
      }
      if (event.key == "Enter") {
        console.log(text, text.startsWith("#"), inputNode.style.display != "none")
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
        } else {
          that.execText(text)
        }
      } else if (event.key == "Escape") {
        outputContainer.style.display = "none"
        // 退出长文编辑模式
        if (textareaNode.style.display != "none") {
          textareaNode.style.display = "none"
          inputNode.value = textareaNode.value.split("\n")[0]
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

      outputContainer.style.display = "none"
    }
    inputNode.addEventListener("keyup", inputListener)
    textareaNode.addEventListener("keyup", inputListener)
    // 输出
    const outputContainer = this.outputContainer = ztoolkit.UI.appendElement({
      tag: "div",
      styles: {
        width: "calc(100% - 1em)",
        backgroundColor: "rgba(89, 192, 188, .08)",
        color: "#374151",
        // maxHeight: "10em",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "0 .5em",
        display: "none",
        // resize: "vertical"
      },
      children: [
        {
          tag: "span",
          styles: {
            fontSize: "0.8em",
            lineHeight: "2em",
          },
          properties: {
            innerText: ""
          }
        }
      ],
      listeners: [
        {
          type: "dblclick",
          listener: () => {
            new ztoolkit.Clipboard()
              .addText(outputContainer.innerText, "text/unicode")
              .copy()
            new ztoolkit.ProgressWindow("Copy Text")
              .createLine({ text: outputContainer.innerText, type: "success" })
              .show()
          }
        }
      ]
    }, container) as HTMLDivElement
    // 命令标签
    const tagContainer = this.tagContainer = ztoolkit.UI.appendElement({
      tag: "div",
      styles: {
        width: "calc(100% - .5em)",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        margin: ".25em 0",
        flexWrap: "wrap",
        overflow: "hidden",
        height: "1.75em"
      }
    }, container) as HTMLDivElement
    // 折叠标签按钮
    const threeDotsContainer = this.threeDotsContainer = ztoolkit.UI.appendElement({
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
                width: "5px",
                height: "5px",
                margin: "0 .25em",
                backgroundColor: "black",
                borderRadius: "5px",
              }
            })
          }
          return arr
        })() as any,
      listeners: [
        {
          type: "click",
          listener: () => {
            tagContainer.style.height = tagContainer.style.height == "auto" ? "1.75em" : "auto"

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
    this.tagContainer?.querySelectorAll("div").forEach(e=>e.remove())
    let tags = this.getTags() as Tag[]
    tags = tags.sort((a: Tag, b: Tag) => a.position - b.position)
    tags.forEach(tag => {
      this.addTag(tag)
    })
  }

  /**
   * 添加一个标签
   */
  private addTag(tag: Tag) {
    let [red, green, blue] = Views.getRGB(tag.color)
    let timer: undefined | number;
    ztoolkit.UI.appendElement({
      tag: "div",
      styles: {
        fontSize: "0.8em",
        height: "1.5em",
        color: `rgba(${red}, ${green}, ${blue}, 1)`,
        backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.15)`,
        borderRadius: "1em",
        border: "1px solid #fff",
        margin: ".25em",
        padding: "0 .8em",
        cursor: "pointer"
      },
      properties: {
        innerText: tag.tag
      },
      listeners: [
        {
          type: "mousedown",
          listener: (event: any) => {
            console.log(event)
            timer = window.setTimeout(() => {
              timer = undefined
              if (event.buttons == 1) {                
                // 进入编辑模式
                const textareaNode = this.inputContainer?.querySelector("textarea")!
                const inputNode = this.inputContainer?.querySelector("input")!
                inputNode.style.display = "none";
                textareaNode.style.display = ""
                textareaNode.value = tag.text
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
              await this.execTag(tag)
            }
          }
        }
      ]
    }, this.tagContainer!) as HTMLDivElement
  }

  private async execTag(tag: Tag) {
    // const popupWin = new ztoolkit.ProgressWindow("Run Tag", {closeTime: -1})
    //   .createLine({ text: tag.tag, type: "default" })
    //   .show()
    this.threeDotsContainer?.classList.add("loading")
    this.outputContainer!.style.display = "none"
    const outputSpan = this.outputContainer!.querySelector("span")!
    outputSpan.innerText = ""
    let text = tag.text.replace(/^#.+\n/, "")
    text = text.replace(/```js\n([\s\S]+?)\n```/, (_, codeString) => window.eval(`
      ${codeString}
    `))
    console.log(text)
    // 运行替换其中js代码
    text = await this.getGPTResponseText(text) as string
    outputSpan.innerText = text;
    this.outputContainer!.style.display = ""
    // popupWin.changeLine({ type: "success" })
    // popupWin.startCloseTimer(1000)
    this.threeDotsContainer?.classList.remove("loading")
    window.eval(`
      setTimeout(async () => {
        ${text}
      })
    `)
  }

  private async execText(text: string) {
    this.outputContainer!.style.display = "none"
    const outputSpan = this.outputContainer!.querySelector("span")!
    outputSpan.innerText = ""
    if (text.trim().length == 0) { return }
    // const popupWin = new ztoolkit.ProgressWindow("Run Tag", {closeTime: -1})
    //   .createLine({ text: text, type: "default" })
    //   .show()
    this.threeDotsContainer?.classList.add("loading")
    text = await this.getGPTResponseText(text) as string
    outputSpan.innerText = text;
    this.outputContainer!.style.display = ""
    // popupWin.changeLine({ type: "success" })
    // popupWin.startCloseTimer(1000)
    this.threeDotsContainer?.classList.remove("loading")


  }
  /**
   * 从Zotero.Prefs获取所有已保存标签
   */
  private getTags() {
    return JSON.parse(Zotero.Prefs.get(`${config.addonRef}.tags`) as string)
  }

  private setTags(tags: any[]) {
    Zotero.Prefs.set(`${config.addonRef}.tags`, JSON.stringify(tags))
  }
  /**
   * 让container出现在鼠标为左上角的地方
   */
  private show(x: number, y: number) {
    this.container?.remove()
    this.container = this.buildContainer()
    this.container.style.left = `${x}px`
    this.container.style.top = `${y}px`
    this.container.style.display = "flex"
  }

  private registerKey() {
    document.addEventListener(
      "keydown",
      async (event: any) => {
        if (event.shiftKey && event.key.toLowerCase() == "?") {
          if (
            event.originalTarget.isContentEditable ||
            "value" in event.originalTarget
          ) {
            return;
          }
          if (Zotero_Tabs.selectedIndex == 0) {
            const div = document.querySelector("#item-tree-main-default .row.selected")!
            const rect = div?.getBoundingClientRect()
            this.show(rect.x, rect.y+rect.height)
          } else {
            const reader = await ztoolkit.Reader.getReader()
            const div = reader!._iframeWindow?.document.querySelector("#selection-menu")!
            if (div) {
              const rect = div?.getBoundingClientRect()
              this.show(rect.x, rect.y + rect.height)
            } else {
              const rect = document.documentElement.getBoundingClientRect()
              this.show(rect.width / 2, rect.height / 2)
            }
          }
        }
      },
      true
    );
  }

  static getRGB(color: string) {
    var sColor = color.toLowerCase();
    //十六进制颜色值的正则表达式
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    // 如果是16进制颜色
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        var sColorNew = "#";
        for (var i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      //处理六位的颜色值
      var sColorChange = [];
      for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
      }
      return sColorChange;
    }
    return sColor;
  }
}


interface Tag { tag: string; color: string; position: number, text: string }