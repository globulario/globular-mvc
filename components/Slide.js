
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

            #panel{
                position: fixed;
                top: 65px;
                bottom: 0px;
                display: flex;
                transition: background 0.2s ease,padding 0.8s linear;
            }

            #container{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                border-left: 1px solid var(--palette-action-disabled);
                border-right: 1px solid var(--palette-action-disabled);
                overflow: auto;
                direction:rtl; 
            }

            #content{
                min-width: 300px;
                width: 100%; 
                height: 100%; 
                direction:ltr;
            }

            #buttons-div {
                margin: 2px;
                border-radius: 20px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                border-right: 1px solid var(--palette-divider);
                height: 40px;
            }

            #buttons-div:hover{
                box-shadow: 0 2px 2px 0 rgb(0 0 0 / 14%), 0 1px 5px 0 rgb(0 0 0 / 12%), 0 3px 1px -2px rgb(0 0 0 / 20%);
                cursor:pointer;
            }

            .slide-in {
                animation: slide-in 0.5s forwards;
                -webkit-animation: slide-in 0.5s forwards;
            }

            .slide-out {
                animation: slide-out 0.5s forwards;
                -webkit-animation: slide-out 0.5s forwards;
            }
            
            @keyframes slide-in {
                0% {  transform: translateX( calc(100% - 42px) ); }
                100% { transform: translateX(0%); }
            }
            
            @-webkit-keyframes slide-in {
                0% {  transform: translateX( calc(100% - 42px) ); }
                100% { -webkit-transform: translateX(0%); }
            }
                
            @keyframes slide-out {
                0% { transform: translateX(0%); }
                100% {  transform: translateX( calc(100% - 42px) ); }
            }
            
            @-webkit-keyframes slide-out {
                0% { -webkit-transform: translateX(0%); }
                100% { -webkit-transform: translateX( calc(100% - 42px) ); }
            }
        </style>

        <div id="panel" class="">
            <div id="buttons-div">
                <paper-icon-button id="show-btn" icon="icons:chevron-left" style="display: none;"></paper-icon-button>
                <paper-icon-button id="hide-btn" icon="icons:chevron-right"></paper-icon-button>
            </div>
            <div id="container">
                <div id="content">
                    <slot></slot>
                </div>
            </div>
        </div>
        `
        this.panel = this.shadowRoot.querySelector("#panel")
        this.container = this.shadowRoot.querySelector("#container")
        this.content = this.shadowRoot.querySelector("#content")
        if (this.hasAttribute("side")) {
            let side = this.getAttribute("side")
            if (side == "right") {
                this.panel.style.right = "0px"
            } else if (side == "left") {
                this.panel.style.left = "0px"
            }
        }

        let showBtn = this.shadowRoot.querySelector("#show-btn")
        let hideBtn = this.shadowRoot.querySelector("#hide-btn")

        hideBtn.onclick = ()=>{
            this.panel.classList.remove("slide-in")
            this.panel.classList.add("slide-out")
            showBtn.style.display = "block"
            hideBtn.style.display = "none"
        }


        showBtn.onclick = ()=>{
            this.panel.classList.remove("slide-out")
            this.panel.classList.add("slide-in")
            hideBtn.style.display = "block"
            showBtn.style.display = "none"

        }
    }

    connectedCallback() {
        
    }

    scrollTo(to){
        this.container.scrollTo(to)
    }
}

customElements.define('globular-slide-panel', SlidePanel)