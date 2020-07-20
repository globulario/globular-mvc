import { Model } from './Model';
import { ActionPermission } from './Permission';
import { RessourcePermission } from 'globular-web-client/lib/ressource/ressource_pb';

/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service), 
 * Stored object (form storage service) can be use as ressource. 
 */
class Ressource extends Model{

    /**
     * A unique identifier.
     */
    protected id: string;

    /**
     * The ressource parent, must also be a ressource.
     */
    protected _parent: Ressource;

    /**
     * The modified date
     */
    protected _modified: Date;
    public get modified(): Date {
        return this._modified;
    }

    /**
     * The size of the ressource on the server.
     */
    protected _size: number;
    public get size(): number {
        return this._size;
    }

    /**
     * Action permission are set by ressource type (class derived from that class)
     */
    protected static actionPermissions = new Array<ActionPermission>();


    /**
     * Contain the list of permission asscociated with that ressouce.
     */
    protected permissions: Array<RessourcePermission>;

    constructor(id?: string,  modified?: Date, size?:number,  parent?: Ressource){
        super();

        // Set attribues if ther is one.
        this.id = id;
        this._parent = parent;
        this._modified = modified;
        this._size = size;

        // The list of permission asscociated with that ressource.
        this.permissions = new Array<RessourcePermission>();
    }

    /**
     * 
     * @param calback 
     */
    init(calback:()=>void){
        /** Not implemented here. */
    }

    /**
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback 
     */
    save(callback: (ressource: Ressource)=>void, errorCallback: (err:any)=>void){
        /** Must be implemented by derived classes */
    }

    delete(callback: ()=>void, errorCallback: (err:any)=>void){
        /** Must be implemented by derived classes */
    }

    read(callback: ()=>void, errorCallback: (err:any)=>void){
        /** Must be implemented by derived classes */
    }

    get parent():Ressource{
        return this.parent;
    }

}

/**
 * That class is use to manage files and directory access.
 */
export class FileRessource extends Ressource{
    constructor(id?: string, modified?: Date, size?:number,  parent?: FileRessource){
        super(id, modified, size, parent)
    }
}