// Globular conneciton.
import * as GlobularWebClient from "globular-web-client";
import { GetConfigRequest } from "globular-web-client/lib/admin/admin_pb";
var Model = /** @class */ (function () {
    function Model() {
        // Set the application name.
        // The domain will be set with the hostname.
        Model.domain = window.location.hostname;
        this.listeners = new Array();
    }
    Object.defineProperty(Model.prototype, "config", {
        get: function () {
            return this._config;
        },
        set: function (value) {
            this._config = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "view", {
        get: function () {
            return this._view;
        },
        set: function (value) {
            this._view = value;
        },
        enumerable: false,
        configurable: true
    });
    // Append a listener.
    Model.prototype.appendListener = function (name, uuid) {
        this.listeners.push({ name: name, uuid: uuid });
    };
    // Explicitly close the view.
    Model.prototype.close = function () {
        // Close all listeners.
        this.listeners.forEach(function (listener) {
            Model.eventHub.unSubscribe(listener.name, listener.uuid);
        });
    };
    /**
     * Return the json string of the class. That will be use to save user data into the database.
     */
    Model.prototype.toString = function () {
        return JSON.stringify(this);
    };
    /**
     * Set the view.
     * @param view
     */
    Model.prototype.setView = function (view) {
        this.view = view;
    };
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    Model.fromString = function (json) {
    };
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    Model.fromObject = function (obj) {
    };
    /**
     * Connect with the backend and get the initial configuration.
     * @param initCallback On success callback
     * @param errorCallback On error callback
     * @param adminPort The admin service port
     * @param adminProxy The admin service proxy
     */
    Model.prototype.init = function (initCallback, errorCallback, adminPort, adminProxy) {
        var _this = this;
        if (adminPort === void 0) { adminPort = 10001; }
        if (adminProxy === void 0) { adminProxy = 10002; }
        this.config = {
            Protocol: window.location.protocol.replace(":", ""),
            Domain: window.location.hostname,
            PortHttp: parseInt(window.location.port),
            AdminPort: adminPort,
            AdminProxy: adminProxy,
            Services: {} // empty for start.
        };
        // So here I will initilyse the server connection.
        var globular = new GlobularWebClient.Globular(this.config);
        var rqst = new GetConfigRequest();
        if (globular.adminService !== undefined) {
            globular.adminService.getConfig(rqst, {
                domain: Model.domain
            }).then(function (rsp) {
                // set back config with all it values.
                _this.config = JSON.parse(rsp.getResult());
                // init the globular object from the configuration retreived.
                Model.globular = new GlobularWebClient.Globular(_this.config);
                // init the event hub from the object retreive.
                Model.eventHub = new GlobularWebClient.EventHub(Model.globular.eventService);
                // Call init callback.
                initCallback();
            }).catch(function (err) {
                errorCallback(err);
            });
        }
    };
    return Model;
}());
export { Model };
//# sourceMappingURL=Model.js.map