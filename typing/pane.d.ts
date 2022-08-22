// chrome/content/zotero/zoteroPane.js

declare const ZoteroPane: {
  [attr: string]: any;
  collectionsView: any;
  itemsView: {
    onSelect: {
      addListener: (Function) => any;
    };
  };
  progressWindow: any;
  canEdit: () => boolean;
  displayCannotEditLibraryMessage: () => void;
  getSelectedCollection: (arg: boolean) => _ZoteroCollection;
  getSelectedItems: () => Array<_ZoteroItem>;
};
