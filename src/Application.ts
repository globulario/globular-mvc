import { Model } from "./Model";
import * as ressource from "globular-web-client/lib/ressource/ressource_pb";
import * as jwt from "jwt-decode";
import { ApplicationView } from "./ApplicationView"
import * as persistence from "globular-web-client/lib/persistence/persistencepb/persistence_pb";

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
    private readOneUserData(
        query: string,
        successCallback: (results: any) => void,
        errorCallback: (err: any) => void
    ) {
        let userName = localStorage.getItem("user_name");
        let database = userName + "_db";
        let collection = "user_data";

        let rqst = new persistence.FindOneRqst();
        rqst.setId(database);
        rqst.setDatabase(database);
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
                successCallback(JSON.parse(rsp.getJsonstr()));
            })
            .catch((err: any) => {
                errorCallback(err);
            });
    }


    /**
     * Must be called once when the session open.
     * @param account 
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void) {
        let userName = this.id

        // Retreive user data...
        this.readOneUserData(
            `{"_id":"` + userName + `"}`,
            (data: any) => {
                this.hasData = true;
                this.firstName = data["firstName_"];
                this.lastName = data["lastName_"];
                this.middleName = data["middleName_"];
                this.profilPicture = data["profilPicture_"];
                if (callback != undefined) {
                    callback(this);
                }
            },
            (err: any) => {
                this.hasData = false;
                onError(err);
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
        dataUrl: string,
        onSaveAccount: (account: Account) => void,
        onError: (err: any, account: Account) => void
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
        onError: (err: any, account: Account) => void
    ) {
        let userName = this.id;
        let database = userName + "_db";
        let collection = "user_data";
        let data = this.toString();

        let rqst = new persistence.ReplaceOneRqst();
        rqst.setId(database);
        rqst.setDatabase(database);
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
            .then((rsp: persistence.ReplaceOneRsp) => {
                // Here I will return the value with it
                callback(this);
            })
            .catch((err: any) => {
                onError(err, this);
            });
    }

    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    toString(): string {
        return JSON.stringify(this)
    }
}

/**
 * That class can be use to create any other application.
 */
export class Application extends Model {
    private name: string;
    private account: Account;

    // Event listener's
    private login_event_listener: string
    private register_event_listener: string

    /**
     * Create a new application with a given name. The view 
     * can be any ApplicationView or derived ApplicationView class.
     * @param name The name of the application.
     */
    constructor(name: string, view: ApplicationView) {
        super()

        // The application name.
        this.name = name;
        Model.application = this.name; // set the application in model.
        this.view = view;
    }

    /**
     * Connect the listner's and call the initcallback.
     * @param initCallback 
     * @param errorCallback 
     * @param adminPort 
     * @param adminProxy 
     */
    init(initCallback: () => void, errorCallback: (err: any) => void, adminPort: number = 10001, adminProxy: number = 10002) {
        super.init(() => {
            // Here I will connect the listener's

            // The login event.
            Model.eventHub.subscribe("login_event_",
                (uuid: string) => {
                    this.login_event_listener = uuid
                },
                (evt: any) => {
                    // Here I will try to login the user.
                    this.login(evt.userId, evt.pwd,
                        (data: any) => {
                            console.log("--> login succeed!", data)
                        },
                        (err: any) => {
                            this.view.displayMessage(err, 4000)
                        })

                }, true)
            if (initCallback != undefined) {
                initCallback();
            }

            // The register event.
            Model.eventHub.subscribe("register_event_",
                (uuid: string) => {
                    this.register_event_listener = uuid
                },
                (evt: any) => {
                    // Here I will try to login the user.
                    this.register(evt.userId, evt.email, evt.pwd, evt.repwd,
                        (data: any) => {
                            console.log("--> register succeed!", data)
                        },
                        (err: any) => {
                            this.view.displayMessage(err, 4000)
                        })

                }, true)
            if (initCallback != undefined) {
                initCallback();
            }

        }, errorCallback, adminPort, adminProxy)
    }

    /////////////////////////////////////////////////////
    // Account releated functionality.
    /////////////////////////////////////////////////////

