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
import * as ressource from "globular-web-client/lib/ressource/ressource_pb";
import * as jwt from "jwt-decode";
import * as persistence from "globular-web-client/lib/persistence/persistencepb/persistence_pb";
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
        var rqst = new persistence.FindOneRqst();
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
        var rqst = new persistence.ReplaceOneRqst();
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
            onError(err, _this);
        });
    };
    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    Account.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return Account;
}(Model));
export { Account };
/**
 * That class can be use to create any other application.
 */
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    /**
     *
     * @param name The name of the application.
     */
    function Application(name, view) {
        var _this = _super.call(this) || this;
        // The application name.
        _this.name = name;
        Model.application = _this.name; // set the application in model.
        _this.view = view;
        return _this;
    }
    /////////////////////////////////////////////////////
    // Account releated functionality.
    /////////////////////////////////////////////////////
    /**
     * Refresh the token and open a new session if the token is valid.
     */
    Application.prototype.refreshToken = function (onError) {
        var _this = this;
        var rqst = new ressource.RefreshTokenRqst();
        rqst.setToken(localStorage.getItem("user_token"));
        Model.globular.ressourceService
            .refreshToken(rqst)
            .then(function (rsp) {
            // Refresh the token at session timeout
            var token = rsp.getToken();
            var decoded = jwt(token);
            var userName = decoded.username;
            var email = decoded.email;
            // here I will save the user token and user_name in the local storage.
            localStorage.setItem("user_token", token);
            localStorage.setItem("token_expired", decoded.exp);
            localStorage.setItem("user_name", userName);
            localStorage.setItem("useremail_", email);
            // Set the account
            _this.account = new Account(userName, email);
            // Set the account infos...
            _this.account.initData(undefined, function (err) {
                // call the error callback.
                onError(err, _this.account);
            });
        })
            .catch(function (err) {
            // remove old information in that case.
            localStorage.removeItem("remember_me");
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("useremail_");
            localStorage.removeItem("token_expired");
            onError(err, _this.account);
        });
    };
    /**
     * Refresh the token to keep it usable.
     */
    Application.prototype.startRefreshToken = function () {
        var _this = this;
        setInterval(function () {
            var isExpired = parseInt(localStorage.getItem("token_expired"), 10) < Math.floor(Date.now() / 1000);
            if (isExpired) {
                _this.refreshToken(function (err) {
                    // simply display the error on the view.
                    _this.view.displayMessage(err);
                });
            }
        }, 1000);
    };
    /**
     * Register a new account with the application.
     * @param name The account name
     * @param email The account email
     * @param password The account password
     */
    Application.prototype.register = function (name, email, password, confirmPassord, onRegister, onError) {
        var _this = this;
        // Create the register request.
        var rqst = new ressource.RegisterAccountRqst();
        rqst.setPassword(password);
        rqst.setConfirmPassword(confirmPassord);
        var account = new ressource.Account();
        account.setEmail(email);
        account.setName(name);
        rqst.setAccount(account);
        // Register a new account.
        Model.globular.ressourceService
            .registerAccount(rqst)
            .then(function (rsp) {
            // Here I will set the token in the localstorage.
            var token = rsp.getResult();
            var decoded = jwt(token);
            // here I will save the user token and user_name in the local storage.
            localStorage.setItem("user_token", token);
            localStorage.setItem("user_name", decoded.username);
            localStorage.setItem("token_expired", decoded.exp);
            localStorage.setItem("useremail_", decoded.email);
            // Callback on login.
            _this.account = new Account(name, email);
            onRegister(_this.account);
            _this.startRefreshToken();
        })
            .catch(function (err) {
            onError(err);
        });
        return null;
    };
    /**
     * Login into the application
     * @param email
     * @param password
     */
    Application.prototype.login = function (email, password, onLogin, onError) {
        var _this = this;
        var rqst = new ressource.AuthenticateRqst();
        rqst.setName(email);
        rqst.setPassword(password);
        Model.globular.ressourceService
            .authenticate(rqst)
            .then(function (rsp) {
            // Here I will set the token in the localstorage.
            var token = rsp.getToken();
            var decoded = jwt(token);
            var userName = decoded.username;
            var email = decoded.email;
            // here I will save the user token and user_name in the local storage.
            localStorage.setItem("user_token", token);
            localStorage.setItem("token_expired", decoded.exp);
            localStorage.setItem("useremail_", email);
            localStorage.setItem("user_name", userName);
            // Start refresh as needed.
            _this.startRefreshToken();
            _this.account = new Account(userName, email);
            // call login on the view.
            if (_this.view != undefined) {
                _this.view.login(_this.account);
            }
            // Send network event.
            Model.eventHub.publish("login_event", _this.account.id, false);
            // Init the user data...
            _this.account.initData(onLogin, onError);
        })
            .catch(function (err) {
            onError(err);
        });
    };
    /**
     * Close the current session explicitelty.
     */
    Application.prototype.logout = function () {
        // exit from the application.
        this.exit();
        // Send network event.
        Model.eventHub.publish("logout_event", this.account.id, false);
        if (this.view != undefined) {
            this.view.logout(this.account);
        }
        // Set room to undefined.
        this.account = undefined;
    };
    /**
     * Exit application.
     */
    Application.prototype.exit = function () {
        // Close the view.
        if (this.view != undefined) {
            this.view.close();
        }
        // remove token informations
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("useremail_");
        localStorage.removeItem("token_expired");
    };
    return Application;
}(Model));
export { Application };
//# sourceMappingURL=Application.js.map