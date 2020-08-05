import { Model } from "./Model";
import { FindOneRqst, ReplaceOneRqst, ReplaceOneRsp } from "globular-web-client/lib/persistence/persistencepb/persistence_pb";

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

        let rqst = new FindOneRqst();
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
        let database = userName + "_db";
        let collection = "user_data";
        let data = this.toString();

        let rqst = new ReplaceOneRqst();
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
            .then((rsp: ReplaceOneRsp) => {
                // Here I will return the value with it
                callback(this);
            })
            .catch((err: any) => {
                onError(err);
            });
    }
}
