
import { v4 as uuidv4 } from "uuid";
import { Account } from "../Account";
import { Application } from "../Application";
import { getAllGroups, getAllRoles } from "globular-web-client/api";
import { Model } from "../Model";
import { getAllOrganizations } from "./Organization";
import { getAllPeers } from "./Peers";
import { fireResize } from "./utility";
import * as getUuidByString from "uuid-by-string";

export class EditableStringList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(list) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            .string-list{
                display: flex;
                flex-wrap: wrap;
                min-height: 25px;
            }

            .string-list div{
                align-items: center;
                justify-content: center;
                padding: 0px 4px 0px 4px;
                margin-right: 5px;
                margin-top: 5px;
                border: 1px solid var(--palette-action-disabled);
            }

            iron-icon {
                width: 16px;
                height: 16px;
                margin-left: 2px;
                
            }

            paper-input {
                display: none; 
            }

            iron-icon:hover {
                cursor: pointer;
            }

        </style>
       
        <div style="position: relative;">
            <paper-icon-button id="add-item-btn" icon="icons:add" style="position: absolute; left: -40px;"></paper-icon-button>
            <div class="string-list">
            </div>
        </div>
       
        `
        // give the focus to the input.
        let stringListDiv = this.shadowRoot.querySelector(".string-list")
        let range = document.createRange()
        stringListDiv.onclick = () => {
            this.blur()
        }


        this.shadowRoot.querySelector("#add-item-btn").onclick = () => {
            this.addItem("New value", stringListDiv, range, true)
        }

        list.forEach(item => {

            this.addItem(item, stringListDiv, range)

        })
    }

    // Add item to the list.
    addItem(item, stringListDiv, range, edit) {
        let uuid = "_" + getUuidByString(item)
        let itemDiv = stringListDiv.querySelector(`#${uuid}`)
        if (itemDiv) {
            itemDiv.children[0].click()
            return
        }

        let html = `
            <div id=${uuid} style="display: flex;">
                <span class="items">${item}</span>
                <paper-input no-label-float style="display: none;"></paper-input>
                <iron-icon id="remove-btn" icon="icons:close"></iron-icon>
            </div>
        `

        let index = stringListDiv.children.length
        stringListDiv.appendChild(range.createContextualFragment(html))

        // I will set edit event...
        itemDiv = stringListDiv.children[index]
        let itemSpan = itemDiv.children[0]
        let itemInput = itemDiv.children[1]
        let removeBtn = itemDiv.children[2]

        // Delete the item.
        removeBtn.onclick = (evt) => {
            evt.stopPropagation()
            itemDiv.parentNode.removeChild(itemDiv)
        }

        itemSpan.onclick = (evt) => {
            evt.stopPropagation()
            for (var i = 0; i < stringListDiv.children.length; i++) {
                stringListDiv.children[i].children[0].style.display = "block"
                stringListDiv.children[i].children[1].style.display = "none"
            }
            itemInput.style.display = "block"
            itemInput.value = itemSpan.innerHTML
            itemSpan.style.display = "none"
            setTimeout(() => {
                itemInput.focus()
                itemInput.inputElement.inputElement.select()
            }, 100)
            fireResize()
        }

        itemInput.onkeyup = (evt) => {
            evt.stopPropagation()
            let key = evt.key;
            if (key == "Escape") {
                itemSpan.innerHTML = itemInput.value = item // set back to item...
                itemInput.style.display = "none"
                itemSpan.style.display = "block"
            }
            if (key == "Enter") {
                let uuid = "_" + getUuidByString(itemInput.value)
                itemDiv.id = uuid
                let count = 0;
                for (var i = 0; i < stringListDiv.children.length; i++) {
                    if (stringListDiv.children[i].id == uuid) {
                        count++
                    }
                }

                if (count >= 1) {
                    let itemDiv_ = stringListDiv.querySelector("#" + uuid)
                    itemDiv_.children[1].value = itemInput.value
                    if (count > 1) {
                        itemDiv.parentNode.removeChild(itemDiv)
                        itemDiv_.children[0].click()
                        return
                    }
                }

                // save value
                itemSpan.innerHTML = itemInput.value
                itemInput.style.display = "none"
                itemSpan.style.display = "block"
            }
        }

        itemInput.onblur = () => {
            // make sure there not repetead values...
            let uuid = "_" + getUuidByString(itemInput.value)
            itemDiv.id = uuid
            itemSpan.innerHTML = itemInput.value
            let count = 0;
            for (var i = 0; i < stringListDiv.children.length; i++) {
                if (stringListDiv.children[i].id == uuid) {
                    count++
                }
            }

            if (count >= 1) {
                let itemDiv_ = stringListDiv.querySelector("#" + uuid)
                itemDiv_.children[1].value = itemInput.value
                if (count > 1) {
                    itemDiv.parentNode.removeChild(itemDiv)
                    itemDiv_.children[0].click()
                    return
                }
            }
        }

        if (edit) {
            itemSpan.click()
        }

    }

    blur() {
        let inputs = this.shadowRoot.querySelectorAll("paper-input")
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].style.display = "none"
            inputs[i].parentNode.children[0].style.display = "block"
        }
    }

    getItems(){
        let spans = this.shadowRoot.querySelectorAll(".items")
        let items = []
        for(var i=0; i < spans.length; i++){
            items.push(spans[i].innerHTML)
        }
        
        return items;
    }
}

