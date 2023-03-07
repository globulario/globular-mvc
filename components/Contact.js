// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'
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

import { Menu } from './Menu';
import { Ringtone } from './Ringtone'

import { Account } from "../Account"
import { Model, generatePeerToken, getUrl } from "../Model"
import { ApplicationView } from '../ApplicationView';
import "./Autocomplete"
import { CreateNotificationRqst, SessionState, Notification, NotificationType, Call, SetCallRqst } from 'globular-web-client/resource/resource_pb';
import { Notification as Notification_ } from '../Notification';
import { randomUUID } from './utility';
import { Application } from '../Application';
import { LogRqst } from 'globular-web-client/log/log_pb';
import { VideoConversation } from './WebRTC';
import * as getUuidByString from 'uuid-by-string';
import { GetThumbnailsRequest } from 'globular-web-client/file/file_pb';

/**
 * Login/Register functionality.
 */
export class ContactsMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("Contacts", "social:people", "Contacts")

        // The logged account.
        this.account = null;

        this.inviteContactInput = null;

        // Here is the class members.
        this.onInviteConctact = null;

        // Revoke contact invitation
        this.onRevokeContact = null;

        // Accept contact invitation
        this.onAcceptContact = null;

        // Decline contact invitation
        this.onDeclineContact = null;

        // Delecte contact
        this.onDeleteContact = null;

        this.width = 350;
        if (this.hasAttribute("width")) {
            this.width = parseInt(this.getAttribute("width"));
        }

        this.height = 550;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }
    }

    // Init the contact at login time.
    init(account) {

        this.account = account;



        let html = `
            <style>
               
                #Contacts-div {
                    display: flex;
                    flex-wrap: wrap;
                    height: 100%;
                    flex-direction: column;
                    overflow: hidden;
                }

                #Contacts_menu_div{
                    overflow: auto;
                    height: ${this.height}px;
                    max-height: 70vh;
                    overflow-y: auto;
                }

                #title{
                    display: none; 
                    justify-content: center;
                }


                #Contacts-list{
                    flex: 1;
                    overflow: auto;
                
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

                /* Need to position the badge to look like a text superscript */
                paper-tab {
                  padding-right: 25px;
                }

                paper-tabs{                  
                    /* custom CSS property */
                    --paper-tabs-selection-bar-color: var(--palette-primary-main); 
                    color: var(--palette-text-primary);
                    --paper-tab-ink: var(--palette-action-disabled);
                }

                paper-tab paper-badge {
                    --paper-badge-background: var(--palette-warning-main);
                    --paper-badge-width: 16px;
                    --paper-badge-height: 16px;
                    --paper-badge-margin-left: 10px;
                }

                paper-card{
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                    padding: 10px;
                }
          
                paper-card h1 {
                    font-size: 1.65rem;
                    margin: 0px;
                    margin-bottom: 10px;
                }
                
                @media (min-width: 500px) {
                    paper-tabs {
                        min-width: 450px;
                    }
                }

                
                @media (max-width: 500px) {

                    #Contacts_menu_div{
                        margin-top: 5px;
                        height: calc(100vh - 100px);
                        max-height: calc(100vh - 100px);
                    }

                    #Contacts-list{
                        width: calc(100vw - 32px);
                        padding-bottom: 50px;
                    }

                    #title{
                        display: flex; 
                    }

                    paper-tabs {
                        font-size: .95rem;
                    }
                }

            </style>
            <div id="Contacts-div">
                <div id="header" style="width: 100%;">

                    <div id="title">
                        <h1 style="flex-grow: 1;">Contact's</h1>
                        <paper-icon-button id="close-btn" icon="icons:close" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                    </div>
        
                    <globular-autocomplete type="email" label="Search Contact" id="invite-contact-input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    <paper-tabs selected="0">
                        <paper-tab id="contacts-tab">
                            <span id="contacts-label">Contacts</span>
                            <paper-badge style="display: none;" for="contacts-label"></paper-badge>
                        </paper-tab>
                        <paper-tab id="sent-contact-invitations-tab">
                            <span id="sent-contact-invitations-label">Sent Invitations</span>
                            <paper-badge style="display: none;" for="sent-contact-invitations-label"></paper-badge>
                        </paper-tab>
                        <paper-tab id="received-contact-invitations-tab">
                            <span id="received-contact-invitations-label">Received Invitations</span>
                            <paper-badge style="display: none;" for="received-contact-invitations-label"></paper-badge>
                        </paper-tab>
                    </paper-tabs>
                </div>
                <div id="Contacts-list">

                </div>
            </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().querySelector("#close-btn").onclick = () => {
            this.getMenuDiv().parentNode.removeChild(this.getMenuDiv())
        }

        this.shadowRoot.appendChild(this.getMenuDiv())


        // Action's
        let contactLst = this.shadowRoot.getElementById("Contacts-list")
        let contactsTab = this.shadowRoot.getElementById("contacts-tab")
        let sentContactInvitationsTab = this.shadowRoot.getElementById("sent-contact-invitations-tab")
        let receivedContactInvitationsTab = this.shadowRoot.getElementById("received-contact-invitations-tab")

        // The invite contact action.
        this.inviteContactInput = this.shadowRoot.getElementById("invite-contact-input")
        this.inviteContactInput.onkeyup = () => {
            let val = this.inviteContactInput.getValue();
            if (val.length >= 3) {
                this.findAccountByEmail(val)
            } else {
                this.inviteContactInput.clear()
            }
        }

        // That function must return the div that display the value that we want.
        this.inviteContactInput.displayValue = (contact) => {

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
                            card.setInviteButton((contact) => {
                                this.onInviteConctact(contact);
                                this.inviteContactInput.clear();
                            })
                        } else if (info.status == "sent") {
                            // Here I will display the revoke invitation button.
                            card.setRevokeButton(this.onRevokeContact)
                        } else if (info.status == "received") {
                            // Here I will display the accept/decline button.
                            card.setAcceptDeclineButton(this.onAcceptContact, this.onDeclineContact)
                        } else if (info.status == "revoked" || info.status == "deleted") {
                            // Here I will display the accept/decline button.
                            card.setInviteButton((contact) => {
                                this.onInviteConctact(contact);
                                this.inviteContactInput.clear();
                            })
                        } else if (info.status == "accepted") {
                            // Here I will display the revoke invitation button.
                            card.setDeleteButton(this.onDeleteContact)
                        }
                    }
                },
                () => {
                    card.setInviteButton((contact) => {
                        this.onInviteConctact(contact);
                        this.inviteContactInput.clear();
                    })
                })


            return card
        }

        let contactList = new ContactList(account, this.onDeleteContact, contactsTab.children[1])
        contactLst.appendChild(contactList)

        let sentContactInvitations = new SentContactInvitations(account, this.onRevokeContact, sentContactInvitationsTab.children[1]);
        contactLst.appendChild(sentContactInvitations)


        let receivedContactInvitations = new ReceivedContactInvitations(account, this.onAcceptContact, this.onDeclineContact, receivedContactInvitationsTab.children[1]);
        contactLst.appendChild(receivedContactInvitations)


        contactsTab.onclick = () => {
            contactList.style.display = "block"
            receivedContactInvitations.style.display = "none"
            sentContactInvitations.style.display = "none"
        }

        sentContactInvitationsTab.onclick = () => {
            contactList.style.display = "none"
            receivedContactInvitations.style.display = "none"
            sentContactInvitations.style.display = "block"
        }

        receivedContactInvitationsTab.onclick = () => {
            contactList.style.display = "none"
            receivedContactInvitations.style.display = "block"
            sentContactInvitations.style.display = "none"
        }

        // set active.
        contactsTab.click();
        window.dispatchEvent(new Event('resize'));

        // Get the list of all accounts (mab).
        if (this.getMenuDiv().parentNode)
            this.getMenuDiv().parentNode.removeChild(this.getMenuDiv())
    }

    findAccountByEmail(email) {

        Account.getAccounts(`{"email":{"$regex": "${email}", "$options": "im"}}`, (accounts) => {
            accounts = accounts.filter((obj) => {
                return obj.id !== this.account.id;
            });
            // set the getValues function that will return the list to be use as filter.
            if (this.inviteContactInput != undefined) {
                this.inviteContactInput.setValues(accounts)
            }

        }, (err) => {
            //callback([])
            ApplicationView.displayMessage(err, 3000)
        })
    }

}

customElements.define('globular-contacts-menu', ContactsMenu)


/**
 * Display the list of sent contact invitation. If the invitation was not pending it will be removed.
 */
export class SentContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, onRevokeContact, badge) {
        super()

        this.badge = badge;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
        this.onRevokeContact = onRevokeContact;

        Model.eventHub.subscribe("sent_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                // So here I will append the account into the list.
                let invitation = JSON.parse(evt)
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.appendContact(contact)
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                    })
            },
            false, this)

        this.shadowRoot.innerHTML = `
        <style>
           

            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }

        </style>

        <div class="contact-invitations-list">
            <slot></slot>
        </div>

        `

        let globule = Model.getGlobule(account.domain)

        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account, `{"status":"sent"}`, (invitations) => {

            for (var i = 0; i < invitations.length; i++) {
                Account.getAccount(invitations[i]._id,
                    (contact) => {
                        this.appendContact(contact)
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            }
        }, err => {
            ApplicationView.displayMessage(err, 3000)
        })


        globule.eventHub.subscribe("revoked_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("declined_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)
    }

    // The connection callback.
    connectedCallback() {


    }

    appendContact(contact) {

        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_pending_invitation")
        if (this.querySelector("#" + id) != undefined) {
            return;
        }

        let card = new ContactCard(this.account, contact)

        card.id = id
        card.setRevokeButton(this.onRevokeContact)
        this.appendChild(card)
        this.badge.label = this.children.length
        this.badge.style.display = "block"
        window.dispatchEvent(new Event('resize'));
    }

    removeContact(contact) {
        // simply remove it.
        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_pending_invitation")
        let card = this.querySelector("#" + id)
        if (card != undefined) {
            this.removeChild(card)
            this.badge.label = this.children.length
            if (this.children.length == 0) {
                this.badge.style.display = "none"
            }
        }
        window.dispatchEvent(new Event('resize'));
    }
}

customElements.define('globular-sent-contact-invitations', SentContactInvitations)

/**
 * Received contact invitations.
 */
export class ReceivedContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, onAcceptContact, onDeclineContact, badge) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.badge = badge
        this.account = account;
        this.onAcceptContact = onAcceptContact;
        this.onDeclineContact = onDeclineContact;

        let domain = Application.domain
        if (account.session) {
            domain = account.domain
        }

        let globule = Model.getGlobule(domain) // connect to the local event hub...

        globule.eventHub.subscribe("received_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.appendContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("revoked_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("declined_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }

        </style>
        <div class="contact-invitations-list">
            <slot></slot>
        </div>
        `
        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account, `{"status":"received"}`, (invitations) => {

            for (var i = 0; i < invitations.length; i++) {
                Account.getAccount(invitations[i]._id,
                    (contact) => {
                        this.appendContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            }
        }, err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    // The connection callback.
    connectedCallback() {

    }

    appendContact(contact) {

        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_pending_invitation")
        if (this.querySelector("#" + id) != undefined) {
            return;
        }
        let card = new ContactCard(this.account, contact)

        card.id = id
        card.setAcceptDeclineButton(this.onAcceptContact, this.onDeclineContact)
        this.appendChild(card)
        this.badge.label = this.children.length
        this.badge.style.display = "block"
    }

    removeContact(contact) {
        // simply remove it.
        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_pending_invitation")
        let card = this.querySelector("#" + id)
        if (card != undefined) {
            this.removeChild(card)
            this.badge.label = this.children.length
            if (this.children.length == 0) {
                this.badge.style.display = "none"
            }
        }
    }
}

customElements.define('globular-received-contact-invitations', ReceivedContactInvitations)

/**
 * The contact list.
 */
export class ContactList extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, onDeleteContact, badge) {
        super()

