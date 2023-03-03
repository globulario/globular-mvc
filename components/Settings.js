
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-input/paper-textarea.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js'
import '@polymer/iron-collapse/iron-collapse.js';
import "@polymer/iron-icons/image-icons";

import { v4 as uuidv4 } from "uuid";
import { ImageCropper } from "./Image";
import { Camera } from "./Camera";
import { FileExplorer } from "./File"

import { Model } from "../Model";
import { ApplicationView } from "../ApplicationView";
import * as getUuidByString from "uuid-by-string";

/**
 * This is the side menu that will be set on left when the user wants to change it settings
 * <globular-settings-side-menu>
 *   <globular-settings-side-menu-item icon="account-box" name="User setting's"> </globular-settings-side-menu-item>
 *   <globular-settings-side-menu-item icon="application" name="Application setting's"> </globular-settings-side-menu-item>
 * </globular-settings-side-menu>
 */
export class SettingsMenu extends HTMLElement {
  constructor() {
    super();
    this.container = null;
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
      
       #container {
           display: flex;
           flex-direction: column;
       }

       globular-settings-side-menu-item.active{
          color: var(--palette-warning-dark);
       }

    </style>
    <div id="container">
      
    </div>
    `;

    this.container = this.shadowRoot.getElementById("container")

  }

  connectedCallback() {

    // Set the first item after the Exit menu of course.
    this.show()

  }

  show() {
    if (this.container.childNodes.length > 1) {
      this.container.childNodes[1].click()
    }
  }

  clear() {
    this.container.innerHTML = '';
    let item = this.appendSettingsMenuItem("exit-to-app", "Exit")
    item.style.order = 1; // That set the item at last position.
  }

  appendSettingsMenuItem(icon, title) {

    const html = `<globular-settings-side-menu-item id="${title}_settings_menu_item" icon="${icon}" title="${title}"> </globular-settings-side-menu-item>`;
    const range = document.createRange()
    this.container.appendChild(range.createContextualFragment(html))

    let item = this.shadowRoot.getElementById(title + "_settings_menu_item")

    item.onclick = () => {
      let elements = this.shadowRoot.querySelectorAll(".active")
      elements.forEach((element) => {
        element.classList.remove("active")
      })
      item.classList.add("active")
      Model.eventHub.publish("set-settings-page", title, true)

      // close the side menu if it's open...
      ApplicationView.layout.appDrawer.close()
    }
    return item;
  }

}

customElements.define("globular-settings-side-menu", SettingsMenu);

/**
 * This is the settings side menue item's cotains in the SettingsSideMenu
 */
export class SettingsSideMenuItem extends HTMLElement {
  constructor() {
    super();
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    const icon = this.getAttribute("icon")
    const title = this.getAttribute("title")
    this.container = null;
    this.titleDiv = null;

    this.shadowRoot.innerHTML = `
    <style>
      
