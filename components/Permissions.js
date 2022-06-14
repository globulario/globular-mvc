import { Model } from "../Model";
import { getTheme } from "./Theme";
import { v4 as uuidv4 } from "uuid";
import { GetActionResourceInfosRqst, GetResourcePermissionsRqst, Permission, SetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { Account } from "../Account";
import { ApplicationView } from "../ApplicationView";
import { SearchableAccountList, SearchableApplicationList, SearchableGroupList, SearchableOrganizationList } from "./List.js";
import { getAllApplicationsInfo, getAllGroups } from "globular-web-client/api";
import { randomUUID } from "./utility";
import { getAllOrganizations, getOrganizationById } from "./Organization";
import { GetAllActionsRequest } from "globular-web-client/services_manager/services_manager_pb";
import { Application } from "../Application";
import { Group } from "../Group";
import '@polymer/iron-icons/av-icons'

// This function return the list of all possible permission name from the server... it a little bit slow...
// so for the moment I will simply use static values read, write and delete.
function getPermissionNames(callbak, errorCallback) {
    let permissionsNames = []
    let getAllActionsRqst = new GetAllActionsRequest
    Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let actions = rsp.getActionsList()
            let index = 0;
            actions.forEach(a => {
                let rqst_ = new GetActionResourceInfosRqst
                rqst_.setAction(a)
                Model.globular.rbacService.getActionResourceInfos(rqst_, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        let infos = rsp.getInfosList()
                        infos.forEach(info => {
                            let p = info.getPermission()
                            if (permissionsNames.indexOf(p) == -1) {
                                permissionsNames.push(p)
                            }
                        })

                        index++
                        if (index == actions.length) {
                            callbak(permissionsNames)
                        }

                    }).catch(e => {
                        errorCallback(e)
                    })

            })
        })
}

/**
 * Sample empty component
 */
