"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRessource = void 0;
const Model_1 = require("./Model");
/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service),
 * Stored object (form storage service) can be use as ressource.
 */
class Ressource extends Model_1.Model {
    constructor(id, modified, size, parent) {
        super();
        // Set attribues if ther is one.
        this.id = id;
        this._parent = parent;
        this._modified = modified;
        this._size = size;
        // The list of permission asscociated with that ressource.
        this.permissions = new Array();
    }
    get modified() {
        return this._modified;
    }
    get size() {
        return this._size;
    }
    /**
     *
     * @param calback
     */
    init(calback) {
        /** Not implemented here. */
    }
    /**
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback
     */
    save(callback, errorCallback) {
        /** Must be implemented by derived classes */
    }
    delete(callback, errorCallback) {
        /** Must be implemented by derived classes */
    }
    read(callback, errorCallback) {
        /** Must be implemented by derived classes */
    }
    get parent() {
        return this.parent;
    }
}
/**
 * Action permission are set by ressource type (class derived from that class)
 */
Ressource.actionPermissions = new Array();
/**
 * That class is use to manage files and directory access.
 */
class FileRessource extends Ressource {
    constructor(id, modified, size, parent) {
        super(id, modified, size, parent);
    }
}
exports.FileRessource = FileRessource;
