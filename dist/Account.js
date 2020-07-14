var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Model } from "./Model";
import { FindOneRqst, ReplaceOneRqst } from "globular-web-client/lib/persistence/persistencepb/persistence_pb";
/**
 * Basic account class that contain the user id and email.
 */
var Account = /** @class */ (function (_super) {
    __extends(Account, _super);
    function Account(id, email) {
        var _this = _super.call(this) || this;
        _this._id = id;
        _this.email_ = email;
        _this.hasData = false;
        _this.firstName_ = "";
        _this.lastName_ = "";
        _this.middleName_ = "";
        return _this;
    }
    Object.defineProperty(Account.prototype, "id", {
        get: function () {
            return this._id;
        },
        set: function (value) {
            this._id = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Account.prototype, "email", {
        get: function () {
            return this.email_;
        },
        set: function (value) {
            this.email_ = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Account.prototype, "profilPicture", {
        get: function () {
            return this.profilPicture_;
        },
        set: function (value) {
            this.profilPicture_ = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Account.prototype, "firstName", {
        get: function () {
            return this.firstName_;
        },
        set: function (value) {
            this.firstName_ = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Account.prototype, "lastName", {
        get: function () {
            return this.lastName_;
        },
        set: function (value) {
            this.lastName_ = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Account.prototype, "middleName", {
        get: function () {
            return this.middleName_;
        },
        set: function (value) {
            this.middleName_ = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Read user data one result at time.
     */
    Account.prototype.readOneUserData = function (query, successCallback, errorCallback) {
        var userName = localStorage.getItem("user_name");
        var database = userName + "_db";
        var collection = "user_data";
        var rqst = new FindOneRqst();
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
            .then(function (rsp) {
            successCallback(JSON.parse(rsp.getJsonstr()));
        })
            .catch(function (err) {
            errorCallback(err);
        });
    };
    /**
     * Must be called once when the session open.
     * @param account
     */
    Account.prototype.initData = function (callback, onError) {
        var _this = this;
        var userName = this.id;
        // Retreive user data...
        this.readOneUserData("{\"_id\":\"" + userName + "\"}", function (data) {
            _this.hasData = true;
            _this.firstName = data["firstName_"];
            _this.lastName = data["lastName_"];
            _this.middleName = data["middleName_"];
            _this.profilPicture = data["profilPicture_"];
            if (callback != undefined) {
                callback(_this);
            }
        }, function (err) {
            _this.hasData = false;
            onError(err);
        });
    };
    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    Account.prototype.changeProfilImage = function (dataUrl, onSaveAccount, onError) {
        this.profilPicture_ = dataUrl;
        this.save(onSaveAccount, onError);
    };
    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    Account.prototype.save = function (callback, onError) {
        var _this = this;
        var userName = this.id;
        var database = userName + "_db";
        var collection = "user_data";
        var data = this.toString();
        var rqst = new ReplaceOneRqst();
        rqst.setId(database);
        rqst.setDatabase(database);
        rqst.setCollection(collection);
        rqst.setQuery("{\"_id\":\"" + userName + "\"}");
        rqst.setValue(data);
        rqst.setOptions("[{\"upsert\": true}]");
        // call persist data
        Model.globular.persistenceService
            .replaceOne(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain
        })
            .then(function (rsp) {
            // Here I will return the value with it
            callback(_this);
        })
            .catch(function (err) {
            onError(err);
        });
    };
    return Account;
}(Model));
export { Account };
//# sourceMappingURL=Account.js.map