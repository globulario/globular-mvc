import { Model } from './Model';
import { Account } from './Account';
/**
 * Role are use to manage
 */
export declare class Role extends Model {
    private _id;
    private name;
    actions: Array<string>;
    constructor();
    /**
     * Return the list of account that can play a given role.
     * @param callback
     * @param errorCallback
     */
    getMembers(callback: (members: Array<Account>) => void, errorCallback: (err: any) => void): void;
}