customElements.define('globular-editable-string-list', EditableStringList)


/**
 * String seach listbox.
 */
export class SearchableList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleteitem, onadditem, onadd) {
        super()

        // handler...
        this.ondeleteitem = ondeleteitem;
        this.onadditem = onadditem;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.list = list
        this.title = title

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            .header{
                position: relative;
                transition: background 0.2s ease,padding 0.8s linear;
                padding-left: 10px;
            }

            .item-div:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .item-div{
                padding: 5px;
                display: flex; 
                align-items: center;
                font-size: 1.125rem;
            }

            .icon-button{
                cursor: pointer;
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
             }
             
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider);
             }

        </style>
        
        <div id="header-div" class="header">
            <span class="title">${title} (${list.length})</span>
            <div style="display:flex; flex-direction: row; align-items: center;">
                <div class="icon-button" style="display: flex; width: 24px; height: 24px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="action-add-btn"  icon="add" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
                <div style="flex-grow: 1;">
                    <paper-input style="padding-left: 15px; max-width: 300px;" type="text" label="Filter ${title}"></paper-input>
                </div>
            </div>
        </div>
        <div id="shadow-div" style="width: 100%; height: 5px;"></div>
        <div id="items-div" style="width: 100%;max-height: 200px; overflow-y: auto; maring-top: 5px; margin-bottom: 5px;"></div>
        `

        this.listDiv = this.shadowRoot.querySelector("#items-div")
        let shadowDiv = this.shadowRoot.querySelector("#shadow-div")

        // set the header shadow...
        this.listDiv.onscroll = () => {
            if (this.listDiv.scrollTop == 0) {
                shadowDiv.style.boxShadow = ""
            } else {
                shadowDiv.style.boxShadow = "inset 0px 5px 6px -3px rgb(0 0 0 / 40%)"
            }
        }

        // Here I will display the filter input.
        let filterInput = this.shadowRoot.querySelector("paper-input")
        this.filter_ = ""
        filterInput.onkeyup = () => {
            this.filter_ = filterInput.value;
            this.displayItems()
        }

        // Call the on add function
        let addBtn = this.shadowRoot.querySelector("#action-add-btn")
        if (onadd != undefined) {
            addBtn.onclick = () => {
                onadd(this.list)
            }
        }

        // Here I will create the action list...
        this.displayItems()
    }

    // Return the header div.
    getHeader() {
        return this.shadowRoot.querySelector("#header-div")
    }

    // That function can be overide, assume a string by default
    filter(item) {
        return item.toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        return this.list.sort()
    }


    hideTitle() {
        this.shadowRoot.querySelector(".title").style.display = "none";
    }

    // The function that display one item.
    displayItem(item) {
        let uuid = "_" + uuidv4();
        let html = `
        <div id="${uuid}" class="item-div" style="">
            <div style="flex-grow: 1; line-break: anywhere;">${item}</div>
            <paper-icon-button icon="delete"></paper-icon-button>
        </div>`

        let div = document.createRange().createContextualFragment(html)
        let deleteBtn = div.querySelector("paper-icon-button")

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                let div = this.shadowRoot.querySelector("#" + uuid)
                div.parentNode.removeChild(div)
                this.ondeleteitem(item)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function display items.
    displayItems() {
        // clean up the list of items.
        this.listDiv.innerHTML = ""

        this.sortItems().forEach((item) => {

            let div = this.displayItem(item)

            if (this.filter(item) || this.filter_.length == 0) {
                this.listDiv.appendChild(div)
            }
            
        })
    }

    removeItem(str) {
        this.list = this.list.filter(el => el !== str)
        let titleDiv = this.shadowRoot.querySelector(".title")
        titleDiv.innerHTML = `${this.title} (${this.list.length})`
        this.displayItems()
    }

    appendItem(item) {
        this.list.push(item)
        let titleDiv = this.shadowRoot.querySelector(".title")
        titleDiv.innerHTML = `${this.title} (${this.list.length})`
        this.displayItems()
    }

}

customElements.define('globular-searchable-list', SearchableList)

/**
 * Searchable Account list
 */
export class SearchableAccountList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleteaccount, onaddaccount) {


        // the onadd handler
        let onadd = (accounts) => {
            // Now the user list...
            Account.getAccounts("{}", (allAccounts) => {

                accounts.forEach(a => {
                    // remove all existing items.
                    allAccounts = allAccounts.filter(el => el._id !== a._id)
                })

                // Now I will display the list of available account to add to the role...
                let html = `
                <style>
                   
                    #add-list-user-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-user-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Account
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="email" label="Search Account" id="add_account_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `
                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-user-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-user-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addAccountInput = this.shadowRoot.getElementById("add_account_input")
                    addAccountInput.focus()
                    addAccountInput.onkeyup = () => {
                        let val = addAccountInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allAccounts.forEach(a => {
                                if (a.name.toUpperCase().indexOf(val.toUpperCase()) != -1 || a.email_.toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(a)
                                }
                            })
                            addAccountInput.setValues(values)
                        } else {
                            addAccountInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addAccountInput.displayValue = (a) => {
                        // display the account...
                        let div = this.createAccountDiv(a)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allAccounts = allAccounts.filter(a_ => a_ !== a)

                            addAccountInput.clear()

                            // set values without the account
                            let values = []
                            let val = addAccountInput.getValue();
                            allAccounts.forEach(a => {
                                if (a.name.toUpperCase().indexOf(val.toUpperCase()) != -1 || a.email_.toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(a)
                                }
                            })

                            addAccountInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(a)
                            }

                        }
                        return div
                    }
                }


            })
        }

        super(title, list, ondeleteaccount, onaddaccount, onadd)

    }


    createAccountDiv(account) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${account.profilePicture.length == 0 ? "none" : "block"};" src="${account.profilePicture}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${account.profilePicture.length != 0 ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${account.id + "@" + account.domain}</span>
                </div>
                <paper-icon-button icon="delete" id="${account._id}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(a) {
        this.list = this.list.filter(el => el._id !== a._id)
    }

    displayItem(a) {
        let div = this.createAccountDiv(a)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(a)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(account) {
        return account.name.toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || account.email_.toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.name > b.name) ? 1 : -1)
    }
}

