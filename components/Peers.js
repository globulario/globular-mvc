import '@polymer/iron-icons/iron-icons.js';
import "@polymer/iron-icons/hardware-icons";
import * as GlobularWebClient from "globular-web-client";
import { Model } from '../Model';
import { AcceptPeerRqst, AddPeerActionsRqst, DeletePeerRqst, GetPeerApprovalStateRqst, GetPeersRqst, Peer, RegisterPeerRqst, RemovePeerActionRqst } from 'globular-web-client/resource/resource_pb';
import { getAllPeersInfo } from 'globular-web-client/api';
import { ApplicationView } from '../ApplicationView';
import { SearchableList } from './List.js'
import { GetAllActionsRequest } from 'globular-web-client/services_manager/services_manager_pb';

export function getPeerById(id, callback, errorCallback){
    let p_ = null
    getAllPeers(Model.globular, peers=>{
        peers.forEach(p=>{
            if(p.getMac() == id){
                p_ = p
            }
        })

        if(p_ != null){
            callback(p_)
            return
        }
        errorCallback("no peer found with id " + id)
    }, errorCallback)
}

export function getAllPeers(globule, callback, errorCallback) {
    let rqst = new GetPeersRqst
    rqst.setQuery("{}")
    let peers = [];

    let stream = globule.resourceService.getPeers(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") });

    // Get the stream and set event on it...
    stream.on("data", (rsp) => {
        peers = peers.concat(rsp.getPeersList());
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            callback(peers);
        } else {
            errorCallback({ message: status.details });
        }
    });
}


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
                
                paper-card{
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                }

                #create-peer-btn{
                    top: -42px;
                    right: 0px;
                    position: absolute;
                 }

                #container{
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                .card-content {
                    min-width: 728px;
                    padding: 0px;
                    font-size: 1rem;
                }
     
                @media (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media (max-width: 600px) {
                    .card-content{
                      min-width: 380px;
                    }
                  }

                  #create-peer-card{
                    width: 400px;
                    right: 0px;
                    position: absolute;
                    background-color: var(--palette-background-paper);
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

                // the hostname.domain:port
                let address = panel.querySelector("#peer-address-input").value
                // Here The peers must be both https or the peer at url must be https
                let url = location.protocol + "//" + address + "/config"
                let globule = new GlobularWebClient.Globular(url, () => {

                    let peer = new Peer
                    peer.setDomain(globule.domain)
                    peer.setProtocol(globule.config.Protocol)
                    peer.setPorthttp(globule.config.PortHttp)
                    peer.setPorthttps(globule.config.PortHttps)

                    let rqst = new RegisterPeerRqst
                    rqst.setPeer(peer)

                    Model.globular.resourceService.registerPeer(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(() => {

                            if (location.protocol == "https:") {
                                if (peer.getProtocol() == "https") {
                                    Model.globules.set("https://" + peer.getDomain() + ":" + peer.getPorthttps(), globule)
                                } else {
                                    ApplicationView.displayMessage("fail to access peer with http protocol from https " + peer.getDomain(), 3000)
                                }
                            } else {
                                // Set http address
                                Model.globules.set("http://" + peer.getDomain() + ":" + peer.getPorthttp(), globule)
                            }

                            // Also keep the given address from the input.
                            Model.globules.set(url, globule)

                            panel.parentNode.removeChild(panel)
                        })
                        .catch(err => {
                            console.log(err)
                            ApplicationView.displayMessage(err, 3000)
                        })

                }, (err) => {
                    ApplicationView.displayMessage(err, 3000)
                })

            }

            let input = panel.querySelector("paper-input")
            setTimeout(() => {
                input.focus()
            }, 100)

        }

        // call once
        displayPeers()

        Model.globular.eventHub.subscribe("update_peers_evt", uuid => { }, evt => {
            displayPeers()
        }, false)

        Model.globular.eventHub.subscribe("delete_peer_evt", uuid => { }, evt => {
            displayPeers()
        }, false)

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

        let address = peer.getDomain()
        if (peer.getProtocol() == "https") {
            address += ":" + peer.getPorthttps()
        } else {
            address += ":" + peer.getPorthttp()
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
                background-color: var(--palette-background-paper);
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
                padding-left: 10px;
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
                padding-left: 10px;
            }

            .state-pending{
                color: var(--palette-error-main);
            }

            .state-rejected .state-deleted{
                color: var(--palette-secondary-main);
            }

            .state-unreachable{
                color: var(--palette-error-dark);
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

            #actions-lst{
                padding-left: 30px;
                padding-right: 30px;
                padding-bottom: 10px;
            }

            #content {
                margin: 10px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

        </style>
        <div id="container">
            <div class="header">
                <iron-icon style="padding: 10px;" icon="hardware:computer"></iron-icon>
                <a class="title">${this.peer.getHostname()}</a>
                <span id="approval-state-span" class="state"></span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="unfold-more"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapse-panel"  style="width: 100%;" >
                <div id="content" style="display: flex; flex-direction: column;">
                    <div class="peer-card-content">
                        <div class="row">
                            <div class="cell label">Mac Address</div>
                            <div class="cell value">${this.peer.getMac()}</div>
                        </div>
                        <div class="row">
                            <div class="cell label">address</div>
                            <div class="cell value">${address}</div>
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
                    <div id="actions-lst">
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
        if (peer.getProtocol() == "https") {
            if (peer.getPorthttps() != 443) {
                lnk.href = peer.getProtocol() + '://' + peer.getDomain() + ":" + peer.getPorthttps() + "/console"
            } else {
                lnk.href = peer.getProtocol() + '://' + peer.getDomain() + "/console"
            }

        } else {
            if (peer.getPorthttp() != 80) {
                lnk.href = peer.getProtocol() + '://' + peer.getDomain() + ":" + peer.getPorthttp() + "/console"
            } else {
                lnk.href = peer.getProtocol() + '://' + peer.getDomain() + "/console"
            }
        }

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

        // get the remote state for this peers.
        this.getRemoteState((remote_state) => {
            let state = 0
            let stateSpan = this.shadowRoot.querySelector("#approval-state-span")

            if (remote_state != 0) {
                if (remote_state == -1) {
                    state = "unreachable"
                    stateSpan.innerHTML = "unreachable"
                    stateSpan.className = "state state-unreachable"
                } else {
                    if (this.peer.getState() == 1 && remote_state == 1) {
                        state = 1
                    }
                    if (this.peer.getState() == 2 || remote_state == 2) {
                        state = 2
                    }

                    stateSpan.innerHTML = this.getState(state)

                    if (this.peer.getState() == 0) {
                        stateSpan.innerHTML += " require your approbation"
                    }


                }

            } else {
                stateSpan.innerHTML += " wait for approbation"
            }

            stateSpan.className = "state state-" + this.getState(state)

            // Here I will set the button

            if (remote_state == -1) {
                deleteBtn.style.display = "block"
                rejectBtn.style.display = "none"
                acceptBtn.style.display = "none"
            } else if (this.peer.getState() == 0) {
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



        })




        // Here I will create the searchable actions list.
        let actionsList = new SearchableList("Actions", this.peer.getActionsList(),
            (action) => {
                // remove action...
                let removeActionRqst = new RemovePeerActionRqst
                removeActionRqst.setAction(action)
                removeActionRqst.setRoleid(peer.getId())
                Model.globular.resourceService.removePeerAction(removeActionRqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        actionsList.removeItem(action)
                        ApplicationView.displayMessage("Action " + action + " was removed from peer " + peer.getId(), 3000)
                    }).catch(err => {
                        ApplicationView.displayMessage(err, 3000)
                    })

            },
            (action) => {
                ApplicationView.displayMessage("Action " + action + " was added to peer " + peer.getId(), 3000)
            },
            (actions) => {

                // Now I will get the list of all actions install on the server.
                let getAllActionsRqst = new GetAllActionsRequest
                Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        let actions_ = rsp.getActionsList()
                        actions.forEach(a => {
                            actions_.splice(actions_.indexOf(a), 1);
                        });

                        // sort the array.
                        actions_.sort()

                        let html = `
                        <style>
                           
                            #add-peer-action-panel{
                                position: absolute;
                                right: 0px;
                                z-index: 1;
                            }

                            paper-card{
                                background-color: var(--palette-background-paper);
                                color: var(--palette-text-primary);
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
                                    Model.globular.resourceService.addPeerAction(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
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
                        ApplicationView.displayMessage(err, 3000)
                    })
            })

        this.shadowRoot.querySelector("#actions-lst").appendChild(actionsList)

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

    getRemoteState(callback) {
        let rqst = new GetPeerApprovalStateRqst
        let address = this.peer.getDomain()
        if (this.peer.getProtocol() == "https") {
            address += ":" + this.peer.getPorthttps()
        } else {
            address += ":" + this.peer.getPorthttp()
        }

        rqst.setRemotePeerAddress(address)
        Model.globular.resourceService.getPeerApprovalState(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getState())
            })
            .catch((err) => {
                console.log("fail to get peer approval state with error ", err)
                callback(-1)
            })

    }


    getState(state) {
        if (state == 0) {
            return "pending"
        } else if (state == 1) {
            return "accepted"
        } else if (state == 2) {
            return "rejected"
        }
        return ""
    }

    onAcceptPeer(peer) {
        let rqst = new AcceptPeerRqst
        rqst.setPeer(peer)
        Model.globular.resourceService.acceptPeer(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                console.log(rsp)
            }).catch(err => ApplicationView.displayMessage(err, 3000))

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
              padding-bottom: 10px;
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

            let rqst = new DeletePeerRqst
            rqst.setPeer(peer)
            Model.globular.resourceService.deletePeer(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
                ApplicationView.displayMessage(
                    "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Peer with hostname " +
                    peer.getHostname() +
                    " was deleted!</div>",
                    3000
                );
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