       #container {
           display: flex;
           position: relative;
           align-items: center;
           padding-left: 10px;
           padding-top: 10px;
           padding-bottom: 10px;
           margin-right: 10px;
           font-weight: 500;
           font-size: .75em;
           transition: background 0.2s ease,padding 0.8s linear;
           background: var(--palette-background-default);
           border-radius: 4px;
       }

       #button{
          display: flex;
          padding-right: 24px;
       }

       #container:hover{
          cursor: pointer;
          -webkit-filter: invert(10%);
          filter: invert(10%);
        }

    </style>
    <div id="container">
        <div id="button">
          <slot></slot>
          <iron-icon id="icon" icon="${icon}"></iron-icon>
        </div>
        <div id="title-div">${title}</div>
        <paper-ripple recenters></paper-ripple>
    </div>
    `;
  }

  clear() {
    this.container.innerHTML = '';
  }

  // attach event here.
  connectedCallback() {
    this.container = this.shadowRoot.getElementById("container")
    this.titleDiv = this.shadowRoot.getElementById("title-div")
    if (this.hasAttribute("icon")) {
      if (this.getAttribute("icon").length == 0) {
        this.shadowRoot.querySelector("#icon").style.display = "none";
      }
    }
  }
}

customElements.define("globular-settings-side-menu-item", SettingsSideMenuItem);

/**
 * This is the settings panel it connect with the side menu to display the correct page.
 * It must be set in the workspace when the user select the gear button.
 * ex.
 * <globular-settings-panel>
 *  <globular-settings-page>
 *      <globular-settings title="Apparance">
 *         <slot>
 *              <div> <div>
 *         </slot>
 *      </globular-settings>
 *      <globular-settings title="Search engine">
 *         <slot>
 *              <div> <div>
 *         </slot>
 *      </globular-settings>
 *  </globular-settings-page>
 * </globular-settings-panel>
 */
export class SettingsPanel extends HTMLElement {
  constructor() {
    super();
    this.container = null;

    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    // Connect to event.
    this.shadowRoot.innerHTML = `
    <style>
      
       #container {
           display: inline-flex;
           flex-direction: column;
           margin-top: 25px;
       }


    </style>
    <div id="container">
      <slot></slot>
    </div>
    `;

    this.container = this.shadowRoot.getElementById("container")
  }

  clear() {
    let yesNoSetting = new YesNoSetting("", "Do you wish to save your settings?",
      () => {
        // Save the setting's
        Model.eventHub.publish("save_settings_evt", true, true)
      },
      () => {
        // Not save the setting's
        Model.eventHub.publish("save_settings_evt", false, true)
      })
    this.shadowRoot.getElementById("container").innerHTML = "<slot></slot>";
    let section = this.appendSettingsPage("Exit").appendSettings("Exit", "Returning to the application...")
    section.appendChild(yesNoSetting)
  }

  appendSettingsPage(title) {
    const html = `<globular-settings-page id="${title}_settings_page" title="${title}"></globular-settings-page>`;
    const range = document.createRange()
    //this.container.appendChild(range.createContextualFragment(html))
    this.appendChild(range.createContextualFragment(html))
    // const page = this.shadowRoot.querySelector("#" + title + "_settings_page")
    const page = this.querySelector("#" + title + "_settings_page")
    page.init()
    return page
  }

}

customElements.define("globular-settings-panel", SettingsPanel);

/**
 * This is the settings page
 */
export class SettingsPage extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    this.title = this.getAttribute("title")
    this.subtitle = this.getAttribute("subtitle")

    // Connect to event.
    this.shadowRoot.innerHTML = `
    <style>
      
       #container {
           display: none;
           flex-direction: column;
       }
    </style>
    <div id="container">
      <slot></slot>
    </div>
    `;

    this.container = this.shadowRoot.getElementById("container")
  }

  getSettings() {
    return this.container.childNodes;
  }

  connectedCallback() {

  }

  // Model.eventHub must be init.
  init() {
    Model.eventHub.subscribe("set-settings-page", (uuid) => { }, (pageId) => {
      if (this.title == pageId) {
        this.container.style.display = "flex"
      } else {
        this.container.style.display = "none"
      }
    }, true, this)
  }

  appendSettings(title, subtitle) {
    const id = "_" + uuidv4()// title.split(" ").join("");

    const html = `<globular-settings id="${id}" title="${title}" subtitle="${subtitle}"></globular-settings>`;
    const range = document.createRange()
    this.appendChild(range.createContextualFragment(html))
    const settings = this.querySelector("#" + id)
    return settings
  }
}



customElements.define("globular-settings-page", SettingsPage);

/**
 * This is the settings page
 */
export class Settings extends HTMLElement {
  constructor() {
    super();

    this.container = null;
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    this.title = this.getAttribute("title")
    this.subtitle = "";

    if (this.hasAttribute("subtitle")) {
      this.subtitle = this.getAttribute("subtitle")
    }

    // Connect to event.
    this.shadowRoot.innerHTML = `
    <style>
      

       #container {
           display: flex;
           flex-direction: column;
           margin-bottom: 10px;
           background-color: var(--palette-background-paper);
       }

        .card-title {
          font-size: 1.25rem;
          text-transform: uppercase;
          font-weight: 400;
          letter-spacing: .25px;
          outline: none;
          position: fixed;
          top: -50px;
        }

        .card-subtitle{
          padding: 24px;
          letter-spacing: .01428571em;
          font-family: Roboto,Arial,sans-serif;
          font-size: 1.125rem;
          font-weight: 400;
          line-height: 1.25rem;
          hyphens: auto;
          word-break: break-word;
          word-wrap: break-word;
          color: var(--cr-primary-text-color);
          flex-grow: 1;
        }

        .card-content{
          display: flex;
          flex-direction: column;
          min-width: 728px;
          padding: 0px;
          font-size: 1rem;
        }

        @media (max-width: 800px) {
          .card-content{
            min-width: 580px;
          }
        }

        @media (max-width: 600px) {
          .card-content{
            min-width: 380px;
          }
        }

        paper-card{
          background-color: var(--palette-background-paper);
          color: var(--palette-text-primary);
        }

        paper-button{
          display: flex;
          font-size: .85rem;
          border: none;
          color: var(--palette-text-accent);
          background: var(--palette-primary-accent);
          max-height: 32px;
        }

        .complex_setting_panel{
          display: none;
        }

        .complex_setting_panel #back-btn{
          display: block;
        }

        #hide-btn{
          align-self: center;
        }

        #back-btn{
          display: none;
        }

        #add-button {
          position: absolute;
          top: -40px;
          right: 0px;
          font-size: 1.25rem;
        }
       

    </style>
    <div id="container">
       <paper-card id="${this.id}">
            <h2 class="card-title">${this.title}</h2>
            <paper-icon-button id="add-button" icon="icons:add" style="display: none;"></paper-icon-button>
            <div style="display: flex; align-items: center;">
              <paper-icon-button id="back-btn"  icon="arrow-back"></paper-icon-button>
              <div class="card-subtitle">${this.subtitle}</div>
              <paper-icon-button id="hide-btn"  icon="unfold-more"></paper-icon-button>
            </div>
            <div class="card-content">
              <iron-collapse class="card-collapse"  opened = "[[opened]]">
                  <slot id="card-content"></slot>
              </iron-collapse>
            </div>
        </paper-card>
    </div>
    `;

    this.shadowRoot.getElementById("hide-btn").onclick = this.hideSettings.bind(this);
    this.container = this.shadowRoot.getElementById("container")
    this.backBtn = this.shadowRoot.getElementById("back-btn")
  }

  showAddButton() {
    this.shadowRoot.querySelector("#add-button").style.display = "block"
    return this.shadowRoot.querySelector("#add-button");
  }

  hideAddButton() {
    this.shadowRoot.querySelector("#add-button").style.display = "none"
  }

  hideSettings() {
    let button = this.shadowRoot.getElementById("hide-btn")
    let content = this.shadowRoot.querySelector(".card-collapse")
    if (button && content) {
      if (!content.opened) {
        button.icon = "unfold-more"
      } else {
        button.icon = "unfold-less"
      }
      content.toggle();
    }
  }

  addSetting(setting) {
    let e = setting.getElement()
    if (e != null) {
      e.tabIndex = this.childNodes.length
    }
    this.appendChild(setting)
  }
}

customElements.define("globular-settings", Settings);

/**
 * The user general settings.
 */
export class Setting extends HTMLElement {
  constructor(name, description, icon) {
    super();

    this.container = null;

    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    if (this.hasAttribute("name")) {
      name = this.getAttribute("name")
    }

    if (!this.hasAttribute("id")) {
      // generate a unique id.
      this.setAttribute("id", "_" + uuidv4())
    }

    // set icon to empty icon by default.
    if (icon == undefined) {
      icon = ""
    }

    // Connect to event.
    this.shadowRoot.innerHTML = `
    <style>
      

      .setting-name{
         line-height: 1.1rem;
         font-size: .85rem;
         font-weight: 500;
         flex-basis: 156px;
         letter-spacing: .07272727em;
         text-transform: uppercase;
         hyphens: auto;
         word-break: break-word;
         word-wrap: break-word;
       }

      .setting-description{
        font-size: 1rem;
        flex-basis: 328px;
        flex-grow: 1;
        letter-spacing: .00625em;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5rem;
        hyphens: auto;
        word-break: break-word;
        word-wrap: break-word;
        width: 100%;
      }

      #icon-left, icon-right {
        display: none;
      }

      a {
        font-size: 1rem;
      }

    </style>

    <iron-icon id="icon-left" icon="${icon}"></iron-icon>
    <div  id="name-div" class="setting-name">${name}</div>
    <div id="description-div" class="setting-description">${description}</div>
    <iron-icon id="icon-right" icon=""></iron-icon>

    `;



    // Set style property of the component itself.
    this.style.position = "relative"
    this.style.display = "flex"
    this.style.color = "var(--cr-primary-text-color)"
    this.style.fontFamily = "Roboto,Arial,sans-serif"
    this.style.alignItems = "center"
    this.style.padding = "15px 16px 16px 16px"

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        let w = entry.contentRect.width
        this.style.flexDirection = "row";
        this.style.alignItems = "center"
        this.shadowRoot.getElementById("name-div").style.flexBasis = "156px";
        this.shadowRoot.getElementById("description-div").style.flexBasis = "328px";
        let textArea = this.shadowRoot.querySelector("paper-textarea")
        if (textArea != undefined) {
          textArea.style.width = "0px"
        }
        let paperInput = this.shadowRoot.querySelector("paper-input")
        if (paperInput != undefined) {
          paperInput.style.width = ""
        }

        let nextPageBtn = this.shadowRoot.querySelector("#icon-right")
        nextPageBtn.style.position = "";
        nextPageBtn.style.right = "0px";

        if (w < 780) {
          this.shadowRoot.getElementById("name-div").style.flexBasis = "100px";
          this.shadowRoot.getElementById("description-div").style.flexBasis = "200px";
          if (w < 600) {
            nextPageBtn.style.position = "absolute";
            this.style.flexDirection = "column";
            nextPageBtn.style.top = "45%";
            this.shadowRoot.getElementById("name-div").style.flexBasis = "0px";
            this.shadowRoot.getElementById("description-div").style.flexBasis = "0px";
            this.style.alignItems = "flex-start"
            let textArea = this.shadowRoot.querySelector("paper-textarea")
            if (textArea != undefined) {
              textArea.style.width = "335px"
            }
            if (paperInput != undefined) {
              paperInput.style.width = "100%"
            }
          }
        }

      }
    });
    resizeObserver.observe(document.body);

    // The name (label) div
    this.name = this.shadowRoot.getElementById("name-div")

    // The description...
    this.description = this.shadowRoot.getElementById("description-div")

  }

  connectedCallback() {
  }

  getElement() { return null; }

  getValue() { return null; }

  getName() { return this.name.innerText; }

  getNameDiv() { return this.name; }

  getDescription() { return this.description.innerText; }

  getDescriptionDiv() { return this.description; }

  setDescription(value) {
    this.description.innerText = value
  }

}

customElements.define("globular-setting", Setting);


export class ConnectionsSetting extends HTMLElement {
  constructor(connections) {
    super();

    // That function is call when a new connection button is click.
    this.onCreateConnection = null

    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
       
        #container {
            display: flex;
            flex-direction: column;
        }

        globular-settings-side-menu-item.active{
          color: var(--palette-warning-dark);
        }



    </style>
    <div id="container">
        <slot></slot>
    </div>
    `;

    for (var name in connections) {
      this.addConnectionSetting(name, connections[name])
    }
  }

  // call when the element is insert in it parent.
  connectedCallback() {
    let addButton = this.parentNode.showAddButton()
    addButton.onclick = () => {
      if (this.onCreateConnection != null) {
        this.onCreateConnection()
      }
    }
  }

  addConnectionSetting(name, connection) {
    let connections = this.querySelectorAll("globular-connection-setting")
    for (var i = 0; i < connections.length; i++) {
      connections[i].hide()
    }

    let connectionSetting = new ConnectionSetting(name, connection)
    this.appendChild(connectionSetting)
    connectionSetting.show()
  }

  getElement() {
    return this.shadowRoot.querySelector("#container")
  }


}