customElements.define('globular-searchable-account-list', SearchableAccountList)



/**
 * Searchable Application list
 */
export class SearchableApplicationList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleteapplication, onaddapplication) {

        // the onadd handler
        let onadd = (applications) => {
            // Now the user list...
            Application.getAllApplicationInfo((allApplications) => {

                applications.forEach(a => {
                    // remove all existing items.
                    allApplications = allApplications.filter(el => el._id !== a._id)
                })

                // Now I will display the list of available account to add to the role...
                let html = `
                <style>
                   
                    #add-list-application-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-application-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Application
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="text" label="Search Application" id="add_application_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `
                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-application-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-application-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addApplicationInput = this.shadowRoot.getElementById("add_application_input")
                    addApplicationInput.focus()
                    addApplicationInput.onkeyup = () => {
                        let val = addApplicationInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allApplications.forEach(a => {
                                if (a.getName().toUpperCase().indexOf(val.toUpperCase()) != -1 || a.getAlias().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(a)
                                }
                            })
                            addApplicationInput.setValues(values)
                        } else {
                            addApplicationInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addApplicationInput.displayValue = (a) => {
                        // display the account...
                        let div = this.createApplicationDiv(a)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allApplications = allApplications.filter(a_ => a_ !== a)

                            addApplicationInput.clear()

                            // set values without the account
                            let values = []
                            let val = addApplicationInput.getValue();
                            allApplications.forEach(a => {
                                if (a.name.toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(a)
                                }
                            })

                            addApplicationInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(a)
                            }

                        }
                        return div
                    }
                }


            })
        }

        super(title, list, ondeleteapplication, onaddapplication, onadd)

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
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${application.getAlias() + "@" + application.domain}</span>
                    <span>${application.getVersion()}</span>
                </div>
                <paper-icon-button icon="delete" id="${application._id}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(a) {
        this.list = this.list.filter(el => el._id !== a._id)
    }

    displayItem(a) {
        let div = this.createApplicationDiv(a)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(a)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(a) {
        return a.getName().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || a.getAlias().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.getName() > b.getName()) ? 1 : -1)
    }
}

