import { theme } from "../../../globular-mvc/components/Theme.js";

export class DropdownMenuItem extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super()

    this.action = null;

    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    this.icon = ""
    if (this.hasAttribute("icon")) {
      this.icon = this.getAttribute("icon")
    }

    this.text = ""
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
          }

          #container:hover{
            filter: invert(10%);
            cursor: pointer;
          }

          iron-icon {
            width: 20px;
          }

          span {
            padding-left: 10px;
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
          <iron-icon icon="${this.icon}"> </iron-icon>
          <span>${this.text}</span>
          <slot><slot>
        </div>
      </div>

      `
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")
    container.onclick = ()=>{
      if(this.action!=undefined){
        this.action()
        // close it parent.
        this.parentNode.close();
      }
    }

    if(!this.hasAttribute("separator")){
      container.querySelector(".separator").style.display = "none"
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

  close(){
    let menuItems = this.shadowRoot.querySelector("paper-card")
    menuItems.style.display = "none"
  }

  // Return true if the menu is open.
  isOpen(){
    let menuItems = this.shadowRoot.querySelector("paper-card")
    return  menuItems.style.display != "none"
  }

}

customElements.define('globular-dropdown-menu', DropdownMenu)
