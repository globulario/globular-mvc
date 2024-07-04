import { ConversationServicePromiseClient } from "globular-web-client/conversation/conversation_grpc_web_pb";
import { fireResize } from "./utility";


function getExtraWidth(pane) {
    const paddingLeft = extractComputedStyleValue(pane, 'paddingLeft');
    const paddingRight = extractComputedStyleValue(pane, 'paddingRight');
    const borderLeft = extractComputedStyleValue(pane, 'borderLeftWidth');
    const borderRight = extractComputedStyleValue(pane, 'borderRightWidth');
    const marginRight = extractComputedStyleValue(pane, 'marginRight');
    const marginLeft = extractComputedStyleValue(pane, 'marginLeft');

    return paddingLeft + paddingRight + borderLeft + borderRight + marginRight + marginLeft;
}

function getExtraHeight(pane) {
    const paddingTop = extractComputedStyleValue(pane, 'paddingTop');
    const paddingBottom = extractComputedStyleValue(pane, 'paddingBottom');
    const borderTop = extractComputedStyleValue(pane, 'borderTop');
    const borderBottom = extractComputedStyleValue(pane, 'borderBottom');
    const marginTop = extractComputedStyleValue(pane, 'marginTop');
    const marginBottom = extractComputedStyleValue(pane, 'marginBottom');

    return paddingTop + paddingBottom + borderTop + borderBottom + marginTop + marginBottom;
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

        this.splitters = []
    }


    // The connection callback.
    connectedCallback() {
        let panes = this.querySelectorAll("globular-split-pane")

        for (var i = 0; i < panes.length; i++) {
            if (i < panes.length - 1) {
                let splitter =new SplitSlider([panes[i], panes[i + 1]], this.shadowRoot.querySelector(".splitter"))
                this.splitters.push(splitter)
                this.insertBefore( splitter, panes[i + 1])
            }
        }

    }

    setVertical(){
        this.shadowRoot.querySelector(".splitter").style.flexDirection = "column"
        this.splitters.forEach(s=>s.setVertical())
        let panes = this.querySelectorAll("globular-split-pane")
        setTimeout(panes[0].click(), 500)
    }

    setHorizontal(){
        this.shadowRoot.querySelector(".splitter").style.flexDirection = "row"
        this.splitters.forEach(s=>s.setHorizontal())
        let panes = this.querySelectorAll("globular-split-pane")
        setTimeout(panes[0].click(), 500)
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
           
            .splitter_horizontal_slider {
                display: block;
                height: 100%;
                width: 0.3rem;
                z-index: 1000;
                cursor: col-resize;
                background-color: var(--palette-background-paper);
            }

            .splitter_vertical_slider {
                display: block;
                width: 100%;
                height: 0.3rem;
                z-index: 1000;
                cursor: row-resize;
                background-color: var(--palette-background-paper);
            }

        </style>
        <div class="splitter_horizontal_slider"></div>
        `

        // Connect the resize event of it parent...
        /*new ResizeObserver(() => {
            let w = this.view.offsetWidth
            let h = this.view.offsetHeight
        }).observe(view)*/

        this.slider = this.shadowRoot.querySelector(".splitter_horizontal_slider")

        // Now I will set the mouse event on the view itself...
        this.handleSliderDragg(panes[0], this.slider)
    }

    setVertical(){
        this.slider.classList.remove("splitter_horizontal_slider")
        this.slider.classList.add("splitter_vertical_slider")
    }

    setHorizontal(){
        this.slider.classList.remove("splitter_vertical_slider")
        this.slider.classList.add("splitter_horizontal_slider")
    }

    handleSliderDragg(pane, slider) {
        let drag = false; //if true draging is in process
        slider.addEventListener('pointerdown', () => drag = true);
        document.body.addEventListener('pointerup', () => drag = false);

        let onMoveHandler = (e) => {
            if (e.touches) {
                e.clientX = e.touches[0].clientX
                e.clientY = e.touches[0].clientY
            }
    
            if (drag) {
                let flexBasis = 0
                if(slider.classList.contains("splitter_horizontal_slider")){
                    const extra = getExtraWidth(pane);
                    pane.style.flexDirection = "row"
                    flexBasis = pane.offsetWidth + e.movementX + extra
                   
                }else{
                    const extra = getExtraHeight(pane);
                    pane.style.flexDirection = "column"
                    flexBasis = pane.offsetHeight+ e.movementY + extra
                }

                pane.style.flex = `0 0 ${flexBasis}px`;
            }

        }

        document.addEventListener('touchmove', onMoveHandler)
        document.body.addEventListener('mousemove', onMoveHandler);
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
                width: 100%;
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

    setHeight(h) {
        this.shadowRoot.querySelector(".splitter__pane").style.height = h + "px"
    }

}

customElements.define('globular-split-pane', SplitPane)