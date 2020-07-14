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
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/paper-badge/paper-badge.js';
import { Model } from '../Model';
import { Menu } from './Menu';
/**
 * Login/Register functionality.
 */
var NotificationMenu = /** @class */ (function (_super) {
    __extends(NotificationMenu, _super);
    // attributes.
    // Create the applicaiton view.
    function NotificationMenu() {
        var _this = _super.call(this, "notification", "social:notifications-none", "Notifications") || this;
        // The div inner panel.
        var html = "\n        <style>\n            #notifications{\n                display: flex;\n                flex-direction: column;\n            }\n\n            #notifications-config{\n                flex-grow: 1;\n\n            }\n\n            #application-notifications #user-notifications{\n                display: flex;\n                flex-direction: column;\n            }\n\n            .header{\n                display: flex;\n                min-width: 375px;\n                position: relative;\n                font-size: 12pt;\n                align-items: center;\n                padding: .5rem;\n            }\n\n            .header:hover{\n                cursor: pointer;\n            }\n\n            .body{\n                min-width: 375px;\n                min-height: 100px;\n                max-height: 30rem;\n                overflow-y: auto;\n            }\n\n            .btn_div{\n                display: flex; \n                flex-grow: 1; \n                justify-content: \n                flex-end;\n            }\n\n            .btn {\n                position: relative;\n            }\n\n            .btn:hover{\n                cursor: pointer;\n            }\n\n            iron-collapse{\n                border-bottom: 1px solid #e8e8e8;\n                border-top: 1px solid #e8e8e8;\n            }\n\n            iron-collapse{\n                border-bottom: 1px solid #e8e8e8;\n                border-top: 1px solid #e8e8e8;\n            }\n\n            .notification_panel{\n                position: relative;\n                display: flex; \n                padding: .75rem; \n                font-size: 12pt;\n                transition: background 0.2s ease,padding 0.8s linear;\n            }\n\n            .notification_panel img {\n                height: 48px;\n                width: 48px;\n                border-radius: 24px;\n            }\n        </style>\n\n        <div>\n            <div class=\"header\" style=\"border-bottom: 1px solid #e8e8e8;\">\n                <div>Notifications</div>\n                <div class=\"btn_div\">\n                    <div class=\"btn\">\n                        <iron-icon id=\"notifications-config\" icon=\"settings\"></iron-icon>\n                        <paper-ripple class=\"circle\" recenters></paper-ripple>\n                    </div>\n                </div>\n            </div>\n\n            <div id=\"application-notifications\" style=\"display: none;\">\n                <div class=\"header\" id=\"application-notifications-btn\">\n                    <span>Application</span>\n                    <paper-ripple recenters></paper-ripple>\n                </div>\n                <iron-collapse id=\"application-notifications-collapse\" opened = \"[[opened]]\">\n                    <div id=\"application-notifications-panel\" class=\"body\"></div>\n                </iron-collapse>\n            </div>\n\n            <div id=\"user-notifications\" style=\"display: none;\">\n                <div class=\"header\" id=\"user-notifications-btn\">\n                    <span>User</span>\n                    <paper-ripple recenters></paper-ripple>\n                </div>\n                <iron-collapse  id=\"user-notifications-collapse\" style=\"\">\n                    <div id=\"user-notifications-panel\" class=\"body\"></div>\n                </iron-collapse>\n            </div>\n\n        </div>\n        ";
        var range = document.createRange();
        _this.getMenuDiv().appendChild(range.createContextualFragment(html));
        // Action's
        _this.shadowRoot.appendChild(_this.getMenuDiv());
        _this.applicationNotificationsDiv = _this.shadowRoot.getElementById("application-notifications");
        _this.userNotificationsDiv = _this.shadowRoot.getElementById("user-notifications");
        _this.userNotificationsBtn = _this.shadowRoot.getElementById("user-notifications-btn");
        _this.applicationNotificationBtn = _this.shadowRoot.getElementById("application-notifications-btn");
        _this.userNotificationsCollapse = _this.shadowRoot.getElementById("user-notifications-collapse");
        _this.applicationNotificationsCollapse = _this.shadowRoot.getElementById("application-notifications-collapse");
        _this.applicationNotificationsPanel = _this.shadowRoot.getElementById("application-notifications-panel");
        _this.userNotificationsPanel = _this.shadowRoot.getElementById("user-notifications-panel");
        // Now I will set the animation
        _this.userNotificationsBtn.onclick = function () {
            _this.userNotificationsCollapse.toggle();
            if (_this.applicationNotificationsCollapse.opened) {
                _this.applicationNotificationsCollapse.toggle();
            }
            if (_this.userNotificationsCollapse.opened == true) {
                _this.userNotificationsBtn.style.borderTop = "1px solid #e8e8e8";
            }
            else {
                _this.userNotificationsBtn.style.borderTop = "";
            }
        };
        // Now I will set the animation
        _this.applicationNotificationBtn.onclick = function () {
            _this.applicationNotificationsCollapse.toggle();
            if (_this.userNotificationsCollapse.opened) {
                _this.userNotificationsCollapse.toggle();
            }
            if (_this.userNotificationsCollapse.opened == true) {
                _this.userNotificationsBtn.style.borderTop = "1px solid #e8e8e8";
            }
            else {
                _this.userNotificationsBtn.style.borderTop = "";
            }
        };
        _this.getIconDiv().addEventListener("click", function () {
            // reset the notification count.
            if (_this.notificationCount != undefined) {
                _this.notificationCount.parentNode.removeChild(_this.notificationCount);
                _this.notificationCount = undefined;
            }
            var isHidden = _this.getMenuDiv().parentNode == null;
            if (isHidden) {
                _this.shadowRoot.appendChild(_this.getMenuDiv());
            }
            var now = new Date();
            var dateTimeDivs = _this.shadowRoot.querySelectorAll(".notification_date");
            for (var i = 0; i < dateTimeDivs.length; i++) {
                var date = dateTimeDivs[i].date;
                var delay = Math.floor((now.getTime() - date.getTime()) / 1000);
                var div = dateTimeDivs[i];
                if (delay < 60) {
                    div.innerHTML = delay + " seconds ago";
                }
                else if (delay < 60 * 60) {
                    div.innerHTML = Math.floor(delay / (60)) + " minutes ago";
                }
                else if (delay < 60 * 60 * 24) {
                    div.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago";
                }
                else {
                    div.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago";
                }
            }
            localStorage.setItem("notifications_read_date", now.getTime().toString());
            if (isHidden) {
                _this.shadowRoot.removeChild(_this.getMenuDiv());
            }
        });
        _this.shadowRoot.removeChild(_this.getMenuDiv());
        return _this;
    }
    NotificationMenu.prototype.init = function () {
        var _this = this;
        // The logout event.
        Model.eventHub.subscribe("logout_event", function (uuid) {
            /** nothing to do here. */
        }, function (account) {
            _this.clearUserNotifications();
            Model.eventHub.unSubscribe(account._id + "_notification_event", _this.account_notification_listener);
        }, true);
        // The logout event.
        Model.eventHub.subscribe("login_event", function (uuid) {
            /** nothing to do here. */
        }, function (account) {
            Model.eventHub.subscribe(account._id + "_notification_event", function (uuid) {
                _this.account_notification_listener = uuid;
            }, function (notification) {
                _this.setNotificationCount();
                notification = JSON.parse(notification);
                notification._date = new Date(notification._date);
                _this.appendNofication(_this.userNotificationsPanel, notification);
                if (!_this.userNotificationsCollapse.opened) {
                    _this.userNotificationsCollapse.toggle();
                }
            }, false);
        }, true);
        Model.eventHub.subscribe("set_application_notifications_event", function (uuid) {
            /** nothing to do here. */
        }, function (notifications) {
            _this.setApplicationNofications(notifications);
        }, true);
        Model.eventHub.subscribe("set_user_notifications_event", function (uuid) {
            /** nothing to do here. */
        }, function (notifications) {
            _this.setUserNofications(notifications);
        }, true);
        // Network event.
        Model.eventHub.subscribe(Model.application + "_notification_event", function (uuid) {
            /** nothing to do here. */
        }, function (notification) {
            _this.setNotificationCount();
            notification = JSON.parse(notification);
            notification._date = new Date(notification._date);
            _this.appendNofication(_this.applicationNotificationsPanel, notification);
            if (!_this.applicationNotificationsCollapse.opened) {
                _this.applicationNotificationsCollapse.toggle();
            }
        }, false);
    };
    // clear the notifications.
    NotificationMenu.prototype.clear = function () {
    };
    NotificationMenu.prototype.setNotificationCount = function () {
        var iconDiv = this.getIconDiv();
        for (var i = 0; i < iconDiv.children.length; i++) {
            if (iconDiv.children[i].id == "notification-count") {
                this.notificationCount = iconDiv.children[i];
                break;
            }
        }
        if (this.notificationCount == undefined) {
            var html = "\n            <style>\n                .notification-count{\n                    position: absolute;\n                    display: flex;\n                    top: 0px;\n                    right: -5px;\n                    background-color: var(--paper-badge-background);\n                    border-radius: 10px;\n                    width: 20px;\n                    height: 20px;\n                    justify-content: center;\n                    align-items: center;\n                    font-size: 8pt;\n                }\n            </style>\n            <div id=\"notification-count\" class=\"notification-count\">\n                0\n            </div>\n            ";
            // Set icon.
            this.getIcon().icon = "social:notifications";
            var range = document.createRange();
            iconDiv.appendChild(range.createContextualFragment(html));
            this.notificationCount = this.shadowRoot.getElementById("notification-count");
        }
    };
    // Set user notifications
    NotificationMenu.prototype.setUserNofications = function (notifications) {
        for (var i = 0; i < notifications.length; i++) {
            var notification = notifications[i];
            this.appendNofication(this.userNotificationsPanel, notification);
        }
        // open the user notifications...
        if (notifications.length > 0) {
            this.userNotificationsCollapse.toggle();
        }
    };
    // Clear all user notifications.
    NotificationMenu.prototype.clearUserNotifications = function () {
        this.userNotificationsPanel.innerHTML = "";
    };
    // Set the application notifications.
    NotificationMenu.prototype.setApplicationNofications = function (notifications) {
        for (var i = 0; i < notifications.length; i++) {
            var notification = notifications[i];
            this.appendNofication(this.applicationNotificationsPanel, notification);
        }
        // open the user notifications...
        if (notifications.length > 0) {
            this.applicationNotificationsCollapse.toggle();
        }
    };
    NotificationMenu.prototype.clearApplicationNotifications = function () {
        this.applicationNotificationsPanel.innerHTML = "";
    };
    // Create the notification panel.
    NotificationMenu.prototype.appendNofication = function (parent, notification) {
        var _this = this;
        var html = "\n        <div id=\"" + notification._id + "\" class=\"notification_panel\">\n            <paper-ripple recenters></paper-ripple>\n            <paper-icon-button id=\"" + notification._id + "_close_btn\" icon=\"close\" style=\"display: none; position: absolute; top: 0px; right: 0px;\"></paper-icon-button>\n            <div id=\"" + notification._id + "_recipient\"  style=\"display: flex; flex-direction: column; padding: 5px; align-items: center;\">\n                <img id=\"" + notification._id + "_img\"></img>\n                <span id=\"" + notification._id + "_span\" style=\"font-size: 10pt;\"></span>\n                <div id=\"" + notification._id + "_date\" class=\"notification_date\" style=\"font-size: 10pt;\"></div>\n            </div>\n            <div style=\"display: flex; flex-direction: column; padding:5px; flex-grow: 1;\">\n                <div id=\"" + notification._id + "_text\" style=\"flex-grow: 1; display: flex;\"></div>\n            </div>\n        </div>\n        ";
        // Set icon.
        this.getIcon().icon = "social:notifications";
        var range = document.createRange();
        parent.insertBefore(range.createContextualFragment(html), parent.firstChild);
        var isHidden = this.shadowRoot.getElementById(notification._id) == undefined;
        // Action's
        if (isHidden) {
            this.shadowRoot.appendChild(this.getMenuDiv());
        }
        this.shadowRoot.getElementById(notification._id + "_text").innerHTML = notification._text;
        var notificationDiv = this.shadowRoot.getElementById(notification._id);
        var closeBtn = this.shadowRoot.getElementById(notification._id + "_close_btn");
        closeBtn.onclick = function () {
            Model.eventHub.publish("delete_notification_event_", notification, true);
        };
        notificationDiv.onmouseover = function () {
            notificationDiv.style.backgroundColor = "#dbdbdb";
            notificationDiv.style.transition;
            notificationDiv.style.cursor = "pointer";
            if (notification._type == 2) {
                closeBtn.style.display = "block";
            }
        };
        notificationDiv.onmouseleave = function () {
            notificationDiv.style.backgroundColor = "";
            notificationDiv.style.cursor = "default";
            if (notification._type == 2) {
                closeBtn.style.display = "none";
            }
        };
        if (notification._type == 1) {
            this.applicationNotificationsDiv.style.display = "";
            var application = JSON.parse(notification._sender);
            this.shadowRoot.getElementById(notification._id + "_img").src = application.icon;
            this.shadowRoot.getElementById(notification._id + "_img").style.borderRadius = "0px";
            this.shadowRoot.getElementById(notification._id + "_img").style.width = "24px";
            this.shadowRoot.getElementById(notification._id + "_img").style.height = "24px";
        }
        else if (notification._type == 2) {
            this.userNotificationsDiv.style.display = "";
            var account = JSON.parse(notification._sender);
            this.shadowRoot.getElementById(notification._id + "_img").src = account.profilPicture_;
            this.shadowRoot.getElementById(notification._id + "_span").innerHTML = account._id;
            var deleteNotificationListener_1;
            Model.eventHub.subscribe(notification._id + "_delete_notification_event", function (uuid) {
                deleteNotificationListener_1 = uuid;
            }, function (notification) {
                notification = JSON.parse(notification);
                notification._date = new Date(notification._date);
                notificationDiv.parentNode.removeChild(notificationDiv);
                Model.eventHub.unSubscribe(notification._id + "_delete_notification_event", deleteNotificationListener_1);
                if (_this.userNotificationsPanel.children.length == 0 && _this.applicationNotificationsPanel.children.length == 0) {
                    _this.getIcon().icon = "social:notifications-none";
                }
                if (_this.userNotificationsPanel.children.length == 0) {
                    _this.userNotificationsDiv.style.display = "none";
                }
            }, false);
        }
        var date = new Date(notification._date);
        var now = new Date();
        var delay = Math.floor((now.getTime() - date.getTime()) / 1000);
        var div = this.shadowRoot.getElementById(notification._id + "_date");
        div.date = date;
        if (delay < 60) {
            div.innerHTML = delay + " seconds ago";
        }
        else if (delay < 60 * 60) {
            div.innerHTML = Math.floor(delay / (60)) + " minutes ago";
        }
        else if (delay < 60 * 60 * 24) {
            div.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago";
        }
        else {
            div.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago";
        }
        if (isHidden) {
            this.shadowRoot.removeChild(this.getMenuDiv());
        }
        // Now the new notification count badge.
        var count = 0;
        var notifications_read_date = 0;
        if (localStorage.getItem("notifications_read_date") != undefined) {
            notifications_read_date = parseInt(localStorage.getItem("notifications_read_date"));
        }
        if (notification._date.getTime() > notifications_read_date) {
            if (this.notificationCount != undefined) {
                count = parseInt(this.notificationCount.innerHTML);
            }
            else {
                this.setNotificationCount();
            }
            count++;
            this.notificationCount.innerHTML = count.toString();
        }
    };
    return NotificationMenu;
}(Menu));
export { NotificationMenu };
customElements.define('globular-notification-menu', NotificationMenu);
//# sourceMappingURL=Notification.js.map