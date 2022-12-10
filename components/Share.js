import "@polymer/iron-icons/social-icons";
import { Model } from "../Model";
import { Menu } from './Menu';
import { getTheme } from "./Theme";

/**
 * Login/Register functionality.
 */
 export class ShareMenu extends Menu {

    // Create the application view.
    constructor() {
        super("share", "social:share", "Share")

        // The panel to manage shared content.
        this.sharePanel = null;

        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if(this.sharePanel.parentNode == undefined){
                Model.eventHub.publish("_display_share_panel_event_", this.sharePanel, true)
            }
           
        }

    }

    // Initialyse the share panel.
    init() {

        if(this.sharePanel == null ){
            // init once...
            this.sharePanel = new SharePanel();
        }
    }
}

customElements.define('globular-share-menu', ShareMenu)

/**
 * Sample empty component
 */
 export class SharePanel extends HTMLElement {
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
            #container {
                display: flex;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                width: 95%;
                margin-left: 2.5%;
            }

            #share_div{
                display: flex;
                flex-wrap: wrap;
            }

            #title_div{
                display: flex;
                flex-wrap: wrap;
            }

            h1{

                margin: 0px; 
                margin-left: 10px;
            }

            h2{
                margin-bottom: 4px; 
                margin-left: 10px;
                border-bottom: 1px solid var(--palette-divider);
                width: 80%;
            }

        </style>
        <paper-card id="container">
            <div style="display: flex; justify-content: center;">
                <h1 style="flex-grow: 1;">Shared Resources...</h1>
                <paper-icon-button id="close-btn" icon="icons:close"></paper-icon-button>
            </div>
            <div id="share_div">

            </div>
        </paper-card>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        this.onclose = null

        // simply close the watching content...
        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }
        }
    }

}

customElements.define('globular-share-panel', SharePanel)
