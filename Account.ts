import { Model } from "./Model";
import { FindOneRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/persistence/persistence_pb";
import * as RessourceService from "globular-web-client/resource/resource_pb";

/**
 * Basic account class that contain the user id and email.
 */
export class Account extends Model {

    // Must be unique
    private _id: string;
    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
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

    // Keep list of participants for further chat.
    private contacts: Array<Account>;

    /**
     * Append a new contanct in the list of contact.
     * @param contact The contact to append.
     */
    addContact(contact: Account) {
        let existing = this.contacts.find(x => x.email == this.email)
        if (existing == null) {
            this.contacts.push(contact)
        }
    }

    /**
     * Remove a contact from the list of contact.
     * @param contact The contact to remove
     */
    removeContact(contact: Account) {
        this.contacts = this.contacts.filter(obj => obj !== contact);
    }

    constructor(id: string, email: string) {
        super();

        this._id = id;
        this.email_ = email;
        this.hasData = false;
        this.firstName_ = "";
        this.lastName_ = "";
        this.middleName_ = "";
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

        if (userName == "sa") {
            rqst.setDatabase("local_resource");
        } else {
            let db = userName + "_db";
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

                console.log(data)
                successCallback(data);
            })
            .catch((err: any) => {
                console.log(err)
                if (err.code == 13) {
                    // empty user data...
                    successCallback({});
                } else {
                    errorCallback(err);
                }
            });
    }


    /**
     * Must be called once when the session open.
     * @param account 
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void) {
        let userName = this.id
        
        let jsonStr = localStorage.getItem(userName + "_user_data")
        if(jsonStr == null){
            // Retreive user data...
            Account.readOneUserData(
                `{"_id":"` + userName + `"}`, 
                userName, // The database to search into 
                (data: any) => {
                    this.hasData = true;
                    this.firstName = data["firstName_"];
                    this.lastName = data["lastName_"];
                    this.middleName = data["middleName_"];
                    this.profilPicture = data["profilPicture_"];
                    jsonStr = JSON.stringify(data)
                    localStorage.setItem(userName + "_user_data", jsonStr)
                    if (callback != undefined) {
                        callback(this);
                    }
                },
                (err: any) => {
                    console.log(err)
                    this.hasData = false;
                    // onError(err);
                    console.log("no data found at this time for user ", userName)
                    // Call success callback ...
                    if (callback != undefined) {
                        callback(this);
                    }
                }
            );
        }else{
            // parse the data string and init the account from it.
            let data = JSON.parse(jsonStr)
            this.hasData = true;
            this.firstName = data["firstName_"];
            this.lastName = data["lastName_"];
            this.middleName = data["middleName_"];
            this.profilPicture = data["profilPicture_"];
            if (callback != undefined) {
                callback(this);
            }
        }
    }

    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    changeProfilImage(
        dataUrl: string,
        onSaveAccount: (account: Account) => void,
        onError: (err: any) => void
    ) {
        this.profilPicture_ = dataUrl;
        this.save(onSaveAccount, onError);
    }

    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    save(
        callback: (account: Account) => void,
        onError: (err: any) => void
    ) {
        let userName = this.id;

        let rqst = new ReplaceOneRqst();
        if (userName == "sa") {
            rqst.setId("local_resource");
            rqst.setDatabase("local_resource");
        } else {
            let db = userName + "_db";
            rqst.setId(db);
            rqst.setDatabase(db);
        }

        let collection = "user_data";
        let data = this.toString();
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"` + userName + `"}`);
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
                callback(this);
            })
            .catch((err: any) => {
                onError(err);
            });
    }

    // Get the list of contacts.
    static getContacts(query: string, callback: (accounts: Array<Account>) => void, errorCallback: (err: any) => void) {
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
                    let a = new Account(a_.getId(), a_.getEmail())
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
