import { GetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { Account } from "../Account";
import { theme } from "../../globular-mvc/components/Theme.js";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";
import { SearchableAccountList } from "./List.js";

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
            permission => {
                console.log(this.permissions)
                console.log(permission)
            }, true)
    }

    setPath(path) {

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

    setPermission(permission, hideTitle) {
        console.log(permission)
        this.permission = permission;

        if (hideTitle == undefined) {
            this.shadowRoot.querySelector(".title").innerHTML = permission.getName()
        } else {
            this.shadowRoot.querySelector(".title").style.display = "none";
        }
        this.setAccountPermissions(permission.getAccountsList())
    }

    // Create a collapseible panel.
    createCollapsible(title) {
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
            <div class="header" id="application-notifications-btn">
                <span class="title">${title}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapase-panel">
                
            </iron-collapse>
        </div>
        `

        this.shadowRoot.querySelector(".members").appendChild(document.createRange().createContextualFragment(html))
        let content = this.shadowRoot.querySelector("#collapase-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

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
        // return the collapse panel.
        return this.shadowRoot.querySelector("#collapase-panel")
    }

    // Each permission can be set for applications, peers, accounts, groups or organisations
    setAccountPermissions(accounts_) {
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
                            Model.eventHub.publish("save_permission_event", this.permission)
                            accountsList.removeItem(a)
                        }
                    },
                    a => {
                        let index = this.permission.getAccountsList().index(a._id)
                        if (index == -1) {
                            this.permission.getAccountsList().push(a._id)
                            Model.eventHub.publish("save_permission_event", this.permission)
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
