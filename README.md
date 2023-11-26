<div align="center">
  <img src="imgs/background.png" width="50%" />


# Awesome GPT


👋

Welcome to share your command tag [here](https://github.com/MuiseDestiny/zotero-gpt/discussions/3) using [Meet API](src/modules/Meet/api.ts).

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-gpt)](https://github.com/MuiseDestiny/zotero-gpt/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-gpt?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-gpt)](https://github.com/MuiseDestiny/zotero-gpt/blob/master/LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-gpt/latest/total?color=yellow)


  <img src="https://user-images.githubusercontent.com/51939531/228763331-90baa9aa-8bef-4b32-9d6f-35538b58b158.png" width="80%" />

</div>




---

## 🚀 Main Features
Features about GPT:  
- [x] 🔗 **Integrate with Zotero**: You can use the plugin to search and ask items in the library based on the selected text or the PDF file.
- [x] 🧠 Use GPT to generate reply text: support `gpt-3.5-turbo` and `gpt-4`
- [x] 🏷️ [Command tags](https://github.com/MuiseDestiny/zotero-gpt#command-tags): **Click once** to accelerate your research.  
  - [x] 💬 Ask questions about current **PDF file** (full-text or selected text).
  - [x] 💬 Ask questions about **selected paper** (Abstract).
  - [x] 📝 **Summarize the selected paper** into several highly condensed sentences.
  - [x] 🔍 **Search items** in the library based on the selected text.
  - [x] ... ...
- [x] ⚙️ **Advanced settings for GPT**: You can set the [api key](https://platform.openai.com/account/api-keys), [model name](https://platform.openai.com/docs/api-reference/chat/create#chat/create-model), [api url](https://platform.openai.com/docs/api-reference/chat/create), [temperature](https://platform.openai.com/docs/api-reference/chat/create#chat/create-temperature).
- [x] 📚 **Integrate with Better Notes**: You can directly open this plugin when using [Better Notes](https://github.com/windingwind/zotero-better-notes).

Features about UI:
- [x] 🎨 **Real-time markdown rendering** for reply text: Latex and mathjax are supported.
- [x] 🔍 **Zoom in and out** of the reply text or the size of the plugin window.
- [x] 🖱️ **Move the plugin window to any position** on the screen.
- [x] 📋 **Copy the reply text** to the clipboard.
- [x] ⚠️ Detailed **error message** will be displayed when the request fails.
- [x] 🔧 Compatible with **Zotero 6** and **Zotero 7**.
- [x] 🎉 Discover more exciting features that are not listed here.


## How to use
- [x] Get `.xpi` file
  - [ ] [download latest](https://github.com/MuiseDestiny/zotero-gpt/releases/latest/download/zotero-gpt.xpi) release `.xpi` file
  - [ ] or build this project [1] to generate a `.xpi` file
- [x] Install `.xpi` file in Zotero [2]
- [x] Open Zotero GPT [3]
- [x] Set your `OpenAI` secret key [4]

### [1] Build the project
Here is an example on how to build this project. For more information on how to build, please visit this project: [https://github.com/windingwind/zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)

```bash
git clone https://github.com/MuiseDestiny/zotero-gpt.git
cd zotero-gpt
npm install
npm run build
```
The generated `.xpi` file in the build directory is the extension that you can install in Zotero.

### [2] Install the extension in Zotero
Open Zotero. In the top menu bar, click on `Tools > Add-ons`.
Click on the gear icon at the top right of the window. Click on `Install Add-on From File` and open the generated `.xpi` file in the build directory from the previous step.

### [3] Open/Exit Zotero GPT

|Action|Shortcut|
|--|--|
|Open|<img src="https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/f76b23ee-8c54-47da-823c-8c14faa88a87" width="20%">|
|Exit|`ESC`|
|Multi-line editing| `Shift` + `Enter`|

### [4] Set up the API key

![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/225c468a-acfc-43be-b5ac-cf6aaaa33e96)

## Hi, Command Tag.
> 👻 Follow the steps below, and you will gain a new understanding of command tags.

|Step| Description | Supplementary Information |
|----|-------------|---------------------------|
|1   | Open Zotero GPT | Refer to [3] Open/Exit Zotero GPT |
|2   | Type `#Tag Name` and press `Enter` | ![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/52f776fc-5592-4c17-8c36-7769c537ef79) |
|3   | Input your prompt or code | ![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/6f6d9985-69e5-4d29-ba78-df31e30e9cd1) |
|4   | **R**un your tag | Press `Ctrl + R` |
|5   | **S**ave your tag | Press `Ctrl + S` |
|6   | Long press a command tag to access the editing interface | ![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/28235117-79ab-43c6-b175-079e609683f4) |
|7   | Modify the tag's color, position, or trigger; remember to save with `Ctrl + S` | ![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/5261878a-30ce-4ea5-b3be-9c6b9ef29f70) |
|8   | Press `ESC` to exit the editing interface | Remember to save your changes with `Ctrl + S` before exiting |
|9   | Long press the right mouse button to delete a tag | Note: Build-in tags do not support deletion |

### How to run a command tag
> Trigger is an attribute of a command tag, as are color and position. Long press any label to view/modify its trigger word. It supports both plain text and JS regular expressions.

![How to run a command tag](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/fdfc369a-1e96-478c-a7c2-4a93d2d7a580)

![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/d7f857a4-9ed9-42af-8662-6336ce70a881)


### How to write a code block

You can find some build-in APIs [here](https://github.com/MuiseDestiny/zotero-gpt/blob/bootstrap/src/modules/Meet/api.ts).

A simple example:
```
Summarize the following paragraph for me:

${Meet.Zotero.getPDFSelection()}
```

Here, the `Summarize the following paragraph for me:` represents plain text, while `${your code}` denotes a code snippet. Undoubtedly, if you are familiar with Zotero APIs, you can develop your own code. The code snippet will be executed, and the text returned by the code snippet will replace the code snippet. Finally, the replaced text will be input to GPT. So, theoretically, you can **accomplish all interactions** between Zotero and GPT using command tags.

### How to navigate historical chats

> Press the up (↑) and down (↓) keys on the keyboard to navigate.

![image](https://github.com/MuiseDestiny/zotero-gpt/assets/51939531/ca2dcfbf-efb4-4ba3-8339-5277a879e3ea)

## Support the project

[Here](https://github.com/MuiseDestiny/zotero-reference#%E8%B5%9E%E5%8A%A9)

