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

import { Notification } from "../Notification"
import { Account } from "../Account"
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';

/**
 * Login/Register functionality.
 */
export class NotificationMenu extends Menu {

    // Create the applicaiton view.
    constructor() {
        super("notification", "social:notifications-none", "Notifications")

        // event handler.
        this.onclose = null;

        // The div inner panel.
        let html = `
        <style>
       

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
            border-bottom: 1px solid var(--palette-action-disabled);
            border-top: 1px solid var(--palette-action-disabled);
        }

        iron-collapse{
            border-bottom: 1px solid var(--palette-action-disabled);
            border-top: 1px solid var(--palette-action-disabled);
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
            filter: invert(0%);
        }
        
        .notification_panel:hover {
            filter: invert(10%);
        }

        paper-card{
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
        }
  

        paper-card h1 {
            font-size: 1.65rem;
            margin: 0px;
            margin-bottom: 10px;
        }

        #title{
            display: none; 
            justify-content: center;
        }

    </style>

        <div>
            <div id="header" style="width: 100%;">
                <div id="title">
                    <h1 style="flex-grow: 1;">Notification's</h1>
                    <paper-icon-button id="close-btn" icon="icons:close" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
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
        `

        let range = document.createRange()
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().querySelector("#close-btn").onclick = ()=>{
            this.getMenuDiv().parentNode.removeChild(this.getMenuDiv())
        }
        
        // Action's
        this.shadowRoot.appendChild(this.getMenuDiv())

        this.applicationNotificationsDiv = this.shadowRoot.getElementById("application-notifications")
        this.userNotificationsDiv = this.shadowRoot.getElementById("user-notifications")

        this.userNotificationsBtn = this.shadowRoot.getElementById("user-notifications-btn")
        this.applicationNotificationBtn = this.shadowRoot.getElementById("application-notifications-btn")

        this.userNotificationsCollapse = this.shadowRoot.getElementById("user-notifications-collapse");
        this.applicationNotificationsCollapse = this.shadowRoot.getElementById("application-notifications-collapse");
        this.applicationNotificationsPanel = this.shadowRoot.getElementById("application-notifications-panel")
        this.userNotificationsPanel = this.shadowRoot.getElementById("user-notifications-panel")

        // Now I will set the animation
        this.userNotificationsBtn.onclick = () => {
            this.userNotificationsCollapse.toggle()
            if (this.applicationNotificationsCollapse.opened) {
                this.applicationNotificationsCollapse.toggle()
            }
            if (this.userNotificationsCollapse.opened == true) {
                this.userNotificationsBtn.style.borderTop = "1px solid var(--palette-action-disabled)"
            } else {
                this.userNotificationsBtn.style.borderTop = ""
            }
        }

        // Now I will set the animation
        this.applicationNotificationBtn.onclick = () => {
            this.applicationNotificationsCollapse.toggle()
            if (this.userNotificationsCollapse.opened) {
                this.userNotificationsCollapse.toggle()
            }
            if (this.userNotificationsCollapse.opened == true) {
                this.userNotificationsBtn.style.borderTop = "1px solid var(--palette-action-disabled)"
            } else {
                this.userNotificationsBtn.style.borderTop = ""
            }
        }

        this.getIconDiv().addEventListener("click", () => {
            // reset the notification count.
            if (this.notificationCount != undefined) {
                this.notificationCount.parentNode.removeChild(this.notificationCount)
                this.notificationCount = undefined
            }

            let isHidden = this.getMenuDiv().parentNode == null
            if (isHidden) {
                this.shadowRoot.appendChild(this.getMenuDiv())
            }

            let now = new Date()
            let dateTimeDivs = this.shadowRoot.querySelector(".notification_date")
            if (dateTimeDivs != undefined) {
                for (var i = 0; i < dateTimeDivs.length; i++) {
                    let date = dateTimeDivs[i].date;
                    let delay = Math.floor((now.getTime() - date.getTime()) / 1000);
                    let div = dateTimeDivs[i]
                    if (delay < 60) {
                        div.innerHTML = delay + " seconds ago"
                    } else if (delay < 60 * 60) {
                        div.innerHTML = Math.floor(delay / (60)) + " minutes ago"
                    } else if (delay < 60 * 60 * 24) {
                        div.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago"
                    } else {
                        div.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago"
                    }
                }

                localStorage.setItem("notifications_read_date", now.getTime().toString())
            }

            if (isHidden) {
                this.shadowRoot.removeChild(this.getMenuDiv())
            }

        })

        this.shadowRoot.removeChild(this.getMenuDiv())
    }