customElements.define("globular-connections-setting", ConnectionsSetting);

/**
 * Generic connection setting...
 */
export class ConnectionSetting extends HTMLElement {

  constructor(name, connection) {
    super();

    // Set the connection.
    this.onDeleteConnection = null;

    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
    <style>
       
        #container{
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 1px solid var(--palette-background-default);
        }

        #content{
            padding: 15px;
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
        }

        .header{
            display: flex;
            align-items: center;
            width: 100%;
            transition: background 0.2s ease,padding 0.8s linear;
            background-color: var(--palette-background-paper);
        }

        .header paper-icon-button {
          min-width: 40px;
        }


        .header:hover{
            -webkit-filter: invert(10%);
            filter: invert(10%);
        }

        .title{
            flex-grow: 1;
            margin: 8px;
            font-size: 1.1rem;
        }
        
        img, iron-icon{
            margin: 8px;
        }

        #collapse-panel{
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        #delete-btn {
            font-size: .85rem;
            max-height: 32px;
        }

        .table{
          display: table;
        }

        .row{
          display: table-row;
        }

        .cell{
          display: table-cell;
          vertical-align: middle;
        }

        #content {
            display: flex; 
            flex-direction: column;
            margin: 10px;
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
        }

      </style>
      <div id="container">
          <div class="header">
              <span class="title">${name}</span>
              <paper-button id="delete-btn" icon="delete">DELETE</paper-button>
              <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                  <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                  <paper-ripple class="circle" recenters=""></paper-ripple>
              </div>
              
          </div>
          <iron-collapse id="collapse-panel"  >
              <div id="content" class="table">
           
              </div>
          </iron-collapse>
      </div>
    `;

    let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
    this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

    let deleteBtn = this.shadowRoot.querySelector("#delete-btn")
    deleteBtn.onclick = () => {

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
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-connection-delete-box">
              <div>Your about to delete connection <span style="font-style: italic;">${connection.Id}</span></div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button id="yes-delete-connection">Yes</paper-button>
                <paper-button id="no-delete-connection">No</paper-button>
              </div>
            </div>
            `,
        15000 // 15 sec...
      );

      let yesBtn = document.querySelector("#yes-delete-connection")
      let noBtn = document.querySelector("#no-delete-connection")

      // On yes
      yesBtn.onclick = () => {
        this.parentNode.removeChild(this)
        if (this.onDeleteConnection) {

          this.onDeleteConnection()
        }

      }

      noBtn.onclick = () => {
        toast.dismiss();
      }
    }

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

    this.appendConnectionBody(connection)
  }

  show() {
    let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
    let button = this.shadowRoot.querySelector("#hide-btn")
    if (button && togglePanel) {
      if (!togglePanel.opened) {
        button.icon = "unfold-more"
        togglePanel.toggle();
      }
    }
  }

  hide() {
    let togglePanel = this.shadowRoot.querySelector("#collapse-panel")
    let button = this.shadowRoot.querySelector("#hide-btn")
    if (button && togglePanel) {
      if (togglePanel.opened) {
        button.icon = "unfold-less"
        togglePanel.toggle();
      }
    }
  }

  appendConnectionBody(connection) {
    let html = `
      <div class="row">
        <div class="cell">id</div>
        <paper-input id="id-input" class="cell"></paper-input>
      </div>
      <div class="row">
        <div class="cell">host</div>
        <paper-input id="host-input" class="cell"></paper-input>
      </div>
      <div class="row">
        <div class="cell">user</div>
        <paper-input id="user-input" class="cell"></paper-input>
      </div>
      <div class="row">
        <div class="cell">password</div>
        <paper-input id="password-input" type="password" class="cell"></paper-input>
      </div>
      <div class="row">
        <div class="cell">port</div>
        <paper-input id="port-input" type="number" min="1" step="1"  class="cell"></paper-input>
      </div>
    `
    let content = this.shadowRoot.querySelector("#content")
    let range = document.createRange()
    content.appendChild(range.createContextualFragment(html))

    // Set the values.
    this.id_input = content.querySelector("#id-input");
    this.id_input.value = connection.Id
    this.id_input.onchange = () => {
      connection.Id = this.id_input.value
      if (this.onchange) {
        this.onchange()
      }
    }

    this.id_input.onkeyup = () => {
      this.shadowRoot.querySelector(".title").innerHTML = this.id_input.value
    }

    this.host_input = content.querySelector("#host-input");
    this.host_input.value = connection.Host
    this.host_input.onchange = () => {
      connection.Host = this.host_input.value
      if (this.onchange) {
        this.onchange()
      }
    }

    this.user_input = content.querySelector("#user-input");
    this.user_input.value = connection.User
    this.user_input.onchange = () => {
      connection.User = this.user_input.value
      if (this.onchange) {
        this.onchange()
      }
    }

    this.password_input = content.querySelector("#password-input");
    this.password_input.value = connection.Password
    this.password_input.onchange = () => {
      connection.Password = this.password_input.value
      if (this.onchange) {
        this.onchange()
      }
    }

    this.port_input = content.querySelector("#port-input");
    this.port_input.value = connection.Port
    this.port_input.onchange = () => {
      connection.Port = this.port_input.value
      if (this.onchange) {
        this.onchange()
      }
    }



  }

}

