import { theme } from "./Theme";
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/iron-collapse/iron-collapse.js';
import { Model } from "../Model";

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
       ${theme}
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
    if(this.container.childNodes.length > 1){
      this.container.childNodes[1].click()
    }else{
      this.container.firstChild.click()
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
       ${theme}
       #container {
           display: flex;
           padding-left: 10px;
           padding-top: 10px;
           padding-bottom: 10px;
           font-weight: 500;
           font-size: .75em;
       }

       iron-icon{
            padding-right: 24px;
       }

       #container div:hover{
           cursor: pointer;
       }

    </style>
    <div id="container">
        <iron-icon icon="${icon}"></iron-icon>
        <div id="title-div">${title}</div>
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
       ${theme}
       #container {
           display: flex;
           flex-direction: column;
       }
    </style>
    <div id="container">
    </div>
    `;

    this.container = this.shadowRoot.getElementById("container")
  }

  clear() {
    let yesNoSetting = new YesNoSetting("", "Do you wish to save your settings?", 
      ()=>{
        // Save the setting's
        Model.eventHub.publish("save_settings_evt", true, true)
        console.log("--------> save settings")
      }, 
      ()=>{
        // Not save the setting's
        Model.eventHub.publish("save_settings_evt", false, true)
        console.log("--------> not save settings")
      })
      
    this.container.innerHTML = '';
    let section = this.appendSettingsPage("Exit").appendSettings("Exit", "Returning to the application...")
    section.appendChild(yesNoSetting)
  }

  appendSettingsPage(title) {
    const html = `<globular-settings-page id="${title}_settings_page" title="${title}"></globular-settings-page>`;
    const range = document.createRange()
    this.container.appendChild(range.createContextualFragment(html))
    const page = this.shadowRoot.getElementById(title + "_settings_page")
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
       ${theme}
       #container {
           display: none;
           flex-direction: column;
       }
    </style>
    <div id="container"></div>
    `;

    this.container = this.shadowRoot.getElementById("container")
  }

  clear() {
    this.container.innerHTML = '';
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
    })
  }

  appendSettings(title, subtitle) {
    const html = `<globular-settings id="${title}_settings" title="${title}" subtitle="${subtitle}"></globular-settings>`;
    const range = document.createRange()
    this.container.appendChild(range.createContextualFragment(html))
    const settings = this.shadowRoot.getElementById(title + "_settings")
    return settings
  }
  //add a setting array or a get settings
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
       ${theme}

       #container {
           display: flex;
           flex-direction: column;
           margin-top: 45px;
           margin-bottom: 10px;
       }

       .card-content{
            min-width: 680px;
            padding: 12px;
        }

        ::slotted(globular-setting:not(:last-child)) {
          border-bottom: 1px solid #e0e0e0;
        }

        ::slotted(globular-complex-setting:not(:last-child)) {
          border-bottom: 1px solid #e0e0e0;
        }

        ::slotted(globular-string-setting:not(:last-child)) {
          border-bottom: 1px solid #e0e0e0;
        }


        ::slotted(globular-email-setting:not(:last-child)) {
          border-bottom: 1px solid #e0e0e0;
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

        .card-title{
            position: absolute;
            top: -40px;
            font-size: 1rem;
            text-transform: uppercase;
            color: var(--cr-primary-text-color);
            font-weight: 400;
            letter-spacing: .25px;
            margin-bottom: 12px;
            margin-top: var(--cr-section-vertical-margin);
            outline: none;
            padding-bottom: 4px;
            padding-top: 8px;
        }

        .card-subtitle{
          padding: 24px;
          letter-spacing: .01428571em;
          font-family: Roboto,Arial,sans-serif;
          font-size: .875rem;
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
        }

        paper-button{
          display: flex;
          font-size: .85rem;
          border: none;
          color: var(--palette-text-accent);
          background: var(--palette-primary-accent);
          max-height: 32px;
        }

        #hide-btn{
          align-self: center;
        }

        #back-btn{
          display: none;
        }

    </style>
    <div id="container">
       <paper-card id="${this.title}_settings">
            <h2 class="card-title">${this.title}</h2>
            <div style="display: flex;">
              <paper-icon-button id="back-btn"  icon="arrow-back"></paper-icon-button>
              <div class="card-subtitle">${this.subtitle}</div>
              <paper-icon-button id="hide-btn"  icon="unfold-less"></paper-icon-button>
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
  
  hideSettings() {
    let button = this.shadowRoot.getElementById("hide-btn")
    let content = this.shadowRoot.querySelector(".card-collapse")
    if (button && content) {
      if(!content.opened) {
        button.icon = "unfold-less"
      } else {
        button.icon = "unfold-more"
      }
      content.toggle();
    }
  }

  addSetting(setting) {
    this.shadowRoot.querySelector("#card-content").appendChild(setting)
  }

  clear() {
    this.container.innerHTML = '';
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

    // set icon to empty icon by default.
    if (icon == undefined) {
      icon = ""
    }

    // Connect to event.
    this.shadowRoot.innerHTML = `
    <style>
       ${theme}

      .setting-name{
         line-height: 1rem;
         font-size: .6875rem;
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
      }

      #icon-left, icon-right {
        display: none;
      }

    </style>
    <iron-icon id="icon-left" icon="${icon}"></iron-icon>
    <div  id="name-div" class="setting-name">${name}</div>
    <div id = "description-div" class="setting-description">${description}</div>
    <iron-icon id="icon-right" icon=""></iron-icon>
    `;

    // Set style property of the component itself.
    this.style.display = "flex"
    this.style.color = "var(--cr-primary-text-color)"
    this.style.fontFamily = "Roboto,Arial,sans-serif"
    this.style.alignItems = "center"
    this.style.padding = "15px 12px 16px 12px"

    // The name (label) div
    this.name = this.shadowRoot.getElementById("name-div")

    // The description...
    this.description = this.shadowRoot.getElementById("description-div")

  }

  clear() {
    this.shadowRoot.innerHTML = '';
  }

  getValue() { return null; }

  getName() { return this.name.innerText; }

  getDescription(){ return this.description.innerText; }

}
customElements.define("globular-setting", Setting);


