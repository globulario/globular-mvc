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
import { Autocomplete } from './Autocomplete'

import { Menu } from './Menu';
import { theme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"

/**
 * Login/Register functionality.
 */
export class ContactsMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("Contacts", "social:people", "Contacts")

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

        this.height = 525;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }
    }

    // Init the contact at login time.
    init(account) {
        let html = `
            <style>
            ${theme}
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

            </style>
            <div id="Contacts-div">
                <div id="header" style="width: 100%;">
                    <globular-autocomplete type="email" label="Search" id="invite_contact_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    <paper-tabs selected="0">
                        <paper-tab id="contacts-tab">Contacts</paper-tab>
                        <paper-tab id="sent-contact-invitations-tab">Sent Invitations</paper-tab>
                        <paper-tab id="received-contact-invitations-tab">Received Invitations</paper-tab>
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
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())

        // Action's
        let div = this.shadowRoot.getElementById("Contacts-div")
        let contactLst = this.shadowRoot.getElementById("Contacts-list")

        let contactsTab = this.shadowRoot.getElementById("contacts-tab")
        let sentContactInvitationsTab = this.shadowRoot.getElementById("sent-contact-invitations-tab")
        let receivedContactInvitationsTab = this.shadowRoot.getElementById("received-contact-invitations-tab")

        // The invite contact action.
        let inviteContactInput = this.shadowRoot.getElementById("invite_contact_input")

        let contactList = new ContactList(account)
        contactLst.appendChild(contactList)

        let sentContactInvitations = new SentContactInvitations(account, this.onRevokeContact);
        contactLst.appendChild(sentContactInvitations)


        let receivedContactInvitations = new ReceivedContactInvitations(account, this.onAcceptContact, this.onDeclineContact);
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

        // Get the list of all accounts (mab).
        Account.getAccounts("{}", (accounts) => {

            // set the getValues function that will return the list to be use as filter.
            inviteContactInput.getValues = (value, callback) => {
                let filtered = [];
                if (value.length == 0) {
                    inviteContactInput.clear();
                    return filtered
                }
                for (var i = 0; i < accounts.length; i++) {
                    let a = accounts[i]
                    let contain = false;

                    if (a._id.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        contain = true
                        filtered.push(a)
                    }

                    if (!contain && a.email_.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        filtered.push(a)
                    }

                }

                // return _id value or email if value
                let getValue = (a) => {
                    if (a._id.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        return a._id.toLowerCase()
                    }

                    if (a.email_.toLowerCase().indexOf(value.toLowerCase()) != -1) {
                        return a.email_.toLowerCase()
                    }
                }

                // Now I will sort the values.
                filtered.sort((a, b) => {
                    let val_a = getValue(a)
                    let val_b = getValue(b)
                    if (val_a < val_b) {
                        return -1;
                    }
                    if (val_a > val_b) {
                        return 1;
                    }
                    return 0;
                });

                // remove user by it id or email.
                let removeUser = (id) => {
                    if (id.length > 0) {
                        let index = filtered.findIndex((a) => {
                            if (a.email_ == id) {
                                return true;
                            }
                            if (a._id == id) {
                                return true;
                            }
                            return false
                        })
                        if (index != -1) {
                            return filtered.splice(index, 1)
                        }
                        return null
                    }
                }

                // Remove the logged user from the list
                removeUser(account.email)

                // Todo filter with value 
                callback(filtered)
            }


            // That function must return the div that display the value that we want.
            inviteContactInput.displayValue = (contact) => {
                let card = new ContactCard(account, contact);

                // Here depending if the contact is in contact list, in received invitation list or in sent invitation
                // list displayed action will be different.
                Account.getContacts(account.id, "{}",
                    (contacts) => {
                        const info = contacts.find(obj => {
                            return obj._id === contact._id;
                        })

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

        }, (err) => {
            callback([])
        })

        this.shadowRoot.removeChild(this.getMenuDiv())
    }

}

customElements.define('globular-contacts-menu', ContactsMenu)

/**
 * Display Contact (account informations)
 */
export class ContactCard extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, contact) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.account = account;
        this.contact = contact;
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            .contact-invitation-div{
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .contact-invitation-div:hover{
                filter: invert(10%);
            }

            .actions-div{
                display: flex;
                justify-content: flex-end;
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
            <div class="actions-div">
                <slot></slot>
            </div>
        </div>
        `
    }

    // Set the invite button...
    setInviteButton(onInviteConctact) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.65em; width: 20px; align-self: flex-end;" id="invite_btn">Invite</paper-button>`))
        let inviteBtn = this.querySelector("#invite_btn")
        inviteBtn.onclick = () => {
            if (onInviteConctact != null) {
                onInviteConctact(this.contact)
            }
        }
    }

    // Set the revoke invitation button.
    setRevokeButton(onRevokeInvitation) {
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.65em; width: 20px; align-self: flex-end;" id="revoke_invitation_btn">Revoke</paper-button>`))

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


/**
 * Display the list of sent contact invitation. If the invitation was not pending it will be removed.
 */
export class SentContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, onRevokeContact) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
        this.onRevokeContact = onRevokeContact;


        Model.eventHub.subscribe("sent_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                // So here I will append the account into the list.
                let invitation = JSON.parse(evt)
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.appendContact(contact)
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .contact-invitations-list{
                display: flex;
                flex-direction: column;
            }

        </style>

        <div class="contact-invitations-list"></div>

        `
        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account._id, `{"status":"sent"}`, (invitations) => {

            for (var i = 0; i < invitations.length; i++) {
                Account.getAccount(invitations[i]._id,
                    (contact) => {
                        this.appendContact(contact)
                    },
                    err => {
                        console.log(err)
                    })
            }
        }, err => {
            console.log(err);
        })

        Model.eventHub.subscribe("revoked_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        Model.eventHub.subscribe("declined_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        Model.eventHub.subscribe("accepted_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)
    }

    // The connection callback.
    connectedCallback() {

    }

    appendContact(contact) {
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let card = new ContactCard(this.account, contact)
        let id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        card.id = id
        card.setRevokeButton(this.onRevokeContact)
        contactLst.appendChild(card)
        console.log("------->", contactLst.querySelector("#" + id))
    }

    removeContact(contact) {
        // simply remove it.
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        let card = contactLst.querySelector("#" + id)
        if (card != undefined) {
            contactLst.removeChild(card)
        }else{
            console.log("no contact card found with id: ", id)
        }
    }
}

customElements.define('globular-sent-contact-invitations', SentContactInvitations)

/**
 * Received contact invitations.
 */
export class ReceivedContactInvitations extends HTMLElement {

    // Create the applicaiton view.
    constructor(account, onAcceptContact, onDeclineContact) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
        this.onAcceptContact = onAcceptContact;
        this.onDeclineContact = onDeclineContact;

        Model.eventHub.subscribe("received_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.appendContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        Model.eventHub.subscribe("revoked_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)


        Model.eventHub.subscribe("declined_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        Model.eventHub.subscribe("accepted_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                let invitation = JSON.parse(evt);
                Account.getAccount(invitation._id,
                    (contact) => {
                        this.removeContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            },
            false)

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>
        <div class="contact-invitations-list"></div>
        `
        // So here I will get the list of sent invitation for the account.
        Account.getContacts(this.account._id, `{"status":"received"}`, (invitations) => {

            for (var i = 0; i < invitations.length; i++) {
                Account.getAccount(invitations[i]._id,
                    (contact) => {
                        this.appendContact(contact);
                    },
                    err => {
                        console.log(err)
                    })
            }
        }, err => {
            console.log(err);
        })
    }

    // The connection callback.
    connectedCallback() {

    }

    appendContact(contact) {
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let card = new ContactCard(this.account, contact)
        card.id = "_" + contact.id.split("-").join("_") + "_pending_invitation"
        card.setAcceptDeclineButton(this.onAcceptContact, this.onDeclineContact)
        contactLst.appendChild(card)
    }

    removeContact(contact) {
        // simply remove it.
        let contactLst = this.shadowRoot.querySelector(".contact-invitations-list")
        let card = contactLst.querySelector("#" + "_" + contact.id.split("-").join("_") + "_pending_invitation")
        if (card != undefined) {
            contactLst.removeChild(card)
        }
    }
}