customElements.define("globular-connection-setting", ConnectionSetting);

/**
 * That class must be use for setting that need more informations.
 */
export class ComplexSetting extends Setting {
  constructor(name, description, icon) {
    super(name, description);
    let range = document.createRange()
    let html = `
      <style>
     
        #icon-right:hover{
          cursor: pointer;
        }
    `
    this.shadowRoot.appendChild(range.createContextualFragment(html))
    this.actionBtn = this.shadowRoot.getElementById("icon-right")
    this.actionBtn.icon = "chevron-right"
    this.actionBtn.style.display = "block";

    this._parentPage = null;
    this._parentPage = null;
    this._container = null;
    this._panel = null;
    this._settings = {};

    this.actionBtn.onclick = () => {
      for (var i = 0; i < this._parentPage.children.length; i++) {
        let node = this._parentPage.children[i];
        node.style.display = "none"
      }

      // display the settings.
      this._panel.style.display = "block"

      if (this._panel.children.length > 0) {
        let e = this._panel.children[0].getElement()
        if (e != undefined) {
          e.focus()
        }
      }

    }

  }

  getElement() {
    return this._panel;
  }

  // add settings...
  addSetting(setting) {
    this._settings[setting.id] = setting;
  }

  // Get the parent page of the complex settings.
  getParentPage(node) {
    if (node.parentNode != undefined) {
      if (node.parentNode.tagName == "GLOBULAR-SETTINGS-PAGE") {
        return node.parentNode
      }
      return this.getParentPage(node.parentNode);
    }
    return null;
  }