/**
 * That class must be use for setting that need more informations.
 */
export class ComplexSetting extends Setting {
  constructor(name, description, icon) {
    super(name, description);
    let range = document.createRange()
    let html = `
      <style>
      ${theme}
        #icon-right:hover{
          cursor: pointer;
        }
    `
    this.shadowRoot.appendChild(range.createContextualFragment(html))
    this.actionBtn = this.shadowRoot.getElementById("icon-right")
    this.actionBtn.icon = "chevron-right"
    this.actionBtn.style.display = "block";
    
    this._parentSettingsPage = null;
    this._container = null;
    this._parentSettingsPageChildnodes=[]; // temporaly keep the content of the page.
    this._panel = null;
    this._settings = {};

    this.actionBtn.onclick = () => {
      for(var i=0; i <  this._parentSettingsPageChildnodes.length; i++){
        let node = this._parentSettingsPageChildnodes[i];
        node.style.display = "none"
      }

      // display the settings.
      this._panel.style.display = "block"
    }

  }

  // add settings...
  addSetting(setting) {
    this._settings[setting.getName()] = setting;
  }

  connectedCallback() {
    this._parentSettingsPage =  this.parentNode.parentNode.parentNode.host;
    this._parentSettingsPageChildnodes = this.parentNode.parentNode.childNodes;
    
    this._panel = this._parentSettingsPage.appendSettings(this.name.innerText, this.description.innerText)
    this._panel.style.display = "none"
    this._panel.backBtn.style.display = "block"
    this._panel.classList.add("complex_setting_panel")

    // hide the panel and display back the content of the page.
    this._panel.backBtn.onclick = ()=>{
      for(var i=0; i <  this._parentSettingsPageChildnodes.length; i++){
        let node = this._parentSettingsPageChildnodes[i];
        if(!node.classList.contains("complex_setting_panel")){
          node.style.display = "block"
        }
      }

      // display the settings.
      this._panel.style.display = "none"
    }

    // add the settings.
    for(var name in this._settings){
      this._panel.addSetting(this._settings[name])
    }
  }

  getSetting(name){ return this._settings[name] }
}

customElements.define("globular-complex-setting", ComplexSetting);

/**
 * Set string setting...
 */
export class StringSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
      ${theme}
        #setting-input{
         flex-grow: 1;
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

  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
  }

}

customElements.define("globular-string-setting", StringSetting);

/**
 * Set number setting...
 */
export class NumberSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
      ${theme}
        #setting-input{
         flex-grow: 1;
        }
      </style>
      <paper-input type="number" id="setting-input" label="" raised></paper-input>
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

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
  }

}

customElements.define("globular-number-setting", NumberSetting);

/**
 * Set image setting...
 */
export class ImageSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
      ${theme}
        #setting-input{
         flex-grow: 1;
        }
      </style>
      <paper-input type="file" id="setting-input" label="" raised></paper-input>
      <img id="image-display" src="#" alt="Image's preview..."/>
    `
    let range = document.createRange();
    this.title = description;

    this.shadowRoot.insertBefore(range.createContextualFragment(html), this.description)
    this.input = this.shadowRoot.getElementById("setting-input");
    this.shadowRoot.getElementById("setting-input").onchange = this.readFile.bind(this);

    this.description.style.display = "none";
    this.setAttribute("title", "")
    if (description.length > 0) {
      this.input.label = description;
    }
    this.input.setAttribute("title", description);

  }

  readFile(input) {
    let files = input.target.inputElement.inputElement.files
    if (files && files[0]) {
      let reader = new FileReader()

      reader.onload = (e) => {
        this.shadowRoot.getElementById("image-display").src = e.target.result
      }

      reader.readAsDataURL(files[0])
    }
  }

  getValue() {
    return this.input.value
  }

  setValue(value) {
    this.input.value = value;
  }

}

customElements.define("globular-image-setting", ImageSetting);

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
    ${theme}
      #yes-no-div{
       display: flex;
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
    this.onno= onNo;
    this.shadowRoot.getElementById("yes-btn").onclick = this.onyes;
    this.shadowRoot.getElementById("no-btn").onclick = this.onno;
  }
}

customElements.define("globular-yes-no-setting", YesNoSetting);