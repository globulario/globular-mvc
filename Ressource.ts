import { Model } from './Model';
import { Permission } from './Permission';
import { getRessourceOwners, getRessourcePermissions } from 'globular-web-client/api';


/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service), 
 * Stored object (form storage service) can be use as ressource. 
 */
export class Ressource extends Model {

    /**
     * A unique identifier.
     */
    private _id: string;
    public get id(): string {
        return this._id;
    }

    /**
     * The path of the ressource.
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
     * The size of the ressource on the server.
     */
    private _size: number;
    public get size(): number {
        return this._size;
    }

    /**
     * The ressource constructor.
     * @param path The path of the ressource must be unique.
     * @param id The unique identifier
     * @param modified The last modified time
     * @param size The size of the ressource on the server.
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
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback 
     */
    save(callback: (ressource: Ressource) => void, errorCallback: (err: any) => void) {
        if(this._id == undefined){
            
        }else{

        }
    }

    delete(callback: () => void, errorCallback: (err: any) => void) {

    }

    /**
     * Return the list of permission define for that ressource.
     * @param callback 
     * @param errorCallback 
     */
    getPermissions(callback: (permissions: Array<Permission>) => void, errorCallback: (err: any) => void) {
        getRessourcePermissions(Model.globular, this.path,
            (data: Array<any>) => {
                /** TODO tranform data here */
                console.log(data)
            }, errorCallback)
    }

    /**
     * Return the list of account that can own the ressource.
     * @param callback 
     * @param errorCallback 
     */
    getOwners(callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        getRessourceOwners(Model.globular, this.path,
            (data: Array<any>) => {
                /** TODO tranform data here */
                console.log(data)
                
            }, errorCallback)
    }
}
