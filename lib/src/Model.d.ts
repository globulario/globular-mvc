import * as GlobularWebClient from "globular-web-client";
import { View } from "./View";
export declare class Model {
    protected listeners: Array<any>;
    static globular: GlobularWebClient.Globular;
    static eventHub: GlobularWebClient.EventHub;
    static domain: string;
    static application: string;
    private _config;
    protected get config(): any;
    protected set config(value: any);
    private _view;
    protected get view(): View;
    protected set view(value: View);
    constructor();
    appendListener(name: string, uuid: string): void;
    close(): void;
    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    toString(): string;
    /**
     * Set the view.
     * @param view
     */
    setView(view: View): void;
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string): any;
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    static fromObject(obj: any): any;
    /**
     * Get the configuration from the configuration address 'config'
     * @param callback
     */
    getConfig(callback: any): void;
    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    init(initCallback: () => void, errorCallback: (err: any) => void): void;
}
