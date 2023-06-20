import { config } from "../../../package.json";
import { MD5 } from "crypto-js"
import { Document } from "langchain/document";
import LocalStorage from "../localStorage";
import Views from "../views";
import Meet from "./api";
const similarity = require('compute-cosine-similarity');
declare type RequestArg = { headers: any, api: string, body: Function, remove?: string | RegExp, process?: Function }
let chatID: string
const requestArgs: RequestArg[] = [
  {
    api: "https://aigpt.one/api/chat-stream",
    headers: {
      "path": "v1/chat/completions"
    },
    body: (requestText: string, messages: any) => { 
      return {
        "model": "gpt-3.5-turbo",
        messages: messages,
        stream: true,
        "max_tokens": 2000,
        "presence_penalty": 0
      }
    } 
  },
  {
    api: "https://chatbot.theb.ai/api/chat-process",
    headers: {
    },
    body: (requestText: string, messages: any) => {
      return { "prompt": requestText, "options": { "parentMessageId": chatID }}
    },
    process: (text: string) => {
      const res = JSON.parse(text.split("\n").slice(-1)[0])
      chatID = res.id
      return res.text
    }
  }
]

/**
 * 给定文本和文档，返回文档列表，返回最相似的几个
 * @param queryText 
 * @param docs 
 * @param obj 
 * @returns 
 */
export async function similaritySearch(queryText: string, docs: Document[], obj: { key: string }) {
  const storage = Meet.Global.storage = Meet.Global.storage || new LocalStorage(config.addonRef)
  await storage.lock.promise;
  const embeddings = new OpenAIEmbeddings() as any
  // 查找本地，为节省空间，只储存向量
  // 因为随着插件更新，解析出的PDF可能会有优化，因此再此进行提取MD5值作为验证
  // 但可以预测，本地JSON文件可能会越来越大
  const id = MD5(docs.map((i: any) => i.pageContent).join("\n\n")).toString()
  await storage.lock
  const _vv = storage.get(obj, id)
  ztoolkit.log(_vv)
  let vv: any
  if (_vv) {
    Meet.Global.popupWin.createLine({ text: "Reading embeddings...", type: "default" })
    vv = _vv
  } else {
    Meet.Global.popupWin.createLine({ text: "Generating embeddings...", type: "default" })
    vv = await embeddings.embedDocuments(docs.map((i: any) => i.pageContent))
    window.setTimeout(async () => {
      await storage.set(obj, id, vv)
    })
  }

  const v0 = await embeddings.embedQuery(queryText)
  // 从20个里面找出文本最长的几个，防止出现较短但相似度高的段落影响回答准确度
  const relatedNumber = Zotero.Prefs.get(`${config.addonRef}.relatedNumber`) as number
  Meet.Global.popupWin.createLine({ text: `Searching ${relatedNumber} related content...`, type: "default" })
  const k = relatedNumber * 5
  const pp = vv.map((v: any) => similarity(v0, v));
  docs = [...pp].sort((a, b) => b - a).slice(0, k).map((p: number) => {
    return docs[pp.indexOf(p)]
  })
  // return docs.slice(0, relatedNumber)
  return docs.sort((a, b) => b.pageContent.length - a.pageContent.length).slice(0, relatedNumber)
}


class OpenAIEmbeddings {
  constructor() {
  }
  private async request(input: string[]) {
    const views = Zotero.ZoteroGPT.views as Views
    let api = Zotero.Prefs.get(`${config.addonRef}.api`) as string
    api = api.replace(/\/(?:v1)?\/?$/, "")
    const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`)
    const split_len = Zotero.Prefs.get(`${config.addonRef}.embeddingBatchNum`)
    let res
    const url = `${api}/v1/embeddings`
    if (!secretKey) {
      new ztoolkit.ProgressWindow(url, { closeOtherProgressWindows: true })
        .createLine({ text: "Your secretKey is not configured.", type: "default" })
        .show()
      return
    }
    var final_embeddings=[]
    for (let i = 0; i < input.length; i += split_len) {

      const chunk = input.slice(i, i + split_len)
      ztoolkit.log("input", chunk)
      try {
        res = await Zotero.HTTP.request(
          "POST",
          url,
          {
            responseType: "json",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${secretKey}`,
            },
            body: JSON.stringify({
              model: "text-embedding-ada-002",
              input: chunk
            }),
          }
        )
      } catch (error: any) {
        try {
          error = error.xmlhttp.response?.error
          views.setText(`# ${error.code}\n> ${url}\n\n**${error.type}**\n${error.message}`, true)
          new ztoolkit.ProgressWindow(error.code, { closeOtherProgressWindows: true })
            .createLine({ text: error.message, type: "default" })
            .show()
        } catch {
          new ztoolkit.ProgressWindow("Error", { closeOtherProgressWindows: true })
            .createLine({ text: error.message, type: "default" })
            .show()
        }
      }
      if (res?.response?.data) {
        final_embeddings = final_embeddings.concat(res.response.data.map((i: any) => i.embedding))
      }
    }
    return final_embeddings
  }

  public async embedDocuments(texts: string[]) {
    return await this.request(texts)
  }

  public async embedQuery(text: string) {
    return (await this.request([text]))?.[0]
  }
}


