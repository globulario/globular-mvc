// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import "@polymer/iron-icon/iron-icon.js";
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/iron-icons.js";
import "@polymer/paper-icon-button/paper-icon-button.js";
import "@polymer/paper-ripple/paper-ripple.js";
import "@polymer/paper-input/paper-input.js";
import "@polymer/paper-card/paper-card.js";
import "@polymer/paper-button/paper-button.js";
import "@polymer/paper-checkbox/paper-checkbox.js";
import "./Session"

import { Menu } from "./Menu";
import { Model } from "../Model";
import { theme } from "./Theme";
import { AccountExistRsp, AddAccountRoleRqst, AddGroupMemberAccountRqst, AddOrganizationAccountRqst, DeleteAccountRqst, GetAccountsRqst, RegisterAccountRqst, RemoveAccountRoleRqst, RemoveGroupMemberAccountRqst, RemoveOrganizationAccountRqst } from "globular-web-client/resource/resource_pb";
import { getAllGroups, getAllRoles } from 'globular-web-client/api';
import { getAllOrganizations } from "./Organization";
import { SearchableGroupList, SearchableOrganizationList, SearchableRoleList } from "./List";
import { ApplicationView } from "../ApplicationView";
import { localToGlobal } from "./utility";
import { Picker } from "emoji-picker-element";


export function getAllAccountsInfo(callback, errorCallback) {
  let rqst = new GetAccountsRqst
  rqst.setQuery("{}")
  let accounts = [];

  let stream = Model.globular.resourceService.getAccounts(rqst, 
    { domain: Model.domain, 
      address: Model.address, 
      application: 
      Model.application, 
      token: localStorage.getItem("user_token") });

  // Get the stream and set event on it...
  stream.on("data", (rsp) => {
    rsp.getAccountsList().forEach(a=>{
      if(localStorage.getItem(a.getId())!=undefined){
        let data = JSON.parse(localStorage.getItem(a.getId()))
        a.profilPicture_ = data.profilPicture_
        a.firstName_ = data.firstName_
        a.lastName_ = data.lastName_
      }
      accounts.push(a)
    })
  });

  stream.on("status", (status) => {
    if (status.code == 0) {
      callback(accounts);
    } else {
      errorCallback({ message: status.details });
    }
  });
}


/**
 * Login/Register functionality.
 */
