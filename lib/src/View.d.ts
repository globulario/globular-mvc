/**
 * That class made use of the web-component applcation view.
 */
export declare class View {
    protected listeners: Array<any>;
    constructor();
    update(): void;
    init(): void;
    appendListener(name: string, uuid: string): void;
    close(): void;
    displayMessage(msg: any, delay?: number): void;
    wait(msg: string): void;
    resume(): void;
    clear(): void;
    show(): void;
    hide(): void;
    getWorkspace(): any;
}
