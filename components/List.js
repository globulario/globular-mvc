import { theme } from "./Theme";
import { v4 as uuidv4 } from "uuid";
import { ContactCard } from "./Contact";
import { Account } from "../Account";

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
            ${theme}
            .header{
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .item-div:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .item-div{
                padding: 5px;
                display: flex; 
                align-items: center;
            }

            .icon-button{
                cursor: pointer;
            }

        </style>
        
        <div id="header-div" class="header">
            <div style="flex-grow: 1;  padding: 5px;">
                <span class="title">${title} (${list.length})</span>
                <paper-input type="text" label="Filter ${title}" width="100"></paper-input>
            </div>
            <div class="icon-button" style="display: flex; width: 24px; height: 24px; justify-content: center; align-items: center;position: relative;">
                <iron-icon  id="action-add-btn"  icon="add" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                <paper-ripple class="circle" recenters=""></paper-ripple>
            </div>
        </div>
        <div id="shadow-div" style="width: 100%; height: 5px;"></div>
        <div id="items-div" style="width: 100%;max-height: 200px; min-width: 550px; overflow-y: auto; maring-top: 5px; margin-bottom: 5px;"></div>
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
    getHeader(){
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

    // The function that display one item.
    displayItem(item) {
        let uuid = "_" + uuidv4();
        let html = `
        <div id="${uuid}" class="item-div" style="">
            <span style="flex-grow: 1;">${item}</span>
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
                    ${theme}
                    #add-role-user-panel{
                        position: absolute;
                        right: 0px;
                        z-index: 1;
                    }

                    .card-content{
                        overflow-y: auto;
                        min-width: 400px;
                    }

                </style>
                <paper-card id="add-role-user-panel">
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
                let panel = headerDiv.querySelector("#add-role-user-panel")

                if (panel == undefined) {
                    headerDiv.appendChild(document.createRange().createContextualFragment(html))
                    panel = headerDiv.querySelector("#add-role-user-panel")
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
            <div style="display: flex; align-items: center; padding: 5px;  width: 100%;"> 
                <img style="width: 40px; height: 40px; display: ${account.profilPicture_ == undefined ? "none" : "block"};" src="${account.profilPicture_}"></img>
                <iron-icon icon="account-circle" style="width: 40px; height: 40px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${account.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                <div style="display: flex; flex-direction: column; width:300px; font-size: .85em; padding-left: 8px; flex-grow: 1;">
                    <span>${account.name}</span>
                    <span>${account.email_}</span>
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
    removeItem(a){
        this.list = this.list.filter(el => el._id !== a._id)
    }

    displayItem(a) {
        let div = this.createAccountDiv(a)
        let deleteBtn =  div.querySelector("paper-icon-button")
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
