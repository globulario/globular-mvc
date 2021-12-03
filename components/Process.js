
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { GetProcessInfosRequest } from "globular-web-client/admin/admin_pb";
import { ApplicationView } from "../ApplicationView";

/**
 * The Globular process manager.
 */
export class ProcessManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        this.onenterfullscreen = null
        this.onexitfullscreen = null
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
          <style>
              ${theme}
              paper-card{
                 position: relative;
                 display: flex;
                 flex-direction: column;
                 width: 100%;
                 height: 100%;
                 font: 1rem Inconsolata, monospace;
                 text-shadow: 0 0 1px #C8C8C8;
                 background: repeating-linear-gradient(
                     0deg,
                     rgba(black, 0.15),
                     rgba(black, 0.15) 1px,
                     transparent 1px,
                     transparent 2px
                   );
             }
 
             
             .title{
                 text-align: center;
                 height: 20px;
                 padding-top: 10px;
                 padding-bottom: 10px;
                 color: var(--palette-action-disabled);
                 
                 flex-grow: 1;
             }
 
             .error_message{
                 color: var(--palette-secondary-main);
             }
 
             .info_message{
                 color: var(--palette-secondary-light);
             }
 
          </style>
          <paper-card>
             <div style="display: flex; width: 100%; border-bottom: 1px solid var(--palette-action-disabled);">
                 <span class="title"></span>
                 <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                 <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
             </div>
             <div id="container" style="flex-grow: 1; height: 30vh; overflow-y: auto;">
             </div>
             
          </paper-card>
          `

        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        // I will use the resize event to set the size of the file explorer.
        this.exitFullScreenBtn.onclick = () => {
            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.position = ""
            this.style.top = ""
            this.style.bottom = ""
            this.style.right = ""
            this.style.left = ""
            this.shadowRoot.querySelector("#container").style.height = "30vh "
            document.querySelector("globular-console").style.display = ""
            if (this.onexitfullscreen) {
                this.onexitfullscreen()
            }
        }

        this.enterFullScreenBtn.onclick = () => {
            this.style.position = "absolute"
            this.style.top = "60px"
            this.style.bottom = "00px"
            this.style.right = "0px"
            this.style.left = "0px"
            this.enterFullScreenBtn.style.display = "none"
            this.exitFullScreenBtn.style.display = "block"

            if (this.onenterfullscreen) {
                this.onenterfullscreen()
            }
        }
    }

    /**
     * Go to the bottom of the div...
     */
    gotoBottom() {
        var element = this.shadowRoot.querySelector("#container");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }


    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.shadowRoot.querySelector(`.title`).innerHTML = `Process Manager @${Application.globular.config.Domain} Globular ${Application.globular.config.Version}`
        let rqst = new GetProcessInfosRequest
        rqst.setName("")
        rqst.setPid(0)
        Application.globular.adminService.getProcessInfos(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp=>{
                console.log(rsp.getInfosList())
            })
            .catch(err=>ApplicationView.displayMessage(err, 3000))

    }
}

customElements.define('globular-process-manager', ProcessManager)