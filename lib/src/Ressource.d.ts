import { Model } from './Model';
import { ActionPermission } from './Permission';
import { RessourcePermission } from 'globular-web-client/lib/ressource/ressource_pb';
/**
 * A ressource is a recursive data structure. File (from file service), Persistent object (from persistence service),
 * Stored object (form storage service) can be use as ressource.
 */
declare class Ressource extends Model {
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
    get modified(): Date;
    /**
     * The size of the ressource on the server.
     */
    protected _size: number;
    get size(): number;
    /**
     * Action permission are set by ressource type (class derived from that class)
     */
    protected static actionPermissions: ActionPermission[];
    /**
     * Contain the list of permission asscociated with that ressouce.
     */
    protected permissions: Array<RessourcePermission>;
    constructor(id?: string, modified?: Date, size?: number, parent?: Ressource);
    /**
     *
     * @param calback
     */
    init(calback: () => void): void;
    /**
     * Save (create/update) a ressource on the server.
     * @param callback The succes callback
     * @param errorCallback
     */
    save(callback: (ressource: Ressource) => void, errorCallback: (err: any) => void): void;
    delete(callback: () => void, errorCallback: (err: any) => void): void;
    read(callback: () => void, errorCallback: (err: any) => void): void;
    get parent(): Ressource;
}
/**
 * That class is use to manage files and directory access.
 */
export declare class FileRessource extends Ressource {
    constructor(id?: string, modified?: Date, size?: number, parent?: FileRessource);
}
export {};
