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
          .subitems{
            display: flex;
            flex-direction: column;
          }

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

          #chevron{
            display: none;
          }

      </style>
      
      <div id="container">
        <span class="separator"></span>
        <div>
          <paper-ripple recenters></paper-ripple>
          <iron-icon id="icon" icon="${this.icon}"> </iron-icon>
          <span>${this.text}</span>
          <iron-icon id="chevron" icon="icons:chevron-right"></iron-icon>
          <paper-card>
            <slot><slot>
          </paper-card>
          <slot class="subitems" name="subitems"><slot>
        </div>
      </div>

      `
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")
    container.onclick = () => {
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
    if (this.slot == "subitems") {
      this.parentNode.hideIcon()
    }

    let container = this.shadowRoot.querySelector("#container")
    // Now the submenu...
    if (this.children.length > 0) {
      if (this.children[0].slot != "subitems") {
        this.shadowRoot.querySelector("#chevron").style.display = "block";
        container.onmouseover = () => {
          let submenu = this.shadowRoot.querySelector("paper-card")
          submenu.style.display = "flex";
          submenu.style.left = container.offsetWidth + "px";
        }

        container.onmouseout = () => {
          let submenu = this.shadowRoot.querySelector("paper-card")
          submenu.style.display = "none";
        }
      } else {
        this.hideIcon();
      }
    }
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
    let container = this.shadowRoot.querySelector("#container")

    let btn = this.shadowRoot.querySelector("paper-icon-button")
    let menuItems = this.shadowRoot.querySelector("paper-card")
    btn.onclick = () => {

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
    let btn = this.shadowRoot.querySelector("paper-icon-button")
    btn.style.display = "none"
  }

  showBtn() {
    let btn = this.shadowRoot.querySelector("paper-icon-button")
    btn.style.display = "block"
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
