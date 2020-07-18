"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsMenu = void 0;
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
require("@polymer/iron-icon/iron-icon.js");
require("@polymer/iron-icons/social-icons");
require("@polymer/iron-icons/editor-icons");
require("@polymer/iron-icons/iron-icons.js");
require("@polymer/paper-icon-button/paper-icon-button.js");
require("@polymer/paper-ripple/paper-ripple.js");
require("@polymer/paper-input/paper-input.js");
require("@polymer/paper-card/paper-card.js");
require("@polymer/paper-button/paper-button.js");
require("@polymer/paper-checkbox/paper-checkbox.js");
require("@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js");
const Menu_1 = require("./Menu");
const Application_1 = require("../Application");
const Layout_1 = require("./Layout");
/**
 * Login/Register functionality.
 */
class ApplicationsMenu extends Menu_1.Menu {
    // attributes.
    // Create the applicaiton view.
    constructor() {
        super("applications", "apps", "Applications");
    }
    init() {
        let html = `
            <style>
                
                #applications-div {
                    display: flex;
                    flex-wrap: wrap;
                    padding: 10px;
                    width: 300px;
                }
            </style>
            <div id="applications-div">
                
            </div>
        `;
        let range = document.createRange();
        this.getMenuDiv().innerHTML = ""; // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().style.height = "380px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv());
        // Action's
        let div = this.shadowRoot.getElementById("applications-div");
        Application_1.Application.getAllApplicationInfo((infos) => {
            this.shadowRoot.appendChild(this.getMenuDiv());
            let range = document.createRange();
            for (var i = 0; i < infos.length; i++) {
                let applicaiton = infos[i];
                let html = `
                <style>
                    ${Layout_1.theme}
                    
                    #applications_menu_div{
                        background-color: var(--palette-background-paper);
                    }

                    .application-div {
                        display: flex;
                        position: relative;
                        flex-direction: column;
                        align-items: center;
                        height: 80px;
                        width: 80px;
                        margin: 5px;
                        padding: 5px;
                        border-radius: 5px;
                        transition: background 0.2s ease,padding 0.8s linear;
                    }

                    .application-div:hover{
                        cursor: pointer;
                        background-color: #dbdbdb;
                    }

                    .application-div img{
                        height: 56px;
                        width: 56px;
                    }

                    .application-div span{
                        margin-top: 5px;
                        color: #404040;
                        display: inline-block;
                        font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
                        font-size: 14px;
                        letter-spacing: .09px;
                        line-height: 16px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                        width: 76px;
                        text-align: center;
                        color: var(--palette-text-primary);
                    }

                </style>
                <div id="${applicaiton._id}_div" class="application-div">
                    <paper-ripple recenters></paper-ripple>
                    <img id="${applicaiton._id}_img"></img>
                    <span id="${applicaiton._id}_span"></span>
                    <a id="${applicaiton._id}_lnk" style="display: none;"></a>
                </div>
            `;
                div.appendChild(range.createContextualFragment(html));
                let div_ = this.shadowRoot.getElementById(applicaiton._id + "_div");
                let img = this.shadowRoot.getElementById(applicaiton._id + "_img");
                let lnk = this.shadowRoot.getElementById(applicaiton._id + "_lnk");
                var currentLocation = window.location;
                lnk.href = currentLocation.origin + applicaiton.path;
                let title = this.shadowRoot.getElementById(applicaiton._id + "_span");
                img.src = applicaiton.icon;
                title.innerHTML = applicaiton._id;
                title.title = applicaiton._id;
                div_.onclick = () => {
                    lnk.click();
                };
            }
            this.shadowRoot.removeChild(this.getMenuDiv());
        }, (err) => {
            console.log(err);
        });
        this.shadowRoot.removeChild(this.getMenuDiv());
    }
}
exports.ApplicationsMenu = ApplicationsMenu;
customElements.define('globular-applications-menu', ApplicationsMenu);