    /**
     * Refresh the token and open a new session if the token is valid.
     */
    private refreshToken(
        onError: (err: any, account: Account) => void
    ) {
        let rqst = new ressource.RefreshTokenRqst();
        rqst.setToken(localStorage.getItem("user_token"));

        Model.globular.ressourceService
            .refreshToken(rqst)
            .then((rsp: ressource.RefreshTokenRsp) => {
                // Refresh the token at session timeout
                let token = rsp.getToken();
                let decoded = jwt(token);
                let userName = (<any>decoded).username;
                let email = (<any>decoded).email;

                // here I will save the user token and user_name in the local storage.
                localStorage.setItem("user_token", token);
                localStorage.setItem("token_expired", (<any>decoded).exp);
                localStorage.setItem("user_name", userName);
                localStorage.setItem("useremail_", email);

                // Set the account
                this.account = new Account(userName, email)

                // Set the account infos...
                this.account.initData(undefined, (err: any) => {
                    // call the error callback.
                    onError(err, this.account)
                })

            })
            .catch(err => {
                // remove old information in that case.
                localStorage.removeItem("remember_me");
                localStorage.removeItem("user_token");
                localStorage.removeItem("user_name");
                localStorage.removeItem("useremail_");
                localStorage.removeItem("token_expired");
                onError(err, this.account);
            });
    }

    /**
     * Refresh the token to keep it usable.
     */
    private startRefreshToken() {
        setInterval(() => {
            let isExpired = parseInt(localStorage.getItem("token_expired"), 10) < Math.floor(Date.now() / 1000);
            if (isExpired) {
                this.refreshToken((err: any) => {
                    // simply display the error on the view.
                    this.view.displayMessage(err)
                })
            }
        }, 1000)
    }

    /**
     * Register a new account with the application.
     * @param name The account name
     * @param email The account email
     * @param password The account password
     */
    register(
        name: string,
        email: string,
        password: string,
        confirmPassord: string,
        onRegister: (account: Account) => void,
        onError: (err: any) => void
    ): Account {

        // Create the register request.
        let rqst = new ressource.RegisterAccountRqst();
        rqst.setPassword(password);
        rqst.setConfirmPassword(confirmPassord);

        let account = new ressource.Account();
        account.setEmail(email);
        account.setName(name);
        rqst.setAccount(account);

        // Register a new account.
        Model.globular.ressourceService
            .registerAccount(rqst)
            .then((rsp: ressource.RegisterAccountRsp) => {
                // Here I will set the token in the localstorage.
                let token = rsp.getResult();
                let decoded = jwt(token);

                // here I will save the user token and user_name in the local storage.
                localStorage.setItem("user_token", token);
                localStorage.setItem("user_name", (<any>decoded).username);
                localStorage.setItem("token_expired", (<any>decoded).exp);
                localStorage.setItem("useremail_", (<any>decoded).email);

                // Callback on login.
                this.account = new Account(name, email);
                onRegister(this.account);

                this.startRefreshToken()
            })
            .catch((err: any) => {
                onError(err);
            });

        return null;
    }

    /**
     * Login into the application
     * @param email
     * @param password
     */
    login(
        email: string,
        password: string,
        onLogin: (account: Account) => void,
        onError: (err: any) => void
    ) {

        let rqst = new ressource.AuthenticateRqst();
        rqst.setName(email);
        rqst.setPassword(password);
        Model.globular.ressourceService
            .authenticate(rqst)
            .then((rsp: ressource.AuthenticateRsp) => {
                // Here I will set the token in the localstorage.
                let token = rsp.getToken();
                let decoded = jwt(token);
                let userName = (<any>decoded).username;
                let email = (<any>decoded).email;

                // here I will save the user token and user_name in the local storage.
                localStorage.setItem("user_token", token);
                localStorage.setItem("token_expired", (<any>decoded).exp);
                localStorage.setItem("useremail_", email);
                localStorage.setItem("user_name", userName);

                // Start refresh as needed.
                this.startRefreshToken()

                this.account = new Account(userName, email);

                // call login on the view.
                if (this.view != undefined) {
                    (<ApplicationView>this.view).login(this.account)
                }

                // Send network event.
                Model.eventHub.publish("login_event", this.account.id, false);

                // Init the user data...
                this.account.initData(onLogin, onError)
            })
            .catch(err => {
                onError(err);
            });
    }

    /**
     * Close the current session explicitelty.
     */
    logout() {

        // exit from the application.
        this.exit()

        // Send network event.
        Model.eventHub.publish("logout_event", this.account.id, false);

        if (this.view != undefined) {
            (<ApplicationView>this.view).logout(this.account)
        }

        // Set room to undefined.
        this.account = undefined;
    }

    /**
     * Exit application.
     */
    exit() {

        // Close the view.
        if (this.view != undefined) {
            this.view.close()
        }

        // Close the listener's
        Model.eventHub.unSubscribe("login_event_", this.login_event_listener)
        Model.eventHub.unSubscribe("register_event_", this.register_event_listener)

        // remove token informations
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("useremail_");
        localStorage.removeItem("token_expired");
    }
}