export class AccountMenu extends Menu {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super("account", "account-circle", "session");
    this.ico = null;
    this.img = null;
    this.accountUpdateListener = null;
  }

  init() {
    //super.init()
    this.account = null;

    // Reset the account.
    Model.eventHub.subscribe("logout_event_",
      (uuid) => { },
      (dataUrl) => {
        this.account = null;
        this.resetProfilePicture()
      },
      true, this)

    // Refresh account event.

  }

  // Set the account information.
  setAccount(account) {
    this.account = account;

    // Set the data url.
    Model.eventHub.subscribe(`__update_account_${account._id}_data_evt__`,
      (uuid) => {
        this.accountUpdateListener = uuid;
      },
      (data) => {
        this.setProfilePicture(data.profilPicture_)
      },
      true, this)

    let html = `
            <style>
                ${theme}

                #accout-menu-header{
                    display: flex;
                    font-size: 12pt;
                    line-height: 1.6rem;
                    align-items: center;
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                    margin-bottom: 16px;
                }

                #account-header-id{
                    font-weight: 500;
                }

                #account-header-id{
                    
                }

                #icon-div iron-icon{
                    height: 40px;
                    width: 40px;
                    padding-right: 10px;
                }

                #profile-picture{
                    width: 64px;
                    height: 64px;
                    padding-right: 10px;
                    border-radius: 20px;
                    border: 1px solid transparent;
                    display: none;
                }

                #profile-picture:hover{
                    cursor: pointer;
                }

                #icon-div iron-icon:hover{
                    cursor: pointer;
                }

                #profile-icon {
                    fill: var(--palette-text-primary);
                }

                .card-actions{
                  display: flex;
                  justify-content: flex-end;
                  background-color: var(--palette-background-paper);
                  color: var(--palette-text-primary);
                }
            </style>

            <div class="card-content">
                <div id="accout-menu-header">
                    <div id="icon-div" title="click here to change profile picture">
                        <iron-icon id="profile-icon" icon="account-circle"></iron-icon>
                        <img id="profile-picture"></img>
                    </div>
                    <div>
                        <span id="account-header-id">
                            ${account.name}
                        </span>
                        <span id="account-header-email">
                            ${account.email}
                        </span>
                    </div>
                </div>
                <globular-session-state account="${account.id}" editable state="online"></globular-session-state>
            </div>
            <div class="card-actions">
              <paper-button id="settings_btn" >settings
                <iron-icon style="padding-left: 5px;" icon="settings"></iron-icon>
              </paper-button> 
              <paper-button id="logout_btn" >logout 
                  <iron-icon style="padding-left: 5px;" icon="exit-to-app"></iron-icon> 
              </paper-button>              
          </div>
        `;

    let range = document.createRange();
    this.getMenuDiv().innerHTML = ""; // remove existing elements.
    this.getMenuDiv().appendChild(range.createContextualFragment(html));

    // Action's
    this.shadowRoot.appendChild(this.getMenuDiv());

    // The Settings event.
    this.shadowRoot.getElementById("settings_btn").onclick = () => {
      Model.eventHub.publish("settings_event_", {}, true);
    };
    // The logout event.
    this.shadowRoot.getElementById("logout_btn").onclick = () => {
      Model.eventHub.publish("logout_event_", {}, true);
    };

    this.img = this.shadowRoot.getElementById("profile-picture");
    this.ico = this.shadowRoot.getElementById("profile-icon");

    if (account.profilPicture_ != undefined) {
      this.setProfilePicture(account.profilPicture_);
    }

    this.shadowRoot.removeChild(this.getMenuDiv());
  }

  resetProfilePicture() {
    // reset the display
    this.getIcon().style.display = "block";
    this.getImage().style.display = "none";
    this.getImage().src = "";

    if (this.img != undefined) {
      this.img.src = "";
      this.img.style.display = "none";
    }

    if (this.ico != undefined) {
      this.ico.style.display = "block";
    }
  }

  /**
   * Set the profile picture with the given data url.
   * @param {*} dataUrl
   */
  setProfilePicture(dataUrl) {

    // The account, and data url must be valid.
    if (this.account == null) {
      this.resetProfilePicture()
      return;
    }

    if (dataUrl == undefined) {
      this.resetProfilePicture()
      return
    }

    if (dataUrl.length == 0) {
      this.resetProfilePicture()
      return;
    }

    // Here the account has a profile picture.
    this.getIcon().style.display = "none";
    this.getImage().style.display = "block";
    this.getImage().src = dataUrl;

    // The profile in the menu.
    let isClose =
      this.shadowRoot.getElementById("profile-picture") == undefined;
    if (isClose) {
      this.shadowRoot.appendChild(this.getMenuDiv());
    }

    if (this.img != undefined) {
      this.img.src = dataUrl;
      this.img.style.display = "block";
    }

    if (this.ico != undefined) {
      this.ico.style.display = "none";
    }

    if (isClose) {
      this.shadowRoot.removeChild(this.getMenuDiv());
    }
  }
}

customElements.define("globular-account-menu", AccountMenu);


/**
 * The way to manage account informations.
 */
export class AccountManager extends HTMLElement {
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

