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
import { theme } from "./Theme";
import { Account } from "../Account"
import { Model } from "../Model"
import { PermissionManager } from '../Permission';
import { ConversationManager } from '../Conversation';
import { Invitation } from 'globular-web-client/conversation/conversation_pb';
import { decode } from 'uint8-to-base64';
import { v4 as uuidv4 } from "uuid";
import { ApplicationView } from '../ApplicationView';
import { getCoords } from "./utility.js"

/**
 * Communication with your contact's
 */
export class MessengerMenu extends Menu {
    // attributes.

    // Create the contact view.
    constructor() {
        super("Messenger", "communication:message", "Messenger")

        this.account = null;

        // Actions handlers

        // When new conversation is receive.
        this.onConversationRequest = null;

        // When a new message is receive.
        this.onReceiveMessage = null;


        this.width = 320;
        if (this.hasAttribute("width")) {
            this.width = parseInt(this.getAttribute("width"));
        }

        this.height = 550;
        if (this.hasAttribute("height")) {
            this.height = parseInt(this.getAttribute("height"));
        }

        // Element of interfaces needed between function call
        this.conversationsLst = null;
        this.sentConversationsInvitationsLst = null;
        this.receivedConversationsInvitationsLst = null;
        this.conversationsTab = null
        this.sentConversationsInvitationsTab = null
        this.receivedConversationsInvitationsTab = null
    }

    // Init the message menu at login time.
    init(account) {

        // Keep the account reference.
        this.account = account;

        // Event listener when a new conversation is created...
        Model.eventHub.subscribe(`send_conversation_invitation_${this.account.id}_evt`,
            (uuid) => { },
            (data) => {
                const decoded = decode(data);
                let invitation = Invitation.deserializeBinary(decoded)
                this.appendSentInvitation(invitation)
            },
            false)

        Model.eventHub.subscribe(`receive_conversation_invitation_${this.account.id}_evt`,
            (uuid) => { },
            (data) => {
                const decoded = decode(data);
                let invitation = Invitation.deserializeBinary(decoded)
                this.appendReceivedInvitation(invitation)
            },
            false)

        Model.eventHub.subscribe("delete_conversation_evt",
            () => { },
            () => {
                this.conversationsTab.innerHTML = `<span id="conversations_label">Conversations</span>`
                if (this.conversationsLst.children.length > 0) {
                    this.conversationsTab.innerHTML += `<paper-badge for="conversations_label" label="${this.conversationsLst.children.length}"></paper-badge>`
                }
            }, true)



        let html = `
            <style>
            ${theme}
            #Messages-div {
                display: flex;
                flex-wrap: wrap;
                padding: 10px;
                height: 100%;
                flex-direction: column;
                overflow: hidden;
                min-width: 200px;
            }
                          
            #conversations-lst{
                flex: 1;
                overflow: auto;
            }

            .conversations-lst{
                display: flex;
                flex-direction: column;
            }

            .btn: hover{
                cursor: pointer;
            }

            #conversation-search-results{
                position: relative;
            }

            /* Need to position the badge to look like a text superscript */
            paper-tab {
              padding-right: 25px;
            }

            paper-tab paper-badge {
                --paper-badge-background: var(--palette-primary-accent);
                --paper-badge-width: 16px;
                --paper-badge-height: 16px;
                --paper-badge-margin-left: 10px;
            }

            </style>

            <div id="Messages-div">
                <div style="display: flex; align-items: center;">
                    <paper-input type="text" label="Search" id="search-conversation-box" width="${this.width}" style="flex-grow: 1;"></paper-input>
                    <div id="new-converstion-btn" class="btn" style="position: relative;">
                        <iron-icon style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                </div>
                <div id="conversation-search-results"></div>
                <paper-tabs selected="0">
                    <paper-tab id="conversations-tab">Conversations</paper-tab>
                    <paper-tab id="sent-conversations-invitations-tab">Sent Invitations</paper-tab>
                    <paper-tab id="received-conversations-invitations-tab">Received Invitations</paper-tab>
                </paper-tabs>
                <div id="conversations-lst">
                    <div id="conversations-lst_" class="conversations-lst"></div>
                    <div id="sent-conversations-invitations-lst" class="conversations-lst" style="display: none;"></div>
                    <div id="received-conversations-invitations-lst" class="conversations-lst" style="display: none;"></div>
                </div>
            </div>
        `

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().style.height = this.height + "px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv())


        this.conversationsTab = this.shadowRoot.querySelector("#conversations-tab")
        this.conversationsLst = this.shadowRoot.querySelector("#conversations-lst_")

        this.sentConversationsInvitationsTab = this.shadowRoot.querySelector("#sent-conversations-invitations-tab")
        this.sentConversationsInvitationsLst = this.shadowRoot.querySelector("#sent-conversations-invitations-lst")

        this.receivedConversationsInvitationsTab = this.shadowRoot.querySelector("#received-conversations-invitations-tab")
        this.receivedConversationsInvitationsLst = this.shadowRoot.querySelector("#received-conversations-invitations-lst")

        // Setup the list of received invitations
        ConversationManager.getReceivedInvitations(account.id,
            (invitations) => {
                /** Get initial invitation list. */
                invitations.forEach(invitation => {
                    this.appendReceivedInvitation(invitation)
                })

            },
            (err) => {
                ApplicationView.displayMessage(err, 3000)
            })

        // Setup the list of sent invitations.
        ConversationManager.getSentInvitations(account.id,
            invitations => {
                invitations.forEach(invitation => {
                    this.appendSentInvitation(invitation)
                })
            },
            err => {
                ApplicationView.displayMessage(err, 3000)
            })

        this.conversationsTab.onclick = () => {
            this.conversationsLst.style.display = "flex"
            this.sentConversationsInvitationsLst.style.display = "none"
            this.receivedConversationsInvitationsLst.style.display = "none"
        }

        this.sentConversationsInvitationsTab.onclick = () => {
            this.conversationsLst.style.display = "none"
            this.sentConversationsInvitationsLst.style.display = "flex"
            this.receivedConversationsInvitationsLst.style.display = "none"
        }

        this.receivedConversationsInvitationsTab.onclick = () => {
            this.sentConversationsInvitationsLst.style.display = "none"
            this.receivedConversationsInvitationsLst.style.display = "flex"
            this.conversationsLst.style.display = "none"
        }

        // Find a conversation...
        let searchBox = this.shadowRoot.querySelector("#search-conversation-box");
        searchBox.onkeyup = (evt) => {
            let searchConverstionResults = this.shadowRoot.querySelector("#search-conversation-results")
            if (searchConverstionResults != undefined) {
                searchConverstionResults.innerHTML = ""
            }

            if (evt.code == "Enter") {
                ConversationManager.findConversations(searchBox.value,
                    (conversations) => {
                        let html = `
                        <style>
                            #search-conversation-results{
                                position: absolute;
                                top: 0px;
                                left: 0px;
                                display: flex;
                                flex-direction: column;
                                z-index: 100;
                                max-height: 450px;
                                overflow-y: auto;
                            }
                        </style>
                        <paper-card id="search-conversation-results">
                            
                        </paper-card>
                        `

                        this.shadowRoot.querySelector("#conversation-search-results").appendChild(document.createRange().createContextualFragment(html))

                        searchConverstionResults = this.shadowRoot.querySelector("#search-conversation-results")
                        for (var i = 0; i < conversations.length; i++) {
                            let conversationInfos = new ConversationInfos(null, this.account)
                            conversationInfos.init(conversations[i])
                            searchConverstionResults.appendChild(conversationInfos)
                        }
                    },
                    (err) => {
                        ApplicationView.displayMessage(err, 3000)
                    })
            } else {

            }
        }


        this.newconversationBtn = this.shadowRoot.querySelector("#new-converstion-btn")

        this.newconversationBtn.onclick = () => {
            // simply publish create new conversation...
            Model.eventHub.publish("__create_new_conversation_event__", {}, true)
        }

        /** Event's subscribe... */
        Model.eventHub.subscribe("__new_conversation_event__",
            (uuid) => { },
            (conversation) => {
                this.appendConversation(conversation)
            },
            true)


        /** Load conversations */
        Model.eventHub.subscribe("__load_conversations_event__",
            (uuid) => { },
            (conversations) => {
                this.conversationsLst.innerHTML = "";
                for (var i = 0; i < conversations.length; i++) {
                    this.appendConversation(conversations[i])
                }
            },
            true)


        Model.eventHub.subscribe("__refresh_invitations__",
            (uuid) => { },
            () => {
                this.receivedConversationsInvitationsTab.innerHTML = `<span id="received_invitations_label">Received Invitations</span>`
                if (this.receivedConversationsInvitationsLst.children.length > 0) {
                    this.receivedConversationsInvitationsTab.innerHTML += `<paper-badge for="received_invitations_label" label="${this.receivedConversationsInvitationsLst.children.length}"></paper-badge>`
                    window.dispatchEvent(new Event('resize'));
                }

                this.sentConversationsInvitationsTab.innerHTML = `<span id="sent_invitations_label">Sent Invitations</span>`
                if (this.sentConversationsInvitationsLst.children.length > 0) {
                    this.sentConversationsInvitationsTab.innerHTML += `<paper-badge for="sent_invitations_label" label="${this.sentConversationsInvitationsLst.children.length}"></paper-badge>`
                    window.dispatchEvent(new Event('resize'));
                }
            },
            true)
        this.shadowRoot.removeChild(this.getMenuDiv())

    }

