# <img src="addon/chrome/content/icons/favicon.png" width="36" height="36" alt=""> Awesome GPT

> 在 Zotero 中与文献对话，让 AI 辅助阅读、理解与笔记整理。

[![Using Zotero Plugin Template](https://img.shields.io/badge/Using-Zotero%20Plugin%20Template-blue?style=flat-round&logo=github)](https://github.com/windingwind/zotero-plugin-template)
[![Latest release](https://img.shields.io/github/v/release/MuiseDestiny/zotero-gpt)](https://github.com/MuiseDestiny/zotero-gpt/releases)
![Release Date](https://img.shields.io/github/release-date/MuiseDestiny/zotero-gpt?color=9cf)
[![License](https://img.shields.io/github/license/MuiseDestiny/zotero-gpt)](LICENSE)
![Downloads latest release](https://img.shields.io/github/downloads/MuiseDestiny/zotero-gpt/latest/total?color=yellow)

Awesome GPT 是一款面向 Zotero 的 AI 阅读与写作辅助插件，支持结合文献全文、选中文本和笔记进行问答、总结、翻译与内容整理。

**[阅读完整功能介绍与使用文档](https://plugins.muisedestiny.xyz/docs/gpt)**

README 仅提供功能概览。安装、模型配置、使用方法以及最新的功能说明，请以完整文档为准。

## 安装与更新

首次安装请参考 [插件安装指南](https://plugins.muisedestiny.xyz/guide)。后续请通过 **插件设置界面右上角的更新入口** 检查并获取最新版本。

**GitHub Releases 可能不会同步发布后续更新**，请勿仅根据 GitHub 上的 Release 版本判断插件是否为最新版本。

## 主要功能

- **文献问答与理解**：结合 PDF 全文、选中文本或所选文献进行提问，辅助总结、翻译与解释。
- **浮窗快速问答**：通过工具栏按钮或 `Ctrl + /` 唤起浮窗，在阅读与文献管理过程中快速调用 AI。
- **命令标签与提示词**：使用内置命令完成常见任务，也可自定义提示词和上下文，适配自己的研究流程。
- **灵活的模型配置**：支持配置 API 地址、API Key、模型及相关参数；具体供应商与接口兼容情况见文档。
- **回答展示与复用**：支持 Markdown、代码和数学公式渲染，并可复制回答用于后续整理。

使用 AI 前需要配置可用的模型服务。模型能力、接口兼容性、额度与费用由所用服务决定，插件授权不等于购买模型服务或获得无限 API 额度。

## Pro 功能

**[加入 Pro](https://plugins.muisedestiny.xyz/)**

插件同时提供 **Awesome GPT Pro** 扩展能力，例如：

- **网页 AI 联动**：通过浏览器扩展连接支持的网页 AI，在 Zotero 中使用网页问答能力。
- **PDF 侧边栏与阅读器浮窗**：围绕当前 PDF、页面或选中文本开展对话，使用快捷命令处理阅读内容。
- **笔记侧边栏**：在笔记编辑过程中调用 AI，辅助改写、补充与整理文本。
- **AI 阅读应用**：提供文献鸟瞰、AI 大纲、AI 标注与 AI 填充笔记，辅助梳理文献结构和记录阅读结果。

Pro 的完整功能、使用条件与激活说明，请查看 [Awesome GPT 文档](https://plugins.muisedestiny.xyz/docs/gpt)。部分功能对模型能力、API 或网页联动方式有特定要求；具体功能范围以文档和当前版本的插件设置为准。

## 开源与代码说明

- **Pro 功能部分不开源**，其受保护实现以独立加密模块随插件分发。
- **非 Pro 功能代码未加密**，后续会逐步整理并同步到本仓库。
- 仓库源码与插件发布版本可能存在时间差；本仓库不代表插件的全部功能均已开源，也不保证当前公开源码可构建出最新发布版本。
- 仓库中已公开代码的许可条款见 [LICENSE](LICENSE)。

## 问题反馈

**本仓库不接受 Pull Request（PR），仅通过 Issues 接收问题反馈和功能建议。**

提交问题前，请先查阅 [完整文档](https://plugins.muisedestiny.xyz/docs/gpt)，并更新插件，确认问题是否仍然存在。

如需反馈，请在 [GitHub Issues](https://github.com/MuiseDestiny/zotero-gpt/issues) 中提供 Zotero 版本、插件版本、操作系统、复现步骤及必要的截图或错误信息。涉及模型连接时，请补充模型名称与接入方式；**不要公开 API Key、访问令牌或其他敏感信息**。

本次历史问题整理会将创建时间超过一个月的 issues 标记为“时间久远”并关闭。这不代表相关问题均已修复；若在最新版本中仍可复现，欢迎补充信息并重新打开，或新建 issue 引用原问题。

## 致谢

感谢所有提出建议、反馈问题和参与贡献的用户，以及以下项目：

- [zotero-plugin-template](https://github.com/windingwind/zotero-plugin-template)
- [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit)
- [Better Notes](https://github.com/windingwind/zotero-better-notes)