                #create-account-btn{
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
                <paper-icon-button icon="add" id="create-account-btn"></paper-icon-button>
             </div>
             `

    // give the focus to the input.
    let content = this.shadowRoot.querySelector(".card-content")

    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")

    let displayAccounts = () => {
      content.innerHTML = ""
      // Here I will get the list of all accounts.
      getAllAccountsInfo(
        (accounts) => {
          accounts.forEach(a => {
            if (a.getId() != "admin" && a.getId() != "guest") {
              let panel = new AccountPanel(a)
              content.appendChild(panel)
            }
          })
        }, err => { ApplicationView.displayMessage(err, 3000) })
    }

    // call once
    displayAccounts()

    Model.globular.eventHub.subscribe("refresh_account_evt", uuid => { }, evt => {
      displayAccounts()
    }, true)

    let createAccountBtn = this.shadowRoot.querySelector("#create-account-btn")
    createAccountBtn.onclick = () => {
      let html = `
            <style>
                ${theme}
                #create-account-panel{
                    position: absolute;
                    right: 0px;
                    top: 0px;
                    z-index: 1;
                    background-color: var(--palette-background-paper);
                }
                #create-account-panel .card-content{
                    min-width: 200px;
                    padding: 0px 10px 0px 10px;
                    display: flex;
                    flex-direction: column;
                }

            </style>
            <paper-card id="create-account-panel">
                <div style="display: flex; align-items: center;">
                    <div style="flex-grow: 1; padding: 5px;">
                        Create account
                    </div>
                    <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                </div>
                <div class="card-content">
                    <paper-input></paper-input>
                    <paper-button style="align-self: end;">Create</paper-button>
                </div>
            </paper-card>
            `

      let panel = container.querySelector("#create-account-panel")
      let input = null
      if (panel == undefined) {
        container.appendChild(document.createRange().createContextualFragment(html))
        panel = container.querySelector("#create-account-panel")
        let closeBtn = panel.querySelector("#cancel-btn")
        closeBtn.onclick = () => {
          panel.parentNode.removeChild(panel)
        }

        input = panel.querySelector("paper-input")
        let createAccountButton = panel.querySelector("paper-button")

        // Create a new account.
        createAccountButton.onclick = () => {
          let accountId = input.value;
          if (accountId.length == 0) {
            ApplicationView.displayMessage("No account name was given!", 3000)
            setTimeout(() => {
              input.focus()
            }, 100)
            return
          }

          let rqst = new RegisterAccountRqst()

          let account = new account()
          account.setId(accountId)
          account.setName(accountId)
          account.setPassword("1234")
          rqst.setConfirmPassword("1234")

          rqst.setAccount(account)
          Model.globular.resourceService.registerAccount(rqst, 
            { domain: Model.domain, 
              address: Model.address,
              application: Model.application, 
              token: localStorage.getItem("user_token") 
            })
            .then(rsp => {
              ApplicationView.displayMessage("account " + accountId + " was created!", 3000)
              panel.parentNode.removeChild(panel)
              displayAccounts()
            }).catch(err => {
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

customElements.define('globular-account-manager', AccountManager)

/**
 * Display account informations in the manager panel.
 */
export class AccountPanel extends HTMLElement {
  // attributes.
  // Create the applicaiton view.
  constructor(a) {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    // Keep account informations.
    this.account = a;

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
                border-bottom: 1px solid var(--palette-background-default);
                min-width: 500px;
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

            img, iron-icon{
              margin: 8px;
            }

            #collapse-panel{
                display: flex;
                flex-direction: column;
                width: 90%;
            }

            #delete-account-btn{
              font-size: .85rem;
              max-height: 32px;
            }
        </style>
        <div id="container">
            <div class="header">
            <img style="width: 32px; height: 32px; display: ${this.account.profilPicture_ == undefined ? "none" : "block"};" src="${this.account.profilPicture_}"></img>
            <iron-icon icon="account-circle" style="width: 32px; height: 32px; --iron-icon-fill-color:var(--palette-action-disabled); display: ${this.account.profilPicture_ != undefined ? "none" : "block"};"></iron-icon>
                <span class="title">${this.account.getName() + "@" + this.account.getDomain()}</span>
                <paper-button id="delete-account-btn">Delete</paper-button>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapse-panel"  style="width: 90%;" >
                <paper-tabs selected="0">
                    <paper-tab id="account-organizations-tab">Organizations</paper-tab>
                    <paper-tab id="account-roles-tab">Roles</paper-tab>
                    <paper-tab id="account-groups-tab">Groups</paper-tab>
                </paper-tabs>
                <div id="content">
                </div>
            </iron-collapse>
        </div>
        `
    let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
    let content = this.shadowRoot.querySelector("#content")
    this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

    // Aggregations
    this.organizationsList = null
    this.rolesList = null
    this.groupsList = null


    this.shadowRoot.querySelector("#account-organizations-tab").onclick = () => {
      if (this.organizationsList != undefined)
        this.organizationsList.style.display = ""
      if (this.rolesList != undefined)
        this.rolesList.style.display = "none"
      if (this.groupsList != undefined)
        this.groupsList.style.display = "none"
    }

    this.shadowRoot.querySelector("#account-groups-tab").onclick = () => {
      if (this.organizationsList != undefined)
        this.organizationsList.style.display = "none"
      if (this.rolesList != undefined)
        this.rolesList.style.display = "none"
      if (this.groupsList != undefined)
        this.groupsList.style.display = ""
    }

    this.shadowRoot.querySelector("#account-roles-tab").onclick = () => {
      if (this.organizationsList != undefined)
        this.organizationsList.style.display = "none"
      if (this.rolesList != undefined)
        this.rolesList.style.display = ""
      if (this.groupsList != undefined)
        this.groupsList.style.display = "none"
    }

    let deleteBtn = this.shadowRoot.querySelector("#delete-account-btn")
    deleteBtn.onclick = () => {
      this.onDeleteaccount(a)
    }

    // Organization list.
    getAllOrganizations(
      organizations => {
        // I will get the account object whit the given id.
        let list = []
        this.account.getOrganizationsList().forEach(organizationId => {
          let o_ = organizations.find(o => o.getId() === organizationId);
          if (o_ != undefined) {
            list.push(o_)
          }
        })

        this.organizationsList = new SearchableOrganizationList("Organizations", list,
          o => {
            this.organizationsList.removeItem(o)
            let rqst = new RemoveOrganizationAccountRqst
            rqst.setOrganizationid(o.getId())
            rqst.setAccountid(a._id)
            Model.globular.resourceService.removeOrganizationAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.organizationsList.removeItem(a)
                ApplicationView.displayMessage("Account " + a._id + " was removed from account " + o.getName(), 3000)
              }).catch(err => {
                this.organizationsList.appendItem(a) // set it back
                ApplicationView.displayMessage(err, 3000)
              })
          },
          o => {
            let rqst = new AddOrganizationAccountRqst
            rqst.setOrganizationid(o.getId())
            rqst.setAccountid(a._id)
            Model.globular.resourceService.addOrganizationAccount(rqst, { domain: Model.domain,address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.organizationsList.appendItem(a)
                ApplicationView.displayMessage("Account " + a._id + " has now organization " + o.getName(), 3000)
              }).catch(err => {
                this.organizationsList.removeItem(a)
                ApplicationView.displayMessage(err, 3000)
              })

          })

        content.appendChild(this.organizationsList)

      }, err => {
        ApplicationView.displayMessage(err, 3000)
      })


    // The role list.
    getAllRoles(Model.globular,
      roles => {

        // I will get the account object whit the given id.
        let list = []
        this.account.getRolesList().forEach(roleId => {
          let r_ = roles.find(r => r.getId() === roleId);
          if (r_ != undefined) {
            list.push(r_)
          }
        })

        this.rolesList = new SearchableRoleList("Roles", list,
          r => {
            this.rolesList.removeItem(r)
            let rqst = new RemoveAccountRoleRqst
            rqst.setAccountid(a.getId())
            rqst.setRoleid(r.getId())
            Model.globular.resourceService.removeAccountRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.rolesList.removeItem(r)
                ApplicationView.displayMessage("Role " + r.getName() + " was removed from account " + a.getName(), 3000)
              }).catch(err => {
                this.rolesList.appendItem(r) // set it back
                ApplicationView.displayMessage(err, 3000)
              })
          },
          r => {
            let rqst = new AddAccountRoleRqst
            rqst.setAccountid(a.getId())
            rqst.setRoleid(r.getId())
            Model.globular.resourceService.addAccountRole(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.rolesList.appendItem(r)
                ApplicationView.displayMessage("Role " + r.getName() + " has now account " + a.getName(), 3000)
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
        this.account.getGroupsList().forEach(groupId => {
          let g_ = groups.find(g => g.getId() === groupId);
          if (g_ != undefined) {
            list.push(g_)
          }
        })

        this.groupsList = new SearchableGroupList("Groups", list,
          g => {
            this.groupsList.removeItem(g)
            let rqst = new RemoveGroupMemberAccountRqst
            rqst.setAccountid(a.getId())
            rqst.setGroupid(g.getId())
            Model.globular.resourceService.removeGroupMemberAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.groupsList.removeItem(g)
                ApplicationView.displayMessage("Group " + g.getName() + " was removed from account " + a.getName(), 3000)
              }).catch(err => {
                this.groupsList.appendItem(g) // set it back
                ApplicationView.displayMessage(err, 3000)
              })
          },
          g => {
            let rqst = new AddGroupMemberAccountRqst
            rqst.setAccountid(a.getId())
            rqst.setGroupid(g.getId())
            Model.globular.resourceService.addGroupMemberAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
              .then(rsp => {
                this.groupsList.appendItem(g)
                ApplicationView.displayMessage("Group " + g.getName() + " has now account " + a.getName(), 3000)
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

  onDeleteaccount(a) {
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
          <div id="yes-no-account-delete-box">
            <div>Your about to delete the account ${a.getName()}</div>
            <div>Is it what you want to do? </div>
            <div style="justify-content: flex-end;">
              <paper-button id="yes-delete-account">Yes</paper-button>
              <paper-button id="no-delete-account">No</paper-button>
            </div>
          </div>
          `,
      15000 // 15 sec...
    );

    let yesBtn = document.querySelector("#yes-delete-account")
    let noBtn = document.querySelector("#no-delete-account")

    // On yes
    yesBtn.onclick = () => {

      let rqst = new DeleteAccountRqst
      rqst.setId(a.getId())
      Model.globular.resourceService.deleteAccount(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
        ApplicationView.displayMessage(
          "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>account named " +
          a.getName() +
          " was deleted!</div>",
          3000
        );
        Model.globular.eventHub.publish("refresh_account_evt", {}, true)
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

  connectedCallback() {
    this.shadowRoot.querySelector("#account-organizations-tab").click()
  }
}

customElements.define('globular-account-panel', AccountPanel)



