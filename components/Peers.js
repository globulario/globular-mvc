import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddPeerActionsRqst, Peer, RegisterPeerRqst, RemovePeerActionRqst } from 'globular-web-client/resource/resource_pb';
import { getAllPeersInfo } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
import { SearchableList } from './List.js'
import { GetAllActionsRequest } from 'globular-web-client/services_manager/services_manager_pb';

export class PeersManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
             <style>
                 ${theme}

                #create-peer-btn{
                    top: -42px;
                    right: 0px;
                    position: absolute;
                 }

                 #container{
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    min-width: 500px;
                 }

                 .card-content {
                    min-width: 680px;
                    max-width: 680px;
                    padding: 0px;
                }
     
                @media only screen and (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media only screen and (max-width: 600px) {
                    .card-content{
                      min-width: 380px;
                    }
                  }

                  #create-peer-card{
                    width: 400px;
                    right: 0px;
                    position: absolute;
                  }
          
             </style>
             <div id="container">
                <paper-card>
                    <div class="card-content">
                    </div>
                </paper-card>
                <paper-icon-button icon="add" id="create-peer-btn"></paper-icon-button>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let displayPeers = () => {
            content.innerHTML = ""
            // Here I will get the list of all peers.
            getAllPeersInfo(Model.globular,
                (peers) => {
                    // sort by status
                    peers.sort((a, b) => {
                        a.getState() - b.getState()
                    })

                    peers.forEach(p => {
                        let panel = new PeerPanel(p)
                        content.appendChild(panel)

                    })
                }, err => {
                    console.log("no peers found")
                    ApplicationView.displayMessage(err, 3000)
                })
        }

        // Here I will display the create peer card.
        this.shadowRoot.querySelector("#create-peer-btn").onclick = () => {
            let panel = this.shadowRoot.querySelector("#create-peer-card")
            if (panel != null) {
                setTimeout(() => {
                    panel.querySelector("paper-input").focus()
                }, 100)
                return
            }

            let html = `
            <paper-card id="create-peer-card">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Send a connection request to peer at domain
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div style="display: flex; flex-direction: column; padding: 10px;">
                    <paper-input id="peer-address-input" title="connect with peer at address"  label="address"></paper-input>
                    <paper-button id="create-peer-connection-btn" style="align-self: end;">Create</paper-button>
                </div>
            </paper-card>
            `

            // The query selector.
            container.appendChild(document.createRange().createContextualFragment(html))
            panel = this.shadowRoot.querySelector("#create-peer-card")

            // Now the actions.
            let closeBtn = panel.querySelector("#cancel-btn")
            closeBtn.onclick = () => {
                panel.parentNode.removeChild(panel)
            }

            let createPeerConnectionBtn = panel.querySelector("#create-peer-connection-btn")
            createPeerConnectionBtn.onclick = () => {
                let peer = new Peer
                // the hostname.domain:port
                let address = panel.querySelector("#peer-address-input").value
                peer.setAddress(address)
                let rqst = new RegisterPeerRqst
                rqst.setPeer(peer)

                Model.globular.resourceService.registerPeer(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(() => {
                        console.log("peer was register")
                    })
                    .catch(err => ApplicationView.displayMessage(err))
            }

            let input = panel.querySelector("paper-input")
            setTimeout(() => {
                input.focus()
            }, 100)

        }

        // call once
        displayPeers()

        Model.globular.eventHub.subscribe("refresh_peer_evt", uuid => { }, evt => {
            displayPeers()
        }, true)

    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-peer-manager', PeersManager)


/**
 * Display each peers
 */
export class PeerPanel extends HTMLElement {
    // attributes.
    // Create the applicaiton view.
    constructor(peer) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep group informations.
        this.peer = peer;

        let address = this.peer.getDomain()
        if (this.peer.getAddress().length > 0) {
            if (this.peer.getAddress().indexOf(":") > 0) {
                address += ":" + this.peer.getAddress().split(":")[1]
            }
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .header{
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .header:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .title{
                padding-left: 20px;
                flex-grow: 1;
                color: var(--palette-text-primary);
            }
            a:visited {
                color: var(--palette-text-primary);
                background-color: transparent;
                text-decoration: none;
            }

            .state{
                padding-right: 20px;
            }

            .state-pending{
                color: var(--palette-error-main);
            }

            .state-rejected{
                color: var(--palette-secondary-main);
            }

            .state-accepted{
                color: var(--palette-success-main);
            }

            .card-content{
                overflow-y: auto;
                min-width: 400px;
                max-height: 260px;
                overflow-y: auto;
            }

            .peer-card-content {
                display: table;
                border-spacing: 30px 10px;
                border-collapse: separate;
            }

            .peer-card-content .row {
                display: table-row;
            }

            .peer-card-content .cell {
                display: table-cell;
            }

        </style>
        <div id="container">
            <div class="header">
                <a class="title">${this.peer.getHostname()}</a>
                <span class="state state-${this.getState()}">${this.getState()}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="unfold-more"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapse-panel"  style="width: 90%;" >
                <div style="display: flex; flex-direction: column;">
                    <div class="peer-card-content">
                        <div class="row">
                            <div class="cell label">Mac Address</div>
                            <div class="cell value">${this.peer.getMac()}</div>
                        </div>
                        <div class="row">
                            <div class="cell label">address</div>
                            <div class="cell value">${this.peer.getAddress()}</div>
                        </div>
                        <div class="row">
                            <div class="cell label">domain</div>
                            <div class="cell value">${this.peer.getDomain()}</div>
                        </div>
                        <div class="row">
                            <div class="cell label">public IP</div>
                            <div class="cell value">${this.peer.getExternalIpAddress()}</div>
                        </div>
                        <div class="row">
                            <div class="cell label">local IP</div>
                            <div class="cell value">${this.peer.getLocalIpAddress()}</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: end;">
                        <paper-button title="accept a peer." id="accept-peer-btn">
                            Accept
                        </paper-button>
                        <paper-button title="keep a peer in a black list until it be deleted." id="reject-peer-btn" >
                            Reject
                        </paper-button>
                        <paper-button title="delete a peer from the peer list, it also delete keys and permissions associated with that peer." id="delete-peer-btn" >
                            Delete
                        </paper-button>
                    </div>
                </div>
            </iron-collapse>
        </div>
        `

        let lnk = this.shadowRoot.querySelector(".title")
        lnk.href = 'http://' + address + "/console"
        lnk.target = "_blank"

        let content = this.shadowRoot.querySelector("#collapse-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        let deleteBtn = this.shadowRoot.querySelector("#delete-peer-btn")
        deleteBtn.onclick = () => {
            this.onDeletePeer(peer)
        }

        let rejectBtn = this.shadowRoot.querySelector("#reject-peer-btn")
        rejectBtn.onclick = () => {
            this.onRejectPeer(peer)
        }

        let acceptBtn = this.shadowRoot.querySelector("#accept-peer-btn")
        acceptBtn.onclick = () => {
            this.onAcceptPeer(peer)
        }

        // Here I will set the button state.
        if (this.peer.getState() == 0) {
            deleteBtn.style.display = "none"
            rejectBtn.style.display = "block"
            acceptBtn.style.display = "block"
        } else if (this.peer.getState() == 1) {
            deleteBtn.style.display = "block"
            rejectBtn.style.display = "none"
            acceptBtn.style.display = "none"
        } else if (this.peer.getState() == 2) {
            deleteBtn.style.display = "block"
            rejectBtn.style.display = "none"
            acceptBtn.style.display = "none"
        }


        // Here I will create the searchable actions list.
        let actionsList = new SearchableList("Actions", this.peer.getActionsList(),
            (action) => {
                // remove action...
                let removeActionRqst = new RemovePeerActionRqst
                removeActionRqst.setAction(action)
                removeActionRqst.setRoleid(peer.getId())
                Model.globular.resourceService.removePeerAction(removeActionRqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        actionsList.removeItem(action)
                        ApplicationView.displayMessage("Action " + action + " was removed from peer " + peer.getId(), 3000)
                    }).catch(err => {
                        console.log(err)
                        ApplicationView.displayMessage(err, 3000)
                    })

            },
            (action) => {
                ApplicationView.displayMessage("Action " + action + " was added to peer " + peer.getId(), 3000)
            },
            (actions) => {

                // Now I will get the list of all actions install on the server.
                let getAllActionsRqst = new GetAllActionsRequest
                Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        console.log(rsp.getActionsList())
                        let actions_ = rsp.getActionsList()
                        actions.forEach(a => {
                            actions_.splice(actions_.indexOf(a), 1);
                        });

                        // sort the array.
                        actions_.sort()

                        let html = `
                        <style>
                            ${theme}
                            #add-peer-action-panel{
                                position: absolute;
                                right: 0px;
                                z-index: 1;
                            }
                        </style>
                        <paper-card id="add-peer-action-panel">
                            <div style="display: flex; align-items: center;">
                                <div style="flex-grow: 1; padding: 5px;">
                                    Add Action
                                </div>
                                <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                            </div>
                            <div class="card-content">
                            </div>
                        </paper-card>
                        `

                        let headerDiv = actionsList.getHeader()
                        let panel = headerDiv.querySelector("#add-peer-action-panel")

                        if (panel == undefined) {
                            headerDiv.appendChild(document.createRange().createContextualFragment(html))
                            panel = headerDiv.querySelector("#add-peer-action-panel")
                            panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                            let closeBtn = panel.querySelector("#cancel-btn")
                            closeBtn.onclick = () => {
                                panel.parentNode.removeChild(panel)
                            }

                            actions_.forEach(a => {

                                let html = `
                                <div class="item-div" style="">
                                    <span style="flex-grow: 1;">${a}</span>
                                    <paper-icon-button id="add-action-btn" icon="add" peer="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                                </div>
                                `
                                let content = panel.querySelector(".card-content")
                                content.appendChild(document.createRange().createContextualFragment(html))
                                let actionDiv = content.children[content.children.length - 1]
                                let actionAddBtn = actionDiv.children[1]
                                actionAddBtn.onclick = () => {

                                    let rqst = new AddPeerActionsRqst
                                    rqst.setPeerid(peer.getId())
                                    rqst.setActionsList([a])
                                    Model.globular.resourceService.addPeerAction(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                                        .then(rsp => {

                                            actionDiv.parentNode.removeChild(actionDiv)
                                            actionsList.appendItem(a)

                                            // call the onadditem.
                                            actionsList.onadditem(a)
                                        }).catch(err => {
                                            ApplicationView.displayMessage(err, 3000)
                                        })

                                }

                            })
                        }


                    }).catch(err => {
                        console.log(err)
                        ApplicationView.displayMessage(err, 3000)
                    })
            })

        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }


    }

    getState() {
        if (this.peer.getState() == 0) {
            return "pending"
        } else if (this.peer.getState() == 1) {
            return "accepted"
        } else if (this.peer.getState() == 2) {
            return "rejected"
        }

        return ""
    }

    onAcceptPeer(peer) {
        console.log("accept peer ", peer)
    }

    onRejectPeer(peer) {
        console.log("reject peer ", peer)
    }

    onDeletePeer(peer) {
        let toast = ApplicationView.displayMessage(
            `
          <style>
            #yes-no-contact-delete-box{
              display: flex;
              flex-direction: column;
            }
    
            #yes-no-contact-delete-box globular-contact-card{
              padding-bottom: 10px;
            }
    
            #yes-no-contact-delete-box div{
              display: flex;
              font-size: 1rem;
              padding-bottom: 10px;
            }
    
            paper-button{
              font-size: .85rem;
              height: 32px;
            }
    
          </style>
          <div id="yes-no-contact-delete-box">
            <div>Your about to delete the peer ${peer.getHostname()}</div>
            <div>Is it what you want to do? </div>
            <div style="justify-content: flex-end;">
              <paper-button id="yes-delete-contact">Yes</paper-button>
              <paper-button id="no-delete-contact">No</paper-button>
            </div>
          </div>
          `,
            15000 // 15 sec...
        );

        let yesBtn = document.querySelector("#yes-delete-contact")
        let noBtn = document.querySelector("#no-delete-contact")

        // On yes
        yesBtn.onclick = () => {

            let rqst = new DeleteRoleRqst
            rqst.setRoleid(peer.getId())
            Model.globular.resourceService.deleteRole(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
                ApplicationView.displayMessage(
                    "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Role named " +
                    peer.getName() +
                    " was deleted!</div>",
                    3000
                );
                Model.globular.eventHub.publish("refresh_peer_evt", {}, true)
                toast.dismiss();
            }).catch(e => {
                ApplicationView.displayMessage(e, 3000)
                toast.dismiss();
            })

        }

        noBtn.onclick = () => {
            toast.dismiss();
        }
    }
}

customElements.define('globular-peer-panel', PeerPanel)