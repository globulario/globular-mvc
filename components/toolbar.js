import { getTheme } from "./Theme.js";
import { Model } from "../Model";
import {Tooltip} from "./tooltip.js"

/**
 * Toolbar.
 */
export class Toolbar extends HTMLElement {
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

            }
            .toolbar{
                position: relative; 
                flex-basis: 100%; 
                display: grid; 
                grid-auto-flow: column; 
                grid-auto-columns: 1fr; 
                column-gap: 1px; 
                background: rgb(51, 51, 51); 
                border-radius: 2px; 
                box-shadow: rgb(51, 51, 51) 0px 0px 0px 1px inset;
            }
        </style>
        <div id="container" class="toolbar">
            <slot>

            </slot>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")

    }

}

customElements.define('globular-toolbar', Toolbar)


export class ToolBarButton extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // event handling function.
        this.onselect = null;
        this.ondeselect = null;

        // TODO remove if not necessary...
        this.onenable = null;
        this.ondisable = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        let tooltip = ""
        if(this.hasAttribute("tooltip")){
            tooltip = this.getAttribute("tooltip")
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                transition: background 0.2s ease,padding 0.8s linear;
            }

            #container:hover{
                cursor: pointer;
                -webkit-filter: invert(15%);
                filter: invert(15%);
            }

            .globular-toolbar-button {
                outline: 0px; 
                cursor: default; 
                user-select: none; 
                padding: 0px; 
                box-sizing: 
                border-box; 
                font-family: inherit; 
                font-size: inherit; 
                position: relative; 
                display: flex; 
                align-items: center;
                justify-content: center; 
                height: 24px; 
                border-radius: 0px; 
                color: rgb(217, 217, 217); 
                background: rgb(94, 94, 94); 
                border-width: 1px 0px; 
                border-top-style: solid; 
                border-right-style: initial; 
                border-bottom-style: solid; 
                border-left-style: initial; 
                border-color: rgb(51, 51, 51); 
                align-self: center;
            }

            .globular-toolbar-button.no-allowed {
                border-color: rgb(51, 51, 51); 
                color: rgb(235, 235, 235);
                background: #fafafa66;
                cursor: not-allowed;
            }

            .globular-toolbar-button.selected {
                background: rgb(30, 30, 30);
                box-shadow: rgb(33, 33, 33) 1px 0px 0px 0px;
                border-color: rgb(33, 33, 33);
                color: rgb(235, 235, 235); 
            }

        </style>
        <globular-tooltip id="container" class="globular-toolbar-button" tooltip="${tooltip}" style="position: relative;">
            <slot>
            </slot>
            <paper-ripple></paper-ripple>
        </globular-tooltip>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.container.onclick = ()=>{
            if(this.container.classList.contains("no-allowed")){
                return;
            }

            if(this.container.classList.contains("selected")){
                return;
            }
            
            // first of all I will uselect all button from the tool bar..
            for(var i=0; i < this.parentNode.children.length; i++){
                this.parentNode.children[i].__deselect()
            }

            this.container.classList.add("selected")
            if(this.onselect!=null){
                this.onselect()
            }

        }

        if(this.hasAttribute("disabled")){
            this.disable();
        }
    }

    enable(){
        this.container.classList.remove("no-allowed")
        this.onmouseove = ()=>{
            this.container.style.cursor = "pointer"
        }
        this.onmouseout = ()=>{
            this.container.style.cursor = "default"
        }
    }

    disable(){
        this.container.classList.add("no-allowed")
        this.onmouseover = ()=>{
            this.container.style.cursor = "not-allowed"
        }
        this.onmouseout = ()=>{
            this.container.style.cursor = "default"
        }
    }

    __deselect(){
        this.container.classList.remove("selected")
        if(this.ondeselect != null){
            this.ondeselect();
        }
    }

}

customElements.define('globular-toolbar-button', ToolBarButton)