    init() {
        
        // hide the menu div
        this.hideMenuDiv = true

        // The logout event.
        Model.eventHub.subscribe("logout_event",
            (uuid) => {
                /** nothing to do here. */
            },
            (account) => {
                this.clearUserNotifications()
                Model.eventHub.unSubscribe(account.id + "@" + account.domain + "_notification_event", this.account_notification_listener)
            }, true, this)


        Model.eventHub.subscribe("set_application_notifications_event",
            (uuid) => {
                /** nothing to do here. */
            },
            (notifications) => {
                this.setApplicationNofications(notifications)
            }, true, this)

        Model.eventHub.subscribe("set_user_notifications_event",
            (uuid) => {
                /** nothing to do here. */
            },
            (notifications) => {
                this.setUserNofications(notifications)
            }, true, this)

        // Network event.
        Model.eventHub.subscribe(Model.application + "_notification_event",
            (uuid) => {
                /** nothing to do here. */
            },
            (evt) => {
                this.setNotificationCount()
                let notification = Notification.fromString(evt)
                this.appendNofication(this.applicationNotificationsPanel, notification)
                if (!this.applicationNotificationsCollapse.opened) {
                    this.applicationNotificationsCollapse.toggle()
                }
            }, false, this)

        Model.eventHub.subscribe(Application.account.id + "@" + Application.account.domain + "_notification_event",
            (uuid) => {
                this.account_notification_listener = uuid
            },
            (evt) => {
                let notification = Notification.fromString(evt)
                this.appendNofication(this.userNotificationsPanel, notification)
                if (!this.userNotificationsCollapse.opened) {
                    this.userNotificationsCollapse.toggle()
                }
                this.setNotificationCount()
            }, false)
    }

    // clear the notifications.
    clear() {

    }

    setNotificationCount() {
        let iconDiv = this.getIconDiv()
        for (var i = 0; i < iconDiv.children.length; i++) {
            if (iconDiv.children[i].id == "notification-count") {
                this.notificationCount = iconDiv.children[i]
                break
            }
        }

        if (this.notificationCount == undefined) {
            let html = `
            <style>
                .notification-count{
                    position: absolute;
                    display: flex;
                    top: 0px;
                    left: -5px;
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
            `
            // Set icon.
            this.getIcon().icon = "social:notifications"

            let range = document.createRange()
            iconDiv.appendChild(range.createContextualFragment(html));
            this.notificationCount = this.shadowRoot.getElementById("notification-count")
        }
    }

    // Set user notifications
    setUserNofications(notifications) {
        for (var i = 0; i < notifications.length; i++) {
            let notification = notifications[i]
            this.appendNofication(this.userNotificationsPanel, notification)
        }

        // open the user notifications...
        if (notifications.length > 0) {
            this.userNotificationsCollapse.toggle()
        }
    }

    // Clear all user notifications.
    clearUserNotifications() {
        this.userNotificationsPanel.innerHTML = ""
    }

    // Set the application notifications.
    setApplicationNofications(notifications) {
        for (var i = 0; i < notifications.length; i++) {
            let notification = notifications[i]
            this.appendNofication(this.applicationNotificationsPanel, notification)
        }
        // open the user notifications...
        if (notifications.length > 0) {
            this.applicationNotificationsCollapse.toggle()
        }
    }

    clearApplicationNotifications() {
        this.applicationNotificationsPanel.innerHTML = ""
    }

