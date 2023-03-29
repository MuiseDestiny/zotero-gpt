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
    const model = Zotero.Prefs.get(`${config.addonRef}.model`)
    const outputSpan = this.outputContainer!.querySelector("span")!
    let responseText = "";
    const xhr = await Zotero.HTTP.request(
      "POST",
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            "role": "user", "content": requestText
          }],
          stream: true,
          temperature: 1.0
        }),
        responseType: "text",
        requestObserver: (xmlhttp: XMLHttpRequest) => {
          let preLength = 0;
          xmlhttp.onprogress = (e: any) => {
            // Only concatenate the new strings
            let newResponse = e.target.response.slice(preLength);
            let dataArray = newResponse.split("data: ");

            for (let data of dataArray) {
              try {
                let obj = JSON.parse(data);
                let choice = obj.choices[0];
                if (choice.finish_reason) {
                  break;
                }
                responseText += choice.delta.content || "";
              } catch {
                continue;
              }
            }

            // Clear timeouts caused by stream transfers
            if (e.target.timeout) {
              e.target.timeout = 0;
            }
            // Remove \n\n from the beginning of the data
            responseText = responseText.replace(/^\n\n/, "");
            preLength = e.target.response.length;
            this.outputContainer!.style.display = ""
            if (responseText) {
              outputSpan.innerText = responseText;
            }
          };
        },
      }
    );
    if (xhr?.status !== 200) {
      throw `Request error: ${xhr?.status}`;
    }
    return responseText
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
        // const windowWidth = window.innerWidth - node.offsetWidth
        // const windowHeight = window.innerHeight - node.offsetHeight

        // if (currentX >= 0 && currentX <= windowWidth) {
        node.style.left = currentX + "px"
        // }

        // if (currentY >= 0 && currentY <= windowHeight) {
        node.style.top = currentY + "px"
        // }
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
            width: "95%",
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
            width: "93%",
            maxHeight: "20em",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            resize: "vertical",
            marginTop: "0.75em",
            fontFamily: "Consolas",
            fontSize: ".8em"

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
      if (text.trim().length == 0) {
        outputContainer.style.display = "none"
      }
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
        height: "1.7em"
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
                width: "6px",
                height: "6px",
                margin: "0 .25em",
                backgroundColor: "#ff7675",
                borderRadius: "6px",
              }
            })
          }
          return arr
        })() as any,
      listeners: [
        {
          type: "click",
          listener: () => {
            tagContainer.style.height = tagContainer.style.height == "auto" ? "1.7em" : "auto"

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
                this.outputContainer!.style!.display = "none"
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
    text = await this.getGPTResponseText(text)
    // outputSpan.innerText = text;
    // this.outputContainer!.style.display = ""
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
    await this.getGPTResponseText(text)

    // outputSpan.innerText = text;
    // this.outputContainer!.style.display = ""
    // popupWin.changeLine({ type: "success" })
    // popupWin.startCloseTimer(1000)
    this.threeDotsContainer?.classList.remove("loading")


  }

  /**
   * 从Zotero.Prefs获取所有已保存标签
   */
  private getTags() {
    let defaultTags = [{ "tag": "添加摘要标签", "color": "#7149C6", "position": 1, "text": "#添加摘要标签[c=#7149C6][pos=1]\n现在请你从下面的摘要中分析出三个标签：\n```js\ni = ZoteroPane.getSelectedItems()[0];\ni.getField(\"abstractNote\");\n```\n然后给我一段代码用于向Zotero选中条目添加你分析出的标签，示例代码如下：\n\ni = ZoteroPane.getSelectedItems()[0];\ntags = [\"tag1\", \"tag2\"];\ntags.forEach(tag=>i.addTag(tag));\nawait i.saveTx();" }, { "tag": "翻译PDF选中", "color": "#d35230", "position": 0, "text": "#翻译PDF选中[pos=0]\n请把下面这段文字翻译成中文：\n```js\nconst ztoolkit = Zotero.ZoteroGPT.data.ztoolkit\nlet getSelection = () => {\n    return ztoolkit.Reader.getSelectedText(\n Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)\n    );\n}\nconsole.log(getSelection())\ngetSelection()\n\n```\n" }, { "tag": "这篇文献讲了啥", "color": "#c4945c", "position": 0, "text": "#这篇文献讲了啥[c=\"#c4945c\"]\n下面是这篇文献的摘要：\n```js\nZoteroPane.getSelectedItems()[0].getField(\"abstractNote\")\n```\n\n请问它讲了啥呢" }, { "tag": "摘要转综述", "color": "#d35230", "position": 1, "text": "#摘要转综述[pos=1]\n\n下面是一篇论文的摘要：\n```js\nconst ztoolkit = Zotero.ZoteroGPT.data.ztoolkit\nlet getSelection = () => {\n    return ztoolkit.Reader.getSelectedText(\n Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)\n    );\n}\nconsole.log(getSelection())\ngetSelection()\n\n```\n\n---\n\n现在我想引用它写一篇文献综述，请你帮我写几句话总结这篇论文的工作，作者没有告诉你，你可以用XX代替。我要中文的。要求50字左右。\n" }, { "tag": "摘要提问", "color": "#d35230", "position": 0, "text": "#摘要提问[pos=0]\n\n下面是一篇论文的摘要：\n```js\nconst ztoolkit = Zotero.ZoteroGPT.data.ztoolkit\nlet getSelection = () => {\n    return ztoolkit.Reader.getSelectedText(\n Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)\n    );\n}\nconsole.log(getSelection())\ngetSelection()\n\n```\n\n---\n\n请问它的主要工作是什么，在什么地区，时间范围是什么，使用的数据是什么，创新点在哪？\n\n请你用下列示例格式回答我：\n主要工作：反演NDVI；\n地区：四川盆地；\n时间：2017~2021；\n数据：Sentinel-2卫星数据；\n创新：考虑了BRDF效应。\n" }, { "tag": "内容概括", "color": "#d35230", "position": 0, "text": "#内容概括[pos=0]\n\n下面是一篇论文的节选：\n```js\nconst ztoolkit = Zotero.ZoteroGPT.data.ztoolkit\nlet getSelection = () => {\n    return ztoolkit.Reader.getSelectedText(\n Zotero.Reader.getByTabID(Zotero_Tabs.selectedID)\n    );\n}\nconsole.log(getSelection())\ngetSelection()\n\n```\n\n---\n\n帮我概括它的主要内容500字以内越少越好。\n" }, { "tag": "期刊评价", "color": "#d35230", "position": 0, "text": "#期刊评价\n请问下面这个期刊什么水平：\n```js\nZoteroPane.getSelectedItems()[0].getField(\"publicationTitle\")\n```\n请给出它的影响因子和你对它的评价。" }, { "tag": "根据题目介绍下文献", "color": "#59c0bc", "position": 3, "text": "#根据题目介绍下文献[c=#59c0bc][pos=3]\n下面是这篇文献的标题：\n\n```js\nZoteroPane.getSelectedItems()[0].getField(\"title\")\n```\n\n这篇论文讲述了：" }]
    let tags = JSON.parse(Zotero.Prefs.get(`${config.addonRef}.tags`) as string)
    return tags.length > 0 ? tags : defaultTags
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
        // if (event.shiftKey && event.key.toLowerCase() == "?") {
        if (
          (event.shiftKey && event.key.toLowerCase() == "?") ||
          (event.key == "/" && Zotero.isMac)) {
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