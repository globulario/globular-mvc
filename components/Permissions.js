import { GetResourcePermissionsRqst, SetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { Account } from "../Account";
import { theme } from "../../globular-mvc/components/Theme.js";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";
import { SearchableAccountList, SearchableGroupList, SearchableOrganizationList } from "./List.js";
import { getAllGroups } from "globular-web-client/api";
import { randomUUID } from "./utility";
import { getAllOrganizations } from "./Organization";

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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
            }

            #header {
                display: flex;
            }

            .title{
                flex-grow: 1;
                font-size: 1.2rem;
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
            <div>
                <div  class="title">
                    Owner(s)
                </div>
                <div class="permissions" id="owner">
                </div>
            </div>
            <div>
                <div  class="title">
                    Allowed(s)
                </div>
                <div class="permissions" id="allowed">
                </div>
            </div>
            <div>
                <div class="title">
                    Denied(s)
                </div>
                <div class="permissions" id="denied">
                </div>
            </div>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.pathDiv = this.shadowRoot.querySelector("#path")

        // The tree sections.
        this.owners = this.shadowRoot.querySelector("#owner")
        this.alloweds = this.shadowRoot.querySelector("#allowed")
        this.denieds = this.shadowRoot.querySelector("#denied")

        // Now the varions sections,

        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            // remove it from it parent.
            this.parentNode.removeChild(this)
        }



    }

    // The connection callback.
    connectedCallback() {
        // Save owner permission.
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
                }).then(rsp => {
                    console.log("succed to save permissions for path ", this.path)
                    ApplicationView.displayMessage("Permissions for path " + this.path + " was changed", 3000)
                    this.setPath(this.path)
                }).catch(err => ApplicationView.displayMessage(err, 3000))
            }, true)
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
        }).then(rsp => {
            // Here I will display the owner's
            let ownersPermissionPanel = new PermissionPanel()
            this.permissions = rsp.getPermissions()
            ownersPermissionPanel.setPermission(rsp.getPermissions().getOwners(), true)
            this.owners.appendChild(ownersPermissionPanel)
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
            ${theme}

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
                <span class="title">${title}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="${uuid}-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="${uuid}-collapase-panel">
                
            </iron-collapse>
        </div>
        `

        this.shadowRoot.querySelector(".members").appendChild(document.createRange().createContextualFragment(html))
        let content = this.shadowRoot.querySelector(`#${uuid}-collapase-panel`)
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
        return this.shadowRoot.querySelector(`#${uuid}-collapase-panel`)
    }

    // The organisation permissions
    setOrgnanisationsPermissions(organisations_) {
        let content = this.createCollapsible(`Organizations(${organisations_.length})`)
        getAllOrganizations(
            organisations=>{
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
        }, err=>ApplicationView.displayMessage(err, 3000))

    }

    // The group permissions
    setApplicationsPermissions(applications_) {
        let content = this.createCollapsible(`Applications(${applications_.length})`)

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

    /*
    repeated string applications = 2;
    repeated string peers = 3;
    repeated string accounts = 4;
    repeated string groups = 5;
    repeated string organizations = 6;
    */

}

customElements.define('globular-permission-panel', PermissionPanel)