        this.badge = badge;

        // Keep contact card in memory...
        this.cards = {}

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
        this.onDeleteContact = onDeleteContact;
        let domain = account.domain
        let globule = Model.getGlobule(domain)


        globule.eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        if (invitation.profilePicture)
                            contact.profilePicture = invitation.profilePicture
                        contact.ringtone = invitation.ringtone
                        this.appendContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        globule.eventHub.subscribe("deleted_" + account.id + "@" + account.domain + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            },
            false, this)

        // calling events...
        globule.eventHub.subscribe("calling_" + account.id + "@" + account.domain + "_evt", uuid => { }, evt => {

            // The contact has answer the call!
            let call = Call.deserializeBinary(Uint8Array.from(evt.split(",")))

            Account.getAccount(call.getCaller(), caller => {
                Account.getAccount(call.getCallee(), callee => {

                    let globule = Application.getGlobule(callee.domain)

                    generatePeerToken(globule, token => {
                        let url = getUrl(globule)

                        // so here I will found the caller ringtone...
                        let path = caller.ringtone
                        path = path.replace(globule.config.WebRoot, "")

                        path.split("/").forEach(item => {
                            item = item.trim()
                            if (item.length > 0) {
                                url += "/" + encodeURIComponent(item)
                            }
                        })

                        url += "?application=" + Model.application
                        url += "&token=" + token

                        let audio = new Audio(url)
                        audio.setAttribute("loop", "true")
                        audio.setAttribute("autoplay", "true")

                        // So now I will display the interface the user to ask...
                        // So here I will get the information from imdb and propose to assciate it with the file.
                        let toast = ApplicationView.displayMessage(`
                        <style>
                           
                            #select-media-dialog{
                                display: flex; flex-direction: column; 
                                justify-content: center; 
                                width: 100%;
                            }

                            paper-icon-button {
                                width: 40px;
                                height: 40px;
                                border-radius: 50%;
                            }

                            #call-img{
                                width: 185.31px; 
                                height: 100%; 
                                align-self: center; 
                                justify-self: center;
                                padding-top: 10px; 
                                padding-bottom: 15px;
                            }
                              
                        </style>
                        <div id="select-media-dialog">
                            <div>Incomming Call from</div>
                            <img style="width: 185.31px; height: 100%; align-self: center; padding-top: 10px; padding-bottom: 15px;" src="${caller.profilePicture}"> </img>
                            <div style="display: flex; justify-content: center; align-items: center;">
                                <span style="max-width: 300px; font-size: 1.5rem; margin-right: 16px;">${caller.name}</span>
                                <paper-icon-button id="ok-button" style="background-color: green; margin-right: 16px;" icon="communication:call"></paper-icon-button>
                                <paper-icon-button id="cancel-button"  style="background-color: red;" icon="communication:call-end">Dismiss</paper-button>
                            </div>
                        </div>
                        `)


                        let timeout = setTimeout(() => {
                            audio.pause()
                            if (toast) {
                                toast.dismiss();
                            }

                            Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                            if (caller.domain != callee.domain)
                                Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)

                        }, 30 * 1000)

                        let cancelBtn = toast.el.querySelector("#cancel-button")
                        cancelBtn.onclick = () => {
                            toast.dismiss();
                            audio.pause()
                            clearTimeout(timeout)

                            // Here I will send miss call event...
                            Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                            if (caller.domain != callee.domain)
                                Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)

                        }

                        let okBtn = toast.el.querySelector("#ok-button")
                        okBtn.onclick = () => {

                            toast.dismiss();
                            audio.pause()
                            clearTimeout(timeout)

                            // The contact has answer the call!
                            let videoConversation = new VideoConversation(call.getUuid(), caller.domain)
                            videoConversation.style.position = "fixed"
                            videoConversation.style.left = "0px"
                            videoConversation.style.top = "0px"


                            // append it to the workspace.
                            ApplicationView.layout.workspace().appendChild(videoConversation)

                            Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_answering_call_evt", call.serializeBinary(), false)
                            if (callee.domain != caller.domain) {
                                Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_answering_call_evt", call.serializeBinary(), false)
                            }
                        }

                        // Here the call was miss...
                        Model.getGlobule(caller.domain).eventHub.subscribe(call.getUuid() + "_miss_call_evt", uuid => { }, evt => {

                            clearTimeout(timeout)

                            // The contact has answer the call!
                            audio.pause()
                            toast.dismiss();
                        }, false)
                    }, err => ApplicationView.displayMessage(err, 3000))



                })

            }, err => ApplicationView.displayMessage(err, 3000))
        }, false)


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }
        </style>
        <div class="contact-invitations-list">
            <slot></slot>
        </div>
        `
        // if the peer is not connected when the user is log in the contact card will not be displayed...
        Model.eventHub.subscribe("update_peers_evt_", uuid => { }, peer => {
            Account.getContacts(this.account, `{"status":"accepted"}`, (invitations) => {
                for (var i = 0; i < invitations.length; i++) {
                    let invitation = invitations[i]
                    Account.getAccount(invitation._id,
                        (contact) => {
                            if (invitation.profilePicture)
                                contact.profilePicture = invitation.profilePicture
                            contact.ringtone = invitation.ringtone
                            this.appendContact(contact);
                        },
                        err => {
                            ApplicationView.displayMessage(err, 3000)
                            console.log(err)
                        })
                }
            }, err => {
                ApplicationView.displayMessage(err, 3000);
            })
        }, true)

        Model.eventHub.subscribe("stop_peer_evt_", uuid => { },
            peer => {
                Model.eventHub.publish("remove_contact_card_" + peer.getDomain() + "_evt_", {}, true)
            }, true)

        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account, `{"status":"accepted"}`, (invitations) => {

            for (var i = 0; i < invitations.length; i++) {
                let invitation = invitations[i]
                Account.getAccount(invitation._id,
                    (contact) => {
                        if (invitation.profilePicture)
                            contact.profilePicture = invitation.profilePicture
                        contact.ringtone = invitation.ringtone
                        this.appendContact(contact);
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                        console.log(err)
                    })
            }
        }, err => {
            ApplicationView.displayMessage(err, 3000);
        })

    }

    getContactCard(contact) {
        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_accepted_invitation")
        let card = this.querySelector("#" + id)
        return card;
    }

    appendContact(contact) {

        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_accepted_invitation")
        if (this.querySelector("#" + id) != undefined) {
            return
        }

        this.innerHtml = ""

        let card = new ContactCard(this.account, contact)
        card.id = id


        card.setCallButton(this.onCallContact)

        card.setDeleteButton(this.onDeleteContact)
        card.showRingtone()
        this.appendChild(card)

        this.badge.label = this.children.length
        this.badge.style.display = "block"

        // if the globule is disconnected I will remove the contact...
        Model.eventHub.subscribe("remove_contact_card_" + contact.domain + "_evt_", uuid => { }, evt => {
            if (card.parentNode) {
                card.parentNode.removeChild(card)
            }
        }, true)
    }

    removeContact(contact) {
        // simply remove it.
        let id = "_" + getUuidByString(contact.id + "@" + contact.domain + "_accepted_invitation")

        let card = this.querySelector("#" + id)
        if (card != undefined) {
            this.removeChild(card)
            this.badge.label = this.children.length
            if (this.children.length == 0) {
                this.badge.style.display = "none"
            }
        }
    }

    onCallContact(contact) {

        let call = new Call()
        call.setUuid(randomUUID())
        call.setCallee(contact.id + "@" + contact.domain)
        call.setCaller(Application.account.id + "@" + Application.account.domain)
        call.setStarttime(Math.floor(Date.now() / 1000)) // set unix timestamp...
        call.setEndtime(-1)
        let rqst = new SetCallRqst
        rqst.setCall(call)

        // Set value on the callee...
        let globule = Model.getGlobule(Application.account.domain)
        generatePeerToken(globule, token => {
            globule.resourceService.setCall(rqst, { application: Application.application, domain: globule.domain, token: token })
                .then(rsp => {
                    Account.getAccount(call.getCaller(), caller => {
                        Account.getAccount(call.getCallee(), callee => {

                            let url = getUrl(globule)

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
                                if (caller.domain != callee.domain)
                                    Model.getGlobule(callee.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)

                            }, 30 * 1000)

                            let cancelBtn = toast.el.querySelector("#cancel-button")
                            cancelBtn.onclick = () => {
                                toast.dismiss();
                                audio.pause()
                                clearTimeout(timeout)

                                // Here I will send miss call event...
                                Model.getGlobule(caller.domain).eventHub.publish(call.getUuid() + "_miss_call_evt", call.serializeBinary(), false)
                                if (caller.domain != callee.domain)
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
                                    notification.setId(call.getUuid())
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
                                    }).catch(err => {
                                        ApplicationView.displayMessage(err, 3000);
                                        console.log(err)
                                    })


                                    Model.getGlobule(Application.domain).eventHub.publish("calling_" + contact.id + "@" + contact.domain + "_evt", call, true)
                                })

                            }, false)

                            // so here I will play the audio of the contact util it respond or the delay was done...
                            Model.getGlobule(contact.domain).eventHub.publish("calling_" + contact.id + "@" + contact.domain + "_evt", call.serializeBinary(), false)

                        })



                    }, err => ApplicationView.displayMessage(err, 3000))

                }, err => ApplicationView.displayMessage(err, 3000))

            if (contact.domain != Application.account.domain) {
                let globule = Model.getGlobule(contact.domain)
                generatePeerToken(globule, token => {
                    globule.resourceService.setCall(rqst, { application: Application.application, domain: globule.domain, token: token })
                }, err => ApplicationView.displayMessage(err, 3000))
            }
        })

    }

}

customElements.define('globular-contact-list', ContactList)

/**
 * Accept contact button.
 */
export class AcceptDeclineContactBtns extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let contact = this.getAttribute("contact");

        this.onaccpect = null;
        this.ondecline = null;


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        </style>

        <div style="display: flex;">
            <paper-button id="decline_contact_btn" style="font-size:.85rem; width: 20px;">Decline</paper-button>
            <paper-button id="accept_contact_btn" style="font-size:.85rem; width: 20px;">Accept</paper-button>
        </div>
        `

        let acceptContactBtn = this.shadowRoot.getElementById("accept_contact_btn")
        acceptContactBtn.onclick = () => {
            if (this.onaccpect != undefined) {
                this.onaccpect(contact)
            }
        }

        let declineContactBtn = this.shadowRoot.getElementById("decline_contact_btn")
        declineContactBtn.onclick = () => {
            if (this.ondecline != undefined) {
                this.ondecline(contact);

            }
        }
    }

}