    // Display base conversation info
    appendConversation(conversation) {
        let conversationUuid = conversation.getUuid()
        if (this.conversationsLst.querySelector("#conversation_" + conversationUuid + "_infos") != undefined) {
            return;
        }
        let conversationName = conversation.getName()
        let conversationInfos = new ConversationInfos(null, this.account)
        conversationInfos.id = `conversation_${conversationUuid}_infos`
        conversationInfos.init(conversation)
        conversationInfos.setJoinButton(); // here I will display the join button.
        this.conversationsLst.appendChild(conversationInfos)
        this.conversationsTab.innerHTML = `<span id="conversation_label">Conversations</span> <paper-badge for="conversation_label" label="${this.conversationsLst.children.length}"></paper-badge>`
        window.dispatchEvent(new Event('resize'));
        console.log("append conversation " + conversationUuid);

        Model.eventHub.subscribe(`delete_conversation_${conversationUuid}_evt`,
            (uuid) => {
                //this.delete_conversation_listener = uuid;
            },
            (conversationUuid) => {
                // simply remove it from it parent.
                console.log("delete conversation event received!", conversationUuid)
                let conversationInfos = this.shadowRoot.querySelector(`#conversation_${conversationUuid}_infos`)
                if (conversationInfos != undefined) {
                    this.conversationsLst.removeChild(conversationInfos)
                    // publish local event from network one.
                    Model.eventHub.publish("delete_conversation_evt", null, true)
                }
            }, false)

        Model.eventHub.subscribe(`__delete_conversation_${conversationUuid}_evt__`,
            (uuid) => {
                //this.delete_conversation_listener = uuid;
            },
            (conversationUuid) => {
                // simply remove it from it parent.
                let conversationInfos = this.shadowRoot.querySelector("#conversation_" + conversationUuid + "_infos")
                if (conversationInfos != undefined) {
                    this.conversationsLst.removeChild(conversationInfos)
                    // publish local event from network one.
                    Model.eventHub.publish("delete_conversation_evt", null, true)
                }
            }, true)

        Model.eventHub.subscribe(`kickout_conversation_${conversationUuid}_evt`,
            (uuid) => {
                //
            },
            (participant) => {
                // check for kickout...
                if (participant == this.account.id) {
                    let conversationInfos = this.shadowRoot.querySelector("#conversation_" + conversationUuid + "_infos")
                    if (conversationInfos != undefined) {
                        // That's mean the user get kickout from the conversation...
                        this.conversationsLst.removeChild(conversationInfos)
                        Model.eventHub.publish("delete_conversation_evt", null, true)
                        ApplicationView.displayMessage(`You got kicked out of the conversation <span style="font-style:italic;">${conversationName}</span>`, 3000)
                    }
                }
            }, false)
    }

