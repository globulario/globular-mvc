import { theme } from "./Layout";
import "@polymer/iron-selector/iron-selector.js";
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

  clear(){
    this.container.innerHTML = '';
  }

  appendSettingsMenuItem(icon, title) {
    const html = `<globular-settings-side-menu-item id="${title}_settings_menu_item" icon="${icon}" title="${title}"> </globular-settings-side-menu-item>`; 
    const range = document.createRange()
    this.container.appendChild(range.createContextualFragment(html))

    let item = this.shadowRoot.getElementById(title + "_settings_menu_item")

    item.onclick = ()=>{
        let elements = this.shadowRoot.querySelectorAll(".active")
        elements.forEach((element)=>{
            element.classList.remove("active")
        })
        item.classList.add("active")
    }
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
    this.titleDiv= null;

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

  clear(){
    this.container.innerHTML = '';
  }

  // attach event here.
  connectedCallback() {
    this.container = this.shadowRoot.getElementById("container")
    this.titleDiv = this.shadowRoot.getElementById("title-div")
  
    // Create the actions here.
    this.titleDiv.onclick = ()=>{
       
    }

    this.titleDiv.onclick = ()=>{

        Model.eventHub.publish("set-settings-page", this.titleDiv.innerText, true)
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

  clear(){
    this.container.innerHTML = '';
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

  clear(){
    this.container.innerHTML = '';
  }

  connectedCallback() {

  }

  // Model.eventHub must be init.
  init(){
      Model.eventHub.subscribe("set-settings-page", (uuid)=>{}, (pageId)=>{
          if(this.title == pageId){
              this.container.style.display = "flex"
          }else{
              this.container.style.display = "none"
          }
      })
  }

  appendSettings(title) {
    const html = `<globular-settings id="${title}_settings" title="${title}"></globular-settings>`; 
    const range = document.createRange()
    this.container.appendChild(range.createContextualFragment(html))
    const settings = this.shadowRoot.getElementById(title + "_settings")
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
            min-height: 200px;
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

    </style>
    <div id="container">
       <paper-card id="${this.title}_settings">
            <h2 class="card-title">${this.title}</h2>
            <div class="card-content">
                <slot></slot>
            </div>
        </paper-card>
    </div>
    `;

    this.container = this.shadowRoot.getElementById("container")

  }

  clear(){
    this.container.innerHTML = '';
  }
  
}

customElements.define("globular-settings", Settings);