  connectedCallback() {
    // did it onces...
    if (this._parentPage == null) {
      this._parentPage = this.getParentPage(this);

      this._panel = this._parentPage.appendSettings(this.getName(), this.getDescription())
      this._panel.style.display = "none"
      this._panel.backBtn.style.display = "block"
      this._panel.classList.add("complex_setting_panel")

      // hide the panel and display back the content of the page.
      this._panel.backBtn.onclick = () => {
        for (var i = 0; i < this._parentPage.children.length; i++) {
          let node = this._parentPage.children[i];
          if (!node.classList.contains("complex_setting_panel")) {
            node.style.display = ""
          }
        }

        // display the settings.
        this._panel.style.display = "none"
      }

      // add the settings.
      for (var id in this._settings) {
        this._panel.addSetting(this._settings[id])
      }

    }
  }

  getSetting(id) { return this._settings[id] }
}

customElements.define("globular-complex-setting", ComplexSetting);

/**
 * Set string setting...
 */
export class ReadOnlyStringSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

    let html = `
      <style>
     
      #setting-span{
         flex-grow: 1;
         font-size: 1rem;
        }
      </style>
      <span id="setting-span" label=""></span>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.span = this.shadowRoot.getElementById("setting-span");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.span.label = description;
    }
    this.span.setAttribute("title", description);
    this.span.onblur = () => {
      if (this.onblur != null) {
        this.onblur()
      }
    }
  }

  getElement() {
    return this.span;
  }

  getValue() {
    return this.span.innerHTML
  }

  setValue(value) {
    this.span.innerHTML = value;
  }

}

customElements.define("globular-read-only-string-setting", ReadOnlyStringSetting);

/**
 * Set string setting...
 */
export class LinkSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

    let html = `
      <style>
     
      #setting-span{
         flex-grow: 1;
         font-size: 1rem;
         color: var(--cr-primary-text-color);
        }
      </style>
      <a style="color: var(--cr-primary-text-color);" target="_blank" rel="noopener noreferrer" id="setting-url" label=""></a>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.link = this.shadowRoot.getElementById("setting-url");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.link.label = description;
    }
    this.link.setAttribute("title", description);
  }

  getElement() {
    return this.link;
  }

  getValue() {
    return this.link.innerHTML
  }

  setValue(value) {
    this.link.innerHTML = value;
  }

  setUrl(url) {
    this.link.setAttribute("href", url)
  }
}

customElements.define("globular-link-setting", LinkSetting);

/**
 * Set string setting...
 */
export class StringSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

    let html = `
      <style>
     
      #setting-input{
         flex-grow: 1;
         font-size: 1rem;
        }
      </style>
      <paper-input id="setting-input" label="" raised></paper-input>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.input = this.shadowRoot.getElementById("setting-input");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }
    this.input.setAttribute("title", description);
    this.input.onblur = () => {
      if (this.onblur != null) {
        this.onblur()
      }
    }
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
    if (this.onchange != null) {
      this.onchange(value);
    }
  }

}

customElements.define("globular-string-setting", StringSetting);

/**
 * Set exclusive select setting...
 */
export class RadioGroupSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

    let html = `
      <style>
        paper-radio-button[checked]{
          --paper-radio-button-label-color: var(--palette-text-accent);
        }

      </style>

      <paper-radio-group selected=""></paper-radio-group>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.radioBtnGrp = this.shadowRoot.querySelector("paper-radio-group");
    this.description.style.display = "none";
  }

  getElement() {
    return this.radioBtnGrp;
  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.radioBtnGrp.setAttribute("selected", value)
    this.shadowRoot.querySelector(`#${value}-radio-btn`).click()
  }

  // That function must be overide.
  onSelect(value) {

  }

  setChoices(values) {
    values.forEach(val => {
      let choice = document.createElement("paper-radio-button")
      choice.name = val
      choice.id = val + "-radio-btn"
      choice.innerHTML = val
      this.radioBtnGrp.appendChild(choice)
      choice.onclick = () => {
        if (this.onSelect != null) {
          this.onSelect(choice.name)
        }
      }
    })
  }
}

customElements.define("globular-radio-group-setting", RadioGroupSetting);

/**
 * Set string setting...
 */
export class TextAreaSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
     
      #setting-input{
         flex-grow: 1;
         font-size: 1rem;
        }
      </style>
      <paper-textarea id="setting-input" style="width: 0px;" label="" raised></paper-textarea>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.input = this.shadowRoot.getElementById("setting-input");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }
    this.input.setAttribute("title", description);
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
  }

}

customElements.define("globular-textarea-setting", TextAreaSetting);

/**
 * true false on of...
 */
export class OnOffSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
     
      #setting-input{
         flex-grow: 1;
         font-size: 1rem;
        }
        
        paper-toggle-button[checked]{
          --paper-toggle-button-label-color: var(--palette-text-accent);
        }

      </style>
      <paper-toggle-button id="setting-input">${description}</paper-toggle-button>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.input = this.shadowRoot.getElementById("setting-input");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }
    this.input.setAttribute("title", description);

    this.getDescriptionDiv().style.display = "none";
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return this.input.checked
  }

  setValue(value) {
    this.input.checked = value;
  }

}

customElements.define("globular-on-off-setting", OnOffSetting);

/**
 * Add email validation to the string setting.
 */
export class NumberSetting extends StringSetting {
  constructor(name, description) {
    super(name, description)

    // email need's validation so here's I will set it.
    this.getElement().type = "number"
  }
}

customElements.define("globular-number-setting", NumberSetting);

/**
 * Set image setting...
 */
