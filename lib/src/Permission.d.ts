import { Model } from './Model';
export declare enum PermissionType {
    None = 0,
    Read = 1,
    Delete = 2,
    Write = 3,
    WriteDelete = 4,
    ReadDelete = 5,
    ReadWrite = 6,
    ReadWriteDelete = 7
}
/**
 * Permission are use to manage ressouces and action access. If no permission are define on action
 * or ressource it make the ressource open and accessible or executable by any user or application.
 * At the moment permission are define on a ressource it became managed and protected by globular.
 */
export declare class Permission extends Model {
    protected id: string;
    protected permission: PermissionType;
    constructor(id: string, permission: PermissionType);
    /** Save a ressource */
    save(callback: () => void, errorCallback: (err: any) => void): void;
    /** Delete a ressource */
    delete(callback: () => void, errorCallback: (err: any) => void): void;
}
/**
 * Action permission it's use to manage who (Application or Role(user's)) can
 * execute action on the server.
 */
export declare class ActionPermission extends Permission {
    private action;
    constructor(id: string, permission: PermissionType, action: string);
    /** Save a ressource */
    save(callback: () => void, errorCallback: (err: any) => void): void;
    /** Delete a ressource */
    delete(callback: () => void, errorCallback: (err: any) => void): void;
}
/**
 * Ressource permission it's use to manage who can access ressource on the server.
 */
export declare class RessourcePermission extends Permission {
    private path;
    private owner;
    constructor(id: string, permission: PermissionType, path: string, owner: string);
    /** Save a ressource */
    save(callback: () => void, errorCallback: (err: any) => void): void;
    /** Delete a ressource */
    delete(callback: () => void, errorCallback: (err: any) => void): void;
}
