"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const Model_1 = require("./Model");
const persistence_pb_1 = require("globular-web-client/lib/persistence/persistencepb/persistence_pb");
/**
 * Basic account class that contain the user id and email.
 */
class Account extends Model_1.Model {
    constructor(id, email) {
        super();
        this._id = id;
        this.email_ = email;
        this.hasData = false;
        this.firstName_ = "";
        this.lastName_ = "";
        this.middleName_ = "";
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
    get email() {
        return this.email_;
    }
    set email(value) {
        this.email_ = value;
    }
    get profilPicture() {
        return this.profilPicture_;
    }
    set profilPicture(value) {
        this.profilPicture_ = value;
    }
    get firstName() {
        return this.firstName_;
    }
    set firstName(value) {
        this.firstName_ = value;
    }
    get lastName() {
        return this.lastName_;
    }
    set lastName(value) {
        this.lastName_ = value;
    }
    get middleName() {
        return this.middleName_;
    }
    set middleName(value) {
        this.middleName_ = value;
    }
    /**
     * Read user data one result at time.
     */
    readOneUserData(query, successCallback, errorCallback) {
        let userName = localStorage.getItem("user_name");
        let database = userName + "_db";
        let collection = "user_data";
        let rqst = new persistence_pb_1.FindOneRqst();
        rqst.setId(database);
        rqst.setDatabase(database);
        rqst.setCollection(collection);
        rqst.setQuery(query);
        rqst.setOptions("");
        // call persist data
        Model_1.Model.globular.persistenceService
            .findOne(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model_1.Model.application,
            domain: Model_1.Model.domain
        })
            .then((rsp) => {
            successCallback(JSON.parse(rsp.getJsonstr()));
        })
            .catch((err) => {
            errorCallback(err);
        });
    }
    /**
     * Must be called once when the session open.
     * @param account
     */
    initData(callback, onError) {
        let userName = this.id;
        // Retreive user data...
        this.readOneUserData(`{"_id":"` + userName + `"}`, (data) => {
            this.hasData = true;
            this.firstName = data["firstName_"];
            this.lastName = data["lastName_"];
            this.middleName = data["middleName_"];
            this.profilPicture = data["profilPicture_"];
            if (callback != undefined) {
                callback(this);
            }
        }, (err) => {
            this.hasData = false;
            onError(err);
        });
    }
    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    changeProfilImage(dataUrl, onSaveAccount, onError) {
        this.profilPicture_ = dataUrl;
        this.save(onSaveAccount, onError);
    }
    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    save(callback, onError) {
        let userName = this.id;
        let database = userName + "_db";
        let collection = "user_data";
        let data = this.toString();
        let rqst = new persistence_pb_1.ReplaceOneRqst();
        rqst.setId(database);
        rqst.setDatabase(database);
        rqst.setCollection(collection);
        rqst.setQuery(`{"_id":"` + userName + `"}`);
        rqst.setValue(data);
        rqst.setOptions(`[{"upsert": true}]`);
        // call persist data
        Model_1.Model.globular.persistenceService
            .replaceOne(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model_1.Model.application,
            domain: Model_1.Model.domain
        })
            .then((rsp) => {
            // Here I will return the value with it
            callback(this);
        })
            .catch((err) => {
            onError(err);
        });
    }
}
exports.Account = Account;