customElements.define('globular-received-contact-invitations', ReceivedContactInvitations)

/**
 * The contact list.
 */
export class ContactList extends HTMLElement {

    // Create the applicaiton view.
    constructor(account) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = account;
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>

        <div style="display: flex;">
        </div>
        `
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
            ${theme}
        </style>

        <div style="display: flex;">
            <paper-button id="decline_contact_btn" style="font-size:.65em; width: 20px;">Decline</paper-button>
            <paper-button id="accept_contact_btn" style="font-size:.65em; width: 20px;">Accept</paper-button>
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

// Example of event that will keep the contact uptodate.
/*

TODO keep the account card in line with it info
                // This fuction will keep the value updated in the contact list.
                Model.eventHub.subscribe(`__update_account_${value._id}_data_evt__`,
                (uuid) => {

                },
                (data) => {
                  console.log("-------------------------> ", data)
                },
                true)

// Connect event to keep the contact panel in correct state.
        // Here I will react to network event to keep the interface in the correct state.
        Model.eventHub.subscribe("sent_invitation_" + contact.id + "_evt",
            (uuid) => { },
            (evt) => {
                // So here I will append the account into the list.
                this.setRevokeButton()
            },
            false)

        Model.eventHub.subscribe("received_invitation_" + account.id + "_evt",
            (uuid) => { },
            (evt) => {
                // So here I will append the account into the list.
                this.setAcceptDeclineButton()
            },
            false)


        Model.eventHub.subscribe("accepted_invitation_" + contact.id + "_evt",
            (uuid) => { },
            (evt) => {
                // TODO display contact actions...
                // this.setAcceptDeclineButton()

            },
            false)

        Model.eventHub.subscribe("declined_invitation_" + contact.id + "_evt",
            (uuid) => { },
            (evt) => {
                // this.setInviteButton(this.oninvite)
            },
            false)
*/