export class PermissionsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // the active permissions.
        this.permissions = null

        // the active path.
        this.path = ""

        // The listener
        this.savePermissionListener = ""

        // Keep the list of possible permissions.
        this.permissionsNames = ["read", "write", "delete"]

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
            }

            #header {
                display: flex;
            }

            .title{
                align-items: center;
                display: flex;
                flex-grow: 1;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
            }

            .permissions{
                padding: 10px;
            }

        </style>
        <div id="container">
            <div id="header">
                <div id="path" class="title"> </div>
                <paper-icon-button icon="close"></paper-icon-button>
                
            </div>
            <globular-permissions-viewer style="padding-bottom: 20px;"></globular-permissions-viewer>
            <div>
                <div  class="title">
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="owner-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                    Owner(s)
                </div>
                <iron-collapse class="permissions" id="owner">
                
                </iron-collapse>
            </div>
            <div>
                <div style="display: flex; position: relative;">
                    <div class="title" style="flex-grow: 1;">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="allowed-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                        Allowed(s)
                    </div>
                    <paper-icon-button  id="add-allowed-btn" icon="icons:add"></paper-icon-button>
                </div>
                <iron-collapse class="permissions" id="allowed">
                
                </iron-collapse>
            </div>
            <div>
                <div style="display: flex; position: relative;">
                    <div class="title" style="flex-grow: 1;">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="denied-collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                        Denied(s)
                    </div>
                    <paper-icon-button id="add-denied-btn" icon="icons:add"></paper-icon-button>
                </div>
                <iron-collapse class="permissions" id="denied">
                
                </iron-collapse>
            </div>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.permissionsViewer = this.shadowRoot.querySelector("globular-permissions-viewer")
        this.pathDiv = this.shadowRoot.querySelector("#path")
        this.style.overflowY = "auto"

        // The tree sections.
        this.owners = this.shadowRoot.querySelector("#owner")
        this.alloweds = this.shadowRoot.querySelector("#allowed")
        this.denieds = this.shadowRoot.querySelector("#denied")

        // Now the collapse panels...
        this.owners_collapse_btn = this.shadowRoot.querySelector("#owner-collapse-btn")
        this.owners_collapse_btn.onclick = () => {
            if (!this.owners.opened) {
                this.owners_collapse_btn.icon = "unfold-more"
            } else {
                this.owners_collapse_btn.icon = "unfold-less"
            }
            this.owners.toggle();
        }

        this.alloweds_collapse_btn = this.shadowRoot.querySelector("#allowed-collapse-btn")
        this.alloweds_collapse_btn.onclick = () => {
            if (!this.alloweds.opened) {
                this.alloweds_collapse_btn.icon = "unfold-more"
            } else {
                this.alloweds_collapse_btn.icon = "unfold-less"
            }
            this.alloweds.toggle();
        }

        this.denieds_collapse_btn = this.shadowRoot.querySelector("#denied-collapse-btn")
        this.denieds_collapse_btn.onclick = () => {
            if (!this.denieds.opened) {
                this.denieds_collapse_btn.icon = "unfold-more"
            } else {
                this.denieds_collapse_btn.icon = "unfold-less"
            }
            this.denieds.toggle();
        }

        this.addDeniedBtn = this.shadowRoot.querySelector("#add-denied-btn")
        this.addDeniedBtn.onclick = () => {
            this.addPermission(this.addDeniedBtn, "denied")
        }

        this.addAllowedBtn = this.shadowRoot.querySelector("#add-allowed-btn")
        this.addAllowedBtn.onclick = () => {
            this.addPermission(this.addAllowedBtn, "allowed")
        }


        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            // remove it from it parent.
            this.parentNode.removeChild(this)
        }

    }

    // Add the list of available permissions.
    addPermission(parent, type) {

        let addPermissionPanel = parent.parentNode.querySelector("#add-permission-panel")

        if (addPermissionPanel == null && this.permissionsNames.length > 0) {
            let html = `
            <style>
                ${getTheme()}
                #add-permission-panel{
                    position: absolute;
                    right: 20px;
                    top: ${parent.offsetTop + 20}px;
                    z-index: 100;
                }

                .card-content{
                    overflow-y: auto;
                    min-width: 200px;
                }

            </style>
            <paper-card id="add-permission-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Add Permission
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-radio-group>
                    </paper-radio-group>
                </div>
            </paper-card>
            `

            // Add the fragment.
            parent.parentNode.appendChild(document.createRange().createContextualFragment(html))

            let buttonGroup = parent.parentNode.querySelector("paper-radio-group")
            this.permissionsNames.sort()
            this.permissionsNames.forEach(p => {
                let radioBtn = document.createElement("paper-radio-button")
                radioBtn.name = p
                radioBtn.innerHTML = p
                buttonGroup.appendChild(radioBtn)
                radioBtn.onclick = () => {
                    this.createPermission(p, type)
                    let popup = parent.parentNode.querySelector("paper-card")
                    popup.parentNode.removeChild(popup)
                }
            })

            // Remove the popup...
            parent.parentNode.querySelector("#cancel-btn").onclick = () => {
                let popup = parent.parentNode.querySelector("paper-card")
                popup.parentNode.removeChild(popup)
            }
        }
    }

    // Create the permission.
    createPermission(name, type) {
        // So here I will try to find if the permission already exist in the interface.
        let id = "permission_" + name + "_" + type + "_panel"
        let panel = null
        if (type == "allowed") {
            panel = this.alloweds.querySelector("#" + id)
        } else if (type == "denied") {
            panel = this.denieds.querySelector("#" + id)
        }

        if (panel == null) {

            // create the panel.
            panel = new PermissionPanel()
            panel.setAttribute("id", id)
            let permission = new Permission
            permission.setName(name)
            panel.setPermission(permission)

            // set the permission in the permissions object.
            if (type == "allowed") {
                this.permissions.getAllowedList().push(permission)
                this.alloweds.appendChild(panel)
            } else if (type == "denied") {
                this.permissions.getDeniedList().push(permission)
                this.denieds.appendChild(panel)
            }

        } else {
            ApplicationView.displayMessage("Permission " + name + " already exist", 3000)
        }

        if (type == "allowed") {
            // display the panel
            if (!this.alloweds.opened) {
                this.alloweds.toggle()
            }
        } else if (type == "denied") {
            if (!this.denieds.opened) {
                this.denieds.toggle()
            }
        }
    }

    // The connection callback.
    connectedCallback() {

        // Here I will get the list off all possible permission name...
        // Save owner permission.
        if (this.savePermissionListener.length == 0) {
            Model.eventHub.subscribe("save_permission_event",
                uuid => {
                    this.savePermissionListener = uuid
                },
                evt => {
                    let rqst = new SetResourcePermissionsRqst
                    rqst.setPermissions(this.permissions)
                    rqst.setPath(this.path)
                    Model.globular.rbacService.setResourcePermissions(rqst, {
                        token: localStorage.getItem("user_token"),
                        application: Model.application,
                        domain: Model.domain,
                        address: Model.address
                    }).then(rsp => {
                        ApplicationView.displayMessage("Permissions for path " + this.path + " was changed", 3000)
                        this.setPath(this.path)
                        Model.eventHub.publish(Application.account.id + "_change_permission_event", {},false)
                    }).catch(err => ApplicationView.displayMessage(err, 3000))
                }, true, this)
        }
    }

    // When the event is diconnected.
    disconnectCallback() {
        Model.eventHub.unSubscribe("save_permission_event", this.savePermissionListener)
    }

    setPath(path) {
        // Keep the path in memory
        this.path = path;
        // clear the panel values.
        this.owners.innerHTML = "";
        this.alloweds.innerHTML = "";
        this.denieds.innerHTML = "";

        this.pathDiv.innerHTML = path;

        // So here I will get the actual permissions.
        let rqst = new GetResourcePermissionsRqst
        rqst.setPath(path)

        Model.globular.rbacService.getResourcePermissions(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp => {

            // Here I will display the owner's
            let ownersPermissionPanel = new PermissionPanel()
            ownersPermissionPanel.id = "permission_owners_panel"
            this.permissions = rsp.getPermissions()
            this.permissionsViewer.setPermissions(this.permissions)

            ownersPermissionPanel.setPermission(rsp.getPermissions().getOwners(), true)
            this.owners.appendChild(ownersPermissionPanel)

            // The list of denied and allowed permissions.
            this.permissions.getAllowedList().forEach(p => {
                let panel = new PermissionPanel()
                panel.id = "permission_" + p.getName() + "_allowed_panel"
                panel.setPermission(p)
                this.alloweds.appendChild(panel)
            })

            this.permissions.getDeniedList().forEach(p => {
                let panel = new PermissionPanel()
                panel.id = "permission_" + p.getName() + "_denied_panel"
                panel.setPermission(p)
                this.denieds.appendChild(panel)
            })

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })


    }
}

