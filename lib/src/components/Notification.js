"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationMenu = void 0;
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
require("@polymer/iron-icon/iron-icon.js");
require("@polymer/iron-icons/iron-icons.js");
require("@polymer/paper-icon-button/paper-icon-button.js");
require("@polymer/paper-ripple/paper-ripple.js");
require("@polymer/iron-collapse/iron-collapse.js");
require("@polymer/paper-badge/paper-badge.js");
const Model_1 = require("../Model");
const Menu_1 = require("./Menu");
const Layout_1 = require("./Layout");
/**
 * Login/Register functionality.
 */
class NotificationMenu extends Menu_1.Menu {
    // attributes.
    // Create the applicaiton view.
    constructor() {
        super("notification", "social:notifications-none", "Notifications");
        // The div inner panel.
        let html = `
        <style>
        ${Layout_1.theme}

        #notifications{
            display: flex;
            flex-direction: column;
        }

        #notifications-config{
            flex-grow: 1;

        }

        #application-notifications #user-notifications{
            display: flex;
            flex-direction: column;
        }

        .header{
            display: flex;
            min-width: 375px;
            position: relative;
            font-size: 12pt;
            align-items: center;
            padding: .5rem;
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
        }

        .header:hover{
            cursor: pointer;
        }

        .body{
            min-width: 375px;
            min-height: 100px;
            max-height: 30rem;
            overflow-y: auto;
        }

        .btn_div{
            display: flex; 
            flex-grow: 1; 
            justify-content: 
            flex-end;
        }

        .btn {
            position: relative;
        }

        .btn:hover{
            cursor: pointer;
        }

        iron-collapse{
            border-bottom: 1px solid #e8e8e8;
            border-top: 1px solid #e8e8e8;
        }

        iron-collapse{
            border-bottom: 1px solid #e8e8e8;
            border-top: 1px solid #e8e8e8;
        }

        .notification_panel{
            position: relative;
            display: flex; 
            padding: .75rem; 
            font-size: 12pt;
            transition: background 0.2s ease,padding 0.8s linear;
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
        }

        .notification_panel img {
            height: 48px;
            width: 48px;
            border-radius: 24px;
        }
    </style>

        <div>
            <div class="header" style="border-bottom: 1px solid #e8e8e8;">
                <div>Notifications</div>
                <div class="btn_div">
                    <div class="btn">
                        <iron-icon id="notifications-config" icon="settings"></iron-icon>
                        <paper-ripple class="circle" recenters></paper-ripple>
                    </div>
                </div>
            </div>

            <div id="application-notifications" style="display: none;">
                <div class="header" id="application-notifications-btn">
                    <span>Application</span>
                    <paper-ripple recenters></paper-ripple>
                </div>
                <iron-collapse id="application-notifications-collapse" opened = "[[opened]]">
                    <div id="application-notifications-panel" class="body"></div>
                </iron-collapse>
            </div>

            <div id="user-notifications" style="display: none;">
                <div class="header" id="user-notifications-btn">
                    <span>User</span>
                    <paper-ripple recenters></paper-ripple>
                </div>
                <iron-collapse  id="user-notifications-collapse" style="">
                    <div id="user-notifications-panel" class="body"></div>
                </iron-collapse>
            </div>

        </div>
        `;
        let range = document.createRange();
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        // Action's
        this.shadowRoot.appendChild(this.getMenuDiv());
        this.applicationNotificationsDiv = this.shadowRoot.getElementById("application-notifications");
        this.userNotificationsDiv = this.shadowRoot.getElementById("user-notifications");
        this.userNotificationsBtn = this.shadowRoot.getElementById("user-notifications-btn");
        this.applicationNotificationBtn = this.shadowRoot.getElementById("application-notifications-btn");
        this.userNotificationsCollapse = this.shadowRoot.getElementById("user-notifications-collapse");
        this.applicationNotificationsCollapse = this.shadowRoot.getElementById("application-notifications-collapse");
        this.applicationNotificationsPanel = this.shadowRoot.getElementById("application-notifications-panel");
        this.userNotificationsPanel = this.shadowRoot.getElementById("user-notifications-panel");
        // Now I will set the animation
        this.userNotificationsBtn.onclick = () => {
            this.userNotificationsCollapse.toggle();
            if (this.applicationNotificationsCollapse.opened) {
                this.applicationNotificationsCollapse.toggle();
            }
            if (this.userNotificationsCollapse.opened == true) {
                this.userNotificationsBtn.style.borderTop = "1px solid #e8e8e8";
            }
            else {
                this.userNotificationsBtn.style.borderTop = "";
            }
        };
        // Now I will set the animation
        this.applicationNotificationBtn.onclick = () => {
            this.applicationNotificationsCollapse.toggle();
            if (this.userNotificationsCollapse.opened) {
                this.userNotificationsCollapse.toggle();
            }
            if (this.userNotificationsCollapse.opened == true) {
                this.userNotificationsBtn.style.borderTop = "1px solid #e8e8e8";
            }
            else {
                this.userNotificationsBtn.style.borderTop = "";
            }
        };
        this.getIconDiv().addEventListener("click", () => {
            // reset the notification count.
            if (this.notificationCount != undefined) {
                this.notificationCount.parentNode.removeChild(this.notificationCount);
                this.notificationCount = undefined;
            }
            let isHidden = this.getMenuDiv().parentNode == null;
            if (isHidden) {
                this.shadowRoot.appendChild(this.getMenuDiv());
            }
            let now = new Date();
            let dateTimeDivs = this.shadowRoot.querySelectorAll(".notification_date");
            for (var i = 0; i < dateTimeDivs.length; i++) {
                let date = dateTimeDivs[i].date;
                let delay = Math.floor((now.getTime() - date.getTime()) / 1000);
                let div = dateTimeDivs[i];
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
                this.shadowRoot.removeChild(this.getMenuDiv());
            }
        });
        this.shadowRoot.removeChild(this.getMenuDiv());
    }
    init() {
        // The logout event.
        Model_1.Model.eventHub.subscribe("logout_event", (uuid) => {
            /** nothing to do here. */
        }, (account) => {
            this.clearUserNotifications();
            Model_1.Model.eventHub.unSubscribe(account._id + "_notification_event", this.account_notification_listener);
        }, true);
        // The logout event.
        Model_1.Model.eventHub.subscribe("login_event", (uuid) => {
            /** nothing to do here. */
        }, (account) => {
            Model_1.Model.eventHub.subscribe(account._id + "_notification_event", (uuid) => {
                this.account_notification_listener = uuid;
            }, (notification) => {
                this.setNotificationCount();
                notification = JSON.parse(notification);
                notification._date = new Date(notification._date);
                this.appendNofication(this.userNotificationsPanel, notification);
                if (!this.userNotificationsCollapse.opened) {
                    this.userNotificationsCollapse.toggle();
                }
            }, false);
        }, true);
        Model_1.Model.eventHub.subscribe("set_application_notifications_event", (uuid) => {
            /** nothing to do here. */
        }, (notifications) => {
            this.setApplicationNofications(notifications);
        }, true);
        Model_1.Model.eventHub.subscribe("set_user_notifications_event", (uuid) => {
            /** nothing to do here. */
        }, (notifications) => {
            this.setUserNofications(notifications);
        }, true);
        // Network event.
        Model_1.Model.eventHub.subscribe(Model_1.Model.application + "_notification_event", (uuid) => {
            /** nothing to do here. */
        }, (notification) => {
            this.setNotificationCount();
            notification = JSON.parse(notification);
            notification._date = new Date(notification._date);
            this.appendNofication(this.applicationNotificationsPanel, notification);
            if (!this.applicationNotificationsCollapse.opened) {
                this.applicationNotificationsCollapse.toggle();
            }
        }, false);
    }
    // clear the notifications.
    clear() {
    }
    setNotificationCount() {
        let iconDiv = this.getIconDiv();
        for (var i = 0; i < iconDiv.children.length; i++) {
            if (iconDiv.children[i].id == "notification-count") {
                this.notificationCount = iconDiv.children[i];
                break;
            }
        }
        if (this.notificationCount == undefined) {
            let html = `
            <style>
                .notification-count{
                    position: absolute;
                    display: flex;
                    top: 0px;
                    right: -5px;
                    background-color: var(--palette-secondary-main);
                    border-radius: 10px;
                    width: 20px;
                    height: 20px;
                    justify-content: center;
                    align-items: center;
                    font-size: 8pt;
                }
            </style>
            <div id="notification-count" class="notification-count">
                0
            </div>
            `;
            // Set icon.
            this.getIcon().icon = "social:notifications";
            let range = document.createRange();
            iconDiv.appendChild(range.createContextualFragment(html));
            this.notificationCount = this.shadowRoot.getElementById("notification-count");
        }
    }
    // Set user notifications
    setUserNofications(notifications) {
        for (var i = 0; i < notifications.length; i++) {
            let notification = notifications[i];
            this.appendNofication(this.userNotificationsPanel, notification);
        }
        // open the user notifications...
        if (notifications.length > 0) {
            this.userNotificationsCollapse.toggle();
        }
    }
    // Clear all user notifications.
    clearUserNotifications() {
        this.userNotificationsPanel.innerHTML = "";
    }
    // Set the application notifications.
    setApplicationNofications(notifications) {
        for (var i = 0; i < notifications.length; i++) {
            let notification = notifications[i];
            this.appendNofication(this.applicationNotificationsPanel, notification);
        }
        // open the user notifications...
        if (notifications.length > 0) {
            this.applicationNotificationsCollapse.toggle();
        }
    }
    clearApplicationNotifications() {
        this.applicationNotificationsPanel.innerHTML = "";
    }
    // Create the notification panel.
    appendNofication(parent, notification) {
        let html = `
        <div id="${notification._id}" class="notification_panel">
            <paper-ripple recenters></paper-ripple>
            <paper-icon-button id="${notification._id}_close_btn" icon="close" style="display: none; position: absolute; top: 0px; right: 0px;"></paper-icon-button>
            <div id="${notification._id}_recipient"  style="display: flex; flex-direction: column; padding: 5px; align-items: center;">
                <img id="${notification._id}_img"></img>
                <span id="${notification._id}_span" style="font-size: 10pt;"></span>
                <div id="${notification._id}_date" class="notification_date" style="font-size: 10pt;"></div>
            </div>
            <div style="display: flex; flex-direction: column; padding:5px; flex-grow: 1;">
                <div id="${notification._id}_text" style="flex-grow: 1; display: flex;"></div>
            </div>
        </div>
        `;
        // Set icon.
        this.getIcon().icon = "social:notifications";
        let range = document.createRange();
        parent.insertBefore(range.createContextualFragment(html), parent.firstChild);
        let isHidden = this.shadowRoot.getElementById(notification._id) == undefined;
        // Action's
        if (isHidden) {
            this.shadowRoot.appendChild(this.getMenuDiv());
        }
        this.shadowRoot.getElementById(notification._id + "_text").innerHTML = notification._text;
        let notificationDiv = this.shadowRoot.getElementById(notification._id);
        let closeBtn = this.shadowRoot.getElementById(notification._id + "_close_btn");
        closeBtn.onclick = () => {
            Model_1.Model.eventHub.publish("delete_notification_event_", notification, true);
        };
        notificationDiv.onmouseover = () => {
            notificationDiv.style.backgroundColor = "#dbdbdb";
            notificationDiv.style.transition;
            notificationDiv.style.cursor = "pointer";
            if (notification._type == 2) {
                closeBtn.style.display = "block";
            }
        };
        notificationDiv.onmouseleave = () => {
            notificationDiv.style.backgroundColor = "";
            notificationDiv.style.cursor = "default";
            if (notification._type == 2) {
                closeBtn.style.display = "none";
            }
        };
        if (notification._type == 1) {
            this.applicationNotificationsDiv.style.display = "";
            let application = JSON.parse(notification._sender);
            this.shadowRoot.getElementById(notification._id + "_img").src = application.icon;
            this.shadowRoot.getElementById(notification._id + "_img").style.borderRadius = "0px";
            this.shadowRoot.getElementById(notification._id + "_img").style.width = "24px";
            this.shadowRoot.getElementById(notification._id + "_img").style.height = "24px";
        }
        else if (notification._type == 2) {
            this.userNotificationsDiv.style.display = "";
            let account = JSON.parse(notification._sender);
            this.shadowRoot.getElementById(notification._id + "_img").src = account.profilPicture_;
            this.shadowRoot.getElementById(notification._id + "_span").innerHTML = account._id;
            let deleteNotificationListener;
            Model_1.Model.eventHub.subscribe(notification._id + "_delete_notification_event", (uuid) => {
                deleteNotificationListener = uuid;
            }, (notification) => {
                notification = JSON.parse(notification);
                notification._date = new Date(notification._date);
                notificationDiv.parentNode.removeChild(notificationDiv);
                Model_1.Model.eventHub.unSubscribe(notification._id + "_delete_notification_event", deleteNotificationListener);
                if (this.userNotificationsPanel.children.length == 0 && this.applicationNotificationsPanel.children.length == 0) {
                    this.getIcon().icon = "social:notifications-none";
                }
                if (this.userNotificationsPanel.children.length == 0) {
                    this.userNotificationsDiv.style.display = "none";
                }
            }, false);
        }
        let date = new Date(notification._date);
        let now = new Date();
        let delay = Math.floor((now.getTime() - date.getTime()) / 1000);
        let div = this.shadowRoot.getElementById(notification._id + "_date");
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
        let count = 0;
        let notifications_read_date = 0;
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
    }
}
exports.NotificationMenu = NotificationMenu;
customElements.define('globular-notification-menu', NotificationMenu);
