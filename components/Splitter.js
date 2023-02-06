import { ConversationServicePromiseClient } from "globular-web-client/conversation/conversation_grpc_web_pb";


function getExtraWidth(pane) {
    const paddingLeft = extractComputedStyleValue(pane, 'paddingLeft');
    const paddingRight = extractComputedStyleValue(pane, 'paddingRight');
    const borderLeft = extractComputedStyleValue(pane, 'borderLeftWidth');
    const borderRight = extractComputedStyleValue(pane, 'borderRightWidth');
    const marginRight = extractComputedStyleValue(pane, 'marginRight');
    const marginLeft = extractComputedStyleValue(pane, 'marginLeft');

    return paddingLeft + paddingRight + borderLeft + borderRight + marginRight + marginLeft;
}

function extractComputedStyleValue(pane, style) {
    return extractPxValue(window.getComputedStyle(pane)[style]);
}

function extractPxValue(str) {
    const match = str.match(/^([0-9]+)px$/);

    if (match && match.length === 2) {
        return +match[1];
    }

    return 0;
}

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
           
            .splitter {
                display: flex;
                width: 100%;
            }


            ::slotted(globular-split-pane) {
                overflow: auto;
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
             }
                
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
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
        for (var i = 0; i < panes.length; i++) {
            if (i < panes.length - 1) {
                this.insertBefore(new SplitSlider([panes[i], panes[i + 1]], this.shadowRoot.querySelector(".splitter")), panes[i + 1])
            }
        }

    }

    // That function will be call when properti of one of child will change...
    onChange() {
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
    constructor(panes, view) {
        super()

        // those are pane managed by this component...
        this.panes = panes;
        this.view = view;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
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

        // Connect the resize event of it parent...
        /*new ResizeObserver(() => {
            let w = this.view.offsetWidth
            let h = this.view.offsetHeight
        }).observe(view)*/

        this.slider = this.shadowRoot.querySelector(".splitter__slider")

        // Now I will set the mouse event on the view itself...
        this.handleSliderDragg(panes[0], this.slider)
    }

    handleSliderDragg(pane, slider) {
        let drag = false; //if true draging is in process
        slider.addEventListener('mousedown', () => drag = true);
        document.body.addEventListener('mouseup', () => drag = false);
        document.body.addEventListener('mousemove', (event) => {
            if (drag) {
                const extra = getExtraWidth(pane);
                pane.style.flex = `0 0 ${pane.offsetWidth + event.movementX + extra}px`;
            }
        });
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
                color: var(--palette-text-primary);
            }

            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
             }
                
             ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
             }
             
             ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
             }
            
        </style>
        <div class="splitter__pane">
            <div id="content">
                <slot>
                </slot>
            </div>
        </div>
        `

        // The pane...
        this.pane = this.shadowRoot.querySelector(".splitter__pane")
    }

    setWidth(w) {
        this.shadowRoot.querySelector(".splitter__pane").style.width = w + "px"
    }

}

customElements.define('globular-split-pane', SplitPane)