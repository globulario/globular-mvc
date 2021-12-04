
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { GetProcessInfosRequest } from "globular-web-client/admin/admin_pb";
import { ApplicationView } from "../ApplicationView";
import { v4 as uuidv4 } from "uuid";

function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

function getStats(callback, errorcallback) {

    let url = window.location.protocol + "//" + window.location.host + "/stats"

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
            var obj = JSON.parse(this.responseText);
            callback(obj);
        } else if (this.readyState == 4) {
            errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("domain", Model.domain);

    xmlhttp.send();
}

/**
 * The Globular process manager.
 */
export class SystemMonitor extends HTMLElement {
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

             #container {
                flex-grow: 1; 
                height: 30vh; 
                overflow-y: auto;
                display: flex;
                flex-direction: column;
             }

             #tab-content {
                flex-grow: 1;
                overflow: auto;
             }

          </style>
          <paper-card>
             <div style="display: flex; width: 100%; border-bottom: 1px solid var(--palette-action-disabled);">
                 <span class="title"></span>
                 <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                 <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
             </div>
             <div id="container" style="">
                <paper-tabs selected="0">
                    <paper-tab id="host-infos-tab">
                        <span>Host Infos</span>
                    </paper-tab>
                    <paper-tab id="resources-display-tab">
                        <span>Resources</span>
                    </paper-tab>
                    <paper-tab id="processes-manager-tab">
                        <span>Processes</span>
                    </paper-tab>
                </paper-tabs>
                <div id="tab-content">
                    <slot>
                    </slot>
                </div>
             </div>
          </paper-card>
          `

        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        let hostInfosTab = this.shadowRoot.querySelector("#host-infos-tab")
        this.hostInfos = new HostInfos()
        this.appendChild(this.hostInfos)

        let resourcesDisplayTab = this.shadowRoot.querySelector("#resources-display-tab")
        this.resourcesDisplay = new ResourcesDisplay()
        this.appendChild(this.resourcesDisplay)

        let processesManagerTab = this.shadowRoot.querySelector("#processes-manager-tab")
        this.processesManager = new ProcessesManager()
        this.appendChild(this.processesManager)


        // Here I will connect the tab and the panel...
        hostInfosTab.onclick = () => {
            this.hostInfos.style.display = "block"
            this.resourcesDisplay.style.display = "none"
            this.processesManager.style.display = "none"
        }

        resourcesDisplayTab.onclick = () => {
            this.hostInfos.style.display = "none"
            this.resourcesDisplay.style.display = "block"
            this.processesManager.style.display = "none"
        }

        processesManagerTab.onclick = () => {
            this.hostInfos.style.display = "none"
            this.resourcesDisplay.style.display = "none"
            this.processesManager.style.display = "block"
        }

        // Set the first tab...
        hostInfosTab.click()


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

    displayStats(stats) {
        this.hostInfos.setUptime(stats.uptime)
        this.resourcesDisplay.setInfos(stats)
    }

    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.shadowRoot.querySelector(`.title`).innerHTML = `System Monitor @${Application.globular.config.Domain} Globular ${Application.globular.config.Version}`
        
        getStats((stats) => {
            this.hostInfos.setInfos(stats)
            this.resourcesDisplay.setInfos(stats)
        }, err => ApplicationView.displayMessage(err, 3000))

        this.interval = setInterval(() => {
            // Display stats...
            getStats((stats) => {
                this.displayStats(stats)
            }, err => ApplicationView.displayMessage(err, 3000))
        }, 1000)

    }

    disconnectedCallback() {
        clearInterval(this.interval)
    }
}

customElements.define('globular-system-monitor', SystemMonitor)


/**
 * Get process usage, kill process... etc.
 */
export class ProcessesManager extends HTMLElement {
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
        </style>
        `
    }

    /**
     * 
     * @param {*} callback 
     */
    getProcessesInfo(callback) {
        let rqst = new GetProcessInfosRequest
        rqst.setName("")
        rqst.setPid(0)
        Application.globular.adminService.getProcessInfos(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getInfosList())
            })
            .catch(err => ApplicationView.displayMessage(err, 3000))
    }

    /**
     * display process infos...
     * @param {*} infos 
     */
    displayProcess(infos) {
        // console.log(infos)
    }

    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.interval = setInterval(() => {
            this.getProcessesInfo((infos) => this.displayProcess(infos))
        }, 1000)

    }

    /**
     * 
     */
    disconnectedCallback() {
        clearInterval(this.interval);
    }


}

customElements.define('globular-processes-manager', ProcessesManager)

/**
 * Display resources usage
 */
