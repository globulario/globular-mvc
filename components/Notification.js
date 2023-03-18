// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/iron-collapse/iron-collapse.js';
import '@polymer/paper-badge/paper-badge.js';
import { setMoveable } from './moveable'
import { setResizeable } from './rezieable'
import { generatePeerToken, Model } from '../Model';
import { Menu } from './Menu';

import { Notification } from "../Notification"
import { Account } from "../Account"
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';
import * as resource_pb from 'globular-web-client/resource/resource_pb';
import { fireResize, randomUUID } from './utility';

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
       
        ::-webkit-scrollbar {
            width: 5px;
            height: 5px;

         }
            
         ::-webkit-scrollbar-track {
            background: var(--palette-background-default);
         }
         
         ::-webkit-scrollbar-thumb {
            background: var(--palette-divider); 
         }

        #notifications{
            display: flex;
            flex-direction: column;
        }

        #notification-create-btn{
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

        .header paper-icon-button {
            min-width: 40px;
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

        .btn_ {
            position: relative;
        }

        .btn_:hover{
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
            border-bottom: 1px solid var(--palette-action-disabled);
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

        #user-notifications-btn{
            display: flex;
            position:  relative;

        }

        #user-notifications-btn span{
            flex-grow: 1;
        }
    
        #content {
            width: 100%;
            display: flex;
            flex-direction: column;
        }

        paper-button {
            font-size: 1rem;
        }

        @media (max-width: 500px) {
            #content {
                width: calc(100vw - 20px);
                margin-top: 10px;
            }

            .header {
                min-width: 0px;
                width: calc(100vw - 20px);
                padding: 0px;
            }

            .notification-label, .btn_ {
                padding: .5rem;
            }

            .body {
                min-width: 0px;
                max-height: calc(100vh - 160px);
            }
        }

    </style>

        <div id="content">
            <div class="header" style="border-bottom: 1px solid var(--palette-action-disabled);">
                <div class="notification-label">Notifications</div>
                <div class="btn_div">
                    <div class="btn_">
                        <iron-icon id="notification-create-btn" icon="icons:add"></iron-icon>
                        <paper-ripple class="circle" recenters></paper-ripple>
                    </div>
                </div>
            </div>

            <div id="application-notifications" style="display: none;">
                <div class="header" id="application-notifications-btn">
                    <span class="notification-label">Application</span>
                    <paper-ripple recenters></paper-ripple>
                </div>
                <iron-collapse id="application-notifications-collapse" opened = "[[opened]]">
                    <div id="application-notifications-panel" class="body"></div>
                </iron-collapse>
            </div>

            <div id="user-notifications" style="display: none;">
                <div class="header" id="user-notifications-btn">
                    <span class="notification-label">User</span>
                    <paper-button id="clear-user-notifications-btn">Clear</paper-button>
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

        // Action's
        this.shadowRoot.appendChild(this.getMenuDiv())


        this.shadowRoot.querySelector("#clear-user-notifications-btn").onclick = (evt) => {
            evt.stopPropagation()

            // Now I will ask the user if he want to remove all notification.
            // Here I will ask the user for confirmation before actually delete the contact informations.
            let toast = ApplicationView.displayMessage(
                `
            <style>
             
              #yes-no-notification-delete-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-notification-delete-box globular-notification-card{
                padding-bottom: 10px;
              }

              #yes-no-notification-delete-box div{
                display: flex;
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-notification-delete-box">
              <div>Your about to delete all user notifications</div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-delete-notification">Yes</paper-button>
                <paper-button raised id="no-delete-notification">No</paper-button>
              </div>
            </div>
            `,
                15000 // 15 sec...
            );

            let yesBtn = document.querySelector("#yes-delete-notification")
            let noBtn = document.querySelector("#no-delete-notification")

            // On yes
            yesBtn.onclick = () => {

                let rqst = new resource_pb.ClearNotificationsByTypeRqst
                rqst.setNotificationType(resource_pb.NotificationType.USER_NOTIFICATION)
                rqst.setRecipient(Application.account.id + "@" + Application.account.domain)

                let globule = Model.getGlobule(Application.account.domain)
                generatePeerToken(globule, token => {
                    globule.resourceService.clearNotificationsByType(rqst, {
                        token: token,
                        application: Model.application,
                        domain: globule.domain,
                        address: Model.address
                    }).then((rsp) => {
                        ApplicationView.displayMessage(
                            "<iron-icon icon='icons:delete' style='margin-right: 10px;'></iron-icon><div>all user notification was removed</div>",
                            3000
                        );
                    })
                        .catch(err => ApplicationView.displayMessage(err, 3000))

                })

                toast.dismiss();

            }

            noBtn.onclick = () => {
                toast.dismiss();
            }

        }

        this.applicationNotificationsDiv = this.shadowRoot.getElementById("application-notifications")
        this.userNotificationsDiv = this.shadowRoot.getElementById("user-notifications")

        this.userNotificationsBtn = this.shadowRoot.getElementById("user-notifications-btn")
        this.applicationNotificationBtn = this.shadowRoot.getElementById("application-notifications-btn")

        this.userNotificationsCollapse = this.shadowRoot.getElementById("user-notifications-collapse");
        this.applicationNotificationsCollapse = this.shadowRoot.getElementById("application-notifications-collapse");
        this.applicationNotificationsPanel = this.shadowRoot.getElementById("application-notifications-panel")
        this.userNotificationsPanel = this.shadowRoot.getElementById("user-notifications-panel")

        this.notificationCreateBtn = this.shadowRoot.getElementById("notification-create-btn")
        this.notificationCreateBtn.onclick = () => {
            let notificationEditor = new NotificationEditor()
            ApplicationView.layout.workspace().appendChild(notificationEditor)
            this.shadowRoot.appendChild(this.getMenuDiv())
        }

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
                if (this.notificationCount.parentNode)
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

        Model.getGlobule(Application.account.domain).eventHub.subscribe(Application.account.id + "@" + Application.account.domain + "_notification_event",
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


        Model.getGlobule(Application.account.domain).eventHub.subscribe(Application.account.id + "@" + Application.account.domain + "_clear_user_notifications_evt",
            (uuid) => {

            },
            (evt) => {
                // So here I will clear the notofication...
                this.userNotificationsPanel.innerHTML = ""
                this.userNotificationsDiv.style.display = "none"
            }, false)


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
        notificationDiv.notification = notification;

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
                let div = toast.el.querySelector(`#div_${notification._id}_text`)
                div.style.minWidth = "200px"
                div.style.maxWidth = "320px"
                div.style.marginLeft = "10px"
                div.style.marginRight = "30px"
                div.style.maxHeight = "350px"
                div.style.overflowY = "auto"
                let closeBtn = toast.el.querySelector(`#div_${notification._id}_close_btn`)
                closeBtn.style.right = "-5px"
                closeBtn.style.top = "-5px"
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
                    let div = toast.el.querySelector(`#div_${notification._id}_text`)
                    div.style.minWidth = "200px"
                    div.style.maxWidth = "320px"
                    div.style.marginLeft = "10px"
                    div.style.marginRight = "30px"
                    div.style.maxHeight = "350px"
                    div.style.overflowY = "auto"
                    let closeBtn = toast.el.querySelector(`#div_${notification._id}_close_btn`)
                    closeBtn.style.display = "block"
                    closeBtn.style.position = "absolute"
                    closeBtn.right = "-5px"
                    closeBtn.top = "-5px"
                    closeBtn.onclick = () => {
                        Model.publish("delete_notification_event_", notification, true)
                        if (this.onclose != undefined) {
                            this.onclose(notification);
                        }
                        toast.dismiss()
                    }
                }

                Model.getGlobule(notification.mac).eventHub.subscribe(
                    notification._id + "_delete_notification_event",
                    (uuid) => {
                        deleteNotificationListener = uuid
                    },
                    (evt) => {
                        let notification = Notification.fromString(evt)
                        let parent = notificationDiv.parentNode
                        parent.removeChild(notificationDiv)

                        let count = 0;
                        let notifications_read_date = 0;
                        if (localStorage.getItem("notifications_read_date") != undefined) {
                            notifications_read_date = parseInt(localStorage.getItem("notifications_read_date"))
                        }

                        // if it set to true a toast will be display for that notification.
                        for (var i = 0; i < parent.children.length; i++) {
                            let notification = parent.children[i].notification
                            if (notification._date.getTime() > notifications_read_date) {
                                if (this.notificationCount != undefined) {
                                    count = parseInt(this.notificationCount.innerHTML)
                                } else {
                                    this.setNotificationCount()
                                }
                                count++
                                this.notificationCount.innerHTML = count.toString()
                            }
                        }

                        if (count == 0) {
                            if (this.notificationCount)
                                if (this.notificationCount.parentNode)
                                    this.notificationCount.parentNode.removeChild(this.notificationCount)
                        }


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


/**
 * Sample empty component
 */
export class NotificationEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // the account to 
        this.accounts = {}


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        #container{
            position: fixed;
            background: var(--palette-background-default); 
            border-top: 1px solid var(--palette-divider);
            border-left: 1px solid var(--palette-divider);
        }

        .header{
            display: flex;
            align-items: center;
            color: var(--palette-text-accent);
            background-color: var(--palette-primary-accent);
        }

        .header span{
            flex-grow: 1;
            text-align: center;
            font-size: 1.1rem;
            font-weight: 500;
            display: inline-block;
            white-space: nowrap;
            overflow: hidden !important;
            text-overflow: ellipsis;
            max-width: calc(100vw - 50px);
        }

        ::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }
            
        ::-webkit-scrollbar-track {
            background: var(--palette-background-default);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--palette-divider); 
        }

        #content{
            display: flex;
            background: #000000;
            justify-items: center;
            overflow: hidden;
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
            height: calc(100% - 40px);
            font-size: 1.1rem;
        }

        globular-subjects-view{
            border-right: 1px solid var(--palette-divider);
        }

        globular-subjects-selected {
            width: 100%;
        }

        iron-autogrow-textarea{
            flex-grow: 1;
        }

        #text-writer-box{
            width: calc(100% - 18px);
            margin-left: 5px;
            border: 1px solid var(--palette-divider);
            border-radius: 4px;
        }

        #sub-content{
            display: flex; 
            flex-direction: column; 
            width: 100%; 
            flex-grow: 1;
        }

        @media (max-width: 500px) {
 
            #content{
                flex-direction: column;
            }

            #sub-content{
                /** to make the send button visible if there is a footer bar **/
                margin-bottom: 50px;
            }
        }

        </style>
        <paper-card id="container">
            <div class="header">
                <span id="handle">Notification</span>
                <paper-icon-button id="close-btn" icon="icons:close"></paper-icon-button>
            </div>
            <div id="content">
                <globular-subjects-view style="min-width: 250px; border-right: 1px solid var(--palette-divider)"></globular-subjects-view>
                <div id="sub-content">
                    <globular-subjects-selected ></globular-subjects-selected>
                    <iron-autogrow-textarea id="text-writer-box"></iron-autogrow-textarea>
                    <paper-icon-button style="align-self: end;"  id="send-btn" icon="send"></paper-icon-button>
                </div>
            </div>
            
        </paper-card>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")

        this.msgBox = this.shadowRoot.querySelector("#text-writer-box")

        this.sendBtn = this.shadowRoot.querySelector("#send-btn")
        this.sendBtn.onclick = () => {
            this.getAccounts(accounts => {

                for (var id in accounts) {
                    let a = accounts[id]
                    // so now I will send notification...
                    let rqst = new resource_pb.CreateNotificationRqst

                    let notification = new resource_pb.Notification
                    let date = Math.floor(Date.now() / 1000)
                    notification.setDate(date)
                    notification.setId(randomUUID())
                    notification.setNotificationType(resource_pb.NotificationType.USER_NOTIFICATION)
                    notification.setMessage(this.msgBox.value)
                    notification.setSender(Application.account.id + "@" + Application.account.domain)
                    notification.setRecipient(a.id + "@" + a.domain)
                    notification.setMac(Model.getGlobule(a.domain).config.Mac)
                    rqst.setNotification(notification)

                    // so here I will send the notification the the destination
                    let globule = Model.getGlobule(a.domain)
                    generatePeerToken(globule, token => {
                        globule.resourceService.createNotification(rqst, {
                            token: token,
                            application: Model.application,
                            domain: globule.domain,
                            address: Model.address
                        }).then((rsp) => {

                            let notification_ = new Notification
                            notification_.id = notification.getId()
                            notification_.date = new Date()
                            notification_.sender = notification.getSender()
                            notification_.recipient = notification.getRecipient()
                            notification_.text = notification.getMessage()
                            notification_.type = 0

                            // Send notification...
                            globule.eventHub.publish(a.id + "@" + a.domain + "_notification_event", notification_.toString(), false)

                        }).catch(err => ApplicationView.displayMessage(err, 3000))
                    })
                }

                // close the notification 
                ApplicationView.displayMessage(`<div style="display: flex;"><iron-icon icon="send"></iron-icon><span style="margin-left: 20px;">Notification was sent...</span></div>`, 3000)
                this.parentNode.removeChild(this)

            })

        }

        let offsetTop = 64
        this.shadowRoot.querySelector("#close-btn").onclick = () => {

            this.parentNode.removeChild(this)
        }

        this.container.name = "notification_editor"

        setMoveable(this.shadowRoot.querySelector("#handle"), this.container, (left, top) => {
            /** */
        }, this, offsetTop)

        if (localStorage.getItem("__notification_editor_dimension__")) {

            let dimension = JSON.parse(localStorage.getItem("__notification_editor_dimension__"))
            if (!dimension) {
                dimension = { with: 600, height: 400 }
            }

            // be sure the dimension is no zeros...
            if (dimension.width < 600) {
                dimension.width = 600
            }

            if (dimension.height < 400) {
                dimension.height = 400
            }

            this.container.style.width = dimension.width + "px"
            this.container.style.height = dimension.height + "px"
            localStorage.setItem("__notification_editor_dimension__", JSON.stringify({ width: dimension.width, height: dimension.height }))
        } else {
            this.container.style.width = "600px"
            this.container.style.height = "400px"
            localStorage.setItem("__notification_editor_dimension__", JSON.stringify({ width: 600, height: 400 }))
        }


        this.container.maxWidth = 800;

        // Set resizable properties...
        setResizeable(this.container, (width, height) => {

            // fix min size.
            if (height < 400) {
                height = 400
            }

            if (width < 600) {
                width = 600
            }

            localStorage.setItem("__notification_editor_dimension__", JSON.stringify({ width: width, height: height }))

            let w = ApplicationView.layout.width();
            if (w < 500) {
                this.container.style.height = "calc(100vh - 60px)"
                this.container.style.width = "100vw"
            } else {
                this.container.style.height = height + "px"
                this.container.style.width = width + "px"
            }

        })

        let subjectsView = this.shadowRoot.querySelector("globular-subjects-view")
        this.selectedSubjects = this.shadowRoot.querySelector("globular-subjects-selected")

        // Append account 
        subjectsView.on_account_click = (accountDiv, account) => {
            accountDiv.account = account;
            this.selectedSubjects.appendAccount(accountDiv)
        }

        // Append group
        subjectsView.on_group_click = (groupDiv, group) => {
            groupDiv.group = group;
            this.selectedSubjects.appendGroup(groupDiv)
        }

        // set the size.
        fireResize()

    }

    getAccounts(callback) {

        let accounts = {}
        for (var i = 0; i < this.selectedSubjects.getAccounts().length; i++) {
            let a = this.selectedSubjects.getAccounts()[i]
            accounts[a.id] = a
        }

        let groups = this.selectedSubjects.getGroups()
        if (groups.length > 0) {
            groups.forEach(g => {
                let index = 0;

                let __getAccount__ = (index) => {
                    let m = g.members[index]
                    index++
                    Account.getAccount(m, (a) => {
                        accounts[a.id] = a
                        if (index < g.members.length) {
                            __getAccount__(index)
                        } else {
                            callback(accounts)
                        }
                    }, () => {
                        if (index < g.members.length) {
                            __getAccount__(index)
                        } else {
                            callback(accounts)
                        }
                    })
                }

                __getAccount__(index)
            })
        } else {
            callback(accounts)
        }

    }

}

customElements.define('globular-notification-editor', NotificationEditor)