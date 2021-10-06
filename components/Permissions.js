import { GetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { theme } from "../../globular-mvc/components/Theme.js";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";

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
        let container = this.shadowRoot.querySelector("#container")
        this.pathDiv = this.shadowRoot.querySelector("#path")

        // The tree sections.
        this.owners = this.shadowRoot.querySelector("#owner")
        this.alloweds = this.shadowRoot.querySelector("#allowed")
        this.denieds = this.shadowRoot.querySelector("#denied")

        // Now the varions sections,

        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = ()=>{
            // remove it from it parent.
            this.parentNode.removeChild(this)
        }
    }

    // The connection callback.
    connectedCallback() {
        // When the permission manager is displayed
    }

    setPath(path) {
        console.log("------------> display permission for path: ", path)
        this.pathDiv.innerHTML = path;

        // So here I will get the actual permissions.
        let rqst = new GetResourcePermissionsRqst
        rqst.setPath(path)

        Model.globular.rbacService.getResourcePermissions(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
          }).then(rsp=>{
            console.log(rsp.getPermissions())
            // Here I will display the owner's
            let ownersPermissionPanel = new PermissionPanel()
            ownersPermissionPanel.setPermission(rsp.getPermissions().getOwners())
            this.owners.appendChild(ownersPermissionPanel)
          }).catch(err=>{
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

    setPermission(permission){
        console.log(permission)
        this.shadowRoot.querySelector(".title").innerHTML = permission.getName()

        this.setAccountPermissions(permission.getAccountsList())

    }

    setCollapsible(title, list){
        let html = `
        <div style="padding-left: 10px; width: 100%">
            <div class="header" id="application-notifications-btn">
                <paper-ripple recenters></paper-ripple>
                <span class="title">${title}</span>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
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

    }

    // Each permission can be set for applications, peers, accounts, groups or organisations
    setAccountPermissions( accounts ){
        this.setCollapsible("Account(s)", accounts)
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