    appendReceivedInvitation(invitation) {

        Model.eventHub.subscribe(`accept_conversation_invitation_${invitation.getConversation()}_${invitation.getFrom()}_evt`,
            (uuid) => { },
            (evt) => {

                // re-init the conversation list.
                ConversationManager.loadConversation(this.account,
                    (conversations) => {
                        Model.eventHub.publish("__load_conversations_event__", conversations.getConversationsList(), true)
                    },
                    (err) => {
                        /** no conversation found... */
                        ApplicationView.displayMessage(err, 3000)
                    })

            }, false)

        let invitationCard = new InvitationCard(invitation, this.account.id, invitation.getFrom(), invitation.getConversation());

        invitationCard.setAcceptButton((invitation) => {

            ConversationManager.acceptConversationInvitation(invitation,
                () => {
                    // Publish network events
                    Model.eventHub.publish(`accept_conversation_invitation_${invitation.getConversation()}_${invitation.getFrom()}_evt`, `{}`, false)

                    // re-init the conversation list.
                    ConversationManager.loadConversation(this.account,
                        (conversations) => {
                            Model.eventHub.publish("__load_conversations_event__", conversations.getConversationsList(), true)
                        },
                        (err) => {
                            /** no conversation found... */
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        })

        invitationCard.setDeclineButton((invitation) => {
            ConversationManager.declineConversationInvitation(invitation,
                () => {
                    // Publish network events
                    Model.eventHub.publish(`decline_conversation_invitation_${invitation.getConversation()}_${invitation.getFrom()}_evt`, {}, false)
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        })

        this.receivedConversationsInvitationsLst.appendChild(invitationCard)

        // Now I will set the number of received conversations in the tab.
        this.receivedConversationsInvitationsTab.innerHTML = `<span id="received_invitation_label">Received Invitations</span> <paper-badge for="received_invitation_label" label="${this.receivedConversationsInvitationsLst.children.length}"></paper-badge>`
        window.dispatchEvent(new Event('resize'));
    }


    appendSentInvitation(invitation) {

        let invitationCard = new InvitationCard(invitation, invitation.getFrom(), invitation.getTo(), invitation.getConversation());
        this.sentConversationsInvitationsLst.appendChild(invitationCard)
        invitationCard.setRevokeButton((invitation) => {

            ConversationManager.revokeConversationInvitation(invitation,
                () => {
                    // Publish network events
                    Model.eventHub.publish(`revoke_conversation_invitation_${invitation.getConversation()}_${invitation.getTo()}_evt`, `{}`, false)
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        })

        this.sentConversationsInvitationsTab.innerHTML = `<span id="sent_invitations_label">Sent Invitations</span> <paper-badge for="sent_invitations_label" label="${this.sentConversationsInvitationsLst.children.length}"></paper-badge>`
        window.dispatchEvent(new Event('resize'));
    }
}

customElements.define('globular-messenger-menu', MessengerMenu)

/**
 * Display conversation basic info...
 */
export class ConversationInfos extends HTMLElement {

    constructor(opened, account) {
        super();

        this.account = account;
        this.delete_conversation_listener = null;
        this.join_conversation_listener = null;
        this.leave_conversation_listener = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        if (this.hasAttribute("opened")) {
            opened = `opened="${this.getAttribute("opened")}"`
        }

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .conversation-infos{
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                padding-left: 10px;
                padding-right: 10px;
                display: flex;
                flex-direction: column;
                min-width: 295px;
                border-bottom: 1px solid var(--palette-divider);
            }

            .conversation-infos .header{
                display: flex;
            }

            .conversation-infos .header .title{
                padding-top: 5px;
                font-size: 1.1rem;
                flex-grow: 1;
            }

            .conversation-infos .action{
                display: flex;
                align-items: center;
                justify-content: flex-end;
            }

            .conversation-infos:hover {
                filter: invert(10%);
            }

            .conversation-infos paper-button{
                font-size:.85em; 
                width: 20px;
            }

            .conversation-infos .info{
                display:table; 
                border-spacing: 5px;
            }

            .conversation-infos .info .row{
                display: table-row;
            }

            .conversation-infos .info .row div{
                font-size: .85rem;
                display: table-cell;
            }

            .conversation-infos .info .row .label{
                padding-right: 10px;
                font-weight: 410;
            }

            .keywords{
                display: flex;
                padding-right: 10px;
            }

            .keywords span{
                margin-right: 10px;
                font-style: italic;
                background-color: yellow;
                text-align: center;
            }

            paper-button{
                display: flex;
                font-size: .85rem;
                border: none;
                color: var(--palette-text-accent);
                background: var(--palette-primary-accent);
                max-height: 32px;
            }

            paper-icon-button {
                color: var(--paper-pink-500);
                --paper-icon-button-ink-color: var(--paper-indigo-500);
            }

        </style>
        <div class="conversation-infos">
            <div class="header">
                <span class="title"></span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="conversation-infos-collapse" ${opened}>
                <div class="info" style="">
                    <div class="row"> 
                        <div class="label">Created</div> <div class="created"></div>
                    </div>
                    <div class="row"> 
                        <div class="label">Last message</div> <div class="last-message"></div>
                    </div>
                    <div class="row"> 
                        <div class="label">Keywords</div> <div class="keywords"></div>
                    </div>
                    <div class="row"> 
                        <div class="label">Owner'(s)</div> <div class="owners"></div>
                    </div>
                </div>
            </iron-collapse>
            <slot class="action"></slot>
        </div>
        `

        this.titleDiv = this.shadowRoot.querySelector(".title")
        this.created = this.shadowRoot.querySelector(".created")
        this.lastMessage = this.shadowRoot.querySelector(".last-message")
        this.keywords = this.shadowRoot.querySelector(".keywords")
        this.owners = this.shadowRoot.querySelector(".owners")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            let content = this.shadowRoot.querySelector("#conversation-infos-collapse")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }

        this.conversation = null;
    }

    //
    init(conversation) {

        this.conversation = conversation;

        // Set the value in the interfaces.
        this.titleDiv.innerHTML = conversation.getName();
        let creationTime = new Date(conversation.getCreationTime() * 1000)
        this.created.innerHTML = creationTime.toLocaleDateString() + " " + creationTime.toLocaleTimeString()

        if (conversation.getLastMessageTime() > 0) {
            let lastMessageTime = new Date(conversation.getLastMessageTime() * 1000)
            this.lastMessage.innerHTML = lastMessageTime.toLocaleDateString() + " " + lastMessageTime.toLocaleTimeString()
        } else {
            this.lastMessage.innerHTML = "no messages reveceived yet..."
        }

        conversation.getKeywordsList().forEach((keyword) => {
            let span = document.createElement("span")
            span.innerHTML = keyword
            this.keywords.appendChild(span)
        })

        // Here  I will display the list of owner for that conversation.
        PermissionManager.getResourcePermissions(conversation.getUuid(),
            (permissions) => {
                permissions.getOwners().getAccountsList().forEach(owner => {
                    let span = document.createElement("span")
                    span.innerHTML = owner
                    this.owners.appendChild(span)
                    this.setLeaveButton()
                    this.setJoinButton();
                    if (owner == this.account.id) {
                        this.setInviteButton();
                    }
                    this.setDeleteButton();
                })
            },
            (err) => { })

        let conversationUuid = conversation.getUuid();

        Model.eventHub.subscribe(`__join_conversation_evt__`,
            (uuid) => {
                this.join_conversation_listener = uuid;
            },
            (evt) => {
                console.log(evt)
                if (evt.conversation.getUuid() == conversationUuid) {
                    this.querySelector(`#join_${conversationUuid}_btn`).style.display = "none"
                    this.querySelector(`#leave_${conversationUuid}_btn`).style.display = "flex"
                }
            }, true)

        Model.eventHub.subscribe(`__leave_conversation_evt__`,
            (uuid) => {
                this.leave_conversation_listener = uuid;
            },
            (evt) => {
                if (evt == conversationUuid) {
                    this.querySelector(`#join_${conversationUuid}_btn`).style.display = "flex"
                    this.querySelector(`#leave_${conversationUuid}_btn`).style.display = "none"
                }
            }, true)
    }
    setInviteButton() {
        if (this.querySelector(`#invite_${this.conversation.getUuid()}_btn`) != undefined) {
            return
        }
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px;" id="invite_${this.conversation.getUuid()}_btn">Invite</paper-button>`))

        this.querySelector(`#invite_${this.conversation.getUuid()}_btn`).onclick = () => {
            Model.eventHub.publish("__invite_conversation_evt__", this.conversation, true)
        }
    }

    /** Leave the conversation */
    setLeaveButton(onLeaveConversation) {
        if (this.querySelector(`#leave_${this.conversation.getUuid()}_btn`) != undefined) {
            return
        }
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`</div><paper-button style="display:none; font-size:.85em; width: 20px;" id="leave_${this.conversation.getUuid()}_btn">Leave</paper-button>`))

        this.querySelector(`#leave_${this.conversation.getUuid()}_btn`).onclick = () => {
            ConversationManager.leaveConversation(this.conversation.getUuid(),
                (messages) => {
                    if (onLeaveConversation != null) {
                        onLeaveConversation(messages);
                    }

                    // local event
                    Model.eventHub.publish("__leave_conversation_evt__", this.conversation.getUuid(), true)

                    this.querySelector(`#join_${this.conversation.getUuid()}_btn`).style.display = "flex"
                    this.querySelector(`#leave_${this.conversation.getUuid()}_btn`).style.display = "none"
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        }
    }

    /** Display join conversation button */
    setJoinButton(onJoinConversation) {
        if (this.querySelector(`#join_${this.conversation.getUuid()}_btn`) != undefined) {
            return
        }
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`</div><paper-button style="font-size:.85em; width: 20px;" id="join_${this.conversation.getUuid()}_btn">Join</paper-button>`))

        this.querySelector(`#join_${this.conversation.getUuid()}_btn`).onclick = () => {
            ConversationManager.joinConversation(this.conversation.getUuid(),
                (conversation, messages) => {
                    if (onJoinConversation != null) {
                        onJoinConversation(messages);
                    }

                    this.conversation = conversation;

                    // local event
                    Model.eventHub.publish("__join_conversation_evt__", { conversation: this.conversation, messages: messages }, true)

                    // network event.
                    this.querySelector(`#join_${this.conversation.getUuid()}_btn`).style.display = "none"
                    this.querySelector(`#leave_${this.conversation.getUuid()}_btn`).style.display = "flex"
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        }
    }

    /** Display delete conversation button */
    setDeleteButton(onDeleteConversation) {
        if (this.querySelector(`#delete_${this.conversation.getUuid()}_btn`) != undefined) {
            return
        }
        this.innerHtml = ""
        let range = document.createRange()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px;" id="delete_${this.conversation.getUuid()}_btn">Delete</paper-button>`))

        this.querySelector(`#delete_${this.conversation.getUuid()}_btn`).onclick = () => {
            Model.eventHub.publish("__delete_conversation_evt__", this.conversation, true)
            if (onDeleteConversation != null) {
                onDeleteConversation();
            }
        }

    }

}

customElements.define('globular-conversation-infos', ConversationInfos)


/**
 * Messenger conversation manager.
 */
export class Messenger extends HTMLElement {

    constructor(account) {
        super();
        this.account = account;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // The list of listener's
        this.listeners = {}

        // Here I will keep the opened converstion infos...
        this.conversations = {}

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #layout-div-1{
                display: flex;

            }

            #layout-div-1-1{
                display: flex;
                flex-direction: column;
            }

            #layout-div-1-2{
                flex-grow: 1;
            }


            .container{
                display: none;
                flex-direction: column;
                position:fixed;
                bottom: 0px;
                right: 0px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .header{
                display: flex;
            }

            .summary{
                display: flex;
                flex-grow: 1;
                font-size: 1.1rem;
                align-items: center;
            }

            .btn{
                display: flex; 
                width: 32px; 
                height: 32px; 
                justify-content: center; 
                align-items: 
                center;position: relative;
            }

            .btn iron-icon{
                --iron-icon-fill-color:var(--palette-text-primary);
            }

            .btn:hover{
                cursor:pointer;
            }

            .conversations-detail{
                border-bottom: 1px solid var(--palette-divider);
                display: flex;
            }

            #messages-list-container{
                min-height: 525px;
                max-height: 525px;
                overflow-y: auto;    
            }
        </style>

        <paper-card class="container">
            <div class="header">
                <div class="btn">
                    <iron-icon  id="hide-btn-0"  icon="expand-more" style="" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <div class="btn">
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                    <iron-icon style="height: 18px;" id="leave_conversation_btn" icon="exit-to-app"></iron-icon>
                </div>     
                <div class="summary"></div>
                <div class="btn">
                    <iron-icon  id="hide-btn-1"  icon="unfold-less" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse class="conversations-detail">
                <globular-conversations-list style="border-right: 1px solid var(--palette-divider);"></globular-conversations-list>
                <div style="display: flex; flex-direction: column; margin-left: 10px;">
                    <paper-tabs selected="0">
                        <paper-tab id="paticipants-tab">Participants</paper-tab>
                        <paper-tab id="attached-files-tab">Files</paper-tab>
                    </paper-tabs>
                    <div style="display: flex; flex-grow: 1; overflow-y: auto; max-height: 175px;">
                        <globular-attached-files-list style="display: none;"></globular-attached-files-list>
                        <globular-paticipants-list></globular-paticipants-list>
                    </div>
                </div>
            </iron-collapse>
            <iron-collapse class="messenger-content" opened = "[[opened]]">
                <div id="messages-list-container">
                    <globular-messages-list style="margin-top: 16px;"></globular-messages-list>
                </div>
                <globular-message-editor></globular-message-editor>
            </iron-collapse>
        </paper-card>
        `
        this.shadowRoot.querySelector("#hide-btn-0").onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn-0")
            let content = this.shadowRoot.querySelector(".conversations-detail")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "expand-less"
                } else {
                    button.icon = "expand-more"
                }
                content.toggle();
            }
        }

        this.shadowRoot.querySelector("#hide-btn-1").onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn-1")
            let content = this.shadowRoot.querySelector(".messenger-content")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
                this.shadowRoot.querySelector("globular-messages-list").setScroll();
            }
        }

        // Here I will get interfaces components and initialyse each of them.
        this.conversationsList = this.shadowRoot.querySelector("globular-conversations-list");
        this.conversationsList.setAccount(this.account)
        this.attachedFilesList = this.shadowRoot.querySelector("globular-attached-files-list");
        this.attachedFilesList.setAccount(this.account)
        this.participantsList = this.shadowRoot.querySelector("globular-paticipants-list");
        this.participantsList.setAccount(this.account)
        this.messagesLst = this.shadowRoot.querySelector("globular-messages-list");
        this.messagesLst.setAccount(this.account)
        this.messageEditor = this.shadowRoot.querySelector("globular-message-editor");
        this.messageEditor.setAccount(this.account)

        let participantsTab = this.shadowRoot.querySelector("#paticipants-tab")
        participantsTab.onclick = () => {
            this.attachedFilesList.style.display = "none"
            this.participantsList.style.display = "block"
        }

        let filesTab = this.shadowRoot.querySelector("#attached-files-tab")
        filesTab.onclick = () => {
            this.attachedFilesList.style.display = "block"
            this.participantsList.style.display = "none"
        }

        // Join a conversation local event...
        Model.eventHub.subscribe(`__join_conversation_evt__`,
            (uuid) => { },
            (evt) => {
                let conversation = evt.conversation;

                // if the conversation already exist i set it.
                if (this.conversations[conversation.getUuid()] != undefined) {
                    // Set the conversation.
                    this.setConversation(conversation.getUuid())
                    return
                }

                // Here the conversation dosent exist so I will keep it in the map.
                this.conversations[conversation.getUuid()] = { conversation: conversation, messages: evt.messages }


                // Open the conversation.
                this.openConversation(conversation, evt.messages)

            }, true)

        Model.eventHub.subscribe(`__new_message_evt__`,
            (uuid) => { },
            (evt) => {
                this.setScroll()
            }, true)
    }

    hide() {
        this.shadowRoot.querySelector(".summary").innerHTML = "";
        this.shadowRoot.querySelector(".container").style.display = "none";
    }

    setScroll() {
        let container = this.shadowRoot.querySelector("#messages-list-container");
        container.scrollTop = container.scrollHeight;
    }

    setConversation(conversationUuid) {
        let conversation = this.conversations[conversationUuid].conversation
        let messages = this.conversations[conversationUuid].messages

        // Set the leave converstion button.
        this.shadowRoot.querySelector("#leave_conversation_btn").onclick = () => {
            ConversationManager.leaveConversation(conversationUuid,
                () => {
                    Model.eventHub.publish("__leave_conversation_evt__", conversationUuid, true)
                }, err => { })
        }

        // Set the name in the summary title.
        this.shadowRoot.querySelector(".summary").innerHTML = conversation.getName();

        // Set the conversation.
        this.conversationsList.setConversation(conversation)

        // Set messages
        this.messagesLst.setConversation(conversation, messages)

        // Set the conversation in the message editor.
        this.messageEditor.setConversation(conversation)

        // Set the participant list.
        this.participantsList.setConversation(conversation, messages)

    }

    // Here I will open the converstion.
    openConversation(conversation, messages) {

        // Display the messenger panel.
        this.shadowRoot.querySelector(".container").style.display = "flex";
        let conversationUuid = conversation.getUuid()

        // Set the listener's for that conversation
        this.listeners[conversationUuid] = []

        // Connect the conversation event's
        // Set the leave converstion button.
        this.shadowRoot.querySelector("#leave_conversation_btn").onclick = () => {
            ConversationManager.leaveConversation(conversationUuid,
                () => {
                    Model.eventHub.publish("__leave_conversation_evt__", conversationUuid, true)
                }, err => { })
        }

        // Set the name in the summary title.
        this.shadowRoot.querySelector(".summary").innerHTML = conversation.getName();

        // Keep messages into conversation
        Model.eventHub.subscribe(`__received_message_${conversationUuid}_evt__`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `__received_message_${conversationUuid}_evt__`, listener: uuid })
            },
            (msg) => {
                // keep the message in the list of messages.
                console.log("1065 ---->", msg)
                this.conversations[conversationUuid].messages.push(msg)

            }, true)

        // Delete a conversation.
        Model.eventHub.subscribe(`delete_conversation_${conversationUuid}_evt`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `delete_conversation_${conversationUuid}_evt`, listener: uuid })
            },
            () => {
                // Here I will unsubscribe to each event from it...
                this.closeConversation(conversationUuid)
            },
            false);

        Model.eventHub.subscribe(`join_conversation_${conversationUuid}_evt`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `join_conversation_${conversationUuid}_evt`, listener: uuid })
            },
            (evt) => {
                let participants = JSON.parse(evt)

                // update the particpant list.
                this.conversations[conversationUuid].conversation.setParticipantsList(participants)

                // Here I will unsubscribe to each event from it...
                this.participantsList.setConversation(this.conversations[conversationUuid].conversation, this.conversations[conversationUuid].messages)
            },
            false);

        // Leave a conversation.

        // Local event
        Model.eventHub.subscribe(`__leave_conversation_evt__`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `__leave_conversation_evt__`, listener: uuid })
            },
            () => {
                this.closeConversation(conversationUuid)
            }, true)

        Model.eventHub.subscribe(`kickout_conversation_${conversationUuid}_evt`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `kickout_conversation_${conversationUuid}_evt`, listener: uuid })
            },
            (participant) => {
                // check for kickout...
                if (participant == this.account.id) {
                    // That's mean the user get kickout from the conversation...
                    this.closeConversation(conversationUuid)

                }
            }, false)

        // Network event                    
        Model.eventHub.subscribe(`leave_conversation_${conversationUuid}_evt`,
            (uuid) => {
                this.listeners[conversationUuid].push({ evt: `leave_conversation_${conversationUuid}_evt`, listener: uuid })
            },
            (evt) => {
                // Remove the participant.
                let participants = JSON.parse(evt)

                this.conversations[conversationUuid].conversation.setParticipantsList(participants)

                // Here I will unsubscribe to each event from it...
                this.participantsList.setConversation(this.conversations[conversationUuid].conversation, this.conversations[conversationUuid].messages)
            },
            false);

        // Open the conversation.
        this.conversationsList.openConversation(conversation)

        // Set messages
        this.messagesLst.setConversation(conversation, messages)

        // Set the conversation in the message editor.
        this.messageEditor.setConversation(conversation)

        // Set the participant list.
        this.participantsList.setConversation(conversation, messages)

    }

    closeConversation(conversationUuid) {

        // Here I will unsubscribe to each event from it...
        this.listeners[conversationUuid].forEach((value) => {
            Model.eventHub.unSubscribe(value.evt, value.listener)
        })

        let conversation = this.conversations[conversationUuid].conversation

        // close the conversation in the participant list.
        this.participantsList.clear()

        // close the conversation in the conversation list.
        this.conversationsList.closeConversation(conversation)

        // Clear the messages panel
        this.messagesLst.clear();

        // remove the conversation from map.
        delete this.conversations[conversationUuid];

        if (Object.keys(this.conversations).length == 0) {
            this.hide()
        } else {
            this.setConversation(Object.keys(this.conversations)[0])
            this.participantsList.setConverssation(this.conversations[Object.keys(this.conversations)[0]].conversation, this.conversations[Object.keys(this.conversations)[0]].messages)
        }

    }

}

customElements.define('globular-messenger', Messenger)


/**
 * Display the list of open conversation (where the user are logged in).
 */
export class ConversationsList extends HTMLElement {

    constructor() {
        super();
        this.account = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                min-height: 140px;
                font-size: 14px;
                font-weight: 400;
                padding-top: 5px;
 
            }

            .container .active{
                font-weight: 500;
            }

        </style>
        <div class="container">
            
        </div>
        `
    }

    setAccount(account) {
        this.account = account
    }

    /**
     * Set the current conversation.
     * @param {*} conversation 
     */
    setConversation(conversation) {
        // simply set as active conversation...
        /** I will unactivate all other conversations... */
        let conversationsListRows = this.shadowRoot.querySelectorAll(`.conversation-list-row`);
        for (var i = 0; i < conversationsListRows.length; i++) {
            conversationsListRows[i].classList.remove("active");
        }
        let selector = this.shadowRoot.querySelector(`#conversation_${conversation.getUuid()}_selector`)
        selector.classList.add("active")

    }

    /**
     * Append a new conversation in the conversation panel.
     * @param {*} conversation The conversation object.
     */
    openConversation(conversation) {

        let html = `
            <style>
                .conversation-list-row{
                    display: flex;
                    background-color: var(--palette-background-paper);
                    transition: background 0.2s ease,padding 0.8s linear;
                    padding: 10px;
                    position: relative;
                }

                .conversation-list-row .active{
                    font-weight: 500;
                }

                .conversation-list-row:hover {
                    filter: invert(10%);
                    cursor: pointer;
                }

            </style>
            <div id="conversation_${conversation.getUuid()}_selector" class="conversation-list-row">
                <div>${conversation.getName()}</div>
                <paper-ripple></paper-ripple>
            </div>
        `

        this.shadowRoot.querySelector(".container").appendChild(document.createRange().createContextualFragment(html))

        let selector = this.shadowRoot.querySelector(`#conversation_${conversation.getUuid()}_selector`)

        selector.onclick = () => {
            document.querySelector("globular-messenger").setConversation(conversation.getUuid())
        }

        this.setConversation(conversation)
    }

    /** Close a conversation by leaving it or delete it. */
    closeConversation(conversation) {
        let selector = this.shadowRoot.querySelector(`#conversation_${conversation.getUuid()}_selector`)
        if (selector != null) {
            // remove it from the vue...
            selector.parentNode.removeChild(selector)
        }
    }

}

customElements.define('globular-conversations-list', ConversationsList)


/**
 * Participants for the active conversation.
 */
export class ParticipantsList extends HTMLElement {

    constructor() {
        super();
        this.account = null;
        this.isOwner = false;
        this.blocked = false;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                
            }

            #paticipants-lst{
                display: flex;
                flex-direction: column;
            }

            .participant-table-row{
                display: flex;
                align-items: center;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                border-bottom: 1px solid var(--palette-divider);
            }

            .participant-table-row:hover{
                filter: invert(10%);
            }

            .participant-table-row div{
                display: flex;
                flex-direction: column;
                padding: 5px;
            }

            .participant-table-row img{
                height: 48px;
                width: 48px;
            }

            .iron-icon {
                height: 48px;
                width: 48px;
            }

            .btn{
                display: flex; 
                width: 32px; 
                height: 32px; 
                justify-content: center; 
                align-items: center;
                position: relative;
            }
          
            .btn:hover{
                cursor: pointer;
            }
          
            .btn iron-icon{
                --iron-icon-fill-color:var(--palette-text-primary);
                width: 24px; 
                height: 24px;
            }

        </style>

        <div id="paticipants-lst">
        </div>
        `
    }

    /**
     * Here I will set paticipant from the conversation.
     * @param {*} conversation 
     */
    setConversation(conversation, messages) {
        if (this.blocked) {
            return
        }
        this.blocked = true
        this.clear() // clear actual participant list...

        PermissionManager.getResourcePermissions(conversation.getUuid(),
            (permissions) => {
                permissions.getOwners().getAccountsList().forEach(owner => {
                    if (owner == this.account.id && !this.isOwner) {
                        this.isOwner = true
                    }
                })

                // Now I will append paticipant who wrote messages in that conversation and are not necessary in the room at that time...
                let __participants__ = JSON.parse(JSON.stringify(conversation.getParticipantsList()));
                let __unavailable__ = []
                messages.forEach(message => {
                    let index = __participants__.indexOf(message.getAuthor())
                    if (index == -1) {
                        __participants__.push(message.getAuthor())
                        __unavailable__.push(message.getAuthor())
                    }
                })

                let setParticipantsRow = () => {
                    let paticipant = __participants__.pop()
                    Account.getAccount(paticipant,
                        p => {
                            // if the session is offline or the user is in the list of unavailble user then I will set it session as unavailable.
                            if (p.session.state == 1 || __unavailable__.indexOf(p._id) != -1) {
                                this.setUnavailableParticipantRow(p)
                            } else {
                                this.setAvailableParticipantRow(p)
                            }

                            this.kickoutFromConversation(conversation, p, this.shadowRoot.querySelector(`#paticipant-${p._id}-row`))

                            // process next...
                            if (__participants__.length > 0) {
                                setParticipantsRow()
                            } else {
                                this.blocked = false
                            }
                        },
                        err => {
                            this.blocked = false
                            ApplicationView.displayMessage(err, 3000)
                        })
                }
                // Process the list of 
                setParticipantsRow()
            },
            (err) => {
                this.blocked = false
                ApplicationView.displayMessage(err, 3000)
            })
    }

    setAvailableParticipantRow(p) {
        if (this.shadowRoot.querySelector(`paticipant-${p._id}-row`) == undefined) {
            let html = `
                <div  id="paticipant-${p._id}-row" class="participant-table-row">
                    <div>
                        <img src="${p.profilPicture_}"> </img>
                    
                    </div>
                    <div style="flex-grow: 1;">
                        <span><span style="font-style: italic;">${p.name_}</span> ${p.firstName_} ${p.lastName_}</span>
                        <globular-session-state account=${p._id}></globular-session-state>
                    </div>
                </div>
                `
            this.shadowRoot.querySelector("#paticipants-lst").insertBefore(document.createRange().createContextualFragment(html), this.shadowRoot.querySelector("#paticipants-lst").firstChild)

        }
    }

    setUnavailableParticipantRow(p) {
        if (this.shadowRoot.querySelector(`paticipant-${p._id}-row`) == undefined) {
            let html = `
            <div id="paticipant-${p._id}-row" class="participant-table-row">
                <div>
                    <img src="${p.profilPicture_}"> </img>
                </div>
                <div style="flex-grow: 1;">
                    <span><span style="font-style: italic;">${p.name_}</span> ${p.firstName_} ${p.lastName_}</span>
                    <span>Not available</span>
                </div>
            </div>
            `
            this.shadowRoot.querySelector("#paticipants-lst").appendChild(document.createRange().createContextualFragment(html))
        }
    }

    /** Set the kickout action. */
    kickoutFromConversation(conversation, user, row) {

        if (user._id != this.account._id && this.isOwner) {
            let id = `conversation_${conversation.getUuid()}_${user._id}_kickout_btn`
            let html = `
            <div id="${id}" class="btn" title="Kickout ${user.name_} from this conversation.">
                <iron-icon   icon="remove-circle-outline"></iron-icon>
                <paper-ripple class="circle" recenters=""></paper-ripple>
            </div>
            `

            row.appendChild(document.createRange().createContextualFragment(html))
            let btn = this.shadowRoot.querySelector("#" + id)
            btn.onclick = () => {
                ConversationManager.kickoutFromConversation(conversation.getUuid(), user._id,
                    () => {
                        ApplicationView.displayMessage(`
                        <div style="display: flex; flex-direction: column;">
                            <img style="height: 48px; width: 48px;" src="${user.profilPicture_}"></img>
                            <span>User <span style="font-style: italic;">${user.name_}</span> was kicked out of the conversation <span style="font-style:italic;">${conversation.getName()}</span>.</span>
                            <span> <span style="font-style: italic;">${user.name_}</span> will not be able to join the conversation without a new invitation.</span>
                        </div>
                        `, 6000)
                    },
                    err => {
                        ApplicationView.displayMessage(err, 3000)
                    })
            }
        }
    }

    clear() {
        this.shadowRoot.querySelector("#paticipants-lst").innerHTML = ""
    }

    setAccount(account) {
        this.account = account
    }
}

