import { theme } from './Theme';
import '@polymer/iron-icons/iron-icons.js';

import { Model } from '../Model';
import { AddOrganizationAccountRqst, AddOrganizationApplicationRqst, AddOrganizationGroupRqst, AddOrganizationRoleRqst, Application, CreateOrganizationRqst, DeleteOrganizationRqst, GetOrganizationsRqst, Organization, RemoveOrganizationAccountRqst, RemoveOrganizationApplicationRqst, RemoveOrganizationGroupRqst, RemoveOrganizationRoleRqst } from 'globular-web-client/resource/resource_pb';
import { ApplicationView } from '../ApplicationView';
import { SearchableAccountList, SearchableApplicationList, SearchableGroupList, SearchableRoleList } from './List.js'
import { Account } from '../Account';
import * as ApplicationTs from '../Application';
import { getAllGroups, getAllRoles } from 'globular-web-client/api';

export function getAllOrganizations(callback, errorCallback) {
    let rqst = new GetOrganizationsRqst
    rqst.setQuery("{}")
    let organizations = [];

    let stream = Model.globular.resourceService.getOrganizations(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") });

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

export function getOrganizationById(id, callback, errorCallback){
    let o_ = null
    getAllOrganizations(organizations=>{
        organizations.forEach(o=>{
            if(o.getId() == id){
                o_ = o
            }
        })

        if(o_ != null){
            callback(o_)
            return
        }
        errorCallback("no organization found with id " + id)
    }, errorCallback)
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
                    background-color: var(--palette-background-paper);
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
                    Model.globular.resourceService.createOrganization(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
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
                border-bottom: 1px solid var(--palette-background-default);
            }

            #content{
                padding-top: 15px;
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
                margin: 8px;
            }
            
                        
            #collapse-panel{
                display: flex;
                flex-direction: column;
                width: 90%;
            }

            img, iron-icon{
              margin: 8px;
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
            <iron-collapse id="collapse-panel"  style="width: 90%;" >
                <paper-tabs selected="0">
                    <paper-tab id="organization-accounts-tab">Accounts</paper-tab>
                    <paper-tab id="organization-applications-tab">Applications</paper-tab>
                    <paper-tab id="organization-roles-tab">Roles</paper-tab>
                    <paper-tab id="organization-groups-tab">Groups</paper-tab>
                </paper-tabs>
                <div id="content">
                </div>
            </iron-collapse>
        </div>
        `
        let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
        let content = this.shadowRoot.querySelector("#content")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")


        this.accountsList = null
        this.rolesList = null
        this.applicationsList = null
        this.groupsList = null


        this.shadowRoot.querySelector("#organization-applications-tab").onclick = () => {
            if (this.accountsList != undefined)
                this.accountsList.style.display = "none"
            if (this.rolesList != undefined)
                this.rolesList.style.display = "none"
            if (this.applicationsList != undefined)
                this.applicationsList.style.display = ""
            if (this.groupsList != undefined)
                this.groupsList.style.display = "none"
        }

        this.shadowRoot.querySelector("#organization-accounts-tab").onclick = () => {

            if (this.accountsList != undefined)
                this.accountsList.style.display = ""
            if (this.rolesList != undefined)
                this.rolesList.style.display = "none"
            if (this.applicationsList != undefined)
                this.applicationsList.style.display = "none"
            if (this.groupsList != undefined)
                this.groupsList.style.display = "none"
        }

        this.shadowRoot.querySelector("#organization-groups-tab").onclick = () => {

            if (this.accountsList != undefined)
                this.accountsList.style.display = "none"
            if (this.rolesList != undefined)
                this.rolesList.style.display = "none"
            if (this.applicationsList != undefined)
                this.applicationsList.style.display = "none"
            if (this.groupsList != undefined)
                this.groupsList.style.display = ""
        }

        this.shadowRoot.querySelector("#organization-roles-tab").onclick = () => {
            if (this.accountsList != undefined)
                this.accountsList.style.display = "none"
            if (this.rolesList != undefined)
                this.rolesList.style.display = ""
            if (this.applicationsList != undefined)
                this.applicationsList.style.display = "none"
            if (this.groupsList != undefined)
                this.groupsList.style.display = "none"
        }

        let deleteBtn = this.shadowRoot.querySelector("#delete-organization-btn")
        deleteBtn.onclick = () => {
            this.onDeleteOrganization(o)
        }

        // Account list.
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

                this.accountsList = new SearchableAccountList("Accounts", list, a => {
                    this.accountsList.removeItem(a)
                    let rqst = new RemoveOrganizationAccountRqst
                    rqst.setOrganizationid(o.getId())
                    rqst.setAccountid(a._id)
                    Model.globular.resourceService.removeOrganizationAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            this.accountsList.removeItem(a)
                            ApplicationView.displayMessage("Account " + a._id + " was removed from Organization " + o.getName(), 3000)
                        }).catch(err => {
                            this.accountsList.appendItem(a) // set it back
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                    a => {
                        let rqst = new AddOrganizationAccountRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setAccountid(a._id)
                        Model.globular.resourceService.addOrganizationAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.accountsList.appendItem(a)
                                ApplicationView.displayMessage("Account " + a._id + " has now Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.accountsList.removeItem(a)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })

                content.appendChild(this.accountsList)
                
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })

        // The applications list.
        ApplicationTs.Application.getAllApplicationInfo(
            applications => {

                // I will get the account object whit the given id.
                let list = []
                this.organization.getApplicationsList().forEach(applicationId => {
                    let a_ = applications.find(a => a.getId() === applicationId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                this.applicationsList = new SearchableApplicationList("Applications", list, a => {
                    this.applicationsList.removeItem(a)
                    let rqst = new RemoveOrganizationApplicationRqst
                    rqst.setOrganizationid(o.getId())
                    rqst.setApplicationid(a.getId())
                    Model.globular.resourceService.removeOrganizationApplication(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                        .then(rsp => {
                            this.applicationsList.removeItem(a)
                            ApplicationView.displayMessage("Application " + a.getAlias() + " was removed from Organization " + o.getName(), 3000)
                        }).catch(err => {
                            this.applicationsList.appendItem(a) // set it back
                            ApplicationView.displayMessage(err, 3000)
                        })
                },
                    a => {
                        let rqst = new AddOrganizationApplicationRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setApplicationid(a.getId())
                        Model.globular.resourceService.addOrganizationApplication(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.applicationsList.appendItem(a)
                                ApplicationView.displayMessage("Application " + a.getAlias() + " has now Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.applicationsList.removeItem(a)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })

                content.appendChild(this.applicationsList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })

        // The role list.
        getAllRoles(Model.globular,
            roles => {

                // I will get the account object whit the given id.
                let list = []
                this.organization.getRolesList().forEach(roleId => {
                    let r_ = roles.find(r => r.getId() === roleId);
                    if (r_ != undefined) {
                        list.push(r_)
                    }
                })

                this.rolesList = new SearchableRoleList("Roles", list,
                    r => {
                        this.rolesList.removeItem(r)
                        let rqst = new RemoveOrganizationRoleRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setRoleid(r.getId())
                        Model.globular.resourceService.removeOrganizationRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.rolesList.removeItem(r)
                                ApplicationView.displayMessage("Role " + r.getName() + " was removed from Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.rolesList.appendItem(r) // set it back
                                ApplicationView.displayMessage(err, 3000)
                            })
                    },
                    r => {
                        let rqst = new AddOrganizationRoleRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setRoleid(r.getId())
                        Model.globular.resourceService.addOrganizationRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.rolesList.appendItem(r)
                                ApplicationView.displayMessage("Role " + r.getName() + " has now Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.rolesList.removeItem(r)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })
                content.appendChild(this.rolesList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })


        // The applications list.
        getAllGroups(Model.globular,
            groups => {

                // I will get the account object whit the given id.
                let list = []
                this.organization.getGroupsList().forEach(groupId => {
                    let g_ = groups.find(g => g.getId() === groupId);
                    if (g_ != undefined) {
                        list.push(g_)
                    }
                })

                this.groupsList = new SearchableGroupList("Groups", list,
                    g => {
                        this.groupsList.removeItem(g)
                        let rqst = new RemoveOrganizationGroupRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setGroupid(g.getId())
                        Model.globular.resourceService.removeOrganizationGroup(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.groupsList.removeItem(g)
                                ApplicationView.displayMessage("Group " + g.getName() + " was removed from Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.groupsList.appendItem(g) // set it back
                                ApplicationView.displayMessage(err, 3000)
                            })
                    },
                    g => {
                        let rqst = new AddOrganizationGroupRqst
                        rqst.setOrganizationid(o.getId())
                        rqst.setGroupid(g.getId())
                        Model.globular.resourceService.addOrganizationGroup(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                this.groupsList.appendItem(g)
                                ApplicationView.displayMessage("Group " + g.getName() + " has now Organization " + o.getName(), 3000)
                            }).catch(err => {
                                this.groupsList.removeItem(g)
                                ApplicationView.displayMessage(err, 3000)
                            })

                    })
                content.appendChild(this.groupsList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })

        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && togglePanel) {
                if (!togglePanel.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                togglePanel.toggle();
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
            Model.globular.resourceService.deleteOrganization(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
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

    connectedCallback(){
        this.shadowRoot.querySelector("#organization-accounts-tab").click()
    }
}

customElements.define('globular-organization-panel', OrganizationPanel)