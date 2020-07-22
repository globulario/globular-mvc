"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
const Model_1 = require("./Model");
/**
 * Role are use to manage
 */
class Role extends Model_1.Model {
    constructor() {
        super();
    }
    /**
     * Return the list of account that can play a given role.
     * @param callback
     * @param errorCallback
     */
    getMembers(callback, errorCallback) {
    }
}
exports.Role = Role;
