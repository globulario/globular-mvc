import { FindOneRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import { Model } from "./Model";
import {Account} from "./Account"

/**
 * Group are use to aggregate accounts.
 */
export class Group extends Model {
    private static listeners: any;
    private static groups: any;

    // The id
    private _id: string;
    public get id(): string {
        return this._id;
    }

    // the name
    private _name: string;
    public get name(): string {
        return this._name;
    }
    public set name(value: string) {
        this._name = value;
    }

    // keep the list members references.
    private members: Array<any>;

    // The model...
    constructor(id:string){
        super();
        this._id = id;
    }

  
    initData(initCallback:()=>void, errorCallback: (err: any)=>void) {

        // In that case I will get the values from the database...
        let rqst = new FindOneRqst();
        rqst.setId("local_resource");
        rqst.setDatabase("local_resource");
        rqst.setCollection("Groups");

        // Find the account by id or by name... both must be unique in the backend.
        rqst.setQuery(`{"_id":"${this._id}"}`); // search by name and not id... the id will be retreived.

        // call persist data
        Model.globular.persistenceService
            .findOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: any) => {
                let obj = rsp.getResult().toJavaScript()
                this.fromObject(obj)

                // keep in the local map.
                Group.groups[this._id] = this

                // Here I will connect local event to react with interface element...
                initCallback()
            })
            .catch(errorCallback);
    }

    // Retreive a given group.
    static getGroup(id: string, successCallback:(g:Group)=>void, errorCallback:(err:any)=>void){
        if(Group.groups == undefined){
            Group.groups = {};
        }
        if(Group.groups[id]!= null){
            successCallback(Group.groups[id])
        }

        // Here I will get the group.
        let g = new Group(id);
        
        g.initData(()=>{
            Group.groups[id] = g;
            successCallback(g)
        }, errorCallback)

    }

    // Save the group.
    save(successCallback:(g:Group)=>void, errorCallback:(err:any)=>void){
        let rqst = new ReplaceOneRqst();
        rqst.setId("local_resource");
        rqst.setDatabase("local_resource");
        let collection = "Groups";
        let data = this.toString();
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"` + this._id + `"}`);
        rqst.setValue(data);
        rqst.setOptions(`[{"upsert": true}]`);

        // call persist data
        Model.globular.persistenceService
            .replaceOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                Model.eventHub.publish(`update_group_${this._id}_data_evt`, data, false)
                successCallback(this);
            })
            .catch((err: any) => {
                errorCallback(err);
            });
    }

    // Return the list of members as Account objects.
    getMembers(successCallback:(members:Array<Account>)=>void, errorCallback:()=>void){
        let members = new Array<Account>();
        if(this.members.length == 0){
            successCallback([])
        }

        // Initi the group.
        let setAccount_ = (index:number)=>{
            if(index < this.members.length){
                let memberId = this.members[index]["$id"]
                Account.getAccount(memberId, (a:Account)=>{
                    members.push(a)
                    index++
                    setAccount_(index);
                    
                }, errorCallback)
            }else{
                successCallback(members);
            }
        }
        
        // start the recursion.
        setAccount_(0)
    }

    // Return true if an account if member of a given group.
    hasMember(account: Account):boolean{
        this.members.forEach((m:any)=>{
            if(m["$id"]==account.id){
                return true;
            }
        })
        return false;
    }

    // Stringnify to save into db.
    toString(): string {
        // return the basic infomration to be store in the database.
        return `{"_id":"${this._id}", "name":"${this.name}", "members":${JSON.stringify(this.members)}}`
    }

    // Initialyse it from object.
    fromObject(obj: any) {
        this._id = obj._id;
        this.name = obj.name;
        this.members = obj.members;
    }

}
