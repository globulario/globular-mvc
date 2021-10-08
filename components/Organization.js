import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddOrganizationAccountRqst, CreateOrganizationRqst, DeleteOrganizationRqst, GetOrganizationsRqst, Organization, RemoveOrganizationAccountRqst } from 'globular-web-client/resource/resource_pb';
import { ApplicationView } from '../ApplicationView';
import { SearchableAccountList } from './List.js'
import { Account } from '../Account';

function getAllOrganizations(callback, errorCallback) {
    let rqst = new GetOrganizationsRqst
    rqst.setQuery("{}")
    let organizations = [];

    let stream = Model.globular.resourceService.getOrganizations(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") });

    // Get the stream and set event on it...
    stream.on("data", (rsp) => {
        organizations = organizations.concat(rsp.getOrganizationsList());
    });

    stream.on("status", (status) => {
        if (status.code == 0) {
            callback(organizations);
        } else {
            errorCallback({ message: status.details });
        }
    });
}

export class OrganizationManager extends HTMLElement {
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

                #create-organization-btn{
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
          
             </style>
             <div id="container">
                <paper-card>
                    <div class="card-content">
                    </div>
                </paper-card>
                <paper-icon-button icon="add" id="create-organization-btn"></paper-icon-button>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let displayOrganizations = () => {
            content.innerHTML = ""
            // Here I will get the list of all Organizations.
            getAllOrganizations(
                (Organizations) => {
                    Organizations.forEach(g => {
                        if (g.getId() != "admin" && g.getId() != "guest") {
                            let panel = new OrganizationPanel(g)
                            content.appendChild(panel)
                        }
                    })
                }, err => { ApplicationView.displayMessage(err, 3000) })
        }

        // call once
        displayOrganizations()

        Model.globular.eventHub.subscribe("refresh_organization_evt", uuid => { }, evt => {
            displayOrganizations()
        }, true)

        let createOrganizationBtn = this.shadowRoot.querySelector("#create-organization-btn")
        createOrganizationBtn.onclick = () => {
            let html = `
            <style>
                ${theme}
                #create-organization-panel{
                    position: absolute;
                    right: 0px;
                    top: 0px;
                    z-index: 1;
                }
                #create-organization-panel .card-content{
                    min-width: 200px;
                    padding: 0px 10px 0px 10px;
                    display: flex;
                    flex-direction: column;
                }

            </style>
            <paper-card id="create-organization-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Create Organization
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-input></paper-input>
                    
                    <paper-button style="align-self: end;">Create</paper-button>
                </div>
            </paper-card>
            `

            let panel = container.querySelector("#create-organization-panel")
            let input = null
            if (panel == undefined) {
                container.appendChild(document.createRange().createContextualFragment(html))
                panel = container.querySelector("#create-organization-panel")
                let closeBtn = panel.querySelector("#cancel-btn")
                closeBtn.onclick = () => {
                    panel.parentNode.removeChild(panel)
                }

                input = panel.querySelector("paper-input")
                let createOrganizationButton = panel.querySelector("paper-button")

                // Create a new Organization.
                createOrganizationButton.onclick = () => {
                    let OrganizationId = input.value;
                    if (OrganizationId.length == 0) {
                        ApplicationView.displayMessage("No Organization name was given!", 3000)
                        setTimeout(() => {
                            input.focus()
                        }, 100)
                        return
                    }

                    let rqst = new CreateOrganizationRqst()
                    let organization = new Organization()
                    organization.setId(OrganizationId)
                    organization.setName(OrganizationId)

                    rqst.setOrganization(organization)
                    Model.globular.resourceService.createOrganization(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            ApplicationView.displayMessage("Organization " + OrganizationId + " was created!", 3000)
                            panel.parentNode.removeChild(panel)
                            displayOrganizations()
                        }).catch(err => {
                            console.log(err)
                            ApplicationView.displayMessage(err, 3000)
                            setTimeout(() => {
                                input.focus()
                            }, 100)
                        })

                }
            } else {
                input = panel.querySelector("paper-input")
            }

            setTimeout(() => {
                input.focus()
            }, 100)

        }


    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-organization-manager', OrganizationManager)


export class OrganizationPanel extends HTMLElement {
    // attributes.
    // Create the applicaiton view.
    constructor(o) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep Organization informations.
        this.organization = o;

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
                flex-grow: 1;
            }

        </style>
        <div id="container">
            <div class="header">
                <paper-icon-button id="delete-organization-btn" icon="delete"></paper-icon-button>
                <span class="title">${this.organization.getName()}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapase-panel" >

            </iron-collapse>
        </div>
        `

        let content = this.shadowRoot.querySelector("#collapase-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        let deleteBtn = this.shadowRoot.querySelector("#delete-organization-btn")
        deleteBtn.onclick = () => {
            this.onDeleteOrganization(o)
        }

        // Now the account list.
        Account.getAccounts("{}",
            accounts => {

                // I will get the account object whit the given id.
                let list = []
                this.organization.getAccountsList().forEach(accountId => {
                    let a_ = accounts.find(a => a._id === accountId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let accountsList = new SearchableAccountList("Accounts", list, a => {
                    accountsList.removeItem(a)
                    let rqst = new RemoveOrganizationAccountRqst
                    rqst.setOrganizationid(o.getId())
                    rqst.setAccountid(a._id)
                    Model.globular.resourceService.removeOrganizationAccount(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            accountsList.removeItem(a)
                            ApplicationView.displayMessage("Account " + a._id + " was removed from Organization " + o.getName(), 3000)
                        }).catch(err => {
                            accountsList.appendItem(a) // set it back
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                    a => {
                        let rqst = new AddOrganizationAccountRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setAccountid(a._id)
                        Model.globular.resourceService.addOrganizationAccount(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                accountsList.appendItem(a)
                                ApplicationView.displayMessage("Account " + a._id + " has now Organization " + o.getName(), 3000)
                            }).catch(err => {
                                accountsList.removeItem(a)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })

                content.appendChild(accountsList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
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

    onDeleteOrganization(o) {
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
            <div>Your about to delete the Organization ${o.getName()}</div>
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

            let rqst = new DeleteOrganizationRqst
            rqst.setOrganization(o.getId())
            Model.globular.resourceService.deleteOrganization(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
                ApplicationView.displayMessage(
                    "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Organization named " +
                    o.getName() +
                    " was deleted!</div>",
                    3000
                );
                Model.globular.eventHub.publish("refresh_organization_evt", {}, true)
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

customElements.define('globular-organization-panel', OrganizationPanel)