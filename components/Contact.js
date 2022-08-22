// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
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
import { getTheme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"
import { ApplicationView } from '../ApplicationView';
import "./Autocomplete"

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
                ${getTheme()}
                #Contacts-div {
                    display: flex;
                    flex-wrap: wrap;
                    padding: 10px;
                    height: 100%;
                    flex-direction: column;
                    overflow: hidden;

                }

                
                #Contacts-list{
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

                
            </style>
            <div id="Contacts-div">
                <div id="header" style="width: 100%;">
                    <globular-autocomplete type="email" label="Search Contact" id="invite_contact_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
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

        this.getMenuDiv().style.height = this.height + "px";
        this.getMenuDiv().style.maxHeight = "70vh"
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())


        // Action's
        let contactLst = this.shadowRoot.getElementById("Contacts-list")
        let contactsTab = this.shadowRoot.getElementById("contacts-tab")
        let sentContactInvitationsTab = this.shadowRoot.getElementById("sent-contact-invitations-tab")
        let receivedContactInvitationsTab = this.shadowRoot.getElementById("received-contact-invitations-tab")

        // The invite contact action.
        let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")
        inviteContactInput.onkeyup = () => {
            let val = inviteContactInput.getValue();
            if (val.length >= 3) {
                this.findAccountByEmail(val)
            } else {
                inviteContactInput.clear()
            }
        }

        // That function must return the div that display the value that we want.
        inviteContactInput.displayValue = (contact) => {

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
                                inviteContactInput.clear();
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
                                inviteContactInput.clear();
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
                        inviteContactInput.clear();
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
        this.shadowRoot.removeChild(this.getMenuDiv())
    }

    findAccountByEmail(email) {

        Account.getAccounts(`{"email":{"$regex": "${email}", "$options": "im"}}`, (accounts) => {
            accounts = accounts.filter((obj) => {
                return obj.id !== this.account.id;
            });
            // set the getValues function that will return the list to be use as filter.
            let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")
            if (inviteContactInput != undefined) {
                inviteContactInput.setValues(accounts)
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
                        console.log(err)
                    })
            },
            false, this)

        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }

        </style>

        <div class="contact-invitations-list"></div>

        `
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

        let globule = Model.getGlobule(account.session.domain)

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
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        if (contactLst.querySelector("#" + id) != undefined) {
            return;
        }

        let card = new ContactCard(this.account, contact)
        card.id = id
        card.setRevokeButton(this.onRevokeContact)
        contactLst.appendChild(card)
        this.badge.label = contactLst.children.length
        this.badge.style.display = "block"
        window.dispatchEvent(new Event('resize'));
    }

    removeContact(contact) {
        // simply remove it.
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        let card = contactLst.querySelector("#" + id)
        if (card != undefined) {
            contactLst.removeChild(card)
            this.badge.label = contactLst.children.length
            if (contactLst.children.length == 0) {
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

        let globule = Model.getGlobule(account.session.domain) // connect to the local event hub...

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
            ${getTheme()}
            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }

        </style>
        <div class="contact-invitations-list"></div>
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
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        if (contactLst.querySelector("#" + id) != undefined) {
            return;
        }
        let card = new ContactCard(this.account, contact)
        card.id = id
        card.setAcceptDeclineButton(this.onAcceptContact, this.onDeclineContact)
        contactLst.appendChild(card)
        this.badge.label = contactLst.children.length
        this.badge.style.display = "block"
    }

    removeContact(contact) {
        // simply remove it.
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let card = contactLst.querySelector("#" + "_" + contact.id.split("-").join("_") + "_pending_invitation")

        if (card != undefined) {
            contactLst.removeChild(card)
            this.badge.label = contactLst.children.length
            if (contactLst.children.length == 0) {
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
        let globule = Model.getGlobule(account.session.domain)

        globule.eventHub.subscribe("accepted_" + account.id + "@" + account.domain + "_evt",
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


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

            .contact-invitations-list globular-contact-card{
                border-bottom: 1px solid var(--palette-divider);
            }
        </style>
        <div class="contact-invitations-list"></div>
        `
        // The connection callback.

        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account, `{"status":"accepted"}`, (invitations) => {

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
            ApplicationView.displayMessage(err, 3000);
        })

    }

    getContactCard(contact) {
        let card = contactLst.querySelector("#" + "_" + contact.id.split("-").join("_") + "_accepted_invitation")
        return card;
    }

    appendContact(contact) {
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let id = "_" + contact.id.split("-").join("_") + "_accepted_invitation"
        if (contactLst.querySelector("#" + id) != undefined) {
            return
        }

        let card = new ContactCard(this.account, contact)
        card.id = id

        card.setDeleteButton(this.onDeleteContact)
        contactLst.appendChild(card)
        this.badge.label = contactLst.children.length
        this.badge.style.display = "block"
    }

    removeContact(contact) {
        // simply remove it.
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let card = contactLst.querySelector("#" + "_" + contact.id.split("-").join("_") + "_accepted_invitation")
        if (card != undefined) {
            contactLst.removeChild(card)
            this.badge.label = contactLst.children.length
            if (contactLst.children.length == 0) {
                this.badge.style.display = "none"
            }
        }
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
            ${getTheme()}
        </style>

        <div style="display: flex;">
            <paper-button id="decline_contact_btn" style="font-size:.85em; width: 20px;">Decline</paper-button>
            <paper-button id="accept_contact_btn" style="font-size:.85em; width: 20px;">Accept</paper-button>
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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
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
                position: absolute;
                bottom: 0px;
                right: 0px;
            }

            globular-session-state{
                padding: 8px;
            }

            }
        </style>
        <div class="contact-invitation-div" style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; padding: 5px;"> 
                <img style="width: 40px; height: 40px; display: ${this.contact.profilPicture_ == undefined ? "none" : "block"};" src="${this.contact.profilPicture_}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${this.contact.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:300px; font-size: .85em; padding-left: 8px;">
                    <span>${this.contact.name}</span>
                    <span>${this.contact.email_}</span>
                </div>
            </div>
            <globular-session-state account="${this.contact.id + "@" + this.contact.domain}"></globular-session-state>
            <div class="actions-div">
                <slot></slot>
            </div>
        </div>
        `
        /** only element with actions will have illuminated background... */
        if (this.children.length > 0 || this.actionable) {
            this.shadowRoot.querySelector(".contact-invitation-div").classList.add("actionable")
        }
    }

    // Set the invite button...
    setInviteButton(onInviteConctact) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="invite_btn">Invite</paper-button>`))
        let inviteBtn = this.querySelector("#invite_btn")
        inviteBtn.onclick = () => {
            if (onInviteConctact != null) {
                onInviteConctact(this.contact)
            }
        }
    }

    setDeleteButton(onDeleteContact) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="delete_btn">Delete</paper-button>`))

        this.querySelector("#delete_btn").onclick = () => {
            if (onDeleteContact != null) {
                onDeleteContact(this.contact)
            }
        }
    }

    // Set the revoke invitation button.
    setRevokeButton(onRevokeInvitation) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="revoke_invitation_btn">Revoke</paper-button>`))

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
