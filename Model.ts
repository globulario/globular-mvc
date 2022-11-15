// Globular conneciton.
import * as GlobularWebClient from "globular-web-client";
import { getAllPeersInfo } from "globular-web-client/api";
import { GeneratePeerTokenRequest } from "globular-web-client/authentication/authentication_pb";
import { Peer } from "globular-web-client/resource/resource_pb";
import { View } from "./View";


// Keep the token in the map...
let tokens:any = {}

/**
 * 
 * @param {*} mac The mac address
 * @param {*} callback The callback
 * @param {*} errorCallback 
 */
export function generatePeerToken(globule: GlobularWebClient.Globular, callback: (token: string) => void, errorCallback: (err: any) => void) {
    let mac = globule.config.Mac
    if (Model.globular.config.Mac == mac) {
        callback(localStorage.getItem("user_token"))
        return
    }

    if (tokens[mac]){
        callback(tokens[mac])
        return
    }

    let rqst = new GeneratePeerTokenRequest
    rqst.setMac(mac)

    Model.globular.authenticationService.generatePeerToken(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let token = rsp.getToken()
            tokens[mac] = token
            setTimeout(()=>{
                delete tokens[mac]
            }, (globule.config.SessionTimeout * 60 * 1000) - 15000) // remove the token before it get invalid...
            callback(token)

        })
        .catch(errorCallback)
}

export class Model {

    protected listeners: Array<any>;

    // Here I will keep list of connected globules...
    public static globules: Map<string, GlobularWebClient.Globular>

    // That function will return a 
    public static getGlobule(address: string): GlobularWebClient.Globular {
        let globule = Model.globules.get(address);
        if (globule == undefined) {
            console.log("-----------> globules: ", Model.globules, address)
        }
        return globule;
    }

    public static getGlobules(): Array<GlobularWebClient.Globular> {
        let connections_ = Array.from(Model.globules.values())
        let connections = new Array<GlobularWebClient.Globular>()
        // Remove duplicat
        connections_.forEach(c => {
            if (connections.filter(c_ => { return c.config.Name == c_.config.Name && c_.config.Domain == c_.config.Domain; }).length == 0) {
                connections.push(c)
            }
        })

        return connections
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

    // The application name.
    public static application: string;

    // Pulish event on all globules...
    public static publish(name: string, data: any, local: boolean): void {
        let globules = Model.getGlobules()
        globules.forEach(g => {
            g.eventHub.publish(name, data, local)
        })
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
        if (window.location.protocol != "files:") {
            Model.domain = window.location.hostname
            Model.address = Model.domain + ":" + window.location.port
            if (Model.address.endsWith(":")) {
                if (window.location.protocol.toLocaleLowerCase() == "https:") {
                    Model.address += "443"
                } else {
                    Model.address += "80"
                }
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

            // Use when globular is not the http server.
            let domain = Model._globular.config.Name
            if (domain.length > 0 && !Model._globular.config.Domain.startsWith(Model._globular.config.Name)) {
                if (Model._globular.config.Domain.length > 0) {
                    domain += "." + Model._globular.config.Domain;
                }
            } else {
                domain = Model._globular.config.Domain;
            }


            Model.domain = domain;

            if (Model._globular.config.Protocol == "https") {
                Model.address = Model._globular.config.Protocol + ":" + Model._globular.config.PortHttps
            } else {
                Model.address = Model._globular.config.Protocol + ":" + Model._globular.config.PortHttp
            }


            Model.globules.set(domain, Model._globular)
            Model.globules.set(domain + ":" + Model._globular.config.PortHttp, Model._globular)
            Model.globules.set(domain + ":" + Model._globular.config.PortHttps, Model._globular)
            Model.globules.set(Model._globular.config.Domain + ":" + Model._globular.config.PortHttp, Model._globular)
            Model.globules.set(Model._globular.config.Domain + ":" + Model._globular.config.PortHttps, Model._globular)
            Model.globules.set(Model.address, Model._globular)
            Model.globules.set(Model._globular.config.Mac, Model._globular)

            // I will also set the globule to other address...
            let alternateDomains = Model._globular.config.AlternateDomains
            alternateDomains.forEach(domain => {
                Model.globules.set(domain, Model._globular)
                let address = domain + ":" + window.location.port
                if (address.endsWith(":")) {
                    if (Model._globular.config.Protocol == "https") {
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
                        let port = 80
                        if (Model._globular.config.Protocol == "https") {
                            port = 443
                            if (peer.getProtocol() == "https") {
                                port = peer.getPorthttps()
                            }
                        } else {
                            port = peer.getPorthttps()
                        }


                        let url = Model._globular.config.Protocol + "://" + peer.getDomain() + ":" + port + "/config"

                        let globule = new GlobularWebClient.Globular(url, () => {
                            // append the globule to the list.
                            Model.globules.set(Model._globular.config.Protocol + "://" + peer.getDomain() + ":" + port, globule)
                            Model.globules.set(url, globule)
                            Model.globules.set(peer.getDomain(), globule)
                            Model.globules.set(peer.getMac(), globule)

                            if (index < peers.length) {
                                connectToPeers()
                            } else {
                                initCallback();
                            }
                        }, (err: any) => {
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
                initCallback();
            });


        }, errorCallback);

    }
}