export class ImageSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

    let html = `
      <style>
     
        #custom-file-upload{
           display: flex;
           flex-grow: 1;
        }

        #custom-file-upload span{
          flex-grow: 1;
        }

        #custom-file-upload iron-icon{
          padding-right: 15px;
        }

        #custom-file-upload div{
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--palette-text-primary);
          font-size: 1rem;
          flex-basis: 100%;
          letter-spacing: .00625em;
          font-weight: 400;
          line-height: 1.5rem;
          word-break: break-word;
          margin-right: 10px;
          margin-top: 10px;
        }

        #custom-file-upload div:hover{
          cursor: pointer;
          border-bottom: 2px solid var(--palette-primary-accent);
        }

        input[type="file"] {
          display: none;
        }

        img {
          padding: 5px;
          max-width: 128px;
          max-height: 128px;
        }

        #image-display-div{
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 64px;
          min-height: 64px;
          
        }

        #no-image-display{
          --iron-icon-height: 48px;
          --iron-icon-width: 48px;
          --iron-icon-fill-color: lightgray;
          border: 1px solid lightgray;
          border-radius: 3px;
        }

        #image-display{
          display: none;
          border: 1px solid lightgray;
          border-radius: 3px;
        }

        #container{
          flex-grow: 1;
          display: flex;
          align-items: baseline;
        }

        @media (max-width: 800px) {
          #container{
            flex-direction: column-reverse;
          }
        }

      </style>
      <div id="container">
        <div id="custom-file-upload">
          <div>
            <iron-icon icon="cloud-upload"> </iron-icon>
            <span>${description}</span>
          </div>
        </div>
        <div id="image-display-div">
          <img id="image-display" src="#" />
          <iron-icon id="no-image-display" icon="image:photo"></iron-icon>
        </div>
      </div>

      <input type="file" id="setting-input"></input>
    `
    let range = document.createRange();
    this.title = description;
    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)

    // Init the interface component here.
    this.image = this.shadowRoot.getElementById("image-display");
    this.icon = this.shadowRoot.getElementById("no-image-display");
    this.input = this.shadowRoot.getElementById("setting-input");

    this.input.onchange = (evt) => {
      let files = evt.target.files;
      if (files && files[0]) {
        let reader = new FileReader()
        reader.onload = (e) => {
          this.image.src = e.target.result
          // Set the change event.
          if (this.onchange != null) {
            this.onchange(this.image.src) // event...
          }
          this.image.style.display = "block";
          this.icon.style.display = "none";
        }
        reader.readAsDataURL(files[0])
      }
    }

    this.shadowRoot.getElementById("custom-file-upload").onclick = () => {
      this.input.click();
    }

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }

    this.input.setAttribute("title", description);
  }

  getValue() {
    return this.image.src;
  }

  /**
   * This must be a blob or something acceptable by an img tag
   * @param {*} value 
   */
  setValue(value) {
    this.image.src = value
    this.image.style.display = "block";
    this.icon.style.display = "none";
  }
}

customElements.define("globular-image-setting", ImageSetting);


/**
 * Set string setting...
 */
export class ImageCropperSetting extends Setting {
  constructor(name, description, accountId, dataUrl) {
    super(name, description);

    let html = `
      <style>
     
      #setting-input{
        font-size: 1rem;
      }
      </style>
      <div style='width:100%;min-height:450px;position:relative;background-color:var(--palette-background-default);'>
        <globular-image-cropper id='mycrop' width='200px' height='200px'>
          <div slot='selectText'>Select image</div>
          <div slot='cropText'>Crop image</div>
          <div slot='resetText'>Reset</div>
        </globular-image-cropper>
        <globular-camera id="polaroid" width="616"></globular-camera>
      </div>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.description.style.display = "none"
    this.name.style.display = "none"
    this.shadowRoot.getElementById("icon-right").style.display = "none";
    this.cropper = this.shadowRoot.getElementById("mycrop")
    this.camera = this.shadowRoot.getElementById("polaroid")
    this.camera.onpicture = (data) => {
      this.camera.close();
      this.cropper.setImage(data);
    }

    if (dataUrl != undefined) {
      this.cropper.setCropImage(dataUrl)
    }

    this.camera.onopen = () => {
      this.cropper.style.display = "none";
    }

    this.camera.onclose = () => {
      this.cropper.style.display = "";
    }
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return this.cropper.getCropped()
  }

  setValue(value) {
    this.cropper.setCropImage(value)
  }

}

customElements.define("globular-image-cropper-setting", ImageCropperSetting);


export class DropdownSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    this.itemsArray = []

    let html = `
      <style>
     
      #setting-input{
         flex-grow: 1;
         font-size: 1rem;
        }
      </style>
      <paper-dropdown-menu id="setting-input" label="The best day ever" raised>
        <paper-listbox slot="dropdown-content">
        </paper-listbox>
      </paper-dropdown-menu>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.input = this.shadowRoot.getElementById("setting-input");

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }
    this.input.setAttribute("title", description);

    this.input.onclick = (evt) => {
      this.onchange(evt)
    }
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
  }

  setDropdownList(valueArray) {
    this.itemsArray = valueArray
    let lst = this.shadowRoot.querySelector("paper-listbox")
    for (var i = 0; i < valueArray.length; i++) {

      let item = document.createRange().createContextualFragment(`<paper-item>${valueArray[i]}</paper-item>`)

      lst.appendChild(item)
    }
  }

}

customElements.define("globular-dropdown-setting", DropdownSetting);


export class StringListSetting extends Setting {
  constructor(name, description) {
    // 
    super(name, description);

    let html = `
      <style>
     
      #setting-input{
         flex-grow: 1;
         font-size: 1rem;
        }

      #container{
        flex-grow: 1;
        position: relative;
      }

      #new_item_btn{
        /* position: absolute;
        top: -15px;
        right: 0px;
        */
      }

      </style>
      <div id="container">
        <paper-icon-button id="new_item_btn"  icon="add"></paper-icon-button>
      </div>
    `
    if (this.getAttribute("description") != undefined) {
      description = this.getAttribute("description")
    }


    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.div = this.shadowRoot.getElementById("container");

    this.div.onfocus = () => {

      let inputs = this.shadowRoot.querySelectorAll("paper-input");
      setTimeout(() => {
        if (inputs.length > 0) {
          //inputs[0].input.setSelectionRange(0, inputs[0].input.value.length);
          inputs[0].focus()
        }

      }, 50)

    }

    if (this.getAttribute("name") != undefined) {
      this.name.innerHTML = this.getAttribute("name")
    }

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.div.label = description;
    }
    this.div.setAttribute("title", description);