customElements.define('globular-paticipants-list', ParticipantsList)

/**
 * Display the list of file attached with that conversation.
 */
export class AttachedFilesList extends HTMLElement {

    constructor() {
        super();
        this.account = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                
            }

        </style>

        <div class="container">
  
        </div>
        `
    }

    setAccount(account) {
        this.account = account
    }
}


customElements.define('globular-attached-files-list', AttachedFilesList)


/**
 * This is where the conversations messages are displayed
 */
export class MessagesList extends HTMLElement {

    constructor() {
        super();
        this.account = null;
        this.conversation = null;
        this.listener = null;
        this.conversationUuid = "";
        this.previousMessage = null;
        this.previousMessageDiv = null;
        this.previousAccountDiv = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                padding-left: 40px;
                padding-right: 8px;
                background-color: var(--palette-background-default);
            }

            .conversation-messages{
                max-width: 470px;
                display: flex;
                flex-direction: column-reverse;
            }

        </style>

        <div class="container">
            <div class="conversation-messages">

            </div>
        </div>
        `
        // Set the container's
        this.container = this.shadowRoot.querySelector(".container");
        this.messagesContainer = this.shadowRoot.querySelector(".conversation-messages");
    }

    setAccount(account) {
        this.account = account
    }

    clear() {
        this.messagesContainer.innerHTML = "";
        this.previousMessage = null;
        this.previousMessageDiv = null;
        if (this.listener != null) {
            Model.eventHub.unSubscribe(`__received_message_${this.conversationUuid}_evt__`, this.listener)
        }
    }

    setConversation(conversation, messages) {
        // simply reset the messages...
        this.clear();
        this.conversationUuid = conversation.getUuid()
        Model.eventHub.subscribe(`__received_message_${conversation.getUuid()}_evt__`,
            (uuid) => {
                this.listener = uuid;
            },
            (msg) => {
                console.log(msg)
                this.appendMessage(msg)
            }, true)

        // Sort message by their date...
        messages.sort((a, b) => {
            if (a.getCreationTime() < b.getCreationTime()) {
                return -1;
            }
            if (a.getCreationTime() > b.getCreationTime()) {
                return 1;
            }
            return 0;
        })

        // I will use the list of message form the event to set 
        for (var i = 0; i < messages.length; i++) {
            this.appendMessage(messages[i])
        }
    }

    /** Append a new message into the list... */
    appendMessage(msg) {

        console.log(msg)
        let parentMsg = null;
        let replyTo = msg.getInReplyTo().split("/").join("_")

        if (replyTo.length > 0) {
            parentMsg = this.messagesContainer.querySelector(`#_${replyTo}`)
            if (parentMsg != undefined) {
                parentMsg.appendReply(msg)
                return
            }
        }

        // simply set space and tab into the message.
        if (this.messagesContainer.querySelector(`#_${msg.getUuid().split("/").join("_")}`) == undefined) {
            let message = new GlobularMessagePanel(msg, this.account)
            this.messagesContainer.insertBefore(message, this.messagesContainer.firstChild)

            // Set display based if multiples messages are received from the same author before somebody else write something.
            let messageDiv = message.getMessageDiv()
            let accountDiv = message.getAccountDiv()
            if (this.previousMessage != undefined) {
                if (this.previousMessage.getAuthor() == msg.getAuthor()) {
                    // hide the actions inside previous message div.
                    this.previousMessageDiv.children[1].style.display = "none"; // hide action
                    this.previousMessageDiv.children[0].style.borderBottomLeftRadius = "0px" // set message corner radius 
                    this.previousMessageDiv.children[0].style.borderBottomRightRadius = "0px" // set message corner radius 
                    this.previousMessageDiv.style.marginBottom = "0px"
                    messageDiv.children[0].style.borderTopLeftRadius = "0px"
                    messageDiv.children[0].style.borderTopRightRadius = "0px"
                    if (this.previousAccountDiv != undefined) {
                        accountDiv.style.display = "none"
                    }

                }
            }

            // set the message for the next step...
            this.previousMessage = msg;
            this.previousMessageDiv = messageDiv;
            this.previousAccountDiv = accountDiv;

        } else {
            // simply set the message.
            this.messagesContainer.querySelector(`#_${msg.getUuid().split("/").join("_")}`).setMessage(msg)
        }

        Model.eventHub.publish("__new_message_evt__", null, true)
    }
}