export class ResourcesDisplay extends HTMLElement {
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
        </style>
        `
    }

    setInfos(infos) {

    }

}
customElements.define('globular-resources-display', ResourcesDisplay)

/**
 * Display host informations, info about the computer where globular run.
 */
export class HostInfos extends HTMLElement {
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

            #container{
                display: table;
                width: 99%;
                height: 100%;
            }

            .row {
                display: table-row;
            }

            .cell {
                display: table-cell;
                padding: 5px;
                border-bottom: 1px solid var(--palette-primary-accent);
            }

            .label {
                width: 30%;
            }

            .value {
                width: 70%;
            }
        </style>
        <div id="container">
            <div class="row">
                <div class="cell">Hostname</div>
                <div class="cell value" id="hostname-div"></div>
            </div>
            <div class="row">
                <div class="cell">OS</div>
                <div class="cell value" id="os-div"></div>
            </div>
            <div class="row">
                <div class="cell">Platform</div>
                <div class="cell value" id="platform-div"></div>
            </div>
            <div class="row">
                <div class="cell">Uptime</div>
                <div class="cell value" id="uptime-div"></div>
            </div>
            <div class="row">
                <div class="cell">Number of runing processes</div>
                <div class="cell value" id="number-of-running-processes-div"></div>
            </div>
            <div class="row">
                <div class="cell">Network Interfaces</div>
                <div class="cell value" id="network-interfaces-div"></div>
            </div>
        </div>
        `
        this.container = this.querySelector("#container")
    }

    setUptime(uptime){
        this.shadowRoot.querySelector("#uptime-div").innerHTML = secondsToDhms(uptime)
    }


    setInfos(infos) {
        if(this.shadowRoot.querySelector("#hostname-div").innerHTML!=""){
            return
        }

        console.log(infos)
        this.shadowRoot.querySelector("#hostname-div").innerHTML = infos.hostname;
        this.shadowRoot.querySelector("#os-div").innerHTML = infos.os;
        this.shadowRoot.querySelector("#platform-div").innerHTML = infos.platform;
        this.shadowRoot.querySelector("#uptime-div").innerHTML = secondsToDhms(infos.uptime)
        this.shadowRoot.querySelector("#number-of-running-processes-div").innerHTML = infos.number_of_running_processes;
        
        // Now the network interfaces.
        let networkInterfacesDiv = this.shadowRoot.querySelector("#network-interfaces-div")
        networkInterfacesDiv.innerHTML = ""
        

        let range = document.createRange()
        infos.network_interfaces.forEach(networkInterface => {
            let uuid = "_" +  uuidv4()
            let html = `
            <div style="display: table; width: 100%; border-bottom: 1px solid var(--palette-primary-accent);">
                <div style="display: table-row; width: 100%;">
                   <span style="display: table-cell; padding: 5px;">Mac ${networkInterface.mac}</span>
                </div>
                <div id="${uuid}" style="display: table; width: 100%; padding-left: 10px;">
                    <div style="display: table-row; width: 100%; padding: 5px;">
                        <span style="display: table-cell; width: 50%; padding-top: 2px; padding-bottom: 2px;">
                            Addresses
                            <div id="${uuid}-addresses-table" style="display: table; padding: 5px; width: 100%; border-top: 1px solid var(--palette-primary-accent);">

                            </div>
                        </span>
                        <span style="display: table-cell; width: 50%; padding-top: 2px; padding-bottom: 2px;">
                            Flags
                            <div id="${uuid}-flags-table" style="display: table; padding: 5px; width: 100%; border-top: 1px solid var(--palette-primary-accent);">

                            </div>
                        </span>
                    <div>
                </div>
            </div>
            `
            networkInterfacesDiv.appendChild(range.createContextualFragment(html))
            let addressTable = networkInterfacesDiv.querySelector("#" +uuid + "-addresses-table")
            networkInterface.addresses.forEach(address=>{
                let obj = JSON.parse(address);
                let html = `
                    <div style="display: table-row;">
                        ${obj.addr}
                    </div>
                `
                addressTable.appendChild(range.createContextualFragment(html))
            })
            
            let flagsTable = networkInterfacesDiv.querySelector("#" +uuid + "-flags-table")
            networkInterface.flags.forEach(flag=>{
                let html = `
                    <div style="display: table-row;">
                        ${flag}
                    </div>
                `
                flagsTable.appendChild(range.createContextualFragment(html))
            })
            // Now I will append values in address and flags div.
        });

        // this.shadowRoot.querySelector("#mac-div").innerHTML = infos.number_of_running_processes;
    }

    connectedCallback() {

    }

}

customElements.define('globular-host-infos', HostInfos)