customElements.define('globular-searchable-application-list', SearchableApplicationList)

/**
 * Searchable Role list
 */
export class SearchableRoleList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleterole, onaddrole) {

        // the onadd handler
        let onadd = (roles) => {
            // Now the user list...
            getAllRoles(Model.globular, (allRoles) => {
                roles.forEach(r => {
                    // remove all existing items.
                    allRoles = allRoles.filter(el => el.getId() !== r.getId())
                })

                // Now I will display the list of available account to add to the role...
                let html = `
                <style>
                   
                    #add-list-role-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-role-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Role
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="text" label="Search Role" id="add_role_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `

                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-role-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-role-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addRoleInput = this.shadowRoot.getElementById("add_role_input")
                    addRoleInput.focus()
                    addRoleInput.onkeyup = () => {
                        let val = addRoleInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allRoles.forEach(r => {
                                if (r.getName().toUpperCase().indexOf(val.toUpperCase()) != -1 || r.getId().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(r)
                                }
                            })
                            addRoleInput.setValues(values)
                        } else {
                            addRoleInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addRoleInput.displayValue = (r) => {
                        // display the account...
                        let div = this.createRoleDiv(r)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allRoles = allRoles.filter(r_ => r_ !== r)
                            addRoleInput.clear()

                            // set values without the account
                            let values = []
                            let val = addRoleInput.getValue();
                            allRoles.forEach(r => {
                                if (r.getName().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(r)
                                }
                            })

                            addRoleInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(r)
                            }

                        }
                        return div
                    }
                }
            })
        }

        super(title, list, ondeleterole, onaddrole, onadd)

    }

    // The div that display the role.
    createRoleDiv(role) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="notification:enhanced-encryption" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${role.getId() + "@" + role.getDomain()}</span>
                </div>
                <paper-icon-button icon="delete" id="${role.getId()}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(r) {
        this.list = this.list.filter(el => el.getId() !== r.getId())
    }

    displayItem(a) {
        let div = this.createRoleDiv(a)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(a)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(r) {
        return r.getName().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || r.getName().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.getName() > b.getName()) ? 1 : -1)
    }
}

customElements.define('globular-searchable-role-list', SearchableRoleList)

/**
 * Searchable Group list
 */
export class SearchableGroupList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeletegroup, onaddgroup) {

