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
import { Model } from "./Model";
// web-components.
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
// Import css styles.
import "../css/Application.css";
import { AccountMenu } from "./components/Account";
import { NotificationMenu } from "./components/Notification";
import { OverflowMenu } from "./components/Menu";
import { ApplicationsMenu } from "./components/Applications";
// This variable is there to give acces to wait and resume...
export var applicationView;
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
        // set it to false.
        _this.isLogin = false;
        // Set the login box...
        _this.login_ = new Login();
        _this.layout.toolbar().appendChild(_this.login_);
        // This contain account informations.
        _this.accountMenu = new AccountMenu();
        // This contain account/application notification
        _this.notificationMenu = new NotificationMenu();
        // The overflow menu is use to hide menu that dosen't fix in the visual.
        _this.overFlowMenu = new OverflowMenu();
        // The applicaiton menu
        _this.applicationsMenu = new ApplicationsMenu();
        // set the global varialbe...
        applicationView = _this;
        return _this;
    }
    Object.defineProperty(ApplicationView.prototype, "isLogin", {
        get: function () {
            return this._isLogin;
        },
        set: function (value) {
            this._isLogin = value;
        },
        enumerable: false,
        configurable: true
    });
    // Must be call by the model when after it initialisation was done.
    ApplicationView.prototype.init = function () {
        var _this = this;
        // init listener's in the layout.
        this.layout.init();
        this.login_.init();
        this.accountMenu.init();
        this.applicationsMenu.init();
        this.notificationMenu.init();
        // Logout event
        Model.eventHub.subscribe("logout_event", function (uuid) {
            _this.logout_event_listener = uuid;
        }, function () {
            _this.onLogout();
        }, true);
        // Login event.
        Model.eventHub.subscribe("login_event", function (uuid) {
            _this.login_event_listener = uuid;
        }, function (account) {
            _this.onLogin(account);
        }, true);
        /**
         * The resize listener.
         */
        window.addEventListener('resize', function (evt) {
            var w = _this.layout.width();
            if (w <= 500) {
                _this.overFlowMenu.getMenuDiv().insertBefore(_this.applicationsMenu, _this.overFlowMenu.getMenuDiv().firstChild);
                _this.applicationsMenu.getMenuDiv().classList.remove("bottom");
                _this.applicationsMenu.getMenuDiv().classList.add("left");
                if (_this.isLogin) {
                    _this.overFlowMenu.show();
                    _this.overFlowMenu.getMenuDiv().appendChild(_this.notificationMenu);
                    _this.notificationMenu.getMenuDiv().classList.remove("bottom");
                    _this.notificationMenu.getMenuDiv().classList.add("left");
                    _this.overFlowMenu.getMenuDiv().appendChild(_this.accountMenu);
                    _this.accountMenu.getMenuDiv().classList.remove("bottom");
                    _this.accountMenu.getMenuDiv().classList.add("left");
                }
            }
            else {
                _this.layout.toolbar().insertBefore(_this.applicationsMenu, _this.layout.toolbar().firstChild);
                _this.applicationsMenu.getMenuDiv().classList.remove("left");
                _this.applicationsMenu.getMenuDiv().classList.add("bottom");
                if (_this.isLogin) {
                    _this.overFlowMenu.hide();
                    _this.layout.toolbar().appendChild(_this.notificationMenu);
                    _this.notificationMenu.getMenuDiv().classList.remove("left");
                    _this.notificationMenu.getMenuDiv().classList.add("bottom");
                    _this.layout.toolbar().appendChild(_this.accountMenu);
                    _this.accountMenu.getMenuDiv().classList.remove("left");
                    _this.accountMenu.getMenuDiv().classList.add("bottom");
                }
            }
        });
        window.dispatchEvent(new Event('resize'));
    };
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
        _super.prototype.close.call(this);
    };
    /**
     * Clear the workspace.
     */
    ApplicationView.prototype.clear = function () {
        this.getWorkspace().innerHTML = "";
        if (this.activeView != null) {
            this.activeView.hide();
        }
    };
    /**
     * Refresh various component.
     */
    ApplicationView.prototype.update = function () {
    };
    /**
     * The title of the application
     * @param title The title.
     */
    ApplicationView.prototype.setTitle = function (title) {
        this.layout.title().innerHTML = "<span>" + title + "</span>";
    };
    ApplicationView.prototype.setIcon = function (imgUrl) {
        var icon = document.createElement("img");
        icon.id = "application_icon";
        icon.src = imgUrl;
        icon.style.height = "24px";
        icon.style.width = "24px";
        icon.style.marginRight = "10px";
        icon.style.marginLeft = "10px";
        var title = this.layout.title();
        title.style.display = "flex";
        title.insertBefore(icon, title.firstChild);
        this.icon = icon;
    };
    /**
     * The icon
     */
    ApplicationView.prototype.getIcon = function () {
        return this.icon;
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
    // Block user input
    ApplicationView.prototype.wait = function (msg) {
        if (msg === void 0) { msg = "wait ..."; }
        this.layout.wait(msg);
    };
    // Resume user input.
    ApplicationView.prototype.resume = function () {
        this.layout.resume();
    };
    //////////////////////////////////////////////////////////////////////////////////////////
    // Event listener's
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Login event handler
     * @param accountId The id of the user
     */
    ApplicationView.prototype.onLogin = function (account) {
        this.isLogin = true;
        /** implement it as needed */
        this.login_.parentNode.removeChild(this.login_);
        this.layout.toolbar().appendChild(this.notificationMenu);
        this.layout.toolbar().appendChild(this.accountMenu);
        // Append the over flow menu.
        this.layout.toolbar().appendChild(this.overFlowMenu);
        this.overFlowMenu.hide(); // not show it at first.
        this.accountMenu.setAccount(account);
        window.dispatchEvent(new Event('resize'));
    };
    /**
     * Logout event handler
     * @param accountId
     */
    ApplicationView.prototype.onLogout = function () {
        this.isLogin = false;
        this.overFlowMenu.hide(); // not show it at first.
        /** implement it as needed */
        this.layout.toolbar().appendChild(this.login_);
        // Remove notification menu and account.
        this.accountMenu.parentNode.removeChild(this.notificationMenu);
        this.accountMenu.parentNode.removeChild(this.accountMenu);
        this.getWorkspace().innerHTML = "";
        window.dispatchEvent(new Event('resize'));
    };
    //////////////////////////////////////////////////////////////////////////////////////////
    // Gui function's
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * The workspace div where the application draw it content.
     */
    ApplicationView.prototype.getWorkspace = function () {
        return this.layout.workspace();
    };
    /**
     * The side menu that contain application actions.
     */
    ApplicationView.prototype.getSideMenu = function () {
        var sideMenu = this.layout.sideMenu();
        sideMenu.style.display = "flex";
        sideMenu.style.flexDirection = "column";
        sideMenu.style.width = "100%";
        sideMenu.style.marginTop = "24px";
        return sideMenu;
    };
    // In case of application view 
    ApplicationView.prototype.setView = function (view) {
        this.activeView = view;
    };
    ApplicationView.prototype.hideSideMenu = function () {
        this.layout.appDrawer.toggle();
    };
    /**
     * Create a side menu button div.
     */
    ApplicationView.prototype.createSideMenuButton = function (id, text, icon) {
        var html = "\n        <style>\n            .side_menu_btn{\n                display: flex;\n                position: relative;\n                align-items: center;\n                font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;\n                font-size: 1rem;\n                letter-spacing: .2px;\n                color: #202124;\n                text-shadow: none;\n            }\n\n            .side_menu_btn:hover{\n                cursor: pointer;\n            }\n\n        </style>\n        <div id=\"" + id + "\" class=\"side_menu_btn\">\n            <paper-ripple recenters></paper-ripple>\n            <paper-icon-button id=\"" + id + "_close_btn\" icon=\"" + icon + "\"></paper-icon-button>\n            <span style=\"flex-grow: 1;\">" + text + "</span>\n        </div>\n        ";
        var range = document.createRange();
        this.getSideMenu().insertBefore(range.createContextualFragment(html), this.getSideMenu().firstChild);
        return document.getElementById(id);
    };
    return ApplicationView;
}(View));
export { ApplicationView };
//# sourceMappingURL=ApplicationView.js.map