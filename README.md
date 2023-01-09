# Zotero Plugin Template

![GitHub Repo stars](https://img.shields.io/github/stars/windingwind/zotero-better-notes?label=zotero-better-notes)
![GitHub Repo stars](https://img.shields.io/github/stars/windingwind/zotero-pdf-preview?label=zotero-pdf-preview)
![GitHub Repo stars](https://img.shields.io/github/stars/windingwind/zotero-pdf-translate?label=zotero-pdf-translate)
![GitHub Repo stars](https://img.shields.io/github/stars/windingwind/zotero-tag?label=zotero-tag)
![GitHub Repo stars](https://img.shields.io/github/stars/iShareStuff/ZoteroTheme?label=zotero-theme)
![GitHub Repo stars](https://img.shields.io/github/stars/MuiseDestiny/zotero-reference?label=zotero-reference)
![GitHub Repo stars](https://img.shields.io/github/stars/MuiseDestiny/ZoteroStyle?label=zotero-style)
![GitHub Repo stars](https://img.shields.io/github/stars/volatile-static/Chartero?label=Chartero)
![GitHub Repo stars](https://img.shields.io/github/stars/l0o0/tara?label=tara)

This is a plugin template for [Zotero](https://www.zotero.org/). Plugins using this template are shown above.

📖[Plugin Development Documentation](https://zotero.yuque.com/books/share/8d230829-6004-4934-b4c6-685a7001bfa0/vec88d)(Chinese, provides English translation)

🛠️[Zotero Plugin Toolkit](https://github.com/windingwind/zotero-plugin-toolkit) | [API Documentation](https://github.com/windingwind/zotero-plugin-toolkit/blob/master/docs/zotero-plugin-toolkit.md)

ℹ️[Zotero Type Definitions](https://github.com/windingwind/zotero-types)

📜[Zotero Source Code](https://github.com/zotero/zotero)

📌[Zotero Plugin Template](https://github.com/windingwind/zotero-plugin-template)(This repo)

> 👍You are currently in `bootstrap` extension mode. To use `overlay` mode, plsase switch to `overlay` branch in git.

> 👁 Watch this repo so that you can be notified whenever there are fixes & updates.

## Features

- Event-driven, functional programming, under extensive skeleton;
- Simple and user-friendly, works out-of-the-box.
- Abundant examples in `src/modules/examples.ts`, covering most of the commonly used APIs in plugins(using [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit));
- TypeScript support:
  - Full type definition support for the whole Zotero project, which is written in JavaScript(using [zotero-types](https://github.com/windingwind/zotero-types));
  - Global variables and environment setup;
- Plugin build/test/release workflow:
  - Automatically generate/update plugin id/version, update configrations, and set environment variables(`development/production`);
  - Automatically build and reload code in Zotero;
  - Automatically release to GitHub(using [release-it](https://github.com/release-it/release-it));
- ⭐[New!]Compatibilities for Zotero 6 & Zotero 7.(using [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit))

## Examples

This repo provides examples for [zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit) APIs.

Search `@example` in `src/examples.ts`. The examples are called in `src/hooks.ts`.

### Basic Examples

- registerNotifier
- registerPrefs, unregisterPrefs

### Shortcut Keys Examples

- registerShortcuts
- exampleShortcutLargerCallback
- exampleShortcutSmallerCallback
- exampleShortcutConflictionCallback

### UI Examples

![image](https://user-images.githubusercontent.com/33902321/209274492-7aa94912-af38-4154-af46-dc8f59640de3.png)

- registerStyleSheet(the official make-it-red example)
- registerRightClickMenuItem
- registerRightClickMenuPopup
- registerWindowMenuWithSeprator
- registerExtraColumn
- registerExtraColumnWithCustomCell
- registerCustomCellRenderer
- registerLibraryTabPanel
- registerReaderTabPanel
- unregisterUIExamples

## Quick Start Guide

- Fork this repo;
- Git clone the forked repo;
- Enter the repo folder;
- Modify the settings in `./package.json`, including:

```
  version,
  author,
  description,
  homepage,
  config {
    releasepage,
    updaterdf,
    addonName,
    addonID,
    addonRef
  }
```

> Be careful to set the addonID and addonRef to avoid confliction.

- Run `npm install` to set up the plugin and install dependencies. If you don't have NodeJS installed, please download it [here](https://nodejs.org/en/);
- Run `npm run build` to build the plugin in production mode. Run `npm run build-dev` to build the plugin in development mode. The xpi for installation and the built code is under `builds` folder.

> What the difference between dev & prod?
>
> - This environment variable is stored in `Zotero.AddonTemplate.data.env`. The outputs to console is disabled in prod mode.
> - You can decide what users cannot see/use based on this variable.

### About Hooks

> See also [`src/hooks.ts`](https://github.com/windingwind/zotero-plugin-template/blob/bootstrap/src/hooks.ts)

1. When install/enable/startup triggered from Zotero, `bootstrap.js` > `startup` is called
   - Wait for Zotero ready
   - Load `index.js` (the main entrance of plugin code, built from `index.ts`)
   - Register resources if Zotero 7+
2. In the main entrance `index.js`, the plugin object is injected under `Zotero` and `hooks.ts` > `onStartup` is called.
   - Initialize anything you want, including notify listeners, preference panes, and UI elements.
3. When uninstall/disabled triggered from Zotero, `bootstrap.js` > `shutdown` is called.
   - `events.ts` > `onShutdown` is called. Remove UI elements, preference panes, or anything created by the plugin.
   - Remove scripts and release resources.

### About Global Variables

> See also [`src/index.ts`](https://github.com/windingwind/zotero-plugin-template/blob/bootstrap/src/index.ts)

The bootstrapped plugin runs in a sandbox, which does not have default global variables like `Zotero` or `window`, which we used to have in the overlay plugins' window environment.

This template registers the following variables to the global scope:

```ts
Zotero, ZoteroPane, Zotero_Tabs, window, document, rootURI, ztoolkit, addon;
```

### About Preference

Zotero 6 doesn't support preference pane injection in bootstrap mode, thus I write a register for Zotero 6 or lower.

You only need to maintain one `preferences.xhtml` which runs natively on Zotero 7 and let the plugin template handle it when it is running on Zotero 6.

<table style="margin-left: auto; margin-right: auto;">
    <tr>
        <td>
          <img width="350px" src="https://user-images.githubusercontent.com/33902321/208080125-2a776a98-f427-4c81-8924-7877bf803e3d.png"/>
          <div>Zotero 7</div>
        </td>
        <td>
          <img width="300px" src="https://user-images.githubusercontent.com/33902321/208080491-b7006c08-2679-4f85-9a28-dba8e622d745.png"/>
          <div>Zotero 6</div>
        </td>
    </tr>
</table>

https://github.com/windingwind/zotero-plugin-template/blob/08d72a4e2b3bacff574f537bbd06cb33e6b22480/src/modules/examples.ts#L73-L85

> `<preferences>` element is deprecated. Please use the full pref-key in the elements' `preference` attribute. Like:

```xml
<checkbox label="&zotero.__addonRef__.pref.enable.label;" preference="extensions.zotero.__addonRef__.enable" />
```

The elements with `preference` attributes will bind to Zotero preferences.

Remember to call `unregister()` on plugin unload.

### Create Elements API

The plugin template provides new APIs for bootstrap plugins. We have two reasons to use these APIs, instead of the `createElement/createElementNS`:

- In bootstrap mode, plugins have to clean up all UI elements on exit (disable or uninstall), which is very annoying. Using the `createElement`, the plugin template will maintain these elements. Just `unregister` on exit.
- Zotero 7 requires createElement()/createElementNS() → createXULElement() for remaining XUL elements, while Zotero 6 doesn't support `createXULElement`. Using `createElement`, it switches API depending on the current platform automatically.

There are more advanced APIs for creating elements in batch: `creatElementsFromJSON`. Input an element tree in JSON and return a fragment/element. These elements are also maintained by this plugin template.

### Directory Structure

This section shows the directory structure of a template.

- All `.js/.ts` code files are in `./src`;
- Addon config files: `./addon/chrome.manifest`, `./addon/install.rdf`, and `./addon/manifest.json`;
- UI files: `./addon/chrome/content/*.xhtml`.
- Locale files: `./addon/chrome/locale/[*.dtd, *.properties]`;
- Resource files: `./addon/chrome/skin/default/__addonRef__/*.dtd`;
- Preferences file: `./addon/chrome/defaults/preferences/defaults.js`;
  > Don't break the lines in the `defaults.js`

```shell
│  .gitignore
│  .release-it.json # release-it conf
|  tsconfig.json    # https://code.visualstudio.com/docs/languages/jsconfig#
│  build.js         # esbuild
│  LICENSE
│  package.json     # npm conf
│  README.md        # readme
│  update.rdf       # addon update
│
├─.github           # github conf
│
├─addon             # addon dir
│  │  chrome.manifest  # for Zotero 6
│  │  manifest.json # for Zotero 7
│  │  install.rdf   # addon install conf, for Zotero 6
│  │  bootstrap.js  # addon load/unload script, like a main.c
│  │
│  └─chrome
│      ├─content    # UI
│      │  │  preferences.xhtml
│      │  │
│      │  ├─icons
│      │  │      favicon.png
│      │  │      favicon@0.5x.png
│      │  │
│      │  └─scripts
│      └─locale     # locale
│         ├─en-US
│         │      overlay.dtd
│         │      addon.properties
│         │
│         ├─zh-CN
│         |      overlay.dtd
│         └─     addon.properties
│
├─builds            # build dir
│  └─.xpi
│
└─src               # source code
    │  index.ts     # main entry
    │  addon.ts     # base class
    │  hooks.ts     # lifecycle hooks
    |
    └─modules       # sub modules
       │  examples.ts           # examples factory
       │  locale.ts             # locale .properties
       │  preferenceScript.ts   # script runs in preferences.xhtml
       └─ progressWindow.ts     # progressWindow tool
```

### Build

```shell
# A release-it command: version increase, npm run build, git push, and GitHub release
# You need to set the environment variable GITHUB_TOKEN https://github.com/settings/tokens
# release-it: https://github.com/release-it/release-it
npm run release
```

Alternatively, build it directly using build.js: `npm run build`

### Build Steps

1. Clean `./builds`
2. Copy `./addon` to `./builds`
3. Esbuild to `./builds/addon/chrome/content/scripts`
4. Replace `__buildVersion__` and `__buildTime__` in `./builds/addon`
5. Zip the `./builds/addon` to `./builds/*.xpi`

### Debug

1. Copy zotero command line config file. Modify the commands.

```sh
cp ./scripts/zotero-cmd-default.json ./scripts/zotero-cmd.json
vim ./scripts/zotero-cmd.json
```

2. Setup plugin development environment following this [link](https://www.zotero.org/support/dev/client_coding/plugin_development#setting_up_a_plugin_development_environment).

3. Build plugin and restart Zotero with this npm command.

4. Launch Firefox 60
5. In Firefox, go to devtools, go to settings, click "enable remote debugging" and the one next to it that's also about debugging(or press `shift+F8`).
6. In Zotero, go to setting, advanced, config editor, look up "debugging" and click on "allow remote debugging"
7. In Firefox, click the hamburger menu in the top right -> web developer -> Connect...
8. Enter localhost:6100
9. Connect
10. Click "Inspect Main Process"

```sh
npm run restart
```

You can also debug code in these ways:

- Test code segments in Tools->Developer->Run Javascript;
- Debug output with `Zotero.debug()`. Find the outputs in Help->Debug Output Logging->View Output;
- UI debug. Zotero is built on the Firefox XUL framework. Debug XUL UI with software like [XUL Explorer](https://udn.realityripple.com/docs/Archive/Mozilla/XUL_Explorer).
  > XUL Documents:  
  > https://www.xul.fr/tutorial/  
  > http://www.xulplanet.com/

### Development

**Search for a Zotero API**  
Zotero docs are outdated or incomplete. Searching the source code of Zotero is unavoidable.  
Clone https://github.com/zotero/zotero and search the keyword globally. You can search the UI text in `.xul`/`.dtd` files, and then search the keys of the text value in `.js`/`.xul` files.

> ⭐The [zotero-types](https://github.com/windingwind/zotero-types) provides most frequently used Zotero APIs. It's included in this template by default.

## Disclaimer

Use this code under AGPL. No warranties are provided. Keep the laws of your locality in mind!

If you want to change the license, please contact me at wyzlshx@foxmail.com

Part of the code of this repo refers to other open-source projects within the allowed scope.

- zotero-better-bibtex(`d.ts`)
