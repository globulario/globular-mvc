import { Model } from './Model';
import { Permission } from './Permission';
/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service),
 * Stored object (form storage service) can be use as ressource.
 */
export declare class Ressource extends Model {
    /**
     * A unique identifier.
     */
    private _id;
    get id(): string;
    /**
     * The path of the ressource.
     */
    private _path;
    get path(): string;
    /**
     * The modified date
     */
    private _modified;
    get modified(): Date;
    /**
     * The size of the ressource on the server.
     */
    private _size;
    get size(): number;
    /**
     * The ressource constructor.
     * @param path The path of the ressource must be unique.
     * @param id The unique identifier
     * @param modified The last modified time
     * @param size The size of the ressource on the server.
     */
    constructor(path: string, id?: string, modified?: Date, size?: number);
    /**
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback
     */
    save(callback: (ressource: Ressource) => void, errorCallback: (err: any) => void): void;
    delete(callback: () => void, errorCallback: (err: any) => void): void;
    /**
     * Return the list of permission define for that ressource.
     * @param callback
     * @param errorCallback
     */
    getPermissions(callback: (permissions: Array<Permission>) => void, errorCallback: (err: any) => void): void;
    /**
     * Return the list of account that can own the ressource.
     * @param callback
     * @param errorCallback
     */
    getOwners(callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void): void;
}
