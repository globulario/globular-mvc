import { Model, generatePeerToken } from "./Model";
import { FindOneRqst, FindResp, FindRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import * as ResourceService from "globular-web-client/resource/resource_pb";
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility";
import { Group } from "./Group";
import { Session } from "./Session"
import { ApplicationView } from "./ApplicationView";
import { Application } from "./Application";
import { Globular } from "globular-web-client";

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

    // The domain where the account came from.
    private _domain: string;
    public get domain(): string {
        return this._domain;
    }
    public set domain(value: string) {
        this._domain = value;
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
    private profile_picture: string;
    public get profilePicture(): string {
        return this.profile_picture;
    }

    public set profilePicture(value: string) {
        this.profile_picture = value;
    }

    // The ringtone for that user...
    private ringtone_: string;
    public get ringtone(): string {
        return this.ringtone_;
    }

    public set ringtone(value: string) {
        this.ringtone_ = value;
    }

    // The user firt name
    private first_name: string;
    public get firstName(): string {
        return this.first_name;
    }
    public set firstName(value: string) {
        this.first_name = value;
    }

    // The user last name
    private last_name: string;
    public get lastName(): string {
        return this.last_name;
    }
    public set lastName(value: string) {
        this.last_name = value;
    }

    // The user middle name.
    private middle_name: string;
    public get middleName(): string {
        return this.middle_name;
    }
    public set middleName(value: string) {
        this.middle_name = value;
    }

    public get userName(): string {
        let name = this.firstName;
        if (this.middle_name.length > 0) {
            name += " " + this.middle_name;
        }

        return name + " " + this.lastName;
    }

    constructor(id: string, email: string, name: string, domain: string, firstName: string, lastName: string, middleName: string, profilePicture: string) {
        super();

        this.hasData = false;
        this._id = id;
        this.name = name;
        this.domain = domain;
        this.email_ = email;
        this.first_name = firstName;
        this.last_name = lastName;
        this.middle_name = middleName;
        this.profile_picture = profilePicture
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

        let accountId = id
        let domain = Model.domain

        if (accountId.indexOf("@") == -1) {
            accountId = id + "@" + domain
        } else {
            domain = accountId.split("@")[1]
            id = accountId.split("@")[0]
        }

        if (Account.accounts[accountId] != null) {
            if (Account.accounts[accountId].session != null) {
                successCallback(Account.accounts[accountId]);
                return
            }
        }

        let globule = Model.getGlobule(domain)
        if (!globule) {
            let jsonStr = localStorage.getItem(accountId)
            if(jsonStr){
                let account = Account.fromString(jsonStr)
                successCallback(account)
            }else{
                errorCallback("no globule was found at domain " + domain)
            }
            return
        }

        generatePeerToken(globule, token => {


            let rqst = new ResourceService.GetAccountsRqst
            rqst.setQuery(`{"_id":"${id}"}`); // search by name and not id... the id will be retreived.
            rqst.setOptions(`[{"Projection":{"_id":1, "email":1, "name":1, "groups":1, "organizations":1, "roles":1, "domain":1}}]`);

            let globule = Model.getGlobule(domain)
            if (globule) {

                let stream = globule.resourceService.getAccounts(rqst, { domain: domain, application: Model.application, token: token })
                let data: ResourceService.Account;

                stream.on("data", (rsp) => {
                    if (!data) {
                        data = rsp.getAccountsList().pop()
                    }
                });

                stream.on("status", (status) => {
                    if (status.code == 0) {

                        // so here I will get the session for the account...
                        if (Account.accounts[accountId] != null) {
                            if (Account.accounts[accountId].session != null) {
                                successCallback(Account.accounts[accountId]);
                                return
                            }

                        }

                        // Initialyse the data...
                        if (!data) {
                            errorCallback("no account found with id " + accountId)
                            return
                        }

                        let account = new Account(data.getId(), data.getEmail(), data.getName(), data.getDomain(), data.getFirstname(), data.getLastname(), data.getMiddle(), data.getProfilepicture())
                        account.session = new Session(account)
                        Account.accounts[accountId] = account;

                        account.session.initData(() => {
                            // here I will initialyse groups...
                            account.groups_ = data.getGroupsList();

                            if(!Application.account){
                                successCallback(account)
                                return
                            }

                            if (account.id == Application.account.id) {
                                account.initData(() => {
                                    successCallback(account)
                                }, errorCallback)
                            } else {
                                // I will keep the account in the cache...
                                localStorage.setItem(account.id + "@" + account.domain, account.toString())
                                successCallback(account)
                            }

                        }, errorCallback)

                    } else {
                        let jsonStr = localStorage.getItem(accountId)
                        if(jsonStr){
                            let account = Account.fromString(jsonStr)
                            successCallback(account)
                        }else{
                            errorCallback(status.details);
                        }
                    }
                })
            }
        }, err => ApplicationView.displayMessage(err, 3000))
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
        Account.accounts[a.id + "@" + a.domain] = a;
    }

    private static getListener(id: string) {
        if (Account.listeners == undefined) {
            return null;
        }
        return Account.listeners[id];
    }

    // Keep track of the listener.
    private static setListener(id: string, domain: string, uuid: string) {
        if (Account.listeners == undefined) {
            Account.listeners = {};
        }
        Account.listeners[id + "@" + domain] = uuid;
        return
    }

    private static unsetListener(id: string, domain: string) {
        let uuid = Account.getListener(id + "@" + domain);
        if (uuid != null) {
            Model.getGlobule(domain).eventHub.unSubscribe(`update_account_${id + "@" + domain}_data_evt`, uuid);
        }
    }

    /**
     * Read user data one result at time.
     */
    private static readOneUserData(
        query: string,
        userName: string,
        userDomain: string,
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

        let globule = Model.getGlobule(userDomain)
        generatePeerToken(globule, token => {
            // call persist data
            Model.getGlobule(userDomain).persistenceService
                .findOne(rqst, {
                    token: token,
                    application: Model.application,
                    domain: Model.domain // the domain at the origin of the request.
                })
                .then((rsp: any) => {
                    let data = rsp.getResult().toJavaScript();
                    successCallback(data);
                })
                .catch((err: any) => {
                    if (err.code == 13) {

                        if (Application.account == null) {
                            ApplicationView.displayMessage("no connections found on the server you need to login", 3000)
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
        }, err => ApplicationView.displayMessage(err, 3000))


    }

    private setData(data: any) {

        this.hasData = true;
        this.firstName = data["firstName"];
        if (this.firstName == undefined) {
            this.firstName = ""
        }
        this.lastName = data["lastName"];
        if (this.lastName == undefined) {
            this.lastName = ""
        }
        this.middle_name = data["middleName"];
        if (this.middle_name == undefined) {
            this.middle_name = "";
        }
        if (data["profilePicture"] != undefined) {
            this.profilePicture = data["profilePicture"];

            // keep the user data into the localstore.
            localStorage.setItem(this.id + "@" + this.domain, JSON.stringify(data))
        }

    }

    /**
     * Must be called once when the session open.
     * @param account 
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void) {
        let userName = this.name

        if (this.hasData == true) {
            return this
        }

        // Retreive user data... 
        Account.readOneUserData(
            `{"_id":"${this.id}"}`, // The query is made on the user database and not local_ressource Accounts here so name is name_ here
            userName, // The database to search into 
            this.domain,
            (data: any) => {

                if (Object.keys(data).length == 0) {
                    if (localStorage.getItem(this.id) != undefined) {
                        data = JSON.parse(localStorage.getItem(this.id));
                        this.setData(data);
                    }
                } else {
                    this.setData(data);
                }

                // Here I will keep the Account up-to date.
                if (Account.getListener(this.id) == undefined) {
                    // Here I will connect the objet to keep track of accout data change.
                    Model.getGlobule(this.domain).eventHub.subscribe(`update_account_${this.id + "@" + this.domain}_data_evt`,
                        (uuid: string) => {
                            Account.setListener(this.id, this.domain, uuid);
                        },
                        (str: string) => {
                            let data = JSON.parse(str);
                            this.setData(data); // refresh data.
                            // Here I will rethrow the event locally...
                            Model.eventHub.publish(`__update_account_${this.id + "@" + this.domain}_data_evt__`, data, true);
                        }, false, this)
                }

                // Keep in the local map...
                Account.setAccount(this)

                // Init list of contacts.
                Account.getContacts(this, `{}`,
                    (contacts: []) => {
                        // Set the list of contacts (received invitation, sent invitation and actual contact id's)
                        callback(this);

                    }, onError)


            },
            (err: any) => {
                this.hasData = false;
                if (localStorage.getItem(this.id) != undefined) {
                    this.setData(JSON.parse(localStorage.getItem(this.id)))
                    callback(this);
                    return
                }
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
        this.profile_picture = dataUrl;
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
        rqst.setQuery(`{"_id":"${this.id}"}`);
        rqst.setValue(data);
        rqst.setOptions(`[{"upsert": true}]`);

        // So here I will set the address from the address found in the token and not 
        // the address of the client itself.
        let token = localStorage.getItem("user_token")

        // call persist data
        Model.getGlobule(this.domain).persistenceService
            .replaceOne(rqst, {
                token: token,
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                Model.publish(`update_account_${this.id + "@" + this.domain}_data_evt`, data, false)
                callback(this);
            })
            .catch((err: any) => {
                onError(err);
            });
    }

    toString(): string {
        return JSON.stringify({ _id: this.id, email: this.email, first_name: this.firstName, last_name: this.lastName, middle_name: this.middle_name, profile_picture: this.profilePicture });
    }

    static fromObject(obj: any): any {
        return new Account(obj._id, obj.email, obj.name, obj.domain, obj.first_name, obj.last_name, obj.middle_name, obj.profile_picture)  
    }

    static fromString(jsonStr:string):any{
        return Account.fromObject(JSON.parse(jsonStr))
    }

    getId(): string {
        return this._id
    }

    getDomain(): string {
        return this.domain
    }

    getName(): string {
        return this.name_
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

        let token = localStorage.getItem("user_token")
        let globule = Model.getGlobule(account.domain)

        let stream = globule.persistenceService.find(rqst, {
            token: token,
            application: Model.application,
            domain: Model.domain
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
                console.log("fail to retreive contacts with error: ", status.details)
                // In case of error I will return an empty array
                callback([]);
            }
        });
    }

    public static setContact(from: Account, status_from: string, to: Account, status_to: string, successCallback: () => void, errorCallback: (err: any) => void) {

        // So here I will save the contact invitation into pending contact invitation collection...
        let rqst = new ResourceService.SetAccountContactRqst
        rqst.setAccountid(from.id + "@" + from.domain)

        let contact = new ResourceService.Contact
        contact.setId(to.id + "@" + to.domain)
        contact.setStatus(status_from)
        contact.setInvitationtime(Math.round(Date.now() / 1000))

        // Set optional values...
        if (to.ringtone)
            contact.setRingtone(to.ringtone)

        if (to.profilePicture)
            contact.setProfilepicture(to.profilePicture)

        rqst.setContact(contact)
        let token = localStorage.getItem("user_token")
        let globule = Model.getGlobule(from.domain)

        globule.resourceService.setAccountContact(rqst, {
            token: token,
            application: Model.application,
            domain: Model.domain
        })
            .then((rsp: ResourceService.SetAccountContactRsp) => {
                let sentInvitation = `{"_id":"${to.id + "@" + to.domain}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_from}"}`

                Model.getGlobule(from.domain).eventHub.publish(status_from + "_" + from.id + "@" + from.domain + "_evt", sentInvitation, false)
                if (from.domain != to.domain) {
                    Model.getGlobule(to.domain).eventHub.publish(status_from + "_" + from.id + "@" + from.domain + "_evt", sentInvitation, false)
                }

                // Here I will return the value with it
                let rqst = new ResourceService.SetAccountContactRqst
                rqst.setAccountid(to.id + "@" + to.domain)

                let contact = new ResourceService.Contact
                contact.setId(from.id + "@" + from.domain)
                contact.setStatus(status_to)
                contact.setInvitationtime(Math.round(Date.now() / 1000))
                rqst.setContact(contact)
                let token = localStorage.getItem("user_token")

                // call persist data
                Model.getGlobule(to.domain).resourceService
                    .setAccountContact(rqst, {
                        token: token,
                        application: Model.application,
                        domain: Model.domain
                    })
                    .then((rsp: ReplaceOneRsp) => {
                        // Here I will return the value with it
                        let receivedInvitation = `{"_id":"${from.id + "@" + from.domain}", "invitationTime":${Math.floor(Date.now() / 1000)}, "status":"${status_to}"}`
                        Model.getGlobule(from.domain).eventHub.publish(status_to + "_" + to.id + "@" + to.domain + "_evt", receivedInvitation, false)
                        if (from.domain != to.domain) {
                            Model.getGlobule(to.domain).eventHub.publish(status_to + "_" + to.id + "@" + to.domain + "_evt", receivedInvitation, false)
                        }

                        successCallback();
                    })
                    .catch(errorCallback);
            }).catch(errorCallback);
    }

    // Get all accounts from all globules... 
    static getAccounts(query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        let accounts_ = new Array<Account>()
        let connections = Model.getGlobules()

        let _getAccounts_ = () => {
            let globule = connections.pop()

            if (connections.length == 0) {
                Account._getAccounts(globule, query, (accounts: Array<Account>) => {
                    for (var i = 0; i < accounts.length; i++) {
                        let a = accounts[i]
                        if (accounts_.filter(a_ => { return a.id == a_.id && a.domain == a_.domain; }).length == 0) {
                            accounts_.push(a)
                        }
                    }
                    callback(accounts_)
                }, errorCallback)
            } else {
                Account._getAccounts(globule, query, (accounts: Array<Account>) => {
                    for (var i = 0; i < accounts.length; i++) {
                        let a = accounts[i]
                        if (accounts_.filter(a_ => { return a.id == a_.id && a.domain == a_.domain; }).length == 0) {
                            accounts_.push(a)
                        }
                    }
                    _getAccounts_() // get the account from the next globule.
                }, errorCallback)
            }
        }

        // get account from all register peers.
        _getAccounts_()
    }

    // Get all account data from a give globule...
    private static _getAccounts(globule: Globular, query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
        let rqst = new ResourceService.GetAccountsRqst
        rqst.setQuery(query)

        let stream = globule.resourceService.getAccounts(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
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
                if (query == "{}") {
                    accounts_.forEach(a_ => {
                        if (Account.accounts[a_.getId() + "@" + a_.getDomain()] != undefined) {
                            accounts.push(Account.accounts[a_.getId() + "@" + a_.getDomain()])
                        } else {
                            let account = new Account(a_.getId(), a_.getEmail(), a_.getName(), a_.getDomain(), a_.getFirstname(), a_.getLastname(), a_.getMiddle(), a_.getProfilepicture())
                            accounts.push(account)
                        }
                    })
                    callback(accounts)
                    return
                }

                let initAccountData = () => {
                    let a_ = accounts_.pop()
                    if (Account.accounts[a_.getId() + "@" + a_.getDomain()] == undefined) {
                        let a = new Account(a_.getId(), a_.getEmail(), a_.getName(), a_.getDomain(), a_.getFirstname(), a_.getLastname(), a_.getMiddle(), a_.getProfilepicture())

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
                        accounts.push(Account.accounts[a_.getId() + "@" + a_.getDomain()])
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
