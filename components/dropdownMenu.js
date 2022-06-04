import { theme } from "./Theme.js";

export class DropdownMenuItem extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(icon, text) {
    super()

    this.action = null;

    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    this.icon = icon
    if (this.hasAttribute("icon")) {
      this.icon = this.getAttribute("icon")
    }

    this.text = text
    if (this.hasAttribute("text")) {
      this.text = this.getAttribute("text")
    }

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
      <style>
          ${theme}

          #container{
            display: flex;
            flex-direction: column;
           
          }

          #container div{
            display: flex;
            min-width: 150px;
            justify-content: flex-start;
            align-items: flex-end;
            padding: 3px;
            transition: background 0.2s ease,padding 0.8s linear;
            background-color: var(--palette-background-paper);
            position: relative;
          }

          
          #container div:hover{
            background-color: var(--palette-background-default);
            cursor: pointer;
          }

          paper-card  {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 0px;
          }

          iron-icon {
            width: 20px;
            padding-right: 10px;
          }

          span {
            flex-grow: 1;
          }

          .separator{
            border-top: 1px solid var(--palette-divider);
            margin-top: 2px;
            padding-top:2px;
          }

      </style>
      
      <div id="container">
        <span class="separator"></span>
        <div>
          <paper-ripple recenters></paper-ripple>
          <iron-icon id="icon" icon="${this.icon}"> </iron-icon>
          <span>${this.text}</span>
          <slot><slot>
        </div>
      </div>

      `
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")
    container.onclick = (evt) => {
      if (this.action != undefined) {
        this.action()
        // close it parent.
        if (this.parentNode != undefined) {
          if (this.parentNode.close != undefined) {
            this.parentNode.close();
          }
        }
      }
    }

    if (!this.hasAttribute("separator")) {
      container.querySelector(".separator").style.display = "none"
    }
  }

  hideIcon() {
    this.shadowRoot.querySelector("#icon").style.display = "none";
  }

  connectedCallback() {
    
  }
}

customElements.define('globular-dropdown-menu-item', DropdownMenuItem)

/**
 * Sample empty component
 */
export class DropdownMenu extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(icon) {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    this.isopen = false;
    this.icon = icon;
    this.action = null;
    this.onopen = null;
    this.onclose = null;

    if (this.hasAttribute("icon")) {
      this.icon = this.getAttribute("icon")
    }else if(!this.icon){
      this.icon = "icons:chevron-right"
    }

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
              display: flex;
              flex-direction: column;
              position: relative;
            }

            iron-icon:hover{
               cursor: pointer;
            }

            span {

            }

            .card-content{
              display: flex;
              flex-direction: column;
              padding: 0px;
            }

            .menu-items{
              position: absolute;
              top: 41px;
            }

        </style>
        <div id="container">
          <paper-icon-button icon="${this.icon}"> </paper-icon-button>
          <paper-card class="menu-items" style="display: none;">
              <div class="card-content">
                <slot></slot>
              </div>
          </paper-card>
        </div>
        `

    // give the focus to the input.
    this.menuBtn = this.shadowRoot.querySelector("paper-icon-button")
    let menuItems = this.shadowRoot.querySelector("paper-card")
    this.menuBtn.onclick = (evt) => {
      evt.stopPropagation()

      if (menuItems.style.display == "none") {
        menuItems.style.display = "block"
      } else {
        menuItems.style.display = "none"
      }
    }
  }

  connectedCallback() {
    if (this.hasAttribute("icon")) {
      this.shadowRoot.querySelector("iron-icon").icon = this.getAttribute("icon")
    }
  }

  hideBtn() {
    if(this.menuBtn){
      this.menuBtn.style.display = "none"
    }
  }

  showBtn() {
    if(this.menuBtn){
      this.menuBtn.style.display = "block"
    }
  }

  close() {
    let menuItems = this.shadowRoot.querySelector("paper-card")
    menuItems.style.display = "none"
    this.showBtn()
    if (this.onclose != undefined) {
      this.onclose()
    }

  }

  open() {
    let menuItems = this.shadowRoot.querySelector("paper-card")
    menuItems.style.display = "block"
    if (this.onopen != undefined) {
      this.onopen()
    }
  }

  // Return true if the menu is open.
  isOpen() {
    let menuItems = this.shadowRoot.querySelector("paper-card")
    return menuItems.style.display != "none"
  }

}

customElements.define('globular-dropdown-menu', DropdownMenu)
