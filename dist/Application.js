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
import { Model } from './Model';
import * as ressource from "globular-web-client/lib/ressource/ressource_pb";
import * as jwt from "jwt-decode";
import { Account } from "./Account";
import { NotificationType, Notification } from './Notification';
import { InsertOneRqst, FindRqst, DeleteOneRqst } from "globular-web-client/lib/persistence/persistencepb/persistence_pb";
import { v4 as uuidv4 } from "uuid";
/**
 * That class can be use to create any other application.
 */
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    /**
     * Create a new application with a given name. The view
     * can be any ApplicationView or derived ApplicationView class.
     * @param name The name of the application.
     */
    function Application(name, title, view) {
        var _this = _super.call(this) || this;
        // generate client uuid, this is use to set information about a client.
        if (localStorage.getItem("globular_client_uuid") == undefined) {
            Application.uuid = uuidv4();
            localStorage.setItem("globular_client_uuid", Application.uuid);
        }
        else {
            Application.uuid = localStorage.getItem("globular_client_uuid");
        }
        // The application name.
        _this.name = name;
        Model.application = _this.name; // set the application in model.
        _this.view = view;
        if (document.getElementsByTagName("title").length > 0) {
            document.getElementsByTagName("title")[0].innerHTML = title;
            view.setTitle(title);
        }
        return _this;
    }
    /**
     * Connect the listner's and call the initcallback.
     * @param initCallback
     * @param errorCallback
     * @param adminPort
     * @param adminProxy
     */
    Application.prototype.init = function (initCallback, errorCallback, adminPort, adminProxy) {
        var _this = this;
        if (adminPort === void 0) { adminPort = 10001; }
        if (adminProxy === void 0) { adminProxy = 10002; }
        _super.prototype.init.call(this, function () {
            // Here I will connect the listener's
            // The login event.
            Model.eventHub.subscribe("login_event_", function (uuid) {
                _this.login_event_listener = uuid;
            }, function (evt) {
                // Here I will try to login the user.
                _this.login(evt.userId, evt.pwd, function (account) {
                    console.log("--> login succeed!", account);
                    // Here I will send a login success.
                    Model.eventHub.publish("login_event", account, true);
                }, function (err) {
                    _this.view.displayMessage(err, 4000);
                });
            }, true);
            Model.eventHub.subscribe("logout_event_", function (uuid) {
                _this.logout_event_listener = uuid;
            }, function (evt) {
                _this.logout();
            }, true);
            // The register event.
            Model.eventHub.subscribe("register_event_", function (uuid) {
                _this.register_event_listener = uuid;
            }, function (evt) {
                // Here I will try to login the user.
                _this.register(evt.userId, evt.email, evt.pwd, evt.repwd, function (data) {
                    console.log("--> register succeed!", data);
                }, function (err) {
                    _this.view.displayMessage(err, 4000);
                });
            }, true);
            // The update profile picuture event.
            Model.eventHub.subscribe("update_profile_picture_event_", function (uuid) {
                _this.update_profile_picture_listener = uuid;
            }, function (dataUrl) {
                // Here I will try to login the user.
                _this.account.changeProfilImage(dataUrl, function () {
                    /** Nothing here. */
                }, function (err) {
                    _this.view.displayMessage(err, 3000);
                });
            }, true);
            // Delete user notification.
            Model.eventHub.subscribe("delete_notification_event_", function (uuid) {
                _this.delete_notification_event_listener = uuid;
            }, function (notification) {
                notification = Notification.fromObject(notification);
                var rqst = new DeleteOneRqst();
                var db = _this.account.id + "_db";
                rqst.setId(db);
                rqst.setDatabase(db);
                rqst.setCollection("Notifications");
                rqst.setQuery("{\"_id\":\"" + notification.id + "\"}");
                Model.globular.persistenceService
                    .deleteOne(rqst, {
                    token: localStorage.getItem("user_token"),
                    application: Model.application,
                    domain: Model.domain,
                })
                    .then(function () {
                    // The notification is not deleted so I will send network event to remove it from 
                    // the display.
                    Model.eventHub.publish(notification.id + "_delete_notification_event", notification.toString(), false);
                })
                    .catch(function (err) {
                    _this.view.displayMessage(err);
                });
            }, true);
            // Get backend application infos.
            Application.getAllApplicationInfo(function (infos) {
                if (initCallback != undefined) {
                    _this.view.setIcon(Application.getApplicationInfo(_this.name).icon);
                    _this.view.init();
                    initCallback();
                }
            }, function (err) { console.log(err); });
            // Connect automatically...
            var rememberMe = localStorage.getItem("remember_me");
            if (rememberMe) {
                // Here I will renew the last token...
                var userId = localStorage.getItem("user_name");
                _this.view.wait("<div>log in</div><div>" + userId + "</div><div>...</div>");
                _this.refreshToken(function (account) {
                    // send a login event.
                    Model.eventHub.publish("login_event", account, true);
                    _this.view.resume();
                    _this.startRefreshToken();
                }, function (err) {
                    _this.view.displayMessage(err, 2000);
                    _this.view.resume();
                });
            }
            else {
                // simply remove invalid token and user infos.
                localStorage.removeItem("remember_me");
                localStorage.removeItem("user_token");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("token_expired");
            }
        }, errorCallback, adminPort, adminProxy);
    };
    /**
     * Return the list of all applicaitons informations.
     * @param callback
     * @param errorCallback
     */
    Application.getAllApplicationInfo = function (callback, errorCallback) {
        var rqst = new ressource.GetAllApplicationsInfoRqst;
        Model.globular.ressourceService.getAllApplicationsInfo(rqst, {})
            .then(function (rsp) {
            var infos = JSON.parse(rsp.getResult());
            Application.infos = new Map();
            for (var i = 0; i < infos.length; i++) {
                Application.infos.set(infos[i]._id, infos[i]);
            }
            callback(infos);
        })
            .catch(errorCallback);
    };
    /**
     * Return application infos.
     * @param id
     */
    Application.getApplicationInfo = function (id) {
        return Application.infos.get(id);
    };
    /**
     * Return partial information only.
     */
    Application.prototype.toString = function () {
        var obj = { name: this.name, title: this.title, icon: "" };
        return JSON.stringify(obj);
    };
    /////////////////////////////////////////////////////
    // Account releated functionality.
    /////////////////////////////////////////////////////
    /**
     * Refresh the token and open a new session if the token is valid.
     */
    Application.prototype.refreshToken = function (initCallback, onError) {
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
            localStorage.setItem("user_email", email);
            // Set the account
            _this.account = new Account(userName, email);
            // Set the account infos...
            _this.account.initData(initCallback, function (err) {
                localStorage.removeItem("remember_me");
                localStorage.removeItem("user_token");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("token_expired");
                onError(err);
            });
        })
            .catch(function (err) {
            // remove old information in that case.
            localStorage.removeItem("remember_me");
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_email");
            localStorage.removeItem("token_expired");
            onError(err);
        });
    };
    /**
     * Refresh the token to keep it usable.
     */
    Application.prototype.startRefreshToken = function () {
        var _this = this;
        this.initNotifications();
        setInterval(function () {
            var isExpired = parseInt(localStorage.getItem("token_expired"), 10) <
                Math.floor(Date.now() / 1000);
            if (isExpired) {
                _this.refreshToken(function (account) {
                    _this.account = account;
                }, function (err) {
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
        this.view.wait("<div>register account </div><div>" + name + "</div><div>...</div>");
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
            localStorage.setItem("user_email", decoded.email);
            // Callback on login.
            _this.account = new Account(name, email);
            _this.account.initData(function (account) {
                Model.eventHub.publish("login_event", account, false);
                _this.view.resume();
                onRegister(_this.account);
            }, function (err) {
                Model.eventHub.publish("login_event", _this.account, false);
                onRegister(_this.account);
                _this.view.resume();
                onError(err);
            });
            _this.startRefreshToken();
        })
            .catch(function (err) {
            _this.view.resume();
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
        this.view.wait("<div>log in</div><div>" + email + "</div><div>...</div>");
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
            localStorage.setItem("user_email", email);
            localStorage.setItem("user_name", userName);
            _this.account = new Account(userName, email);
            // Start refresh as needed.
            _this.startRefreshToken();
            // Init the user data...
            _this.account.initData(function (account) {
                Model.eventHub.publish("login_event", account, false);
                onLogin(account);
                _this.view.resume();
                // Now I will set the application and user notification.
            }, function (err) {
                Model.eventHub.publish("login_event", _this.account, false);
                onLogin(_this.account);
                _this.view.resume();
                onError(err);
            });
        })
            .catch(function (err) {
            _this.view.resume();
            onError(err);
        });
    };
    ///////////////////////////////////////////////////////////////
    // Application close funtions.
    //////////////////////////////////////////////////////////////
    /**
     * Close the current session explicitelty.
     */
    Application.prototype.logout = function () {
        // Send local event.
        Model.eventHub.publish("logout_event", this.account, true);
        // Set room to undefined.
        this.account = undefined;
        // remove token informations
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("token_expired");
    };
    /**
     * Exit application.
     */
    Application.prototype.exit = function () {
        // Close the view.
        if (this.view != undefined) {
            this.view.close();
        }
        // Close the listener's
        Model.eventHub.unSubscribe("login_event_", this.login_event_listener);
        Model.eventHub.unSubscribe("logout_event_", this.logout_event_listener);
        Model.eventHub.unSubscribe("register_event_", this.register_event_listener);
        Model.eventHub.unSubscribe("update_profile_picture_event_", this.update_profile_picture_listener);
        Model.eventHub.unSubscribe("delete_notification_event_", this.delete_notification_event_listener);
        // remove token informations
        localStorage.removeItem("remember_me");
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_email");
        localStorage.removeItem("token_expired");
    };
    ///////////////////////////////////////////////////////////////////////////////////////////
    // Notifications
    ///////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Initialyse the user and application notifications
     */
    Application.prototype.initNotifications = function () {
        var _this = this;
        // Initialyse application notifications.
        this.getNotifications(NotificationType.Application, function (notifications) {
            Model.eventHub.publish("set_application_notifications_event", notifications, true);
        }, function (err) {
            _this.view.displayMessage(err);
        });
        this.getNotifications(NotificationType.User, function (notifications) {
            Model.eventHub.publish("set_user_notifications_event", notifications, true);
        }, function (err) {
            _this.view.displayMessage(err);
        });
    };
    /**
     * Send application notifications.
     * @param notification The notification can contain html text.
     */
    Application.prototype.sendNotifications = function (notification, callback, onError) {
        // first of all I will save the notificaiton.
        var db;
        if (notification.type == NotificationType.Application) {
            db = Model.application + "_db";
            console.log(Application.getApplicationInfo(this.name));
            notification.sender = JSON.stringify(Application.getApplicationInfo(this.name));
        }
        else {
            db = this.account.id + "_db";
            // attach account informations.
            notification.sender = this.account.toString();
        }
        // Insert the notification in the db.
        var rqst = new InsertOneRqst();
        rqst.setId(db);
        rqst.setDatabase(db);
        rqst.setCollection("Notifications");
        rqst.setJsonstr(notification.toString());
        // Save the nofiction on the server.
        Model.globular.persistenceService
            .insertOne(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        })
            .then(function () {
            // Here I will throw a network event...
            Model.eventHub.publish(notification.recipient + "_notification_event", notification.toString(), false);
            if (callback != undefined) {
                callback();
            }
        })
            .catch(function (err) {
            onError(err);
        });
    };
    /**
     *  Retreive the list of nofitications
     * @param callback The success callback with the list of notifications.
     * @param errorCallback The error callback with the error message.
     */
    Application.prototype.getNotifications = function (type, callback, errorCallback) {
        // So here I will get the list of notification for the given type.
        var db;
        var query;
        if (type == NotificationType.Application) {
            db = Model.application + "_db";
            query = "{\"_recipient\":\"" + Model.application + "\"}";
        }
        else {
            db = this.account.id + "_db";
            query = "{\"_recipient\":\"" + this.account.id + "\"}";
        }
        // Insert the notification in the db.
        var rqst = new FindRqst();
        rqst.setId(db);
        rqst.setDatabase(db);
        rqst.setCollection("Notifications");
        rqst.setQuery(query);
        var stream = Model.globular.persistenceService.find(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        });
        var notifications = new Array();
        stream.on("data", function (rsp) {
            var data = JSON.parse(rsp.getJsonstr());
            for (var i = 0; i < data.length; i++) {
                var n = Notification.fromObject(data[i]);
                notifications.push(n);
            }
        });
        stream.on("status", function (status) {
            if (status.code != 0) {
                console.log(status.details);
                errorCallback(status.details);
            }
            else {
                callback(notifications);
            }
        });
    };
    Application.prototype.removeNotification = function (notification) { };
    /**
     * Remove all notification.
     */
    Application.prototype.clearNotifications = function (type) { };
    return Application;
}(Model));
export { Application };
//# sourceMappingURL=Application.js.map