customElements.define('globular-messages-list', MessagesList)

/**
 * This is where the user write new messages.
 */
export class MessageEditor extends HTMLElement {
    constructor() {
        super();
        this.account = null;
        this.conversationUuid = null;

        // Reply 
        this.on_answer_message_listener = ""
        this.replyTo = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                display:flex;
                flex-direction: column;
                padding: 2px;
                border-top: 1px solid var(--palette-divider);
            }

            .toolbar {
                display: flex;
            }

            #text-writer-box{
                width: 100%;
            }

            .btn{
                display: flex; 
                width: 32px; 
                height: 32px; 
                justify-content: center; 
                align-items: center;
                position: relative;
            }

            .btn:hover{
                cursor: pointer;
            }

            .btn iron-icon{
                flex-grow: 1; 
                --iron-icon-fill-color:var(--palette-text-primary);
            }

            iron-autogrow-textarea {
                border: 1px solid var(--palette-divider);
                border-radius: 3px;
                font-size: 1rem;
            }

            .answer-bar{
                display: none;
                flex-direction: column;
                font-size: .85em;
            }

            .answer-to-div{
                display: flex;
            }

            .answer-to-div span{
                flex-grow: 1;
            }

            #reply-to{
                font-weight: 500;
                padding-left: 5px;
            }


            .answer-to-text{
                max-width: 500px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                padding: 3px;
            }


        </style>
        <div class="container">
            <div class="answer-bar">
                <div class="answer-to-div">
                    <span style="display: flex; align-items: center;">You reply to <div id="reply-to"> </div></span>
                    <div class="btn">
                        <iron-icon  id="close-answer-btn" icon="close"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                </div>
                <div class="answer-to-text">
                </div>
            </div>
            <div class="toolbar">
                <iron-autogrow-textarea id="text-writer-box"></iron-autogrow-textarea>
                <div class="btn">
                    <iron-icon  id="send-btn" icon="send"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <div class="btn">
                    <iron-icon  id="attach-file-btn" icon="editor:insert-drive-file"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
        </div>
        `

        this.send = this.shadowRoot.querySelector("#send-btn")
        this.textWriterBox = this.shadowRoot.querySelector("#text-writer-box")

        Model.eventHub.subscribe("__answer_message_evt__",
            uuid => {
                /** nothing here... */
                this.on_answer_message_listener = uuid;
            },
            msg => {

                this.replyTo = msg;

                // Here I will set the reply to content.
                this.shadowRoot.querySelector(".answer-bar").style.display = "flex";
                Account.getAccount(msg.getAuthor(), account => {
                    this.shadowRoot.querySelector("#reply-to").innerHTML = `${account.firstName} ${account.lastName}`;
                }, err => { ApplicationView.displayMessage(err, 3000) })

                this.shadowRoot.querySelector(".answer-to-text").innerHTML = msg.getText()

                // Set the text write box the focus...
                setTimeout(() => {
                    this.textWriterBox.textarea.focus();
                }, 100)

            }, true)

        /** Close the answer panel... */
        this.shadowRoot.querySelector("#close-answer-btn").onclick = () => {
            this.replyTo = null;
            this.shadowRoot.querySelector(".answer-bar").style.display = "none";
            this.shadowRoot.querySelector("#reply-to").innerHTML = "";
            this.shadowRoot.querySelector(".answer-to-text").innerHTML = ""

            // Set the text write box the focus...
            setTimeout(() => {
                this.textWriterBox.textarea.focus();
            }, 100)
        }

        this.send.onclick = () => {
            let txt = this.textWriterBox.value;
            this.textWriterBox.value = ""
            let replyTo = ""
            if (this.replyTo != undefined) {
                replyTo = this.replyTo.getUuid();
            }

            this.shadowRoot.querySelector("#close-answer-btn").click()

            ConversationManager.sendMessage(this.conversationUuid, this.account, txt, replyTo,
                () => {
                    /** Nothing here... */
                },
                (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })
        }

    }

    setConversation(conversation) {
        this.conversationUuid = conversation.getUuid()
    }

    setAccount(account) {
        this.account = account
    }
}

customElements.define('globular-message-editor', MessageEditor)

/**
 * Display information about invitation.
 */
export class InvitationCard extends HTMLElement {

    constructor(invitation, account, contact, converation) {
        super();

        this.invitation = invitation;
        this.account = account;
        this.contact = contact;
        this.conversation = converation;
        this.interval = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // map of listeners.
        this.listeners = {}

        if (document.getElementById("_" + this.invitation.getConversation() + "_invitation_card") != undefined) {
            return // must be call one time...
        }

        this.id = "_" + this.invitation.getConversation() + "_invitation_card"

        // set attributes.
        if (this.hasAttribute("account")) {
            this.account = this.getAttribute("account")
        }

        if (this.hasAttribute("contact")) {
            this.contact = this.getAttribute("contact")
        }

        if (this.hasAttribute("conversation")) {
            this.conversation = this.getAttribute("conversation")
        }


        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .container{
                position: relative;
                padding: 5px;
                display: flex;
                flex-direction: column;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                border-bottom: 1px solid var(--palette-divider);
            }

            .container:hover{
                filter: invert(10%);
            }

            .container .title {
                font-size: 1rem;
            }

            .container .title span{
                font-weight: 500;
            }

            .actions{
                display: flex;
                justify-content: flex-end;
                position: absolute;
                bottom: 0px;
                right: 0px;
            }

        </style>

        <div class="container">
            <div class="title"></div>
            <globular-contact-card account="${this.account}" contact="${this.contact}"></globular-contact-card>
            <slot class="actions"></slot>
        </div>
        `

        this.shadowRoot.querySelector(".title").innerHTML = `Conversation <span>${this.invitation.getName()}</span>`;


        /** Listener event... */
        Model.eventHub.subscribe(`accept_conversation_invitation_${this.conversation}_${this.contact}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["accept_conversation_invitation_"] = { evt: `accept_conversation_invitation_${this.conversation}_${this.contact}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()

            }, false)

        Model.eventHub.subscribe(`decline_conversation_invitation_${this.conversation}_${this.contact}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["decline_conversation_invitation_"] = { evt: `decline_conversation_invitation_${this.conversation}_${this.contact}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()
            }, false)

        Model.eventHub.subscribe(`revoke_conversation_invitation_${this.conversation}_${this.contact}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["revoke_conversation_invitation_"] = { evt: `revoke_conversation_invitation_${this.conversation}_${this.contact}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()

            }, false)

        /** Listener event... */
        Model.eventHub.subscribe(`accept_conversation_invitation_${this.conversation}_${this.account}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["accept_conversation_invitation_"] = { evt: `accept_conversation_invitation_${this.conversation}_${this.account}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()

            }, false)

        Model.eventHub.subscribe(`decline_conversation_invitation_${this.conversation}_${this.account}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["decline_conversation_invitation_"] = { evt: `decline_conversation_invitation_${this.conversation}_${this.account}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()
            }, false)

        Model.eventHub.subscribe(`revoke_conversation_invitation_${this.conversation}_${this.account}_evt`,
            (uuid) => {
                //console.log(uuid)
                this.listeners["revoke_conversation_invitation_"] = { evt: `revoke_conversation_invitation_${this.conversation}_${this.account}_evt`, uuid: uuid }
            },
            (evt) => {
                // remove the invitation from the list.
                this.deleteMe()

            }, false)

        Model.eventHub.subscribe(`delete_conversation_${this.conversation}_evt`,
            (uuid) => {
                this.listeners["delete_conversation_"] = { evt: `delete_conversation_${this.conversation}_evt`, uuid: uuid }
            },
            (evt) => {
                // simply remove it from it parent.
                this.deleteMe()
            }, false)

        // initialyse account informations.
        Account.getAccount(account, () => { }, err => { })
        Account.getAccount(contact, () => { }, err => { })


    }


    connectedCallback() {

    }

    deleteListeners() {
        for (const key in this.listeners) {
            const listener = this.listeners[key]
            Model.eventHub.unSubscribe(listener.evt, listener.uuid)
        }
    }

    deleteMe() {
        this.parentNode.removeChild(this)
        this.deleteListeners()
        Model.eventHub.publish("__refresh_invitations__", null, true)
    }

    setInvitation(invitation) {
        this.invitation = invitation;
    }

    setAcceptButton(onAccpect) {
        this.innerHtml = ""
        let range = document.createRange()
        let uuid = uuidv4()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="accept_${uuid}_btn">Accept</paper-button>`))
        this.querySelector(`#accept_${uuid}_btn`).onclick = () => {
            if (onAccpect != null) {
                onAccpect(this.invitation)
            }
            this.deleteMe()
        }
    }

    setDeclineButton(onDecline) {
        this.innerHtml = ""
        let range = document.createRange()
        let uuid = uuidv4()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="decline_${uuid}_btn">Decline</paper-button>`))

        this.querySelector(`#decline_${uuid}_btn`).onclick = () => {
            if (onDecline != null) {
                onDecline(this.invitation)
            }
            this.deleteMe()
        }
    }

    setRevokeButton(onRevoke) {
        this.innerHtml = ""
        let range = document.createRange()
        let uuid = uuidv4()
        this.appendChild(range.createContextualFragment(`<paper-button style="font-size:.85em; width: 20px; align-self: flex-end;" id="revoke_${uuid}_btn">Revoke</paper-button>`))

        this.querySelector(`#revoke_${uuid}_btn`).onclick = () => {
            if (onRevoke != null) {
                onRevoke(this.invitation)
            }
            this.deleteMe()
        }
    }
}


