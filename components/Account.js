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

import { Menu } from "./Menu";
import { Model } from "../Model";
import { theme } from "./Theme";
import { AccountExistRsp } from "globular-web-client/resource/resource_pb";

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
  }

  init() {
    //super.init()
    this.account = null;

    // Set the data url.
    Model.eventHub.subscribe("update_profile_picture_event_",
      (uuid) => { },
      (dataUrl) => {
        this.setProfilePicture(dataUrl)
      },
      true)

    // Reset the account.
    Model.eventHub.subscribe("logout_event_",
      (uuid) => { },
      (dataUrl) => {
        this.account = null;
        this.resetProfilePicture()
      },
      true)

    // Refresh account event.

  }

  // Set the account information.
  setAccount(account) {
    this.account = account;
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
                    width: 40px;
                    height: 40px;
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
                            ${account._id}
                        </span>
                        <span id="account-header-email">
                            ${account.email}
                        </span>
                    </div>
                </div>
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
    console.log(this.ico)
    if (this.ico != undefined) {
      this.ico.style.display = "none";
    }

    if (isClose) {
      this.shadowRoot.removeChild(this.getMenuDiv());
    }
  }
}

customElements.define("globular-account-menu", AccountMenu);
