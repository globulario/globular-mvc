// Globular conneciton.
import * as GlobularWebClient from "globular-web-client";
import { View } from "./View";

export class Model {

    protected listeners: Array<any>;

    // Static class.
    public static globular: GlobularWebClient.Globular;

    // This is the event controller.
    public static eventHub: GlobularWebClient.EventHub;

    // The domain of the application.
    public static domain: string;

    // The name of the applicaition where the model is use.
    public static application: string;

    // The view.
    private _view: View;
    protected get view(): View {
        return this._view;
    }

    protected set view(value: View) {
        this._view = value;
    }

    constructor() {
        // Set the application name.
        // The domain will be set with the hostname.
        Model.domain = window.location.hostname
        Model.application = window.location.pathname.split('/')[1]
        this.listeners = new Array<any>();
    }

    // Append a listener.
    appendListener(name: string, uuid: string) {
        this.listeners.push({ name: name, uuid: uuid })
    }

    // Explicitly close the view.
    close() {
        // Close all listeners.
        this.listeners.forEach((listener: any) => {
            Model.eventHub.unSubscribe(listener.name, listener.uuid)
        })
    }

    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    toString(): string {
        return JSON.stringify(this)
    }

    /**
     * Set the view.
     * @param view 
     */
    setView(view: View) {
        this.view = view;
    }

    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string): any {
        
    }

    /**
     * Initialyse the notification from object.
     * @param obj 
     */
    static fromObject(obj: any): any {
    }

    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    init(url:string , initCallback: () => void, errorCallback: (err: any) => void) {
        // So here I will initilyse the server connection.
        // let url = window.location.origin
        // url += "/config"
        Model.globular = new GlobularWebClient.Globular(url, ()=>{
            // set the event hub.
            Model.eventHub = Model.globular.eventHub;
            initCallback();
        }, errorCallback);
      
    }
}