customElements.define('globular-conversation-invitation-card', InvitationCard)



/**
 * Display a Like or Dislike button.
 */
export class LikeDisLikeBtn extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.icon = this.getAttribute("icon")

        // The onclick event listener...
        this.onclick = null;
        let id = "_" + uuidv4()

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            .like-dislike-btn{
                --iron-icon-fill-color:var(--palette-text-primary);
                width: 18px; 
                height: 18px;
            }

            paper-badge {
                --paper-badge-background: var(--palette-primary-accent);
                --paper-badge-width: 16px;
                --paper-badge-height: 16px;
                --paper-badge-margin-left: 10px;
            }

            paper-card {
                display: flex;
                flex-direction: column;
                position: absolute;
                padding: 2px;
                max-width: 100px;
               
            }

            .liker-unliker-lst {
                transition: background 1.2s ease,padding 0.8s linear;
                display:inline-block;
                padding: 2px;
                font-size: .85rem;
            }

        </style>

        <div class="btn" id="${id}_btn">
            <iron-icon class="like-dislike-btn" icon="${this.icon}"></iron-icon>
            <paper-ripple class="circle" recenters=""></paper-ripple>
            <paper-badge  id="${id}_count" style="display: none;" for="${id}_btn"></paper-badge>
        </div>
        <paper-card  id="${id}_card" style="display: none;">
        </paper-card>
        `
        this.badge = this.shadowRoot.querySelector(`#${id}_count`)
        this.btn = this.shadowRoot.querySelector(`#${id}_btn`)
        this.card = this.shadowRoot.querySelector(`#${id}_card`)

        this.btn.onmouseover = () => {
            if (this.card.children.length == 0) {
                return
            }
            this.card.style.display = "flex"
            document.body.appendChild(this.card)
            let coord = getCoords(this.btn)
            this.card.style.maxWidth = "150px"
            this.card.style.fontSize = ".85rem"
            this.card.style.padding = "3px"
            this.card.style.top = coord.top + this.btn.offsetHeight + 5 + "px"
            this.card.style.left = coord.left + 5 + "px"

        }

        this.btn.onmouseout = () => {
            this.card.style.display = "none"
            this.shadowRoot.appendChild(this.card)
        }
    }

    setAccounts(accounts) {

        this.card.innerHTML = ""
        this.card.style.display = "none"

        if (accounts.length > 0) {
            this.badge.label = accounts.length;
            this.badge.style.display = "block"
            window.dispatchEvent(new Event('resize'));

            accounts.forEach(a => {
                Account.getAccount(a, account => {
                    let div = document.createElement("div");
                    div.className = "liker-unliker-lst"
                    div.innerHTML = `<span style="padding-right: 2px;">${account.firstName}</span><span>${account.lastName}</span>`
                    this.card.appendChild(div)
                }, err => { ApplicationView.displayMessage(err, 3000) })
            })
        } else {
            this.badge.style.display = "none"
        }
    }

}