export async function getGPTResponse(requestText: string) {
  const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`)
  // 这里可以补充很多免费API，然后用户设置用哪个
  if (!secretKey) { return await getGPTResponseBy(requestArgs[1], requestText) }
  else { return await getGPTResponseByOpenAI(requestText) }
}

/**
 * 所有getGPTResponseTextByXXX参照此函数实现
 * gpt-3.5-turbo / gpt-4
 * @param requestText 
 * @returns 
 */
export async function getGPTResponseByOpenAI(requestText: string) {
  const views = Zotero.ZoteroGPT.views as Views
  const secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`)
  const temperature = Zotero.Prefs.get(`${config.addonRef}.temperature`)
  let api = Zotero.Prefs.get(`${config.addonRef}.api`) as string
  api = api.replace(/\/(?:v1)?\/?$/, "")
  const model = Zotero.Prefs.get(`${config.addonRef}.model`)
  views.messages.push({
    role: "user",
    content: requestText
  })
  // outputSpan.innerText = responseText;
  const deltaTime = Zotero.Prefs.get(`${config.addonRef}.deltaTime`) as number
  // 储存上一次的结果
  let _textArr: string[] = []
  // 随着请求返回实时变化
  let textArr: string[] = []
  // 激活输出
  views.stopAlloutput()
  views.setText("")
  let responseText: string | undefined
  const id: number = window.setInterval(async () => {
    if (!responseText && _textArr.length == textArr.length) { return}
    _textArr = textArr.slice(0, _textArr.length + 1)
    let text = _textArr.join("")
    text.length > 0 && views.setText(text)
    if (responseText && responseText == text) {
      views.setText(text, true)
      window.clearInterval(id)
    }
  }, deltaTime)
  views._ids.push({
    type: "output",
    id: id
  })
  const chatNumber = Zotero.Prefs.get(`${config.addonRef}.chatNumber`) as number
  const url = `${api}/v1/chat/completions`
  try {
    await Zotero.HTTP.request(
      "POST",
      url,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: views.messages.slice(-chatNumber),
          stream: true,
          temperature: Number(temperature)
        }),
        responseType: "text",
        requestObserver: (xmlhttp: XMLHttpRequest) => {
          xmlhttp.onprogress = (e: any) => {
            try {
              textArr = e.target.response.match(/data: (.+)/g).filter((s: string) => s.indexOf("content") >= 0).map((s: string) => {
                try {
                  return JSON.parse(s.replace("data: ", "")).choices[0].delta.content.replace(/\n+/g, "\n")
                } catch {
                  return false
                }
              }).filter(Boolean)
            } catch {
              // 出错一般是token超出限制
              ztoolkit.log(e.target.response)
            }
            if (e.target.timeout) {
              e.target.timeout = 0;
            }
          };
        },
      }
    );
  } catch (error: any) {
    try {
      error = JSON.parse(error?.xmlhttp?.response).error
      textArr = [`# ${error.code}\n> ${url}\n\n**${error.type}**\n${error.message}`]
      new ztoolkit.ProgressWindow(error.code, { closeOtherProgressWindows: true })
        .createLine({ text: error.message, type: "default" })
        .show()
    } catch {
      new ztoolkit.ProgressWindow("Error", { closeOtherProgressWindows: true })
        .createLine({ text: error.message, type: "default" })
        .show()
    }
  }
  responseText = textArr.join("")
  ztoolkit.log("responseText", responseText)
  // if (views._ids.map(i=>i.id).indexOf(id) >= 0 ) {
  //   views.setText(responseText, true)
  // }
  // window.clearInterval(id)
  views.messages.push({
    role: "assistant",
    content: responseText
  })
  return responseText
}

/**
 * 返回值要是纯文本
 * @param requestArg
 * @param requestText 
 * @param views 
 * @returns 
 */
export async function getGPTResponseBy(
  requestArg: RequestArg,
  requestText: string,
) {
  const views = Zotero.ZoteroGPT.views as Views
  const deltaTime = Zotero.Prefs.get(`${config.addonRef}.deltaTime`) as number
  let responseText: string | undefined
  let _responseText = ""
  views.messages.push({
    role: "user",
    content: requestText
  })
  // 储存上一次的结果
  // 激活输出
  views.stopAlloutput()
  views.setText("")
  const id = window.setInterval(() => {
    _responseText.trim().length > 0 && views.setText(_responseText)
    if (responseText && responseText == _responseText) {
      views.setText(_responseText, true)
      window.clearInterval(id)
    }
  }, deltaTime)
  views._ids.push({ type: "output", id: id })
  const chatNumber = Zotero.Prefs.get(`${config.addonRef}.chatNumber`) as number
  const body = JSON.stringify(requestArg.body(requestText, views.messages.slice(-chatNumber)))
  await Zotero.HTTP.request(
    "POST",
    requestArg.api,
    {
      headers: {
        "Content-Type": "application/json",
        ...requestArg.headers
      }, 
      body,
      responseType: "text",
      requestObserver: (xmlhttp: XMLHttpRequest) => {
        xmlhttp.onprogress = (e: any) => {
          _responseText = e.target.response.replace(requestArg.remove, "")
          if (requestArg.process) {
            _responseText = requestArg.process(_responseText)
          }
          if (e.target.timeout) {
            e.target.timeout = 0;
          }
        };
      },
    }
  );
  // if (views._ids.map(i => i.id).indexOf(id) >= 0) {
  //   views.setText(responseText, true)
  // }
  // window.clearInterval(id)
  // if (views.isInNote) {
  //   window.setTimeout(async () => {
  //     Meet.BetterNotes.replaceEditorText(
  //       // await Zotero.BetterNotes.api.convert.md2html(responseText)
  //       views.container.querySelector(".markdown-body")!.innerHTML
  //     )
  //   })
  // }
  responseText = _responseText
  views.messages.push({
    role: "assistant",
    content: responseText
  })
  return responseText
}