customElements.define('globular-permissions-manager', PermissionsManager)


/**
 * Search Box
 */
export class PermissionPanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            .title{
                flex-grow: 1;
                font-size: 1.2rem;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-color: var(--palette-divider);
                width: 66.66%;
            }

            .members{
                display: flex;
                flex-direction: column;
            }

            .header{
                position: relative;
            }

        </style>
        <div>
            <div class="title">
            </div>
            <div class="members">

            </div>
        </div>
        `

        // test create offer...
    }

    // Set Permission infos...
    setPermission(permission, hideTitle) {

        this.permission = permission;

        if (hideTitle == undefined) {
            this.shadowRoot.querySelector(".title").innerHTML = permission.getName()
        } else {
            this.shadowRoot.querySelector(".title").style.display = "none";
        }

        // Set's account permissions.
        this.setAccountsPermissions(permission.getAccountsList());

        // Set's groups permissions
        this.setGroupsPermissions(permission.getGroupsList());

        // Set's Applications permissions
        this.setApplicationsPermissions(permission.getApplicationsList());

        // Set's Orgnanisation permissions
        this.setOrgnanisationsPermissions(permission.getOrganizationsList());

    }

    // Create a collapseible panel.
    createCollapsible(title) {
        let uuid = "_" + randomUUID()
        let html = `
        <style>
            .header {
                display: flex;
                align-items: center;
            }

            .title{
                flex-grow: 1;
            }

            iron-icon:hover{
                cursor: pointer;
            }

        </style>
        <div style="padding-left: 10px; width: 100%">
            <div class="header">
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="${uuid}-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <span class="title">${title}</span>
            </div>
            <iron-collapse id="${uuid}-collapse-panel"  style="width: 90%;">
                
            </iron-collapse>
        </div>
        `

        this.shadowRoot.querySelector(".members").appendChild(document.createRange().createContextualFragment(html))
        let content = this.shadowRoot.querySelector(`#${uuid}-collapse-panel`)
        this.hideBtn = this.shadowRoot.querySelector(`#${uuid}-btn`)

        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector(`#${uuid}-btn`)
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }
        // return the collapse panel.
        return this.shadowRoot.querySelector(`#${uuid}-collapse-panel`)
    }

    // The organisation permissions
    setOrgnanisationsPermissions(organisations_) {
        let content = this.createCollapsible(`Organizations(${organisations_.length})`)
        getAllOrganizations(
            organisations => {
                let list = []
                this.permission.getOrganizationsList().forEach(organisationId => {
                    let o_ = organisations.find(o => o.getId() === organisationId);
                    if (o_ != undefined) {
                        list.push(o_)
                    }
                })

                let organizationList = new SearchableOrganizationList("Organizations", list,
                    o => {
                        let index = this.permission.getOrganizationsList().indexOf(o.getId())
                        if (index != -1) {
                            this.permission.getOrganizationsList().splice(index, 1)
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            organizationList.removeItem(o)
                        }
                    },
                    o => {
                        let index = this.permission.getOrganizationsList().indexOf(o.getId())
                        if (index == -1) {
                            this.permission.getOrganizationsList().push(o.getId())
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            organizationList.appendItem(o)
                        }
                    })

                // Do not display the title again...
                organizationList.hideTitle()
                content.appendChild(organizationList)
            }, err => ApplicationView.displayMessage(err, 3000))

    }

    // The group permissions
    setApplicationsPermissions(applications_) {
        let content = this.createCollapsible(`Applications(${applications_.length})`)
        getAllApplicationsInfo(Model.globular,
            applications => {
                // I will get the account object whit the given id.
                let list = []

                this.permission.getApplicationsList().forEach(applicationId => {
                    let a_ = applications.find(a => a.getId() === applicationId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let applicationList = new SearchableApplicationList("Applications", list,
                    a => {
                        let index = this.permission.getApplicationsList().indexOf(a.getId())
                        if (index != -1) {
                            this.permission.getApplicationsList().splice(index, 1)
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            applicationList.removeItem(a)
                        }
                    },
                    a => {
                        let index = this.permission.getApplicationsList().indexOf(a.getId())
                        if (index == -1) {
                            this.permission.getApplicationsList().push(a.getId())
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            applicationList.appendItem(a)
                        }
                    })

                // Do not display the title again...
                applicationList.hideTitle()
                content.appendChild(applicationList)

            }), err => ApplicationView.displayMessage(err, 3000)

    }

    // The group permissions
    setGroupsPermissions(groups_) {
        let content = this.createCollapsible(`Groups(${groups_.length})`)

        getAllGroups(Model.globular,
            groups => {
                // I will get the account object whit the given id.
                let list = []

                this.permission.getGroupsList().forEach(groupId => {

                    let g_ = groups.find(g => g.getId() === groupId);
                    if (g_ != undefined) {
                        list.push(g_)
                    }

                })

                let groupsList = new SearchableGroupList("Groups", list,
                    g => {
                        let index = this.permission.getGroupsList().indexOf(g.getId())
                        if (index != -1) {
                            this.permission.getGroupsList().splice(index, 1)
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            groupsList.removeItem(g)
                        }
                    },
                    g => {
                        let index = this.permission.getGroupsList().indexOf(g.getId())
                        if (index == -1) {
                            this.permission.getGroupsList().push(g.getId())
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            groupsList.appendItem(g)
                        }
                    })

                // Do not display the title again...
                groupsList.hideTitle()
                content.appendChild(groupsList)

            }), err => ApplicationView.displayMessage(err, 3000)

    }

    // Each permission can be set for applications, peers, accounts, groups or organisations
    setAccountsPermissions(accounts_) {
        let content = this.createCollapsible(`Account(${accounts_.length})`)

        // Here I will set the content of the collapse panel.
        // Now the account list.
        Account.getAccounts("{}",
            accounts => {

                // I will get the account object whit the given id.
                let list = []
                accounts_.forEach(accountId => {
                    let a_ = accounts.find(a => a._id === accountId);
                    if (a_ != undefined) {
                        list.push(a_)
                    }
                })

                let accountsList = new SearchableAccountList("Accounts", list,
                    a => {
                        let index = this.permission.getAccountsList().indexOf(a._id)
                        if (index != -1) {
                            this.permission.getAccountsList().splice(index, 1)
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            accountsList.removeItem(a)
                        }
                    },
                    a => {
                        let index = this.permission.getAccountsList().indexOf(a._id)
                        if (index == -1) {
                            this.permission.getAccountsList().push(a._id)
                            Model.eventHub.publish("save_permission_event", this.permission, true)
                            accountsList.appendItem(a)
                        }
                    })

                // Do not display the title again...
                accountsList.hideTitle()

                content.appendChild(accountsList)
            }, err => {
                ApplicationView.displayMessage(err, 3000)
            })

    }

}

customElements.define('globular-permission-panel', PermissionPanel)


/**
 * Display all permissions at once.
 */
export class PermissionsViewer extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #subjects-div{
                vertical-align: middle;
                text-aling: center;
            }

            #permissions-div{
                display: table;
                width: 100%;
                vertical-align: middle;
                text-aling: center;
            }

            #permissions-header{
                display: table-row;
                font-size: 1.0rem;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-bottom: 2 px solid;
                border-color: var(--palette-divider);
                width: 100%;
            }

            #permissions-header div {
                display: table-cell;
            }

            .subject-div{
                vertical-align: middle;
                text-aling: center;
                max-width: 300px;
            }

            .permission-div{
                text-align: center;
                vertical-align: middle;
                text-aling: center;
            }

        </style>

        <div>
            <div id="subjects-div">
            </div>

            <div id="permissions-div">
            </div>

        </div>
        `

        this.subjectsDiv = this.shadowRoot.querySelector("#subjects-div")

        this.permissionsDiv = this.shadowRoot.querySelector("#permissions-div")

    }

    // Set the permission
    setPermission(subjects, name, permission) {

        // Accounts
        permission.getAccountsList().forEach(a => {
            let id = a + "_account"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "account"
                subject.id = a
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name

        })

        // Groups
        permission.getGroupsList().forEach(g => {
            let id = g + "_group"
            let subject = subjects[id]
           
            if (subject == null) {
                subject = {}
                subject.type = "group"
                subject.id = g
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })

        // Applications
        permission.getApplicationsList().forEach(a => {
            let id = a + "_application"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "application"
                subject.id = a
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })

        // Organizations
        permission.getOrganizationsList().forEach(o => {
            let id =  o + "_organization"
            let subject = subjects[id]
            if (subject == null) {
                subject = {}
                subject.type = "organization"
                subject.id = o
                subject.permissions = {}
                subjects[id] = subject
            }

            subject.permissions[permission.getName()] = name
        })
    }

    createAccountDiv(account) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${account.profilPicture_ == undefined ? "none" : "block"};" src="${account.profilPicture_}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${account.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${account.name}</span>
                    <span>${account.email_}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createApplicationDiv(application) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${application.getIcon() == undefined ? "none" : "block"};" src="${application.getIcon()}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${application.getIcon() != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${application.getAlias()}</span>
                    <span>${application.getVersion()}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    createOrganizationDiv(organisation) {
        let uuid = "_" + uuidv4();
        let html = `
            <style>
            </style>
            <div id="${uuid}" class="item-div" style="">
                <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                    <iron-icon icon="social:domain" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                    <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                        <span>${organisation.getName()}</span>
                    </div>
                </div>
            </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }


    createGroupDiv(group) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="social:people" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:250px; font-size: .85em; padding-left: 8px;">
                    <span>${group.name}</span>
                </div>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    setPermissionCell(row, value) {
        // The delete permission
        let cell = document.createElement("div")
        cell.style.display = "table-cell"
        cell.className = "permission-div"

        let check = document.createElement("iron-icon")
        check.icon = "icons:check"

        let none = document.createElement("iron-icon")
        none.icon = "icons:remove"

        let denied = document.createElement("iron-icon")
        denied.icon = "av:not-interested"

        if (value != undefined) {
            if (value == "allowed") {
                cell.appendChild(check)
            } else if (value == "denied") {
                cell.appendChild(denied)
            } else if (value == "owner") {
                cell.appendChild(check)
            }
        } else {
            cell.appendChild(none)
        }

        row.appendChild(cell)
    }

    // Set permission and display it.
    setPermissions(permissions) {

        this.subjectsDiv.innerHTML = ""

        this.permissionsDiv.innerHTML = `
        <div id="permissions-header">
            <div class="subject-div">subject</div>
            <div class="permission-div">read</div>
            <div class="permission-div">write</div>
            <div class="permission-div">delete</div>
            <div class="permission-div">owner</div>
        </div>
        `

        // So here I will transform the values to be display in a table like view.
        let subjects = {}

        // Set the owner permissions.
        this.setPermission(subjects, "owner", permissions.getOwners())

        // Set the denied permissions
        permissions.getDeniedList().forEach(p => this.setPermission(subjects, "denied", p))

        // set the allowed permission.
        permissions.getAllowedList().forEach(p => this.setPermission(subjects, "allowed", p))

        // Now I will display the permission.
        for (var id in subjects) {
            let row = document.createElement("div")
            row.style.display = "table-row"
            let subjectCell = document.createElement("div")
            subjectCell.style.display = "table-cell"
            subjectCell.className = "subject-div"
            row.appendChild(subjectCell)

            let subject = subjects[id]
            if (subject.type == "account") {
                Account.getAccount(subject.id, (a) => {
                    let accountDiv = this.createAccountDiv(a)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(accountDiv)
                }, e =>{
                    ApplicationView.displayMessage(e, 3000)
                })
            } else if (subject.type == "application") {
                // Set application div.
                let applicationDiv = this.createApplicationDiv(Application.getApplicationInfo(subject.id))
                subjectCell.innerHTML = ""
                subjectCell.appendChild(applicationDiv)
            } else if (subject.type == "group") {
                Group.getGroup(subject.id, g => {
                    let groupDiv = this.createGroupDiv(g)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(groupDiv)
                }, e => ApplicationView.displayMessage(e, 3000))
            } else if (subject.type == "organization") {
                getOrganizationById(subject.id, o => {
                    let organizationDiv = this.createOrganizationDiv(o)
                    subjectCell.innerHTML = ""
                    subjectCell.appendChild(organizationDiv)
                }, e => ApplicationView.displayMessage(e, 3000))
            }

            // Now I will set the value for other cells..
            this.setPermissionCell(row, subject.permissions["read"])
            this.setPermissionCell(row, subject.permissions["write"])
            this.setPermissionCell(row, subject.permissions["delete"])
            this.setPermissionCell(row, subject.permissions["owner"])

            this.permissionsDiv.appendChild(row)
        }

    }

}

customElements.define('globular-permissions-viewer', PermissionsViewer)