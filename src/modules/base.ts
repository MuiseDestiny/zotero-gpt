const help = `
### Quick Commands

\`/help\` Show all commands.
\`/clear\` Clear history conversation.
\`/report\` Run this and copy the output content to give feedback to the developer.
\`/secretKey sk-xxx\` Set GPT secret key. Generate it in https://platform.openai.com/account/api-keys.
\`/api https://api.openai.com\` Set API. 
\`/model gpt-4/gpt-3.5-turbo\` Set GPT model. For example, \`/model gpt-3.5-turbo\`.
\`/temperature 1.0\` Set GPT temperature. Controls the randomness and diversity of generated text, specified within a range of 0 to 1.
\`/deltaTime 100\` Control GPT smoothness (ms).
\`/width 32%\` Control GPT UI width (pct).
\`/tagsMore expand/scroll\` Set mode to display more tags.
\`/key default\` Restore the variable values above to their default values (if have).


### About UI

You can hold down \`Ctrl\` and scroll the mouse wheel to zoom the entire UI.
And when your mouse is in the output box, the size of any content in the output box will be adjusted.

### About Tag

You can \`long click\` on the tag below to see its internal pseudo-code.
You can type \`#xxx\` and press \`Enter\` to create a tag. And save it with \`Ctrl + S\`, during which you can execute it with \`Ctrl + R\`.
You can \`right-long-click\` a tag to delete it.

### About Output Text

You can \`double click\` on this text to copy GPT's answer.
You can \`long press\` me without releasing, then move me to a suitable position before releasing.

### About Input Text

You can exit me by pressing \`Esc\` above my head and wake me up by pressing \`Shift + /\` or \`Shift + ?\` in the Zotero main window.
You can type the question in my header, then press \`Enter\` to ask me.
You can press \`Ctrl + Enter\` to execute last executed command tag again.
You can press \`Shift + Enter\` to enter long text editing mode and press \`Ctrl + R\` to execute long text.
`
// 这是 OpenAI ChatGPT 的字体
const fontFamily = `Söhne,ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif,Helvetica Neue,Arial,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji`

const defaultTags = [{ "tag": "🪐AskPDF", "color": "#009FBD", "position": 0, "text": "#🪐AskPDF[position=0][color=#009FBD]\n\nYou are a helpful assistant. Context information is below.\n\n---\n```js\nwindow.gptInputString = Zotero.ZoteroGPT.views.inputContainer.querySelector(\"input\").value\nZotero.ZoteroGPT.views.messages = [];\n\nZotero.ZoteroGPT.utils.getRelatedText(\nwindow.gptInputString \n)\n\n```\n---\n\nCurrent date: ```js\nString(new Date())\n```\nUsing the provided context information, write a comprehensive reply to the given query. Make sure to cite results using [number] notation after the reference. If the provided context information refer to multiple subjects with the same name, write separate answers for each subject. Use prior knowledge only if the given context didn't provide enough information. \n\nAnswer the question using the language as same as this question:\n```js\nwindow.gptInputString \n```\n" }, { "tag": "🎈Translate", "color": "#21a2f1", "position": 1, "text": "#🎈Translate[position=1][color=#21a2f1]\n\ntranslate these from English to 简体中文:\n```js\nMeet.Zotero.getPDFSelection()\n```" }, { "tag": "✨ToEnglish", "color": "#42BA99", "position": 2, "text": "#✨ToEnglish[position=2][color=#42BA99]\nPlease help me translate these to English:\n\n```js\nZotero.ZoteroGPT.views.inputContainer.querySelector(\"input\").value\n```\n\nYour answer is:" }, { "tag": "✍️Abs2Sum", "color": "#E11299", "position": 4, "text": "#✍️Abs2Sum[position=4][color=#E11299]\n下面是一篇论文的摘要：\n```js\n// 确保你选择的是PDF的摘要部分\nMeet.Zotero.getPDFSelection()\n```\n\n---\n\n请问它的主要工作是什么，在什么地区，时间范围是什么，使用的数据是什么，创新点在哪？\n\n请你用下列示例格式回答我：\n主要工作：反演AOD；\n地区：四川盆地；\n时间：2017~2021；\n数据：Sentinel-2卫星数据；\n创新：考虑了BRDF效应。" }, { "tag": "🔍SearchItems", "color": "#ED5629", "position": 9, "text": "#🔍SearchItems[position=9][color=#ED5629]\n\nNow you are a database, these JSON represent Zotero item：\n\n---\n\n```js\nwindow.gptInputString = Zotero.ZoteroGPT.views.inputContainer.querySelector(\"input\").value\nZotero.ZoteroGPT.views.messages = [];\n\nMeet.Zotero.getRelatedText(\nwindow.gptInputString \n)\n\n```\n\n---\n\nPlease answer me using the lanaguage as same as my question. Make sure to cite results using [number] notation after the reference. \n\nThis is my question：\n\n```js\nwindow.gptInputString \n```\n\n--\n" }, { "tag": "🌸AskClipboard", "color": "#dc4334", "position": 9, "text": "#🌸AskClipboard[position=9][color=#dc4334]\nRead this:\n\n```js\n\nMeet.Zotero.getClipboardText()\n\n```\n\n---\n\nplease answer this question based on above content:\n```js\nZotero.ZoteroGPT.views.inputContainer.querySelector(\"input\").value\n```" }]

export { help, fontFamily, defaultTags }