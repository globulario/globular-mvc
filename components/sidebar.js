import { getTheme } from "./Theme.js";

/**
 * Sample empty component
 */
export class Sidebar extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(width) {
        super()

        this.width = width;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                min-width: ${this.width}px;

            }

            .Sidebar{
                height: 100%;
                position: relative;
                display: -webkit-box;
                display: -ms-flexbox;
                display: flex;
                -webkit-box-orient: vertical;
                -webkit-box-direction: normal;
                -ms-flex-direction: column;
                flex-direction: column;
                -ms-flex-wrap: nowrap;
                flex-wrap: nowrap;
                -webkit-box-pack: start;
                -ms-flex-pack: start;
                justify-content: flex-start;
                pointer-events: all;
                z-index: 13;
              }
        </style>
        <div id="container" class="Sidebar">
              <slot></slot>
        </div>
        `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

    }

    // Call search event.
    attributeChangedCallback(name, oldValue, newValue) {
        console.log('Custom square element attributes changed.', name, oldValue, newValue);
        updateStyle(this);
    }

}

customElements.define('globular-sidebar', Sidebar)


/**
 * Sample empty component
 */
export class SidebarCollapsiblePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.headerText = this.getAttribute("header-text")
        this.hasAttributeChanged = false; // The blue dot opacity must be set to 1 in that case
        this.hasHeritedValue = false; // The orange dot must be display when css value are inherited from other css rules.

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                transition: background 0.2s ease,padding 0.8s linear;
            }

            #expand-btn, #collapse-btn:hover{
                cursor: pointer;
            }

        </style>
        <div data-automation-id="Layout" style="display: flex; flex-direction: column; flex: 0 1 auto;">
            <div data-automation-id="Header" tabindex="0" style="outline: 0px; cursor: default; user-select: none; background: rgb(43, 43, 43); border-bottom: 1px solid rgb(33, 33, 33); height: 28px; padding-left: 4px; padding-top: 4px; padding-bottom: 4px; box-sizing: border-box; overflow: visible; display: flex; align-items: center; flex: 0 1 auto;">
                <div style="display: flex; align-items: center; justify-content: center; margin-right: 4px;">
                    <svg id="collapse-btn" data-icon="CaretDown" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" class="bem-Svg" style="display: none;">
                        <path d="M4 6l3 .01h2L12 6l-4 4-4-4z" fill="currentColor"></path>
                    </svg>
                    <svg id="expand-btn" data-icon="CaretRight" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" class="bem-Svg" style="display: block;">
                        <path d="M6 12l.01-3V7L6 4l4 4-4 4z" fill="currentColor"></path>
                    </svg>
                </div>
                <div style="width: calc(100% - 12px); color: rgb(217, 217, 217); font-size: 12px; font-family: Inter, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Oxygen-Sans, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, Helvetica, Arial, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, sans-serif; line-height: 16px; font-weight: 600;">
                    <div style="display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
                        <div style="margin-right: 4px;">${this.headerText}</div>
                        <div style="margin-right: auto;">
                            <div style="align-items: center; display: grid; gap: 0px; grid-template-columns: 4px 8px;">
                                <svg id="has-changed-values" data-icon="DotCutout" aria-hidden="true" focusable="false" width="4" height="5" viewBox="0 0 4 5" class="bem-Svg" style="display: block; color: rgb(232, 145, 83); align-self: center; transition: opacity 100ms ease 0s; opacity: 0;">
                                    <path fill="currentColor" d="M4 .5c-.607.456-1 1.182-1 2 0 .818.393 1.544 1 2a2.5 2.5 0 110-4z"></path>
                                </svg>
                                <svg id="has-inherited-values"  data-icon="DotMedium" aria-hidden="true" focusable="false" width="7" height="7" viewBox="0 0 7 7" class="bem-Svg" style="display: block; color: rgb(107, 176, 255); align-self: center; transition: opacity 100ms ease 0s; opacity: 0;">
                                    <circle fill="currentColor" cx="3.5" cy="3.5" r="2.5"></circle>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <slot name="header-menu">
                   
                </slot>
            </div>
            <div id="content"  style="background-color: rgb(64, 64, 64); display: none;">
                <slot>

                </slot>
                <div style="height: 1px; width: 100%; border-bottom: 1px solid rgb(33, 33, 33);"></div>
            </div>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.expandBtn = this.shadowRoot.querySelector("#expand-btn")
        this.collapseBtn = this.shadowRoot.querySelector("#collapse-btn")
        this.content = this.shadowRoot.querySelector("#content")

        this.expandBtn.onclick = ()=>{
            this.content.style.display = "block";
            this.expandBtn.style.display = "none";
            this.collapseBtn.style.display = "block";
        }

        this.collapseBtn.onclick = ()=>{
            this.content.style.display = "none";
            this.expandBtn.style.display = "block";
            this.collapseBtn.style.display = "none";
        }

        this.hasChangedValues = this.shadowRoot.querySelector("#has-changed-values")
        this.hasInheritedValues = this.shadowRoot.querySelector("#has-inherited-values")

    }

    /** Set the blue dot that display change has append. */
    setHasChange(){
        this.hasChangedValues.setAttributeNS("http://www.w3.org/2000/svg", "opacity", "1")
    }

    /** Hide the blue dot */
    resetHasChange(){
        this.hasChangedValues.setAttributeNS("http://www.w3.org/2000/svg", "opacity", "0")
    }

    /** Set the orange dot that display that the property came from hierarchy */
    setInherited(){
        this.hasInheritedValues.setAttributeNS("http://www.w3.org/2000/svg", "opacity", "1")
    }

    /** Reset the orange dot */
    resetInherited(){
        hasInheritedValues.setAttributeNS("http://www.w3.org/2000/svg", "opacity", "0")
    }
}

customElements.define('globular-sidebar-collapsible-panel', SidebarCollapsiblePanel)