import { Model } from './Model';
import { Account } from './Account';


/**
 * Role are use to manage 
 */
export class Role extends Model {
    private _id: string;
    private name: string;
    public actions: Array<string>;

    constructor(){
        super()
    }

    /**
     * Return the list of account that can play a given role.
     * @param callback 
     * @param errorCallback 
     */
    getMembers(callback:(members:Array<Account>)=>void, errorCallback:(err:any)=>void){
        
    }
}
