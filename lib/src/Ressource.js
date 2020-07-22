"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ressource = void 0;
const Model_1 = require("./Model");
const api_1 = require("globular-web-client/lib/api");
/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service),
 * Stored object (form storage service) can be use as ressource.
 */
class Ressource extends Model_1.Model {
    /**
     * The ressource constructor.
     * @param path The path of the ressource must be unique.
     * @param id The unique identifier
     * @param modified The last modified time
     * @param size The size of the ressource on the server.
     */
    constructor(path, id, modified, size) {
        super();
        // Set attribues if ther is one.
        this._id = id;
        this._modified = modified;
        this._size = size;
        this._path = path;
    }
    get id() {
        return this._id;
    }
    get path() {
        return this._path;
    }
    get modified() {
        return this._modified;
    }
    get size() {
        return this._size;
    }
    /**
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback
     */
    save(callback, errorCallback) {
        if (this._id == undefined) {
        }
        else {
        }
    }
    delete(callback, errorCallback) {
    }
    /**
     * Return the list of permission define for that ressource.
     * @param callback
     * @param errorCallback
     */
    getPermissions(callback, errorCallback) {
        api_1.getRessourcePermissions(Model_1.Model.globular, Model_1.Model.application, Model_1.Model.domain, this.path, (data) => {
            /** TODO tranform data here */
            console.log(data);
        }, errorCallback);
    }
    /**
     * Return the list of account that can own the ressource.
     * @param callback
     * @param errorCallback
     */
    getOwners(callback, errorCallback) {
        api_1.getRessourceOwners(Model_1.Model.globular, Model_1.Model.application, Model_1.Model.domain, this.path, (data) => {
            /** TODO tranform data here */
            console.log(data);
        }, errorCallback);
    }
}
exports.Ressource = Ressource;