        // the onadd handler
        let onadd = (groups) => {
            // Now the user list...
            getAllGroups(Model.globular, (allGroups) => {
                groups.forEach(g => {
                    // remove all existing items.
                    allGroups = allGroups.filter(el => el.getId() !== g.getId())
                })

                let html = `
                <style>
                   
                    #add-list-group-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-group-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Group
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="text" label="Search Group" id="add_group_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `

                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-group-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-group-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addGroupInput = this.shadowRoot.getElementById("add_group_input")
                    addGroupInput.focus()
                    addGroupInput.onkeyup = () => {
                        let val = addGroupInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allGroups.forEach(g => {
                                if (g.getName().toUpperCase().indexOf(val.toUpperCase()) != -1 || g.getId().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(g)
                                }
                            })
                            addGroupInput.setValues(values)
                        } else {
                            addGroupInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addGroupInput.displayValue = (g) => {
                        // display the account...
                        let div = this.createGroupDiv(g)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allGroups = allGroups.filter(g_ => g_ !== g)

                            addGroupInput.clear()

                            // set values without the account
                            let values = []
                            let val = addGroupInput.getValue();
                            allGroups.forEach(g => {
                                if (g.getName().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(g)
                                }
                            })

                            addGroupInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(g)
                            }

                        }
                        return div
                    }
                }
            })
        }

        super(title, list, ondeletegroup, onaddgroup, onadd)

    }

    // The div that display the role.
    createGroupDiv(group) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="social:people" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${group.getId() + "@" + group.getDomain()}</span>
                </div>
                <paper-icon-button icon="delete" id="${group.getId()}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(g) {
        this.list = this.list.filter(el => el.getId() !== g.getId())
    }

    displayItem(g) {
        let div = this.createGroupDiv(g)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(g)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(g) {
        return g.getName().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || g.getId().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.getName() > b.getName()) ? 1 : -1)
    }
}

customElements.define('globular-searchable-group-list', SearchableGroupList)



/**
 * Searchable Organization list
 */
export class SearchableOrganizationList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeleteorganization, onaddorganization) {

        // the onadd handler
        let onadd = (organizations) => {
            // Now the user list...
            getAllOrganizations(allOrganizations => {
                organizations.forEach(o => {
                    // remove all existing items.
                    allOrganizations = allOrganizations.filter(el => el.getId() !== o.getId())
                })

                let html = `
                <style>
                   
                    #add-list-organization-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-organization-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Organization
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="text" label="Search Group" id="add_organization_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `

                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-organization-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-organization-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addOrganizationInput = this.shadowRoot.getElementById("add_organization_input")
                    addOrganizationInput.focus()
                    addOrganizationInput.onkeyup = () => {
                        let val = addOrganizationInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allOrganizations.forEach(o => {
                                if (o.getName().toUpperCase().indexOf(val.toUpperCase()) != -1 || o.getId().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(o)
                                }
                            })
                            addOrganizationInput.setValues(values)
                        } else {
                            addOrganizationInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addOrganizationInput.displayValue = (o) => {
                        // display the account...
                        let div = this.createOrganizationDiv(o)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allOrganizations = allOrganizations.filter(o_ => o_ !== o)

                            addOrganizationInput.clear()

                            // set values without the account
                            let values = []
                            let val = addOrganizationInput.getValue();
                            allOrganizations.forEach(o => {
                                if (o.getName().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(o)
                                }
                            })

                            addOrganizationInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(o)
                            }

                        }
                        return div
                    }
                }
            })
        }

        super(title, list, ondeleteorganization, onaddorganization, onadd)

    }

    // The div that display the role.
    createOrganizationDiv(organization) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="social:domain" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${organization.getId()+ "@" + organization.getDomain()}</span>
                </div>
                <paper-icon-button icon="delete" id="${organization.getId()}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(o) {
        this.list = this.list.filter(el => el.getId() !== o.getId())
    }

    displayItem(o) {
        let div = this.createOrganizationDiv(o)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(o)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(o) {
        return o.getName().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || o.getId().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.getName() > b.getName()) ? 1 : -1)
    }
}

customElements.define('globular-searchable-organization-list', SearchableOrganizationList)


/**
 * Searchable Group list
 */
export class SearchablePeerList extends SearchableList {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list, ondeletepeer, onaddpeer) {