customElements.define('globular-accept-decline-contact-btns', AcceptDeclineContactBtns)


/**
 * Display Contact (account informations)
 */
export class ContactCard extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, contact, actionable = false) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.account = account;
        this.contact = contact;
        this.actionable = actionable
        this.showRingTone = false;

        if (this.hasAttribute("contact")) {
            Account.getAccount(this.getAttribute("contact"), (val) => {
                this.contact = val;
            }, (err) => {
                ApplicationView.displayMessage(err, 3000)
            })
        }

        if (this.hasAttribute("account")) {
            Account.getAccount(this.getAttribute("account"), (val) => {
                this.account = val;
            }, (err) => {
                ApplicationView.displayMessage(err, 3000)
                console.log(err)
            })
        }
    }

    // The connection callback.
    connectedCallback() {
        if (this.contact == undefined) {
            return
        }

        console.log(this.contact)

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .contact-invitation-div{
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                position: relative;
            }

            .contact-invitation-div.actionable:hover{
                filter: invert(10%);
            }

            .actions-div{
                display: flex;
                justify-content: flex-end;
            }

            globular-session-state, globular-ringtones {
                padding: 8px;
            }

            }
        </style>
        <div class="contact-invitation-div" style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; padding: 5px;"> 
                <img style="width: 40px; height: 40px; display: ${this.contact.profilePicture.length == 0 ? "none" : "block"};" src="${this.contact.profilePicture}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${this.contact.profilePicture.length != 0 ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:300px; font-size: .85em; padding-left: 8px;">
                    <span>${this.contact.name}</span>
                    <span>${this.contact.email_}</span>
                </div>
            </div>
            <globular-session-state account="${this.contact.id + "@" + this.contact.domain}"></globular-session-state>
            <globular-ringtones style="display: none;" dir="audio/ringtone" id="${this.contact.id + "_" + this.contact.domain + "_ringtone"}" account="${this.contact.id + "@" + this.contact.domain}"> </globular-ringtones>
            <div class="actions-div">
                <slot></slot>
            </div>
        </div>
        `
        /** only element with actions will have illuminated background... */
        if (this.children.length > 0 || this.actionable) {
            this.shadowRoot.querySelector(".contact-invitation-div").classList.add("actionable")

        }

        if (this.showRingTone) {
            this.shadowRoot.querySelector("globular-ringtones").style.display = "block"
        } else {
            this.shadowRoot.querySelector("globular-ringtones").style.display = "none"
        }

    }

    hideRingtone() {
        this.showRingTone = false
        if (this.shadowRoot.querySelector("globular-ringtones"))
            this.shadowRoot.querySelector("globular-ringtones").style.display = "none"
    }


    showRingtone() {
        this.showRingTone = true
        if (this.shadowRoot.querySelector("globular-ringtones"))
            this.shadowRoot.querySelector("globular-ringtones").style.display = "block"
    }

    // Set the invite button...
    setInviteButton(onInviteConctact) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85rem; width: 20px; align-self: flex-end;" id="invite_btn">Invite</paper-button>`))
        let inviteBtn = this.querySelector("#invite_btn")
        inviteBtn.onclick = () => {
            if (onInviteConctact != null) {
                onInviteConctact(this.contact)
            }
        }
    }

    setDeleteButton(onDeleteContact) {

        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85rem; width: 20px; align-self: flex-end;" id="delete_btn">Delete</paper-button>`))

        this.querySelector("#delete_btn").onclick = () => {
            if (onDeleteContact != null) {
                onDeleteContact(this.contact)
            }
        }
    }

    setCallButton(onCallContact) {
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85rem; width: 20px; align-self: flex-end;" id="call_btn">Call</paper-button>`))

        this.querySelector("#call_btn").onclick = () => {
            if (onCallContact != null) {
                onCallContact(this.contact)
                document.body.click()
            }
        }
    }

    // Set the revoke invitation button.
    setRevokeButton(onRevokeInvitation) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85rem; width: 20px; align-self: flex-end;" id="revoke_invitation_btn">Revoke</paper-button>`))

        this.querySelector("#revoke_invitation_btn").onclick = () => {
            if (onRevokeInvitation != null) {
                onRevokeInvitation(this.contact)
            }
        }
    }

    // Set the accept/decline button.
    setAcceptDeclineButton(onAcceptInvitation, onDeclineInvitation) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<globular-accept-decline-contact-btns id="accept_decline_btn"></globular-accept-decline-contact-btns>`))

        this.querySelector("#accept_decline_btn").onaccpect = () => {
            if (onAcceptInvitation != null) {
                onAcceptInvitation(this.contact)
            }
        }

        this.querySelector("#accept_decline_btn").ondecline = () => {
            if (onDeclineInvitation != null) {
                onDeclineInvitation(this.contact)
            }
        }
    }
}

customElements.define('globular-contact-card', ContactCard)
