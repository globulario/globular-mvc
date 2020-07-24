/**
 * That class is the base class of FilesListView and FilesIconView
 */
export class FilesView extends HTMLElement {
    path: any;
    setDir(dir: any): void;
    connectedCallback(): void;
    div: HTMLElement;
}
/**
 * In this view files will be show as list.
 */
export class FilesListView extends FilesView {
}
/**
 * In this view files will be show as icon
 */
export class FilesIconView extends FilesView {
}
/**
 * That component is use to navigate in path.
 */
export class PathNavigator extends HTMLElement {
    div: HTMLElement;
    path: any;
    navigationListener: string;
    setDir(dir: any): void;
    connectedCallback(): void;
}
/**
 * That component is use to display file navigation tree.
 */
export class FileNavigator extends HTMLElement {
    path: any;
    navigationListener: string;
    div: HTMLElement;
    initTreeView(dir: any, div: any, level: any): void;
    setDir(dir: any): void;
    connectedCallback(): void;
}
/**
 * File explorer.
 */
export class FileExplorer extends HTMLElement {
    path: string;
    init(): void;
    getWorkspace(): HTMLElement;
    connectedCallback(): void;
    fileExplorerBox: HTMLElement;
    fileExplorerOpenBtn: HTMLElement;
    fileExplererCloseBtn: HTMLElement;
    filesListView: HTMLElement;
    filesIconView: HTMLElement;
    pathNavigator: HTMLElement;
    fileNavigator: HTMLElement;
    filesListBtn: HTMLElement;
    fileIconBtn: HTMLElement;
}
