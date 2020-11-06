"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
// Globular conneciton.
const GlobularWebClient = require("globular-web-client");
class Model {
    constructor() {
        // Set the application name.
        // The domain will be set with the hostname.
        Model.domain = window.location.hostname;
        Model.application = window.location.pathname.split('/')[1];
        this.listeners = new Array();
    }
    get config() {
        return this._config;
    }
    set config(value) {
        this._config = value;
    }
    get view() {
        return this._view;
    }
    set view(value) {
        this._view = value;
    }
    // Append a listener.
    appendListener(name, uuid) {
        this.listeners.push({ name: name, uuid: uuid });
    }
    // Explicitly close the view.
    close() {
        // Close all listeners.
        this.listeners.forEach((listener) => {
            Model.eventHub.unSubscribe(listener.name, listener.uuid);
        });
    }
    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    toString() {
        return JSON.stringify(this);
    }
    /**
     * Set the view.
     * @param view
     */
    setView(view) {
        this.view = view;
    }
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json) {
    }
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    static fromObject(obj) {
    }
    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    init(url, initCallback, errorCallback) {
        // So here I will initilyse the server connection.
        Model.globular = new GlobularWebClient.Globular(url, initCallback, errorCallback);
    }
}
exports.Model = Model;