    this.appendValueBtn = this.shadowRoot.querySelector("#new_item_btn")

    this.appendValueBtn.onclick = () => {
      let inputs = this.shadowRoot.querySelectorAll("paper-input");
      let input = this.appendValue(inputs.length, "")
      setTimeout(() => { input.focus() }, 50)

    }
  }

  connectedCallback() {


  }

  getElement() {
    return this.div;
  }

  appendValue(index, value) {
    let input = this.div.querySelector("#item_" + index)
    if (input != undefined) {
      return
    }

    let item = document.createRange().createContextualFragment(`
    <div id="item_div_${index}" style="display: flex; align-items: end;">
      <paper-input style="flex-grow: 1;" id="item_${index}"></paper-input>
      <paper-icon-button id="item_delete_${index}"  icon="delete"></paper-icon-button>
    </div>`)
    this.div.appendChild(item)
    input = this.div.querySelector("#item_" + index)
    let deleteBtn = this.div.querySelector("#item_delete_" + index)
    deleteBtn.onclick = () => {
      let div = input.parentNode
      div.parentNode.removeChild(div);
    }

    input.value = value
    return input
  }

  setValues(valueArray) {
    // Remove previous values...
    let inputs = this.shadowRoot.querySelectorAll("paper-input");
    for(var i=0; i < inputs.length; i++){
      inputs[i].parentNode.parentNode.removeChild(inputs[i].parentNode)
    }

    if (valueArray == null) {
      return
    }
    for (var i = 0; i < valueArray.length; i++) {
      this.appendValue(i, valueArray[i])
    }

  }



  getValues() {
    let inputs = this.shadowRoot.querySelectorAll("paper-input");
    let values = []
    for (var i = 0; i < inputs.length; i++) {
      values.push(inputs[i].value)
    }

    return values;
  }
}

customElements.define("globular-string-list-setting", StringListSetting);

/**
 * Add email validation to the string setting.
 */
export class EmailSetting extends StringSetting {
  constructor(name, description) {
    super(name, description)

    // email need's validation so here's I will set it.

  }
}

customElements.define("globular-email-setting", EmailSetting);


/**
 * Simple yes no button's
 */
export class YesNoSetting extends Setting {
  constructor(name, description, onYes, onNo) {
    super(name, description)

    let html = `
    <style>
   
      #yes-no-div{
       display: flex;
       width: 100%;
       align-items: flex-end;
       justify-content: flex-end;
       padding-top: 10px;
      }

      #yes-no-div paper-button{
        font-size: .85rem;
        height: fit-content;
        border: none;
        color: var(--palette-text-accent);
        background: var(--palette-primary-accent);
        max-height: 32px;
      }

    </style>
    <div id="yes-no-div">
      <paper-button id="yes-btn" raised>Yes</paper-button>
      <paper-button id="no-btn" raised>No</paper-button>
    </div>
  `
    let range = document.createRange();
    this.shadowRoot.appendChild(range.createContextualFragment(html))
    this.onyes = onYes;
    this.onno = onNo;
    this.shadowRoot.getElementById("yes-btn").onclick = this.onyes;
    this.shadowRoot.getElementById("no-btn").onclick = this.onno;
  }
}

customElements.define("globular-yes-no-setting", YesNoSetting);

/**
 * Button to attach action in the setting panel.
 */
export class ActionSetting extends Setting {
  constructor(name, description, onclick) {
    super(name, description)

    let uuid = getUuidByString(name + description)

    let html = `
    <style>
   
      #bnt-div{
       display: flex;
      }

      #bnt-div paper-button{
        font-size: .85rem;
        height: fit-content;
        border: none;
        color: var(--palette-text-accent);
        background: var(--palette-warning-dark);
        max-height: 32px;
      }

    </style>
    <div id="bnt-div">
      <paper-button class=" " id="_${uuid}" raised>${name}</paper-button>
    </div>
  `
    let range = document.createRange();
    this.shadowRoot.appendChild(range.createContextualFragment(html))
    this.shadowRoot.querySelector(`#_${uuid}`).onclick = onclick
  }
}

customElements.define("globular-action-setting", ActionSetting);


/**
 * display a video convertion error
 */
 export class VideoConversionError extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(err) {
      super()
      // Set the shadow dom.
      this.attachShadow({ mode: 'open' });

      let uuid = "_" + getUuidByString(err.getPath())

      // Innitialisation of the layout.
      this.shadowRoot.innerHTML = `
      <style>
         
      </style>

      <div id="${uuid}" style="display: flex; align-items: center; padding-bottom: 10px; padding-top: 10px; border-bottom: 1px solid var(--palette-divider)">
        <div style="padding-right: 10px;">
          <paper-icon-button id="${uuid}_delete_btn" icon="delete"></paper-icon-button>
        </div>
        <div style="flex-grow: 1; display: flex; flex-direction: column;">
          <div style="padding-bottom: 5px; padding-top: 5px;">${err.getPath()}</div>
          <span style="margin: 5px;  border-bottom: 1px solid var(--palette-divider)"></span>
          <div style="padding-bottom: 5px; padding-top: 5px;">${err.getError()}</div>
        </div>
      </div>
      `

      // test create offer...
      this.deleteBtn = this.shadowRoot.querySelector(`#${uuid}_delete_btn`)
  }

}

customElements.define('globular-video-conversion-error', VideoConversionError)

