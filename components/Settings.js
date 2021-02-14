import { theme } from "./Theme";
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
import { ImageCropper } from "./Image";
import { Camera } from "./Camera";
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
    if (this.container.childNodes.length > 1) {
      this.container.childNodes[1].click()
    } else {
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
       ${theme}
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
    })
  }

  appendSettings(title, subtitle) {
    const id = title.split(" ").join("");

    const html = `<globular-settings id="${id}_settings" title="${title}" subtitle="${subtitle}"></globular-settings>`;
    const range = document.createRange()
    this.appendChild(range.createContextualFragment(html))
    const settings = this.querySelector("#" + id + "_settings")
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
            max-width: 680px;
            padding: 0px;
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
      if (!content.opened) {
        button.icon = "unfold-less"
      } else {
        button.icon = "unfold-more"
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
        this.style.alignItems = "flex-start"
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
        nextPageBtn.style.position = "block";
        nextPageBtn.style.top = "40%";
        nextPageBtn.style.right = "0px";

        if (w < 780) {
          this.shadowRoot.getElementById("name-div").style.flexBasis = "100px";
          this.shadowRoot.getElementById("description-div").style.flexBasis = "200px";
          if (w < 600) {
            nextPageBtn.style.position = "absolute";
            this.style.flexDirection = "column";
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

  getDescription() { return this.description.innerText; }

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

    this._parentPage = null;
    this._parentPage = null;
    this._container = null;
    this._panel = null;
    this._settings = {};

    this.actionBtn.onclick = () => {
      for (var i = 0; i < this._parentPage.childNodes.length; i++) {
        let node = this._parentPage.childNodes[i];
        node.style.display = "none"
      }

      // display the settings.
      this._panel.style.display = "block"
      if (this._panel.childNodes.length > 0) {
        let e = this._panel.childNodes[0].getElement()
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
    this._settings[setting.getName()] = setting;
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

      this._panel = this._parentPage.appendSettings(this.name.innerText, this.description.innerText)
      this._panel.style.display = "none"
      this._panel.backBtn.style.display = "block"
      this._panel.classList.add("complex_setting_panel")

      // hide the panel and display back the content of the page.
      this._panel.backBtn.onclick = () => {
        for (var i = 0; i < this._parentPage.childNodes.length; i++) {
          let node = this._parentPage.childNodes[i];
          if (!node.classList.contains("complex_setting_panel")) {
            node.style.display = "block"
          }
        }

        // display the settings.
        this._panel.style.display = "none"
      }

      // add the settings.
      for (var name in this._settings) {
        this._panel.addSetting(this._settings[name])
      }

    }
  }

  getSetting(name) { return this._settings[name] }
}

customElements.define("globular-complex-setting", ComplexSetting);

/**
 * Set string setting...
 */
export class StringSetting extends Setting {
  constructor(name, description) {
    super(name, description);
    this.onchange = null;

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
 * Set string setting...
 */
export class TextAreaSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    let html = `
      <style>
      ${theme}
      #setting-input{
         flex-grow: 1;
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
      ${theme}
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
          align-items: flex-end;
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

        @media only screen and (max-width: 800px) {
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
      ${theme}
      #setting-input{
         
      }
      </style>
      <div style='width:100%;min-height:450px;position:relative;background-color:var(--palette-background-default);'>
        <globular-image-cropper id='mycrop' width='200px' height='200px'>
          <div slot='selectText'>Select image</div>
          <div slot='cropText'>Crop image</div>
          <div slot='resetText'>Reset</div>
          <div slot='saveText'>Set picture</div>
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
    this.camera.onpicture = (data)=>{
      this.camera.close();
      this.cropper.setImage(data);
    }

    // Save the cropped image.
    this.cropper.onsave = (data)=>{
      /*console.log(data)*/
      Model.eventHub.publish(
        `update_profile_picture_event_`,
        data,
        true
      );
    }
    if(dataUrl != undefined){
      this.cropper.setCropImage(dataUrl)
    }

    this.camera.onopen = ()=>{
      this.cropper.style.display = "none";
    }

    this.camera.onclose = ()=>{
      this.cropper.style.display = "";
    }
  }

  getElement() {
    return this.input;
  }

  getValue() {
    return ""
  }

  setValue(value) {

  }

}

customElements.define("globular-image-cropper-setting", ImageCropperSetting);


export class DropdownSetting extends Setting {
  constructor(name, description) {
    super(name, description);

    this.itemsArray = []

    let html = `
      <style>
      ${theme}
      #setting-input{
         flex-grow: 1;
        }
      </style>
      <paper-dropdown-menu id="setting-input" label="The best day ever" raised>
        <paper-listbox class ="dropdown-content">
          <template is="dom-repeat" items="{{itemsArray}}">
            <paper-item>{{item}}</paper-item>
          </template>
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
  }
}

customElements.define("globular-dropdown-setting", DropdownSetting);

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
    this.onno = onNo;
    this.shadowRoot.getElementById("yes-btn").onclick = this.onyes;
    this.shadowRoot.getElementById("no-btn").onclick = this.onno;
  }
}

customElements.define("globular-yes-no-setting", YesNoSetting);