import { Model } from "./Model";
import { FindOneRqst, FindResp, FindRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import * as ResourceService from "globular-web-client/resource/resource_pb";
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility";
import { Group } from "./Group";
import { Session } from "./Session"
import { ApplicationView } from "./ApplicationView";
import { Application } from "./Application";
/**
 * Basic account class that contain the user id and email.
 */
export class Account extends Model {
    private static listeners: any;
    private static accounts: any;

    private groups_: Array<any>;

    // keep the session information.
    private session_: Session;
    public get session(): Session {
        return this.session_;
    }
    public set session(value: Session) {
        this.session_ = value;
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

        // Set empty session...
        this.session = new Session(this)
    }

    /**
     * Get an account with a given id.
     * @param id The id of the account to retreive
     * @param successCallback Callback when succed
     * @param errorCallback Error Callback.
     */
    public static getAccount(id: string, successCallback: (account: Account) => void, errorCallback: (err: any) => void) {
        if (id.length == 0) {
            errorCallback("No account id given to getAccount function!")
            return
        }
        if (Account.accounts == null) {
            // Set the accouts map
            Account.accounts = {}
        }

        if (Account.accounts[id] != null) {
            successCallback(Account.accounts[id]);
            return
        }

        let rqst = new ResourceService.GetAccountsRqst
        rqst.setQuery(`{"$or":[{"_id":"${id}"},{"name":"${id}"} ]}`); // search by name and not id... the id will be retreived.
        rqst.setOptions(`[{"Projection":{"_id":1, "email":1, "name":1, "groups":1, "organizations":1, "roles":1}}]`);

        let stream = Model.globular.resourceService.getAccounts(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
        let accounts_ = new Array<ResourceService.Account>();

        stream.on("data", (rsp) => {
            accounts_ = accounts_.concat(rsp.getAccountsList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                let data = accounts_[0]
                let account = new Account(data.getId(), data.getEmail(), data.getName())

                // so here I will get the session for the account...
                account.session = new Session(account)

                account.initData(() => {
                    Account.accounts[data.getId()] = account;
                    // here I will initialyse groups...
                    account.groups_ = data.getGroupsList();
                    successCallback(account)
                }, errorCallback)
            } else {
                errorCallback(status.details);
            }
        })
    }

    /**
     * Initialyse account groups.
     * @param obj The account data from the persistence store.
     * @param successCallback 
     * @param errorCallback 
     */
    public getGroups(successCallback: (groups: Array<Group>) => void) {
        let groups_ = new Array<Group>();
        if (this.groups_ == undefined) {
            successCallback([])
            return
        }

        if (this.groups_.length == 0) {
            successCallback([])
            return
        }

        // Initi the group.
        let setGroup_ = (index: number) => {
            if (index < this.groups_.length) {
                let groupId = this.groups_[index]["$id"]
                Group.getGroup(groupId, (g: Group) => {
                    groups_.push(g)
                    index++
                    setGroup_(index);

                }, () => {
                    index++
                    if (index < this.groups_.length) {
                        setGroup_(index);
                    } else {
                        successCallback(groups_);
                    }
                })
            } else {
                successCallback(groups_);
            }
        }

        // start the recursion.
        setGroup_(0)
    }

    // Test if a account is member of a given group.
    isMemberOf(id: string): boolean {
        this.groups_.forEach((g: any) => {
            if (g._id == id) {
                // be sure the account is in the group reference list...
                return g.hasMember(this)
            }
        })
        return false;
    }

    public static setAccount(a: Account) {
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

        // remove unwanted characters
        let id = userName.split("@").join("_").split(".").join("_")
        let db = id + "_db";

        // set the connection id.
        rqst.setId(id);
        rqst.setDatabase(db);

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

                    if (Application.account == null) {
                        ApplicationView.displayMessage("no connection found on the server you need to login", 3000)
                        setTimeout(() => {
                            localStorage.removeItem("remember_me");
                            localStorage.removeItem("user_token");
                            localStorage.removeItem("user_id");
                            localStorage.removeItem("user_name");
                            localStorage.removeItem("user_email");
                            localStorage.removeItem("token_expired");
                            location.reload();
                            return;
                        }, 3000)
                    }

                    if (Application.account.id == id) {
                        if (err.message.indexOf("no documents in result") != -1) {
                            successCallback({});
                        } else {
                            ApplicationView.displayMessage("no connection found on the server you need to login", 3000)
                            setTimeout(() => {
                                localStorage.removeItem("remember_me");
                                localStorage.removeItem("user_token");
                                localStorage.removeItem("user_id");
                                localStorage.removeItem("user_name");
                                localStorage.removeItem("user_email");
                                localStorage.removeItem("token_expired");
                                location.reload();
                                return;
                            }, 3000)
                        }
                    } else {
                        successCallback({});
                    }
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
            `{"$or":[{"_id":"${this.id}"},{"name":"${this.id}"} ]}`, // The query is made on the user database and not local_ressource Accounts here so name is name_ here
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

                Account.getContacts(this, `{}`,
                    (contacts: []) => {
                        // Set the list of contacts (received invitation, sent invitation and actual contact id's)
                        if (this.session != undefined) {
                            this.session.initData(() => {
                                callback(this);
                            }, onError)
                        } else {
                            callback(this);
                        }
                    },
                    (err: any) => {
                        if (this.session != undefined) {
                            this.session.initData(() => {
                                callback(this);
                            }, onError)
                        } else {
                            callback(this);
                        }
                    })


            },
            (err: any) => {
                this.hasData = false;
                // Call success callback ...
                if (callback != undefined && this.session != null) {
                    this.session.initData(() => {
                        callback(this);
                    }, onError)
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

        // save the user_data
        let rqst = new ReplaceOneRqst();
        let id = userName.split("@").join("_").split(".").join("_");
        let db = id + "_db";

        // set the connection infos,
        rqst.setId(id);
        rqst.setDatabase(db);

        let collection = "user_data";
        // save only user data and not the how user info...
        let data = this.toString();
        rqst.setCollection(collection);
        rqst.setQuery(`{"$or":[{"_id":"${this.id}"},{"name":"${this.id}"} ]}`);
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

    toString(): string {
        return JSON.stringify({ _id: this.id, firstName_: this.firstName, lastName_: this.lastName, middleName_: this.middleName, profilPicture_: this.profilPicture });
    }

    static getContacts(account: Account, query: string, callback: (contacts: Array<any>) => void, errorCallback: (err: any) => void) {

        // Insert the notification in the db.
        let rqst = new FindRqst();

        // set connection infos.
        let id = account.name.split("@").join("_").split(".").join("_")
        let db = id + "_db";

        rqst.setId(id);
        rqst.setDatabase(db);

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

    public static setContact(from: Account, status_from: string, to: Account, status_to: string, successCallback: () => void, errorCallback: (err: any) => void) {

        // So here I will save the contact invitation into pending contact invitation collection...
        let rqst = new ResourceService.SetAccountContactRqst
        rqst.setAccountid(from.id)

        let contact = new ResourceService.Contact
        contact.setId(to.id)
        contact.setStatus(status_from)
        contact.setInvitationtime(Math.round(Date.now() / 1000))
        rqst.setContact(contact)

        Model.globular.resourceService.setAccountContact(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain
        })
            .then((rsp: ResourceService.SetAccountContactRsp) => {
                let sentInvitation = `{"_id":"${to.id}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_from}"}`
                Model.eventHub.publish(status_from + "_" + from.id + "_evt", sentInvitation, false)

                // Here I will return the value with it
                let rqst = new ResourceService.SetAccountContactRqst
                rqst.setAccountid(to.id)

                let contact = new ResourceService.Contact
                contact.setId(from.id)
                contact.setStatus(status_to)
                contact.setInvitationtime(Math.round(Date.now() / 1000))
                rqst.setContact(contact)

                // call persist data
                Model.globular.resourceService
                    .setAccountContact(rqst, {
                        token: localStorage.getItem("user_token"),
                        application: Model.application,
                        domain: Model.domain
                    })
                    .then((rsp: ReplaceOneRsp) => {
                        // Here I will return the value with it
                        let receivedInvitation = `{"_id":"${from.id}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_to}"}`
                        Model.eventHub.publish(status_to + "_" + to.id + "_evt", receivedInvitation, false)
                        successCallback();
                    })
                    .catch(errorCallback);
            }).catch(errorCallback);

    }

    // Get all account data...
    static getAccounts(query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        let rqst = new ResourceService.GetAccountsRqst
        rqst.setQuery(query)

        let stream = Model.globular.resourceService.getAccounts(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
        let accounts_ = new Array<ResourceService.Account>();

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

                // In that case I will return the list of account without init ther data
                if(query == "{}"){
                    accounts_.forEach(a_ =>{
                        if(Account.accounts[a_.getId()] != undefined){
                            accounts.push(Account.accounts[a_.getId()])
                        }else{
                            accounts.push(new Account(a_.getId(), a_.getEmail(), a_.getName()))
                        }
                    })
                    callback(accounts)
                    return
                }

                let initAccountData = () => {
                    let a_ = accounts_.pop()
                    if (Account.accounts[a_.getId()] == undefined) {
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
                    } else {
                        accounts.push(Account.accounts[a_.getId()])
                        if (accounts_.length > 0) {
                            initAccountData()
                        } else {
                            callback(accounts)
                        }
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
