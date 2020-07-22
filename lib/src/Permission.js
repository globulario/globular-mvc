"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RessourcePermission = exports.ActionPermission = exports.Permission = exports.PermissionType = void 0;
const Model_1 = require("./Model");
var PermissionType;
(function (PermissionType) {
    PermissionType[PermissionType["None"] = 0] = "None";
    PermissionType[PermissionType["Read"] = 1] = "Read";
    PermissionType[PermissionType["Delete"] = 2] = "Delete";
    PermissionType[PermissionType["Write"] = 3] = "Write";
    PermissionType[PermissionType["WriteDelete"] = 4] = "WriteDelete";
    PermissionType[PermissionType["ReadDelete"] = 5] = "ReadDelete";
    PermissionType[PermissionType["ReadWrite"] = 6] = "ReadWrite";
    PermissionType[PermissionType["ReadWriteDelete"] = 7] = "ReadWriteDelete";
})(PermissionType = exports.PermissionType || (exports.PermissionType = {}));
/**
 * Permission are use to manage ressouces and action access. If no permission are define on action
 * or ressource it make the ressource open and accessible or executable by any user or application.
 * At the moment permission are define on a ressource it became managed and protected by globular.
 */
class Permission extends Model_1.Model {
    constructor(id, permission) {
        super();
    }
    /** Save a ressource */
    save(callback, errorCallback) {
        /** nothing here. */
    }
    /** Delete a ressource */
    delete(callback, errorCallback) {
        /** nothing here. */
    }
}
exports.Permission = Permission;
/**
 * Action permission it's use to manage who (Application or Role(user's)) can
 * execute action on the server.
 */
class ActionPermission extends Permission {
    constructor(id, permission, action) {
        super(id, permission);
        this.action = action;
    }
    /** Save a ressource */
    save(callback, errorCallback) {
        // Dispatch event on the network.
        Model_1.Model.eventHub.publish("action_permission_change_event", { id: this.id, permission: this.permission }, false);
    }
    /** Delete a ressource */
    delete(callback, errorCallback) {
        // Dispatch event on the network.
        Model_1.Model.eventHub.publish("action_permission_delete_event", this.id, false);
    }
}
exports.ActionPermission = ActionPermission;
/**
 * Ressource permissions are use to manage who can access ressource on the server.
 */
class RessourcePermission extends Permission {
    constructor(id, permission, path, owner) {
        super(id, permission);
        this.path = path;
        this.owner = owner;
    }
    /** Save a ressource */
    save(callback, errorCallback) {
        Model_1.Model.eventHub.publish("ressource_permission_change_event", { id: this.id, permission: this.permission }, false);
    }
    /** Delete a ressource */
    delete(callback, errorCallback) {
        Model_1.Model.eventHub.publish("delete_permission_delete_event", this.id, false);
    }
}
exports.RessourcePermission = RessourcePermission;
