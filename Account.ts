import { Model } from "./Model";
import { FindOneRqst, FindResp, FindRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import * as RessourceService from "globular-web-client/resource/resource_pb";
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility";

/**
 * Basic account class that contain the user id and email.
 */
export class Account extends Model {
    private static listeners: any;
    private static accounts: any;

    // Set the list of contact informations.
    private _contacts: Array<any>;
    public get contacts(): Array<any> {
        return this._contacts;
    }
    public set contacts(value: Array<any>) {
        this._contacts = value;
    }

    // Must be unique
    private _id: string;
    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    private name_: string;
    public get name(): string {
        return this.name_;
    }
    public set name(value: string) {
        this.name_ = value;
    }

    // Must be unique.
    private email_: string;
    public get email(): string {
        return this.email_;
    }
    public set email(value: string) {
        this.email_ = value;
    }

    // complementary information.
    private hasData: boolean;

    // The user profile picture.
    private profilPicture_: string;
    public get profilPicture(): string {
        return this.profilPicture_;
    }

    public set profilPicture(value: string) {
        this.profilPicture_ = value;
    }

    // The user firt name
    private firstName_: string;
    public get firstName(): string {
        return this.firstName_;
    }
    public set firstName(value: string) {
        this.firstName_ = value;
    }

    // The user last name
    private lastName_: string;
    public get lastName(): string {
        return this.lastName_;
    }
    public set lastName(value: string) {
        this.lastName_ = value;
    }

    // The user middle name.
    private middleName_: string;
    public get middleName(): string {
        return this.middleName_;
    }
    public set middleName(value: string) {
        this.middleName_ = value;
    }

    public get userName(): string {
        let name = this.firstName;
        if (this.middleName.length > 0) {
            name += " " + this.middleName;
        }

        return name + " " + this.lastName;
    }

    constructor(id: string, email: string, name: string) {
        super();

        this._id = id;
        this.name_ = name;
        this.email_ = email;
        this.hasData = false;
        this.firstName_ = "";
        this.lastName_ = "";
        this.middleName_ = "";
    }

    /**
     * Get an account with a given id.
     * @param id The id of the account to retreive
     * @param successCallback Callback when succed
     * @param errorCallback Error Callback.
     */
    private static getAccount(id: string, successCallback: (account: Account) => void, errorCallback: (err: any) => void) {
        if (Account.accounts != null) {
            if (Account.accounts[id] != null) {
                successCallback(Account.accounts[id]);
                return
            }
        }

        let rqst = new FindOneRqst();
        rqst.setId("local_resource");
        rqst.setDatabase("local_resource");

        let collection = "Accounts";
        rqst.setCollection(collection);

        // Find the account by id or by name... both must be unique in the backend.
        rqst.setQuery(`{"name":"${id}"}`); // search by name and not id... the id will be retreived.
        rqst.setOptions(`[{"Projection":{"_id":1, "email":1, "name":1}}]`);

        // call persist data
        Model.globular.persistenceService
            .findOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: any) => {
                let data = rsp.getResult().toJavaScript();
                let account = new Account(data._id, data.email, data.name)
                account.initData(successCallback, errorCallback)
            })
            .catch((err: any) => {
                errorCallback(err);
            });
    }

    private static setAccount(a: Account) {
        if (Account.accounts == null) {
            Account.accounts = []
        }
        Account.accounts[a.id] = a;
    }

    private static getListener(id: string) {
        if (Account.listeners == undefined) {
            return null;
        }
        return Account.listeners[id];
    }

    // Keep track of the listener.
    private static setListener(id: string, uuid: string) {
        if (Account.listeners == undefined) {
            Account.listeners = {};
        }
        Account.listeners[id] = uuid;
        return
    }

    private static unsetListener(id: string) {
        let uuid = Account.getListener(id);
        if (uuid != null) {
            Model.eventHub.unSubscribe(`update_account_${id}_data_evt`, uuid);
        }
    }

    /**
     * Read user data one result at time.
     */
    private static readOneUserData(
        query: string,
        userName: string,
        successCallback: (results: any) => void,
        errorCallback: (err: any) => void
    ) {
        let rqst = new FindOneRqst();
        rqst.setId("local_resource");

        // remove unwanted characters
        if (userName == "sa") {
            rqst.setDatabase("local_resource");
        } else {
            let db =  userName.split("@").join("_").split(".").join("_") + "_db";
            rqst.setDatabase(db);
        }

        let collection = "user_data";
        rqst.setCollection(collection);
        rqst.setQuery(query);
        rqst.setOptions("");

        // call persist data
        Model.globular.persistenceService
            .findOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: any) => {
                let data = rsp.getResult().toJavaScript();
                successCallback(data);
            })
            .catch((err: any) => {
                if (err.code == 13) {
                    // empty user data...
                    successCallback({});
                } else {
                    errorCallback(err);
                }
            });
    }

    private setData(data: any) {
        this.hasData = true;
        this.firstName = data["firstName_"];
        if (this.firstName == undefined) {
            this.firstName = ""
        }
        this.lastName = data["lastName_"];
        if (this.lastName == undefined) {
            this.lastName = ""
        }
        this.middleName = data["middleName_"];
        if (this.middleName == undefined) {
            this.middleName = "";
        }
        this.profilPicture = data["profilPicture_"];
    }

    /**
     * Must be called once when the session open.
     * @param account 
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void) {
        let userName = this.name
        // Retreive user data...
        Account.readOneUserData(
            `{"name_":"` + userName + `"}`, // The query is made on the user database and not local_ressource Accounts here so name is name_ here
            userName, // The database to search into 
            (data: any) => {

                this.setData(data);

                // Here I will keep the Account up-to date.
                if (Account.getListener(this.id) == undefined) {
                    // Here I will connect the objet to keep track of accout data change.
                    Model.eventHub.subscribe(`update_account_${this.id}_data_evt`,
                        (uuid: string) => {
                            Account.setListener(this.id, uuid);
                        },
                        (str: string) => {
                            let data = JSON.parse(str);
                            this.setData(data); // refresh data.
                            // Here I will rethrow the event locally...
                            Model.eventHub.publish(`__update_account_${this.id}_data_evt__`, data, true);
                        }, false)
                }

                // Keep in the local map...
                Account.setAccount(this)

                Account.getContacts(this.name, `{}`, 
                (contacts:[])=>{
                    // Set the list of contacts (received invitation, sent invitation and actual contact id's)
                    this.contacts = contacts;
                    callback(this);
                }, 
                (err:any)=>{
                    callback(this);
                })

               
            },
            (err: any) => {
                this.hasData = false;
                // onError(err);
                // Call success callback ...
                if (callback != undefined) {
                    callback(this);
                }
            }
        );
    }

    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    changeProfilImage(
        dataUrl: string
    ) {
        this.profilPicture_ = dataUrl;
    }

    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    save(
        callback: (account: Account) => void,
        onError: (err: any) => void
    ) {
        let userName = this.name;

        let rqst = new ReplaceOneRqst();
        if (userName == "sa") {
            rqst.setId("local_resource");
            rqst.setDatabase("local_resource");
        } else {
            let db = userName.split("@").join("_").split(".").join("_") + "_db";
            rqst.setId(db);
            rqst.setDatabase(db);
        }

        let collection = "user_data";
        let data = this.toString();
        rqst.setCollection(collection);
        rqst.setQuery(`{"name":"` + userName + `"}`);
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
                Model.eventHub.publish(`update_account_${this.id}_data_evt`, data, false)
                callback(this);
            })
            .catch((err: any) => {
                onError(err);
            });
    }

    static getContacts(userName: string, query: string, callback: (contacts: Array<any>) => void, errorCallback: (err: any) => void) {

        // Insert the notification in the db.
        let rqst = new FindRqst();
        rqst.setId("local_resource");

        if (userName == "sa") {
            rqst.setId("local_resource");

        } else {
            let db = userName.split("@").join("_").split(".").join("_") + "_db";
            rqst.setDatabase(db);
        }

        rqst.setCollection("Contacts");
        rqst.setQuery(query);
        let stream = Model.globular.persistenceService.find(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        });

        let data: any;
        data = [];

        stream.on("data", (rsp: FindResp) => {
            data = mergeTypedArrays(data, rsp.getData());
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                uint8arrayToStringMethod(data, (str: string) => {
                    callback(JSON.parse(str));
                });
            } else {
                // In case of error I will return an empty array
                callback([]);
            }
        });
    }

    public static setContact(from: string, status_from: string, to: string, status_to: string, successCallback: () => void, errorCallback: (err: any) => void) {
        // So here I will save the contact invitation into pending contact invitation collection...
        let rqst = new ReplaceOneRqst();
        rqst.setId("local_resource");
        if (from == "sa") {
            rqst.setDatabase("local_resource");
        } else {
            let db = from.split("@").join("_").split(".").join("_") + "_db";
            rqst.setDatabase(db);
        }

        // Keep track of pending sended invitations.
        let collection = "Contacts";
        rqst.setCollection(collection);

        rqst.setQuery(`{"_id":"${to}"}`);
        let sentInvitation = `{"_id":"${to}", "invitationTime":${new Date().getTime()}, "status":"${status_from}"}`
        rqst.setValue(sentInvitation);
        rqst.setOptions(`[{"upsert": true}]`);

        // call persist data
        Model.globular.persistenceService
            .replaceOne(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: ReplaceOneRsp) => {

                // So Here I will send network event...
                Model.eventHub.publish( status_from + "_" + from + "_evt", sentInvitation, false)

                // Here I will return the value with it
                let rqst = new ReplaceOneRqst();
                rqst.setId("local_resource");

                if (to == "sa") {
                    rqst.setDatabase("local_resource");
                } else {
                    let db = to.split("@").join("_").split(".").join("_") + "_db";
                    rqst.setDatabase(db);
                }

                // Keep track of pending sended invitations.
                let collection = "Contacts";
                rqst.setCollection(collection);

                rqst.setQuery(`{"_id":"${from}"}`);
                let receivedInvitation = `{"_id":"${from}", "invitationTime":${new Date().getTime()}, "status":"${status_to}"}`
                rqst.setValue(receivedInvitation);
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
                        Model.eventHub.publish(status_to + "_" + to + "_evt", receivedInvitation, false)
                        successCallback();

                    })
                    .catch(errorCallback);
            })
            .catch(errorCallback);
    }

    // Get all account data...
    static getAccounts(query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        let rqst = new RessourceService.GetAccountsRqst
        rqst.setQuery(query)

        let stream = Model.globular.resourceService.getAccounts(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
        let accounts_ = new Array<RessourceService.Account>();

        stream.on("data", (rsp) => {
            accounts_ = accounts_.concat(rsp.getAccountsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                let accounts = new Array<Account>();

                if (accounts_.length == 0) {
                    callback(accounts);
                    return;
                }

                let initAccountData = () => {
                    let a_ = accounts_.pop()
                    let a = new Account(a_.getId(), a_.getEmail(), a_.getName())
                    if (accounts_.length > 0) {
                        a.initData(() => {
                            accounts.push(a)
                            initAccountData()
                        }, errorCallback)
                    } else {
                        a.initData(
                            () => {
                                accounts.push(a)
                                callback(accounts)
                            }, errorCallback)
                    }
                }

                // intialyse the account data.
                initAccountData();

            } else {
                // In case of error I will return an empty array
                errorCallback(status.details)
            }
        });
    }
}