    // Create the notification panel.
    appendNofication(parent, notification) {

        let html = `
        <div id="div_${notification._id}" class="notification_panel">
            <div id="div_${notification._id}_close_btn" style="position: absolute; top: 5px; right: 5px; display: none;">
                <div style="position: relative;">
                    <iron-icon   icon="close" style="--iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters></paper-ripple>
                </div>
            </div>
            <div id="div_${notification._id}_recipient"  style="display: flex; flex-direction: column; padding: 5px; align-items: center;">
                <img id="div_${notification._id}_img"></img>
                <iron-icon id="div_${notification._id}_ico" icon="account-circle"></iron-icon>
                <span id="div_${notification._id}_span" style="font-size: 10pt;"></span>
                <div id="div_${notification._id}_date" class="notification_date" style="font-size: 10pt;"></div>
            </div>
            <div style="display: flex; flex-direction: column; padding:5px; flex-grow: 1;">
                <div id="div_${notification._id}_text" style="flex-grow: 1; display: flex;">${notification._text}</div>
            </div>
        </div>
        `

        // Set icon.
        this.getIcon().icon = "social:notifications"

        let range = document.createRange()

        parent.insertBefore(range.createContextualFragment(html), parent.firstChild);

        let isHidden = this.shadowRoot.getElementById(`div_${notification._id}`) == undefined

        // Action's
        if (isHidden) {
            this.shadowRoot.appendChild(this.getMenuDiv())
        }


        let notificationDiv = this.shadowRoot.getElementById(`div_${notification._id}`)
        let closeBtn = this.shadowRoot.getElementById(`div_${notification._id}_close_btn`)

        closeBtn.onclick = () => {
            Model.publish("delete_notification_event_", notification, true)
            if (this.onclose != undefined) {
                this.onclose(notification);
            }
        }

        notificationDiv.onmouseover = () => {
            notificationDiv.style.transition
            notificationDiv.style.cursor = "pointer"
            if (notification._type == 0) {
                closeBtn.style.display = "block"
            }
        }

        notificationDiv.onmouseleave = () => {
            notificationDiv.style.backgroundColor = ""
            notificationDiv.style.cursor = "default"
            if (notification._type == 0) {
                closeBtn.style.display = "none"
            }
        }

        // set element style.
        notificationDiv.style.display = "flex"
        notificationDiv.style.position = "relative"
        notificationDiv.style.padding = ".75rem"
        let date_div = this.shadowRoot.getElementById(`div_${notification._id}_date`)

        setInterval(() => {
            let date = new Date(notification._date)
            let now = new Date()
            let delay = Math.floor((now.getTime() - date.getTime()) / 1000);

            date_div.date = date

            if (delay < 60) {
                date_div.innerHTML = delay + " seconds ago"
            } else if (delay < 60 * 60) {
                date_div.innerHTML = Math.floor(delay / (60)) + " minutes ago"
            } else if (delay < 60 * 60 * 24) {
                date_div.innerHTML = Math.floor(delay / (60 * 60)) + " hours ago"
            } else {
                date_div.innerHTML = Math.floor(delay / (60 * 60 * 24)) + " days ago"
            }
        }, 1000)

        // Now the new notification count badge.
        let count = 0;
        let notifications_read_date = 0;
        if (localStorage.getItem("notifications_read_date") != undefined) {
            notifications_read_date = parseInt(localStorage.getItem("notifications_read_date"))
        }

        // if it set to true a toast will be display for that notification.
        let displayNotification = true;

        if (notification._date.getTime() > notifications_read_date) {
            if (this.notificationCount != undefined) {
                count = parseInt(this.notificationCount.innerHTML)
            } else {
                this.setNotificationCount()
            }
            count++
            this.notificationCount.innerHTML = count.toString()
        } else {
            displayNotification = false
        }

        if (notification._type == 1) {
            this.applicationNotificationsDiv.style.display = ""
            let application = JSON.parse(notification._sender)
            let img = this.shadowRoot.getElementById(`div_${notification._id}_img`)
            let ico = this.shadowRoot.getElementById(`div_${notification._id}_ico`)
            img.src = application.icon
            img.style.borderRadius = "0px"
            img.style.width = "24px"
            img.style.height = "24px"
            ico.style.display = "none"

            // Here I will display notification to the Application toast...
            if (displayNotification) {
                let toast = ApplicationView.displayMessage(notificationDiv.outerHTML, 15000)
                if (toast == undefined) {
                    return
                }
                let closeBtn = toast.el.querySelector(`#div_${notification._id}_close_btn`)
                closeBtn.style.right = "-10px"
                closeBtn.style.display = "block"
                closeBtn.onclick = () => {
                    if (this.onclose != undefined) {
                        this.onclose(notification);
                    }
                    toast.dismiss()
                }

            }


        } else if (notification._type == 0) {
            this.userNotificationsDiv.style.display = ""
            let img = this.shadowRoot.getElementById(`div_${notification._id}_img`)
            let ico = this.shadowRoot.getElementById(`div_${notification._id}_ico`)
            let span = this.shadowRoot.getElementById(`div_${notification._id}_span`)
            Account.getAccount(notification._sender, (account) => {
                if (account.profilePicture) {
                    img.style.display = "block"
                    ico.style.display = "none"
                    img.src = account.profilePicture
                    img.style.maxWidth = "64px"
                    img.style.maxHeight = "64px"
                } else {
                    img.style.display = "none"
                    ico.style.display = "block"
                }

                span.innerHTML = account.name
                let deleteNotificationListener

                // Here I will display notification to the Application toast...
                if (displayNotification) {
                    let toast = ApplicationView.displayMessage(notificationDiv.outerHTML, 10000)
                    let closeBtn = toast.el.querySelector(`#div_${notification._id}_close_btn`)
                    closeBtn.style.display = "block"
                    closeBtn.right = "-10px"
                    closeBtn.onclick = () => {
                        Model.publish("delete_notification_event_", notification, true)
                        if (this.onclose != undefined) {
                            this.onclose(notification);
                        }
                        toast.dismiss()
                    }
                }

                Model.eventHub.subscribe(
                    notification._id + "_delete_notification_event",
                    (uuid) => {
                        deleteNotificationListener = uuid
                    },
                    (evt) => {
                        let notification = Notification.fromString(evt)
                        notificationDiv.parentNode.removeChild(notificationDiv)
                        Model.eventHub.unSubscribe(notification._id + "_delete_notification_event", deleteNotificationListener)
                        if (this.userNotificationsPanel.children.length == 0 && this.applicationNotificationsPanel.children.length == 0) {
                            this.getIcon().icon = "social:notifications-none"
                        }

                        if (this.userNotificationsPanel.children.length == 0) {
                            this.userNotificationsDiv.style.display = "none"
                        }
                    },
                    false, this
                );
            }, err => {
                ApplicationView.displayMessage(err, 3000)
                console.log(err)
            })
        }

        // remove it from display.
        if (isHidden) {
            this.shadowRoot.removeChild(this.getMenuDiv())
        }


    }



}

customElements.define('globular-notification-menu', NotificationMenu)