import { Model } from "./Model";
import { ApplicationView } from "./ApplicationView";
import {Account} from "./Account"
import * as resource from "globular-web-client/resource/resource_pb";

/**
 * The session object will keep information about the
 * the account.
 */
 export enum SessionState {
    Online,
    Offline,
    Away
}

export class Session extends Model {
    // private members.
    private _id: string;
    private account: Account;
    private state_: SessionState;
    private lastStateTime_: Date; // Keep track ot the last session state.

    public get lastStateTime(): Date {
        return this.lastStateTime_;
    }
    public set lastStateTime(value: Date) {
        this.lastStateTime_ = value;
    }

    public get state(): SessionState {
        return this.state_;
    }

    // Set the session state.
    public set state(value: SessionState) {
        this.state_ = value;
        this.lastStateTime = new Date();
    }

    // The link to the account.
    constructor(account: Account, state: number = 1, lastStateTime?: number) {
        super();
        this.account = account;
        this._id = this.account.id;

        if (state == 0) {
            this.state = SessionState.Online;
        } else if (state == 1) {
            this.state = SessionState.Offline;
        } else if (state == 2) {
            this.state = SessionState.Away;
        }

        if (lastStateTime != undefined) {
            this.lastStateTime = new Date(lastStateTime * 1000)
        }

        // So here I will lisen on session change event and keep this object with it.
        Model.eventHub.subscribe(`session_state_${this.account.id}_change_event`,
            (uuid: string) => {
                /** nothing special here... */
            },
            (evt: string) => {
                let obj = JSON.parse(evt)
                // update the session state from the network.
                this.state_ = obj.state;
                this.lastStateTime = new Date(obj.lastStateTime * 1000); // a number to date

            }, false)

        Model.eventHub.subscribe(`__session_state_${this.account.id}_change_event__`,
            (uuid: string) => {
                /** nothing special here... */
            },
            (obj: any) => {
                console.log("session state was change...")
                // Set the object state from the object and save it...
                this.state_ = obj.state;
                this.lastStateTime =  obj.lastStateTime; // already a date

                this.save(() => {
                    /* nothing here*/
                }, (err: any) => {
                    ApplicationView.displayMessage(err, 3000)
                })
            }, true)
    }

    initData(initCallback: () => void, errorCallback: (err: any) => void) {

        // In that case I will get the values from the database...
        let rqst = new resource.GetSessionRequest

        // Find the account by id or by name... both must be unique in the backend.
        rqst.setAccountid(this.account.id)

        // call persist data
        Model.globular.resourceService
            .getSession(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: resource.GetSessionResponse) => {
                let obj = rsp.getSession()
                this._id = obj.getAccountid();
                this.state_ = obj.getState().valueOf();
                this.lastStateTime = new Date(obj.getLastStateTime() * 1000);
                Account.getAccount(this._id , 
                    (account: Account)=>{
                        // Here I will connect local event to react with interface element...
                        this.account = account;
                        initCallback()
                    }, errorCallback)

            })
            .catch((err: any) => {
                // In that case I will save defaut session values...
                this.save(() => {
                    initCallback()
                }, errorCallback)
            });
    }

    toString(): string {
        // return the basic infomration to be store in the database.
        return `{"_id":"${this._id}", "state":${this.state.toString()}, "lastStateTime":"${ Math.floor(this.lastStateTime.getTime()/1000)}"}`
    }

    // Init from the db...
    fromObject(obj: any) {

        this._id = obj._id;
        Account.getAccount(this._id, (account:Account)=>{this.account = account}, (err:any)=>{console.log(err)})

        if (obj.state == 0) {
            this.state = SessionState.Online;
        } else if (obj.state == 1) {
            this.state = SessionState.Offline;
        } else if (obj.state == 2) {
            this.state = SessionState.Away;
        }
        this.lastStateTime = new Date(obj.lastStateTime * 1000);
    }

    // Save session state in the databese.
    save(onSave: () => void, onError: (err: any) => void) {
        let rqst = new resource.UpdateSessionRequest;
        let session = new resource.Session;

        // save the actual session informations.
        session.setAccountid(this.account.id)
        session.setLastStateTime(Math.floor(this.lastStateTime.getTime()/1000))
        if(this.state == SessionState.Away){
            session.setState( resource.SessionState.AWAY)
        }else if(this.state == SessionState.Online){
            session.setState( resource.SessionState.ONLINE)
        }else if(this.state == SessionState.Offline){
            session.setState( resource.SessionState.OFFLINE)
        }
        
        session.setExpireAt(parseInt(localStorage.getItem("token_expired")))
        
        rqst.setSession(session)
        // call persist data
        Model.globular.resourceService
            .updateSession(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: resource.UpdateSessionResponse) => {
                // Here I will return the value with it
                Model.eventHub.publish(`session_state_${this._id}_change_event`, this.toString(), false)
                onSave();
            })
            .catch((err: any) => {
                onError(err);
            });
    }
}
