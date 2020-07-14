/**
 * This is a web-component.
 */
export class Layout extends HTMLElement {
    connectedCallback(): void;
    appDrawer: HTMLElement;
    menuBtn: HTMLElement;
    showSideBar(): void;
    hideSideBar(): void;
    init(): void;
    width(): number;
    /**
     * The toolbar contain the application menu.
     */
    toolbar(): HTMLElement;
    /**
     * Return the side menu
     */
    sideMenu(): HTMLElement;
    /**
     * Return the workspace
     */
    workspace(): HTMLElement;
    /**
     * Block user input and wait until resume.
     * @param {*} msg
     */
    wait(msg: any): void;
    /**
     * Remove the waiting div.
     */
    resume(): void;
}
