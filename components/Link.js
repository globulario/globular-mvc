import { File } from "../File";
import { Model } from "../Model";
import { getTheme } from "./Theme";

/**
 * Sample empty component
 */
export class Link extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let path = this.getAttribute("path")
        let thumbnail = this.getAttribute("thumbnail")
        let domain = this.getAttribute("domain")
        let name = path.split("/")[ path.split("/").length - 1]


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${getTheme()}
            #container{

            }

            .shortcut-icon {
                position: absolute;
                bottom: -5px;
                left: 0px;
            }


            .shortcut-icon iron-icon{
                background: white;
                fill: black;
                height: 20px;
                width: 20px;
            }

        </style>

        <div id="link-div" style="display: flex; flex-direction: column; align-items: center; width: fit-content; margin: 5px; height: fit-content;">
            <div style="display: flex; flex-direction: column; border: 1px solid var(--palette-divider); padding: 5px; border-radius: 2.5px;">
            <div style="display: flex; align-items: center; width: 100%;">
                <span class="title" style="flex-grow: 1;"></span>
            </div>
            <div style="position: relative;">
                <img style="height: 72px; width: fit-content; max-width: 172px;" src="${thumbnail}">
                <div class="shortcut-icon">
                    <iron-icon icon="icons:reply"></iron-icon>
                </div> 
            </div>
            </div>
            <span style="font-size: .85rem; padding: 2px; display: block; max-width: 128px; word-break: break-all;">${name}</span>
            
        </div>
        `

        let lnk = this.shadowRoot.querySelector("#link-div")
        lnk.onclick = ()=>{
            Model.eventHub.publish("follow_link_event_", {path:path, domain:domain}, true)
        }


    }

}

customElements.define('globular-link', Link)