        // the onadd handler
        let onadd = (peers) => {
            // Now the peer list...
            getAllPeers(Model.globular, (allPeers) => {
                peers.forEach(p => {
                    // remove all existing items.
                    allPeers = allPeers.filter(el => el.getMac() !== p.getMac())
                })

                let html = `
                <style>
                   
                    #add-list-peer-panel{
                        position: absolute;
                        left: 0px;
                        z-index: 1;
                        background-color: var(--palette-background-paper);
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                    paper-card{
                        background-color: var(--palette-background-paper);
                        color: var(--palette-text-primary);
                    }

                </style>
                <paper-card id="add-list-peer-panel">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Add Peer
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <globular-autocomplete type="text" label="Search Peer" id="add_peer_input" width="${this.width - 10}" style="flex-grow: 1;"></globular-autocomplete>
                    </div>
                </paper-card>
                `

                let headerDiv = this.shadowRoot.querySelector("#header-div")
                let panel = headerDiv.querySelector("#add-list-peer-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-list-peer-panel")
                    panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                    let closeBtn = panel.querySelector("#cancel-btn")
                    closeBtn.onclick = () => {
                        panel.parentNode.removeChild(panel)
                    }

                    // The invite contact action.
                    let addPeerInput = this.shadowRoot.getElementById("add_peer_input")
                    addPeerInput.focus()
                    addPeerInput.onkeyup = () => {
                        let val = addPeerInput.getValue();
                        if (val.length >= 2) {
                            let values = []
                            allPeers.forEach(p => {
                                if (p.getHostname().toUpperCase().indexOf(val.toUpperCase()) != -1 || p.getMac().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(p)
                                }
                            })
                            addPeerInput.setValues(values)
                        } else {
                            addPeerInput.clear()
                        }
                    }


                    // That function must return the div that display the value that we want.
                    addPeerInput.displayValue = (p) => {
                        // display the account...
                        let div = this.createPeerDiv(p)
                        div.children[0].style.width = "auto"
                        let addBtn = div.querySelector("paper-icon-button")
                        addBtn.icon = "add"
                        addBtn.onclick = () => {

                            // remove the account form the list off available choice.
                            allPeers = allPeers.filter(p_ => p_ !== p)

                            addPeerInput.clear()

                            // set values without the account
                            let values = []
                            let val = addPeerInput.getValue();
                            allPeers.forEach(p => {
                                if (p.getName().toUpperCase().indexOf(val.toUpperCase()) != -1) {
                                    values.push(p)
                                }
                            })

                            addPeerInput.setValues(values)

                            // Here I will set the account role...
                            if (this.onadditem != null) {
                                this.onadditem(p)
                            }

                        }
                        return div
                    }
                }
            })
        }

        super(title, list, ondeletepeer, onaddpeer, onadd)

    }

    // The div that display the role.
    createPeerDiv(peer) {
        let uuid = "_" + uuidv4();
        let html = `
        <style>
        </style>
        <div id="${uuid}" class="item-div" style="">
            <div style="display: flex; align-items: center; padding: 5px; width: 100%;"> 
                <iron-icon icon="hardware:computer" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display:block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:200px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${peer.getHostname() + "@" + peer.getDomain()} (${peer.getMac()})</span>
                </div>
                <paper-icon-button icon="delete" id="${peer.getMac()}_btn"></paper-icon-button>
            </div>
            
        </div>`

        this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
        let div = this.shadowRoot.getElementById(uuid)
        div.parentNode.removeChild(div)
        return div
    }

    // Remove an accout from the list.
    removeItem(p) {
        this.list = this.list.filter(el => el.getId() !== p.getId())
    }

    displayItem(p) {
        let div = this.createPeerDiv(p)
        let deleteBtn = div.querySelector("paper-icon-button")
        deleteBtn.icon = "delete"

        if (this.ondeleteitem != undefined) {
            deleteBtn.onclick = () => {
                // remove the div...
                div.parentNode.removeChild(div)
                this.ondeleteitem(p)
            }
        } else {
            deleteBtn.style.display = "none"
        }

        return div
    }

    // That function can be overide, assume a string by default
    filter(p) {
        return p.getHostname().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1 || p.getMac().toUpperCase().indexOf(this.filter_.toUpperCase()) != -1
    }

    // The sort items function
    sortItems() {
        // Sort account...
        return this.list.sort((a, b) => (a.getMac() > b.getMac()) ? 1 : -1)
    }
}

customElements.define('globular-searchable-peer-list', SearchablePeerList)
