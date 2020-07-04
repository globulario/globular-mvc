// Globular conneciton.
import * as GlobularWebClient from "globular-web-client";
import { GetConfigResponse, GetConfigRequest } from "globular-web-client/lib/admin/admin_pb";
import { View } from "./View";

export class Model {

    protected listeners: Array<any>;

    // Static class.
    protected static globular: GlobularWebClient.Globular;

    // This is the controller.
    public static eventHub: GlobularWebClient.EventHub;

    // The domain of the application.
    public static domain: string;

    // The name of the applicaition where the model is use.
    public static application: string;

    // The configuation (can be partial or full)
    private _config: any;
    protected get config(): any {
        return this._config;
    }
    protected set config(value: any) {
        this._config = value;
    }

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
        this.listeners = new Array<any>();
    }

    // Append a listener.
    appendListener(name: string, uuid: string){
        this.listeners.push({name:name, uuid:uuid})
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
    setView(view:View){
        this.view = view;
    }

    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string):any {

    }

    /**
     * Initialyse the notification from object.
     * @param obj 
     */
    static fromObject(obj: any):any {
    }

    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    init(initCallback: () => void, errorCallback: (err: any) => void, adminPort: number = 10001, adminProxy: number = 10002) {

        this.config = {
            Protocol: window.location.protocol.replace(":", ""),
            Domain: window.location.hostname,
            PortHttp: parseInt(window.location.port),
            AdminPort: adminPort,
            AdminProxy: adminProxy,
            Services: {} // empty for start.
        };

        // So here I will initilyse the server connection.
        let globular = new GlobularWebClient.Globular(this.config);

        let rqst = new GetConfigRequest();
        if (globular.adminService !== undefined) {
            globular.adminService.getConfig(rqst, {
                domain: Model.domain
            }).then((rsp: GetConfigResponse) => {
                // set back config with all it values.
                this.config = JSON.parse(rsp.getResult())

                // init the globular object from the configuration retreived.
                Model.globular = new GlobularWebClient.Globular(this.config);

                // init the event hub from the object retreive.
                Model.eventHub = new GlobularWebClient.EventHub(
                    Model.globular.eventService
                );

                // Call init callback.
                initCallback()

            }).catch((err: any) => {
                errorCallback(err)
            })
        }
    }
}
