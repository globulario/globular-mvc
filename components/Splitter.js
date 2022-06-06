import { theme } from "./Theme";

/**
 * A simple splitter...
 */
export class SplitView extends HTMLElement {
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
            .splitter {
                display: flex;
                width: 100%;
            }


            ::slotted(globular-split-pane) {
                overflow: auto;
            }

        </style>

        <div class="splitter">
            <slot>
            </slot>
        </div>
        `
    }


    // The connection callback.
    connectedCallback() {
        this.children[0].hideSlider()

    }

    // That function will be call when properti of one of child will change...
    onChange(){
        console.log("----------> propertie change event")
    }
}

customElements.define('globular-split-view', SplitView)

/**
 * Search Box
 */
export class SplitPane extends HTMLElement {
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
            .splitter__pane {
                overflow: auto;
                flex: 1 1 auto;
                padding: 10px;
            }
            
            .splitter__slider {
                display: block;
                position: absolute;
                height: 100%;
                width: 0.3rem;
                z-index: 1000;
                top: 0;
                cursor: col-resize;
                left: 0;
                background-color: var(--palette-background-paper);
                
            }
        </style>
        <div class="splitter__pane">
            <slot>
            </slot>
            <div class="splitter__slider"></div>
        </div>
        `
    }

    hideSlider() {
        this.shadowRoot.querySelector(".splitter__slider").style.display = "none";
    }

}

customElements.define('globular-split-pane', SplitPane)