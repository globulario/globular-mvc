
import { getTheme } from "./Theme";


/**
 * A slide panel.
 */
export class SlidePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                position: fixed;
                top: 65px;
                bottom: 0px;
                width: 500px;
                overflow: auto;
                direction:rtl; 
            }

            #content{
                width: 100%; 
                height: 100%; 
                direction:ltr;
            }

        </style>
        <div id="container">
            <div id="content">
                <slot></slot>
            </div>
        </div>
        `
        this.container = this.shadowRoot.querySelector("#container")
        this.content = this.shadowRoot.querySelector("#content")
        if (this.hasAttribute("side")) {
            let side = this.getAttribute("side")
            if (side == "right") {
                this.container.style.right = "0px"
            } else if (side == "left") {
                this.container.style.left = "0px"
            }
        }
    }

    connectedCallback() {
        console.log("-----------> the panel is visible!")
    }

    scrollTo(to){
        this.container.scrollTo(to)
    }
}

customElements.define('globular-slide-panel', SlidePanel)