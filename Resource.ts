import { Model } from './Model';
import { Permission } from './Permission';


/**
 * A resource is a recursive data structure. File (from file service), Persistent object (from persistence service), 
 * Stored object (form storage service) can be use as resource. 
 */
export class Resource extends Model {

    /**
     * A unique identifier.
     */
    private _id: string;
    public get id(): string {
        return this._id;
    }

    /**
     * The path of the resource.
     */
    private _path: string;
    public get path(): string {
        return this._path;
    }

    /**
     * The modified date
     */
    private _modified: Date;
    public get modified(): Date {
        return this._modified;
    }

    /**
     * The size of the resource on the server.
     */
    private _size: number;
    public get size(): number {
        return this._size;
    }

    /**
     * The resource constructor.
     * @param path The path of the resource must be unique.
     * @param id The unique identifier
     * @param modified The last modified time
     * @param size The size of the resource on the server.
     */
    constructor(path: string, id?: string, modified?: Date, size?: number) {
        super();

        // Set attribues if ther is one.
        this._id = id;
        this._modified = modified;
        this._size = size;
        this._path = path;
    }

    /**
     * Save (create/update) a resource on the server.
     * @param callback The succes callback
     * @param errorCallback 
     */
    save(callback: (resource: Resource) => void, errorCallback: (err: any) => void) {
        if(this._id == undefined){
            
        }else{

        }
    }

    delete(callback: () => void, errorCallback: (err: any) => void) {

    }

    /**
     * Return the list of permission define for that resource.
     * @param callback 
     * @param errorCallback 
     */
    getPermissions(callback: (permissions: Array<Permission>) => void, errorCallback: (err: any) => void) {
        errorCallback("Not implemented!")
    }

    /**
     * Return the list of account that can own the resource.
     * @param callback 
     * @param errorCallback 
     */
    getOwners(callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        errorCallback("Not implemented")
    }
}
