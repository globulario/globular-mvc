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
import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Layout } from "./components/Layout";
import { Model } from "./Model";
/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
var ApplicationView = /** @class */ (function (_super) {
    __extends(ApplicationView, _super);
    function ApplicationView() {
        var _this = _super.call(this) || this;
        // The web-component use as layout is named globular-application
        if (document.getElementsByTagName("globular-application") != undefined) {
            _this.layout = document.getElementsByTagName("globular-application")[0];
        }
        else {
            _this.layout = new Layout();
            document.body.appendChild(_this.layout);
        }
        // Event listner's
        // Logout event
        Model.eventHub.subscribe("logout_event", function (uuid) {
            _this.logout_event_listener = uuid;
        }, function (accountId) {
            _this.onLogout(accountId);
        }, false);
        // Login event.
        Model.eventHub.subscribe("login_event", function (uuid) {
            _this.login_event_listener = uuid;
        }, function (accountId) {
            _this.onLogin(accountId);
        }, false);
        return _this;
    }
    ///////////////////////////////////////////////////////////////////////////////////////
    // Application action's
    ///////////////////////////////////////////////////////////////////////////////////////
    /**
     * Free ressource here.
     */
    ApplicationView.prototype.close = function () {
        // Disconnect event listener's
        Model.eventHub.unSubscribe("login_event", this.login_event_listener);
        Model.eventHub.unSubscribe("logout_event", this.logout_event_listener);
    };
    /**
     * Refresh various component.
     */
    ApplicationView.prototype.update = function () {
    };
    /**
     * Call by the model when user is login
     * @param account
     */
    ApplicationView.prototype.login = function (account) {
        /** Implement it as needed */
    };
    /**
     * Call by the model when the user is logout.
     * @param account
     */
    ApplicationView.prototype.logout = function (account) {
        /** Implement it as needed */
    };
    /**
     * Try to extract error message from input object.
     * @param err Can be a string or object, in case of object I will test if the object contain a field named 'message'
     */
    ApplicationView.prototype.getErrorMessage = function (err) {
        try {
            var errObj = err;
            if (typeof err === 'string' || err instanceof String) {
                errObj = JSON.parse(err);
            }
            else if (errObj.message != undefined) {
                errObj = JSON.parse(errObj.message);
            }
            if (errObj.ErrorMsg != undefined) {
                console.log(errObj);
                return errObj.ErrorMsg;
            }
            else {
                return err;
            }
        }
        catch (_a) {
            console.log(err);
            return err;
        }
    };
    /**
     * Display a message to the user.
     * @param msg The message to display in toast!
     */
    ApplicationView.prototype.displayMessage = function (err, duration) {
        return M.toast({ html: this.getErrorMessage(err), displayLength: duration });
    };
    //////////////////////////////////////////////////////////////////////////////////////////
    // Event listener's
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Login event handler
     * @param accountId The id of the user
     */
    ApplicationView.prototype.onLogin = function (accountId) {
        /** implement it as needed */
    };
    /**
     * Logout event handler
     * @param accountId
     */
    ApplicationView.prototype.onLogout = function (accountId) {
        /** implement it as needed */
    };
    return ApplicationView;
}(View));
export { ApplicationView };
//# sourceMappingURL=ApplicationView.js.map