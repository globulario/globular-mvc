// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/editor-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import { Menu } from './Menu';
import { getTheme } from "./Theme";
import { Account } from "../Account"
import { generatePeerToken, Model } from "../Model"
import { ApplicationView } from '../ApplicationView';
import { Application } from '../Application';
import { ContactCard } from './Contact';
import { Notification as Notification_ } from '../Notification';
import { Call, ClearCallsRqst, CreateNotificationRqst, DeleteCallRqst, GetCallHistoryRqst, Notification, NotificationType, SetCallRqst } from 'globular-web-client/resource/resource_pb';
import { randomUUID } from './utility';
import { VideoConversation } from './WebRTC';
import { secondsToTime } from './Audio';

/**
 * Display information about calls, missed calls etc...
 */
export class CallsHistoryMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("calls_history", "communication:call", "Messenger")

        this.account = null;
        this.calls = {};

        this.width = 320;
        if (this.hasAttribute("width")) {
            this.width = parseInt(this.getAttribute("width"));
        }

        this.height = 550;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }
    }

    // Call search event.
    init(account) {

        this.account = account;

        let html = `
        <style>
            #Contacts-div {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
                height: 100%;
                flex-direction: column;
                overflow: hidden;

            }

            #calls-list{
                flex: 1;
                overflow: auto;
            
            }

            /* Need to position the badge to look like a text superscript */
            paper-tab {
              padding-right: 25px;
            }

            paper-tab paper-badge {
                --paper-badge-background: var(--palette-warning-main);
                --paper-badge-width: 16px;
                --paper-badge-height: 16px;
                --paper-badge-margin-left: 10px;
            }

            .tab-content{
                display: flex;
                flex: 1;
                flex-direction: column;
                min-width: 450px;
            }


        </style>
        <div id="Contacts-div">
            <div id="header" style="width: 100%;">
                <globular-autocomplete type="email" label="Search Contact" id="call_contact_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                <paper-tabs selected="0">
                    <paper-tab id="incomming-calls-tab">
                        <span id="incomming-calls-label" style="flex-grow: 1;">Incomming Call's</span>
                        <paper-badge style="display: none;" for="incomming-calls-label"></paper-badge>
                        <paper-icon-button id="clear-incomming-calls-btn" title="clear all incomming call's" icon="icons:delete-sweep"></paper-icon-button>
                    </paper-tab>
                    <paper-tab id="outgoing-calls-tab">
                        <span id="outgoing-calls-label" style="flex-grow: 1;">Outgoing Call's</span>
                        <paper-badge style="display: none;" for="outgoing-calls-label"></paper-badge>
                        <paper-icon-button id="clear-outgoing-calls-btn" title="clear all outgoing call's" icon="icons:delete-sweep"></paper-icon-button>
                    </paper-tab>
                </paper-tabs>
            </div>
            <div id="calls-list">
                <div class="tab-content" id="incomming-calls-div">
                </div>
                <div class="tab-content" id="outgoing-calls-div">
                </div>
            </div>
        </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        let outgoingCallsTab = this.getMenuDiv().querySelector("#outgoing-calls-tab")
        let outgoingCallsDiv = this.getMenuDiv().querySelector("#outgoing-calls-div")

        outgoingCallsTab.onclick = () => {
            outgoingCallsDiv.style.display = "flex"
            incommingCallsDiv.style.display = "none"
        }

        let incommingCallsTab = this.getMenuDiv().querySelector("#incomming-calls-tab")
        let incommingCallsDiv = this.getMenuDiv().querySelector("#incomming-calls-div")

        let clearIncommingCallsBtn = this.getMenuDiv().querySelector("#clear-incomming-calls-btn")
        clearIncommingCallsBtn.onclick = () => {
            // Here I will ask the user for confirmation before actually delete the contact informations.
            let toast = ApplicationView.displayMessage(
                `
            <style>
              ${getTheme()}
              #yes-no-calls-clear-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-calls-clear-box globular-contact-card{
                padding-bottom: 10px;
              }

              #yes-no-calls-clear-box div{
                display: flex;
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-calls-clear-box">
              <div>Your about to clear incomming call's history</div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-calls-clear">Yes</paper-button>
                <paper-button raised id="no-calls-clear">No</paper-button>
              </div>
            </div>
            `,
                15000 // 15 sec...
            );

            let yesBtn = document.querySelector("#yes-calls-clear")
            let noBtn = document.querySelector("#no-calls-clear")

            // On yes
            yesBtn.onclick = () => {
                toast.dismiss();
                let rqst = new ClearCallsRqst
                rqst.setAccountId(this.account.id + "@" + this.account.domain)
                rqst.setFilter(`{"callee":"${this.account.id + "@" + this.account.domain}"}`)
                let globule = Model.getGlobule(this.account.domain)

                generatePeerToken(globule, token => {
                    globule.resourceService.clearCalls(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                        .then(rsp => {

                            ApplicationView.displayMessage(
                                "Incomming call's history was clear",
                                3000
                            );
                            this.refreshCalls()
                        })
                })
            }

            noBtn.onclick = () => {
                toast.dismiss();
            }
        }

        let clearOutgoingCallsBtn = this.getMenuDiv().querySelector("#clear-outgoing-calls-btn")
        clearOutgoingCallsBtn.onclick = () => {
            // Here I will ask the user for confirmation before actually delete the contact informations.
            let toast = ApplicationView.displayMessage(
                `
            <style>
              ${getTheme()}
              #yes-no-calls-clear-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-calls-clear-box globular-contact-card{
                padding-bottom: 10px;
              }

              #yes-no-calls-clear-box div{
                display: flex;
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-calls-clear-box">
              <div>Your about to clear outgoing call's history</div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-calls-clear">Yes</paper-button>
                <paper-button raised id="no-calls-clear">No</paper-button>
              </div>
            </div>
            `,
                15000 // 15 sec...
            );

            let yesBtn = document.querySelector("#yes-calls-clear")
            let noBtn = document.querySelector("#no-calls-clear")

            // On yes
            yesBtn.onclick = () => {
                toast.dismiss();


                let rqst = new ClearCallsRqst
                rqst.setAccountId(this.account.id + "@" + this.account.domain)
                rqst.setFilter(`{"caller":"${this.account.id + "@" + this.account.domain}"}`)
                let globule = Model.getGlobule(this.account.domain)

                generatePeerToken(globule, token => {
                    globule.resourceService.clearCalls(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                        .then(rsp => {

                            ApplicationView.displayMessage(
                                "Outgoing call's history was clear",
                                3000
                            );
                            this.refreshCalls()
                        })
                })
            }

            noBtn.onclick = () => {
                toast.dismiss();
            }
        }

        incommingCallsTab.onclick = () => {
            outgoingCallsDiv.style.display = "none"
            incommingCallsDiv.style.display = "flex"
        }

        this.getMenuDiv().style.height = this.height + "px";
        this.getMenuDiv().style.maxHeight = "70vh"
        this.shadowRoot.appendChild(this.getMenuDiv())

        // The call contact action.
        let callContactInput = this.shadowRoot.getElementById("call_contact_input")
        callContactInput.onkeyup = () => {
            let val = callContactInput.getValue();
            if (val.length >= 3) {
                this.findAccountByEmail(val)
            } else {
                callContactInput.clear()
            }
        }


        // That function must return the div that display the value that we want.
        callContactInput.displayValue = (contact) => {

            let card = new ContactCard(account, contact, true);

            // Here depending if the contact is in contact list, in received invitation list or in sent invitation
            // list displayed action will be different.
            Account.getContacts(account, "{}",
                (contacts) => {

                    const info = contacts.find(obj => {
                        return obj._id === contact.name;
                    })

                    if (contact._id != this.account._id) {
                        if (info == undefined) {
                            card.setCallButton((contact) => {
                                this.onCallContact(contact);
                                callContactInput.clear();
                            })
                        }
                    }
                },
                err => ApplicationView.displayMessage(err, 3000))


            return card
        }


        // set active.
        incommingCallsTab.click();
        window.dispatchEvent(new Event('resize'));

        // Here I will subscribe to call's event.
        Account.getContacts(this.account, `{}`,
            (contacts) => {
                // Set the list of contacts (received invitation, sent invitation and actual contact id's)
                contacts.forEach(contact => {

                    // Connect other event...
                    let contact_domain = contact._id.split("@")[1]

                    // Outgoing calls.
                    Model.getGlobule(this.account.domain).eventHub.subscribe("calling_" + contact._id + "_evt", uuid => { },
                        call => {
                            // keep the call in map...
                            this.calls[call.getUuid()] = call;

                            Model.getGlobule(contact_domain).eventHub.subscribe(call.getUuid() + "_answering_call_evt", uuid => { }, evt => {
                                this.callStart(call, contact_domain)
                            }, false)

                            Model.getGlobule(contact_domain).eventHub.subscribe(call.getUuid() + "_miss_call_evt", uuid => { }, evt => {
                                call.setEndtime(-1)
                                this.setCall(call)
                            }, false)


                        }, true)

                    // Incomming call's
                    Model.getGlobule(this.account.domain).eventHub.subscribe("calling_" + this.account.id + "@" + this.account.domain + "_evt", uuid => { },
                        evt => {

                            let call = Call.deserializeBinary(Uint8Array.from(evt.split(",")))

                            // keep the call in map...
                            this.calls[call.getUuid()] = call;

                            Model.getGlobule(this.account.domain).eventHub.subscribe(call.getUuid() + "_answering_call_evt", uuid => { }, evt => {
                                this.callStart(call, contact_domain)
                            }, false)

                            Model.getGlobule(this.account.domain).eventHub.subscribe(call.getUuid() + "_miss_call_evt", uuid => { }, evt => {
                                call.setEndtime(-1)
                                this.setCall(call)
                            }, false)



                        }, false)
                })

            }, err => ApplicationView.displayMessage(err, 3000))

        // populate infos.
        this.refreshCalls()

        // Get the list of all accounts (mab).
        this.shadowRoot.removeChild(this.getMenuDiv())

    }

    onshow() {

        if (this.account)
            this.refreshCalls()

    }

    // save the call in the backend.
    setCall(call) {

        let rqst = new SetCallRqst
        rqst.setCall(call)

        // Set value on the callee...
        let globule = Model.getGlobule(this.account.domain)
        generatePeerToken(globule, token => {
            globule.resourceService.setCall(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                .then(rsp => {
                    // releoad the history...
                    this.refreshCalls()
                }).catch(err => { })
        })
    }

    // refresh the call history...
    refreshCalls() {

        let outgoingCallsDiv = this.getMenuDiv().querySelector("#outgoing-calls-div")
        let incommingCallsDiv = this.getMenuDiv().querySelector("#incomming-calls-div")

        // 
        outgoingCallsDiv.innerHTML = ""
        incommingCallsDiv.innerHTML = ""
        let range = document.createRange()

        // Display the calls...
        let rqst = new GetCallHistoryRqst
        rqst.setAccountId(this.account.id + "@" + this.account.domain)
        let globule = Model.getGlobule(this.account.domain)

        generatePeerToken(globule, token => {
            globule.resourceService.getCallHistory(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                .then(rsp => {
                    // releoad the history...
                    let calls = rsp.getCallsList().sort((a, b) => {
                        return b.getStarttime() - a.getStarttime()
                    })
                    let index = 0
                    calls.forEach(call => {

                        let html = `
                        <style>
                            img{
                                height: 40px;
                                width: 40px;
                                border-radius: 20px;
                                padding-right: 5px;
                            }

                            span{
                                font-size: 1.2rem;
                                margin-left: 10px;
                            }

                            #call_date{
                                flex-grow: 1;
                                font-size: 1.0rem;
                            }

                            #call_duration{
                               
                                font-size: 1.0rem;
                            }

                        </style>
                        <div id="_${call.getUuid()}" style="display: flex; flex-direction: column; padding: 5px 0px 5px; border-bottom: 1px solid var(--palette-divider);">
                            <div style="display: flex;">
                                <div id="call_date"></div>
                                <div id="call_duration"></div>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <img></img>
                                <span style="flex-grow: 1;"></span>
                                <paper-icon-button id="delete-btn" icon="icons:delete"></paper-icon-button>
                                <paper-icon-button id="call-btn" icon="communication:call"></paper-icon-button>
                            </div>
                        </div>
                        `
                        let fragment = range.createContextualFragment(html)
                        let div = fragment.querySelector(`#_${call.getUuid()}`)
                        let img = fragment.querySelector("img")
                        let span = fragment.querySelector("span")
                        let call_btn = fragment.querySelector("#call-btn")
                        let delete_btn = fragment.querySelector("#delete-btn")
                        let date_div = fragment.querySelector("#call_date")
                        let duration_div = fragment.querySelector("#call_duration")
                        div.style.order = ++index

                        Account.getAccount(call.getCallee(), callee => {
                            Account.getAccount(call.getCaller(), caller => {


                                let contact = null
                                if (caller.id == this.account.id) {
                                    contact = callee
                                    outgoingCallsDiv.appendChild(fragment)
                                } else {
                                    contact = caller
                                    incommingCallsDiv.appendChild(fragment)
                                }
                                if (contact) {
                                    img.src = contact.profilePicture
                                    span.innerHTML = contact.email
                                    let call_start = new Date(call.getStarttime() * 1000)
                                    date_div.innerHTML = call_start.toLocaleDateString() + " " + call_start.toLocaleTimeString()
                                    if (call.getEndtime() == -1) {
                                        duration_div.innerHTML = "missed"
                                        duration_div.style.color = "var(--palette-error-dark)"
                                    } else if (call.getEndtime() > 0) {
                                        let duration = call.getEndtime() - call.getStarttime()
                                        let obj = secondsToTime(duration)
                                        var hours = obj.h
                                        var min = obj.m
                                        var sec = obj.s
                                        let hours_ = (hours < 10) ? '0' + hours : hours;
                                        let minutes_ = (min < 10) ? '0' + min : min;
                                        let seconds_ = (sec < 10) ? '0' + sec : sec;

                                        duration_div.innerHTML = hours_ + ":" + minutes_ + ":" + seconds_;
                                    }

                                    call_btn.onclick = () => {
                                        this.onCallContact(contact)
                                    }

                                    delete_btn.onclick = () => {
                                        let rqst = new DeleteCallRqst
                                        rqst.setAccountId(this.account.id + "@" + this.account.domain)
                                        rqst.setUuid(call.getUuid())
                                        // Set value on the callee...
                                        let globule = Model.getGlobule(this.account.domain)
                                        generatePeerToken(globule, token => {
                                            globule.resourceService.deleteCall(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                                                .then(rsp => {
                                                    // this.refreshCalls()
                                                    let div = this.getMenuDiv().querySelector(`#_${call.getUuid()}`)
                                                    if (div) {
                                                        div.parentNode.removeChild(div)
                                                    }
                                                })
                                        })
                                    }

                                }

                            }, err => ApplicationView.displayMessage(err, 3000))
                        }, err => ApplicationView.displayMessage(err, 3000))
                    })
                }).catch(err => { })
        })
    }

    // start 
    callStart(call, contact_domain) {

        // save at 1 second interval. so if the conversation crash we will have converstion infos...
        let interval = setInterval(() => {
            call.setEndtime(parseInt(Date.now() / 1000))
            this.setCall(call)
        }, 5000)

        // so here I will save the call at 5 second intterval... until the conversation end...
        Model.getGlobule(contact_domain).eventHub.subscribe(`video_conversation_close_${call.getUuid()}_evt`, uuid => {

        }, evt => {
            console.log("call is terminated !!!!")
            clearInterval(interval)
            this.setCall(call) // save last time...
        }, false)

        Model.getGlobule(this.account.domain).eventHub.subscribe(`video_conversation_close_${call.getUuid()}_evt`, uuid => {

        }, evt => {
            console.log("call is terminated !!!!")
            clearInterval(interval)
            this.setCall(call) // save last time...
        }, false)

    }

    findAccountByEmail(email) {

        Account.getAccounts(`{"email":{"$regex": "${email}", "$options": "im"}}`, (accounts) => {
            accounts = accounts.filter((obj) => {
                return obj.id !== this.account.id;
            });
            // set the getValues function that will return the list to be use as filter.
            let callContactInput = this.shadowRoot.getElementById("call_contact_input")

            if (callContactInput != undefined) {
                callContactInput.setValues(accounts)
            }

        }, (err) => {
            //callback([])
            ApplicationView.displayMessage(err, 3000)
        })
    }



    // When you call a contact...
    onCallContact(contact) {
        console.log("call ", contact.id + "@" + contact.domain)

        let call = new Call()
        call.setUuid(randomUUID())
        call.setCallee(contact.id + "@" + contact.domain)
        call.setCaller(Application.account.id + "@" + Application.account.domain)
        call.setStarttime(Math.floor(Date.now() / 1000)) // set unix timestamp...
        let rqst = new SetCallRqst
        rqst.setCall(call)

        // Set value on the callee...
        let globule = Model.getGlobule(Application.account.domain)
        generatePeerToken(globule, token => {
            globule.resourceService.setCall(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                .then(rsp => {
                    Account.getAccount(call.getCaller(), caller => {
                        Account.getAccount(call.getCallee(), callee => {
                            let globule = Application.getGlobule(caller.domain)
                            generatePeerToken(globule, token => {
                                let url = globule.config.Protocol + "://" + globule.config.Domain
                                if (window.location != globule.config.Domain) {
                                    if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                                        url = globule.config.Protocol + "://" + window.location.host
                                    }
                                }

                                if (globule.config.Protocol == "https") {
                                    if (globule.config.PortHttps != 443)
                                        url += ":" + globule.config.PortHttps
                                } else {
                                    if (globule.config.PortHttps != 80)
                                        url += ":" + globule.config.PortHttp
                                }

                                // so here I will found the caller ringtone...
                                let path = callee.ringtone
                                path = path.replace(globule.config.WebRoot, "")

                                path.split("/").forEach(item => {
                                    item = item.trim()
                                    if (item.length > 0) {
                                        url += "/" + encodeURIComponent(item)
                                    }
                                })

                                url += "?application=" + Model.application
                                if (localStorage.getItem("user_token") != undefined) {
                                    url += "&token=" + token
                                }

                                let audio = new Audio(url)
                                audio.setAttribute("loop", "true")
                                audio.setAttribute("autoplay", "true")

                                // So now I will display the interface the user to ask...
                                // So here I will get the information from imdb and propose to assciate it with the file.
                                let toast = ApplicationView.displayMessage(`
                                <style>
                                    ${getTheme()}
                                    paper-icon-button {
                                        width: 40px;
                                        height: 40px;
                                        border-radius: 50%;
                                    }
    
                                </style>
                                <div id="select-media-dialog">
                                    <div>Outgoing Call to </div>
                                    <div style="display: flex; flex-direction: column; justify-content: center;">
                                        <img style="width: 185.31px; align-self: center; padding-top: 10px; padding-bottom: 15px;" src="${callee.profilePicture}"> </img>
                                    </div>
                                    <span style="max-width: 300px; font-size: 1.5rem;">${callee.name}</span>
                                    <div style="display: flex; justify-content: flex-end;">
                                        <paper-icon-button id="cancel-button" style="background-color: red " icon="communication:call-end"></paper-icon-button>
                                    </div>
                                </div>
                                `)


                                // set timeout...
                                let timeout = setTimeout(() => {
                                    audio.pause()
                                    toast.dismiss();
                                    Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                                    Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)

                                }, 30 * 1000)

                                let cancelBtn = toast.el.querySelector("#cancel-button")
                                cancelBtn.onclick = () => {
                                    toast.dismiss();
                                    audio.pause()
                                    clearTimeout(timeout)

                                    // Here I will send miss call event...
                                    Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                                    Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                                }

                                // Here the call succeed...
                                Model.getGlobule(contact.domain).eventHub.subscribe(call.getUuid() + "_answering_call_evt", uuid => { }, evt => {
                                    // The contact has answer the call!
                                    audio.pause()
                                    toast.dismiss();
                                    clearTimeout(timeout)


                                    let call = Call.deserializeBinary(Uint8Array.from(evt.split(",")))
                                    // The contact has answer the call!
                                    let videoConversation = new VideoConversation(call.getUuid(), Application.account.domain)
                                    videoConversation.style.position = "fixed"
                                    videoConversation.style.left = "0px"
                                    videoConversation.style.top = "0px"

                                    // append it to the workspace.
                                    ApplicationView.layout.workspace().appendChild(videoConversation)

                                    // start the video conversation.
                                    globule.eventHub.publish("start_video_conversation_" + call.getUuid() + "_evt", contact, true)

                                }, false)

                                // Here the call was miss...
                                Model.getGlobule(contact.domain).eventHub.subscribe(call.getUuid() + "_miss_call_evt", uuid => { }, evt => {

                                    // The contact has answer the call!
                                    audio.pause()
                                    toast.dismiss();
                                    clearTimeout(timeout)

                                    generatePeerToken(Model.getGlobule(contact.domain), token => {
                                        let rqst = new CreateNotificationRqst
                                        let notification = new Notification

                                        notification.setDate(parseInt(Date.now() / 1000)) // Set the unix time stamp...
                                        notification.setId(randomUUID())
                                        notification.setRecipient(contact.id + "@" + contact.domain)
                                        notification.setSender(Application.account.id + "@" + Application.account.domain)
                                        notification.setNotificationType(NotificationType.USER_NOTIFICATION)

                                        let date = new Date()
                                        let msg = `
                                        <div style="display: flex; flex-direction: column; padding: 16px;">
                                            <div>
                                                ${date.toLocaleString()}
                                            </div>
                                            <div>
                                                Missed call from ${Application.account.name}
                                            </div>
                                        </div>
                                        `

                                        notification.setMessage(msg)
                                        rqst.setNotification(notification)

                                        // Create the notification...
                                        Model.getGlobule(contact.domain).resourceService.createNotification(rqst, {
                                            token: token,
                                            application: Model.application,
                                            domain: Model.domain,
                                            address: Model.address
                                        }).then((rsp) => {
                                            /** nothing here... */

                                        }).catch(err => {
                                            ApplicationView.displayMessage(err, 3000);
                                            console.log(err)
                                        })

                                        // use the ts class to send notification...
                                        let notification_ = new Notification_
                                        notification_.id = notification.getId()
                                        notification_.date = date
                                        notification_.sender = notification.getSender()
                                        notification_.recipient = notification.getRecipient()
                                        notification_.text = notification.getMessage()
                                        notification_.type = 0

                                        // Send notification...
                                        Model.getGlobule(contact.domain).eventHub.publish(contact.id + "@" + contact.domain + "_notification_event", notification_.toString(), false)
                                    })

                                }, false)

                                // so here I will play the audio of the contact util it respond or the delay was done...
                                Model.getGlobule(contact.domain).eventHub.publish("calling_" + contact.id + "@" + contact.domain + "_evt", call.serializeBinary(), false)
                                Model.getGlobule(this.account.domain).eventHub.publish("calling_" + contact.id + "@" + contact.domain + "_evt", call, true)
                            })

                        })

                    }, err => ApplicationView.displayMessage(err, 3000))

                }, err => ApplicationView.displayMessage(err, 3000))

            if (contact.domain != Application.account.domain) {
                let globule = Model.getGlobule(contact.domain)
                generatePeerToken(globule, token => {
                    globule.resourceService.setCall(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
                }, err => ApplicationView.displayMessage(err, 3000))
            }
        })
    }

}

customElements.define('calls-history-menu', CallsHistoryMenu)