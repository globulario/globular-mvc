/**
 * Login/Register functionality.
 */
export class Menu extends HTMLElement {
    constructor(id: any, icon: any, text: any);
    icon: any;
    keepOpen: boolean;
    parentNode_: Node & ParentNode;
    menu: HTMLElement;
    connectedCallback(): void;
    /**
     * Return the body of the menu.
     */
    getMenuDiv(): HTMLElement;
    /**
     * Return the icon div.
     */
    getIconDiv(): HTMLElement;
    /**
     * Return the image div.
     */
    getImage(): HTMLElement;
    /**
     * Return the image div.
     */
    getIcon(): HTMLElement;
    /**
     * Hide the menu.
     */
    hide(): void;
    /**
     * Show the menu.
     */
    show(): void;
    init(): void;
}
/**
 * Login/Register functionality.
 */
export class OverflowMenu extends Menu {
}
