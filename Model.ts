// Globular conneciton.
import * as GlobularWebClient from "globular-web-client";
import { getAllPeersInfo } from "globular-web-client/api";
import { Application, GetPeersRqst, GetPeersRsp, Peer } from "globular-web-client/resource/resource_pb";
import { View } from "./View";

export class Model {

    protected listeners: Array<any>;

    // Here I will keep list of connected globules...
    public static globules: Map<string, GlobularWebClient.Globular>

    // That function will return a 
    public static getGlobule(address: string): GlobularWebClient.Globular {
        return Model.globules.get(address);
    }

    // This is the globule where the application is running.
    private static _globular: GlobularWebClient.Globular;
    public static get globular(): GlobularWebClient.Globular {
        return Model.getGlobule(Model.address);
    }

    // This is the event controller.
    public static eventHub: GlobularWebClient.EventHub;

    // The domain of the application.
    public static domain: string;

    // The address...
    public static address: string;

    // The name of the applicaition where the model is use.
    public static get application(): string {
        let app = window.location.pathname.split('/')[1]
        if (app.length == 0) {
            app = Model._globular.config.IndexApplication;
        }
        return app;
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
        Model.address = Model.domain + ":" + window.location.port
        if (Model.address.endsWith(":")) {
            if (window.location.protocol.toLocaleLowerCase() == "https:") {
                Model.address += "443"
            } else {
                Model.address += "80"
            }
        }

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
    init(url: string, initCallback: () => void, errorCallback: (err: any) => void) {
        // So here I will initilyse the server connection.
        Model._globular = new GlobularWebClient.Globular(url, () => {
            // set the event hub.
            Model.eventHub = Model._globular.eventHub;

            // So here I will create connection to peers know by globular...
            Model.globules = new Map<string, GlobularWebClient.Globular>();
            Model.globules.set(Model.address, Model._globular)

            // I will also set the globule to other address...
            let alternateDomains = Model._globular.config.AlternateDomains
            alternateDomains.forEach(domain => {
                Model.globules.set(domain, Model._globular)
                let address = domain + ":" + window.location.port
                if (address.endsWith(":")) {
                    if (window.location.protocol.toLocaleLowerCase() == "https:") {
                        address += "443"
                    } else {
                        address += "80"
                    }
                }
                Model.globules.set(address, Model._globular)
            });

            getAllPeersInfo(Model.globular, (peers: Peer[]) => {

                let index = 0;
                let connectToPeers = () => {
                    let peer = peers[index]
                    if (index < peers.length) {
                        index++
                        let url = location.protocol + "//" + peer.getAddress() + "/config"

                        let globule = new GlobularWebClient.Globular(url, () => {
                            // append the globule to the list.
                            Model.globules.set(peer.getAddress(), globule)
                            if (index < peers.length) {
                                connectToPeers()
                            } else {
                                initCallback();
                            }
                        }, (err: any) => {
                            console.log(err, "fail to connect with globule at address ", peer.getAddress())
                            if (index < peers.length) {
                                connectToPeers()
                            } else {
                                initCallback();
                            }
                        })
                    } else {
                        initCallback();
                    }
                }

                // call onces
                connectToPeers()
            }, (err: any) => {
                console.log("no peers found ", err)
                initCallback();
            });


        }, errorCallback);

    }
}