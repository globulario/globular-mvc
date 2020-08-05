import { Model } from './Model';

export enum PermissionType {
    None = 0,
    Read,
    Delete,
    Write,
    WriteDelete,
    ReadDelete,
    ReadWrite,
    ReadWriteDelete
}

/**
 * Permission are use to manage ressouces and action access. If no permission are define on action
 * or ressource it make the ressource open and accessible or executable by any user or application.
 * At the moment permission are define on a ressource it became managed and protected by globular.
 */
export class Permission extends Model {

    protected id: string;
    protected permission: PermissionType;


    constructor(id: string, permission: PermissionType) {
        super()
    }

    /** Save a ressource */
    public save(callback: () => void, errorCallback: (err: any) => void) {
        /** nothing here. */

    }

    /** Delete a ressource */
    public delete(callback: () => void, errorCallback: (err: any) => void) {
        /** nothing here. */
    }
}

/**
 * Action permission it's use to manage who (Application or Role(user's)) can 
 * execute action on the server.
 */
export class ActionPermission extends Permission {
    private action: string;

    constructor(id: string, permission: PermissionType, action: string) {
        super(id, permission)
        this.action = action;
    }

    /** Save a ressource */
    public save(callback: () => void, errorCallback: (err: any) => void) {
        // Dispatch event on the network.
        Model.eventHub.publish("action_permission_change_event", { id: this.id, permission: this.permission }, false)
    }

    /** Delete a ressource */
    public delete(callback: () => void, errorCallback: (err: any) => void) {
        // Dispatch event on the network.
        Model.eventHub.publish("action_permission_delete_event", this.id, false)
    }
}

/**
 * Ressource permissions are use to manage who can access ressource on the server.
 */
export class RessourcePermission extends Permission {
    // The path of the permission.
    private path: string;

    // The owner of the permssion.
    private owner: string;

    constructor(id: string, permission: PermissionType, path: string, owner: string) {
        super(id, permission)
        this.path = path;
        this.owner = owner;
    }

    /** Save a ressource */
    public save(callback: () => void, errorCallback: (err: any) => void) {
        Model.eventHub.publish("ressource_permission_change_event", { id: this.id, permission: this.permission }, false)
    }

    /** Delete a ressource */
    public delete(callback: () => void, errorCallback: (err: any) => void) {
        Model.eventHub.publish("delete_permission_delete_event", this.id, false)
    }
}