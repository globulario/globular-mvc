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
       let panes = this.querySelectorAll("globular-split-pane")
       for(var i=0; i < panes.length; i++){
          // test only...
          if(i==0){
            panes[i].setWidth(250)
          }

          if(i<panes.length){
              this.insertBefore(new SplitSlider(), panes[i + 1])
          }
       }

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
 export class SplitSlider extends HTMLElement {
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
            .splitter__slider {
                display: block;
                height: 100%;
                width: 0.3rem;
                z-index: 1000;
                cursor: col-resize;
                background-color: var(--palette-background-paper);
            }
        </style>
        <div class="splitter__slider"></div>
        `
    }
}

customElements.define('globular-split-slider', SplitSlider)

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
            ::slotted(globular-file-reader){
                height: 100%;
                overflow: hidden;
            }

            .splitter__pane {
                flex: 1 1 auto;
                position: relative;
                height: 100%;
            }

            #content{
                position: absolute;
                top: 0px;
                left: 0px;
                bottom: 0px;
                right: 0px;
                overflow: auto;
            }
            
        </style>
        <div class="splitter__pane">
            <div id="content">
                <slot>
                </slot>
            </div>
        </div>
        `
    }

    setWidth(w){
        this.shadowRoot.querySelector(".splitter__pane").style.width = w + "px"
    }

}

customElements.define('globular-split-pane', SplitPane)