customElements.define('globular-like-dislike-btn', LikeDisLikeBtn)

/**
 * Display a message inside a div.
 */
export class GlobularMessagePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(msg, account) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = null
        if (account != null) {
            this.setAccount(this.account = account)
        }


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            .btn{
                display: flex; 
                width: 32px; 
                height: 32px; 
                justify-content: center; 
                align-items: center;
                position: relative;
            }
          
            .btn:hover{
                cursor: pointer;
            }
          
            .btn iron-icon{
                flex-grow: 1; 
                --iron-icon-fill-color:var(--palette-text-primary);
                width: 18px; 
                height: 18px;
            }

            .conversation-message{
                position: relative;
                display: flex;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                border: 2px solid var(--palette-divider);
                border-radius: 10px;
            }

            .conversation-message .body{
                padding: 10px;
                font-size: 1rem;
            }

            .conversation-participant-info{
                position: absolute;
                top: -16px;
            }

            .conversation-participant-img{
                width: 32px;
                height: 32px;
                border-radius: 16px;
                border: 1px solid transparent;
            }

            .conversation-participant-ico{
                width: 32px;
                height: 32px;
                border-radius: 16px;
                border: 1px solid transparent;
            }

            .conversation-message-infos{
                display: flex;
                font-size: .85rem;
                padding: 3px;
            }

            .conversation-message-actions{
                display: flex;
                flex-grow: 1;
            }
        </style>
        `

        this.msg = null
        if (msg != null) {
            this.setMessage(msg)
        }


        // Now I will set the account info...
        let participantInfos = this.shadowRoot.querySelector(".conversation-participant-info");

        // Now the like/dislike button...
        if (this.account.id != this.msg.getAuthor()) {
            let likeBtn = this.shadowRoot.querySelector(`#like-btn-${msg.getUuid().split("/").join("_")}`)
            likeBtn.onclick = () => {
                ConversationManager.likeIt(this.msg.getConversation(), this.msg.getUuid().split("/").join("_"), this.account.id, () => { }, err => { ApplicationView.displayMessage(err, 3000) })
            }

            let dislikeBtn = this.shadowRoot.querySelector(`#dislike-btn-${msg.getUuid().split("/").join("_")}`)
            dislikeBtn.onclick = () => {
                ConversationManager.dislikeIt(this.msg.getConversation(), this.msg.getUuid().split("/").join("_"), this.account.id, () => { }, err => { ApplicationView.displayMessage(err, 3000) })
            }
        }

        // Display author info if it's somone-else than the current author...
        Account.getAccount(msg.getAuthor(),
            (author) => {
                /** Retreive the image and account informations */
                if (this.account.id == author.id) {
                    participantInfos.parentNode.style.borderTopRightRadius = "0px";
                } else {
                    participantInfos.style.display = "flex"

                    let img = participantInfos.querySelector(".conversation-participant-img")
                    let ico = participantInfos.querySelector(".conversation-participant-ico")

                    participantInfos.parentNode.style.borderTopLeftRadius = "0px";
                    participantInfos.style.left = "-38px"

                    // Set the ico.
                    if (author.profilPicture != undefined) {
                        ico.style.display = "none"
                        img.style.display = "block"
                        img.src = author.profilPicture
                    } else {
                        ico.style.display = "block"
                        img.style.display = "none"
                    }

                    // Now the tool tip...
                    participantInfos.querySelector(`#msg_uuid_${msg.getUuid().split("/").join("_")}_tooltip`);
                }
            },
            (err) => {

            })
    }

    setMessage(msg) {
        this.msg = msg
        this.id = "_" + msg.getUuid().split("/").join("_")
        let txt = msg.getText()
        txt = txt.replace(new RegExp('\r?\n', 'g'), "<br />");
        txt = txt.replace(new RegExp('\t', 'g'), `<span "style='width: 2rem;'></span>`)
        let creationDate = new Date(msg.getCreationTime() * 1000)

        if (this.shadowRoot.querySelector(`#msg_uuid_${msg.getUuid().split("/").join("_")}`) == undefined) {
            let html = `
                <div id="msg_uuid_${msg.getUuid().split("/").join("_")}" style="display: flex; flex-direction: column; margin-top: 5px;">
                <div class="conversation-message">
                    <div id="msg_participant_${msg.getUuid().split("/").join("_")}" style="display: none;" class="conversation-participant-info">
                        <img class="conversation-participant-img" style="display: none;"></img>
                        <iron-icon class="conversation-participant-ico" icon="account-circle" style="display: none;"></iron-icon>
                        <paper-tooltip for="msg_participant_${msg.getUuid().split("/").join("_")}" style="font-size: 10pt;" role="tooltip" tabindex="-1">${msg.getAuthor()}</paper-tooltip>
                    </div>
                    <div class="body">
                        ${txt}
                    </div>
                    <paper-tooltip for="msg_body_${msg.getUuid().split("/").join("_")}" style="font-size: 10pt;" role="tooltip" tabindex="-1">${creationDate.toLocaleString()}</paper-tooltip>
                </div>
                <div class="conversation-message-infos">
                    <div class="conversation-message-actions">
                        <div class="btn">
                            <iron-icon  id="reply-btn-${msg.getUuid().split("/").join("_")}" icon="reply"></iron-icon>
                            <paper-ripple class="circle" recenters=""></paper-ripple>
                            </div>
                        
                        <globular-like-dislike-btn class="btn" id="like-btn-${msg.getUuid().split("/").join("_")}" icon="thumb-up"></globular-like-dislike-btn>
                        <globular-like-dislike-btn class="btn" id="dislike-btn-${msg.getUuid().split("/").join("_")}" icon="thumb-down"></globular-like-dislike-btn>

                    </div>
                    <span>
                        ${creationDate.toLocaleString()}
                    </span>
                </div>
                <globular-messages-list style="display: none;" id="replies-${msg.getUuid().split("/").join("_")}"></globular-messages-list>
            </div>
            `
            // append the fragment.
            this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        } else {
            this.shadowRoot.querySelector(".body").innerHTML = txt;
        }

        let likeBtn = this.shadowRoot.querySelector(`#like-btn-${msg.getUuid().split("/").join("_")}`)
        let dislikeBtn = this.shadowRoot.querySelector(`#dislike-btn-${msg.getUuid().split("/").join("_")}`)
        let replyBtn = this.shadowRoot.querySelector(`#reply-btn-${msg.getUuid().split("/").join("_")}`)

        if (replyBtn != null) {
            if (this.account.id == msg.getAuthor()) {
                replyBtn.parentNode.removeChild(replyBtn)
            } else {
                // Now the reply button...
                replyBtn.onclick = () => { this.reply() }
            }
        }

        // Set likes and dislike list.
        likeBtn.setAccounts(msg.getLikesList())
        dislikeBtn.setAccounts(msg.getDislikesList())


        this.replies = this.shadowRoot.querySelector(`#replies-${msg.getUuid().split("/").join("_")}`)
        this.replies.setAccount(this.account)

    }

    reply() {
        Model.eventHub.publish("__answer_message_evt__", this.msg, true)
    }

    appendReply(msg) {
        this.replies.appendMessage(msg)
        this.replies.style.display = "block"
    }

    setAccount(account) {
        this.account = account;
    }

    // Return div where the message live in...
    getMessageDiv() {
        return this.shadowRoot.querySelector(`#msg_uuid_${this.msg.getUuid().split("/").join("_")}`)
    }

    getAccountDiv() {
        return this.shadowRoot.querySelector(`#msg_participant_${this.msg.getUuid().split("/").join("_")}`)
    }
}

customElements.define('globular-message-panel', GlobularMessagePanel)