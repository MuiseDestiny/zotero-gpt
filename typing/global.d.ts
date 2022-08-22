declare interface DirectoryIterator {
  forEach(handler: any): Promise<void>;
  close(): void;
  next: () => any;
}
declare interface DirectoryIteratorConstructable {
  new (path: string): DirectoryIterator; // eslint-disable-line @typescript-eslint/prefer-function-type
}

declare namespace OS {
  namespace File {
    type Entry = {
      isDir: boolean;
      size: number;
      path: string;
      unixMode?: number;
    };
    type FileInfo = {
      isDir: boolean;
      size: number;
      unixMode?: number;
      lastModificationDate: Date;
    };
  }
}
declare const OS: {
  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.File_for_the_main_thread
  File: {
    exists: (path: string) => boolean | Promise<boolean>;
    read: (
      path: string | BufferSource,
      options?: { encoding?: string }
    ) =>
      | string
      | Promise<string>
      | Uint8Array
      | Promise<Uint8Array>
      | Promise<BufferSource>;
    move: (from: string, to: string) => void | Promise<void>;
    remove: (
      path: string,
      options?: { ignoreAbsent: boolean }
    ) => Promise<void>;
    writeAtomic: (
      path: string,
      data: Uint8Array | string,
      options?: { tmpPath?: string; encoding?: string }
    ) => void | Promise<void>;
    makeDir: (
      path: string,
      options?: { ignoreExisting?: boolean }
    ) => void | Promise<void>;
    stat: (path: string) => OS.File.FileInfo | Promise<OS.File.FileInfo>;
    copy: (
      src: string,
      tgt: string,
      options?: { noOverwrite?: boolean }
    ) => void;
    removeDir: (
      path: string,
      options?: { ignoreAbsent?: boolean; ignorePermissions?: boolean }
    ) => void;

    DirectoryIterator: DirectoryIteratorConstructable;
  };

  // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/OSFile.jsm/OS.Path
  Path: {
    join: (...args: string[]) => string;
    dirname: (path: string) => string;
    basename: (path: string) => string;
    normalize: (path: string) => string;
    split: (path: string) => {
      absolute: boolean;
      components: string[];
      winDrive?: string;
    };
    toFileURI: (path: string) => string;
  };
};

declare const NetUtil: { [attr: string]: any };

// https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
declare const Zotero: {
  [attr: string]: any;
  debug: (message, level?, maxDepth?, stack?) => void;
  log: (
    message,
    type?,
    sourceName?,
    sourceLine?,
    lineNumber?,
    columnNumber?
  ) => void;
  Prefs: {
    get: (pref: string, global: boolean = false) => boolean | string | number;
    set: (
      pref: string,
      value: boolean | string | number,
      global: boolean = false
    ) => any;
  };
  Notifier: {
    registerObserver: (
      ref: { notify: Function },
      types?: string[],
      id?: string,
      priority?: null
    ) => string;
    unregisterObserver: (id: String) => void;
  };
  DataObject: _ZoteroDataObjectConstructable;
  Item: _ZoteroItemConstructable;
  Items: _ZoteroItems;
  Collection: _ZoteroCollectionConstructable;
  Collections: _ZoteroCollection;
  Library: _ZoteroLibraryConstructable;
  Libraries: _ZoteroLibraries;
  Reader: _ZoteroReader;
  EditorInstance: _ZoteroEditorInstanceConstructable;
  EditorInstanceUtilities: _ZoteroEditorInstanceUtilities;
  Notes: _ZoteroNotes;
  AddonTemplate: import("../src/addon");
};

declare const ZoteroPane_Local: {
  getSelectedCollection: () => _ZoteroCollection;
  newNote: (popup?, parentKey?, text?, citeURI?) => Promise<number>;
};

declare const Zotero_File_Interface: {
  exportItemsToClipboard: (items: _ZoteroItem[], translatorID: string) => void;
};

declare class Zotero_File_Exporter {
  items: _ZoteroItem[];
  save = async () => {};
}

declare const Components: any;
declare const Services: any;

declare const ZoteroContextPane: {
  [attr: string]: any;
  getActiveEditor: () => _ZoteroEditorInstance;
};