/**
 * Video Convertion error
 */
 export class VideoConversionErrorsManager extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(ondeleteerror, onclear, onrefresh) {
      super()
      // Set the shadow dom.
      this.attachShadow({ mode: 'open' });

      // Innitialisation of the layout.
      this.shadowRoot.innerHTML = `
      <style>
         

          #container{
            padding: 15px 16px 16px;
            display: flex;
            flex-direction: column;
          }

          #errors{
            display: flex;
            flex-direction: column;
          }

      </style>

      <div id="container">
         <div style="display: flex; justify-content: flex-end;">
          <paper-icon-button id="refresh-btn" icon="icons:refresh"></paper-icon-button>
          <paper-icon-button id="clear-btn" icon="icons:clear"></paper-icon-button>
         </div>
         <div id="errors">
            <slot></slot>
         </div>
      </div>
      `

      // List of handler.
      this.ondeleteerror = ondeleteerror
      this.onclear = onclear
      this.onrefresh = onrefresh

      // Clear the content.
      this.shadowRoot.querySelector("#clear-btn").onclick = ()=>{
        if(this.onclear != undefined){
          this.innerHTML = "" // reset the content...
          this.onclear()
        }
      }

      // Refresh the the content
      this.shadowRoot.querySelector("#refresh-btn").onclick = ()=>{
        if(this.onrefresh != null){
          this.onrefresh(errors=>{
            this.innerHTML = "" // reset the content...
            this.setErrors(errors)
          })
        }
      }
  }

  // Use by addSetting...
  getElement(){
    return null
  }

  setError(err){
    let videoConversionError = new VideoConversionError(err)
    this.appendChild(videoConversionError)
    if(videoConversionError.deleteBtn){
      videoConversionError.deleteBtn.onclick = ()=>{this.deleteError(err, videoConversionError)}
    }
  }

  setErrors(errors){
    errors.forEach(err=>{
      this.setError(err)
    })
  }

  // Delete error...
  deleteError(err, videoConversionError){
    if(videoConversionError){
      if(videoConversionError.parentNode!=undefined){
        videoConversionError.parentNode.removeChild(videoConversionError)
      }
    }
    if(this.ondeleteerror){
      this.ondeleteerror(err)
    }
  }
}

customElements.define('globular-video-conversion-errors-manager', VideoConversionErrorsManager)


/**
 * display a video convertion error
 */
 export class VideoConversionLog extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(log) {
      super()
      // Set the shadow dom.
      this.attachShadow({ mode: 'open' });

      let uuid = "_" + getUuidByString(log.getLogTime().toString())
      let date = new Date(log.getLogTime() * 1000)
      // Innitialisation of the layout.
      this.shadowRoot.innerHTML = `
      <style>
         
      </style>

      <div id="${uuid}" style="display: flex; align-items: center; padding-bottom: 10px; padding-top: 10px; border-bottom: 1px solid var(--palette-divider)">
        <div style="flex-grow: 1; display: flex; flex-direction: column;">
          <div style="padding-bottom: 5px; padding-top: 5px;">${log.getMsg() + " " + log.getPath()}</div>
          <span style="margin: 5px;  border-bottom: 1px solid var(--palette-divider); align-self: flex-end;"></span>
          <div style="padding-bottom: 5px; padding-top: 5px; align-self: flex-end;">${date.toLocaleDateString() + " " + date.toLocaleTimeString()} <span id="status_span"  style="margin-left: 20px;  text-transform: capitalize; font-weight: bold;">${log.getStatus()}</span></div>
        </div>
      </div>
      `
  }

  setStatus(value){
    this.shadowRoot.querySelector(`#status_span`).innerHTML = value
  }
}

customElements.define('globular-video-conversion-log', VideoConversionLog)


/**
 * Video Convertion error
 */
 export class VideoConversionLogsManager extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(onclear, onrefresh) {
      super()
      // Set the shadow dom.
      this.attachShadow({ mode: 'open' });

      // Innitialisation of the layout.
      this.shadowRoot.innerHTML = `
      <style>
         

          #container{
            padding: 15px 16px 16px;
            display: flex;
            flex-direction: column;
          }

          #logs{
            display: flex;
            flex-direction: column;
          }

      </style>

      <div id="container">
         <div style="display: flex; justify-content: flex-end;">
          <paper-icon-button id="refresh-btn" icon="icons:refresh"></paper-icon-button>
          <paper-icon-button id="clear-btn" icon="icons:clear"></paper-icon-button>
         </div>
         <div id="logs">
            <slot></slot>
         </div>
      </div>
      `

      // List of handler.
      this.onclear = onclear
      this.onrefresh = onrefresh

      // Clear the content.
      this.shadowRoot.querySelector("#clear-btn").onclick = ()=>{
        if(this.onclear != undefined){
          this.innerHTML = "" // reset the content...
          this.onclear()
        }
      }

      // Refresh the the content
      this.shadowRoot.querySelector("#refresh-btn").onclick = ()=>{
        if(this.onrefresh != null){
          this.onrefresh(logs=>{
            this.innerHTML = "" // reset the content...
            this.setLogs(logs)
          })
        }
      }
  }

  // Use by addSetting...
  getElement(){
    return null
  }

  setLog(log){
    let uuid = "_" + getUuidByString(log.getLogTime().toString())
    let videoConversionLog = this.querySelector("#" + uuid)
    if(videoConversionLog){
      videoConversionLog.setStatus(log.getStatus())
    }else{
      videoConversionLog = new VideoConversionLog(log)
      videoConversionLog.id = uuid
      this.appendChild(videoConversionLog)
    }

  }

  setLogs(logs){
    logs.forEach(l=>{
      this.setLog(l)
    })
  }

}

customElements.define('globular-video-conversion-logs-manager', VideoConversionLogsManager)