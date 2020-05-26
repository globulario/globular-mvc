// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';

import { Menu } from './Menu';
import { Model } from '../Model';
import { Application } from '../Application';

/**
 * Login/Register functionality.
 */
export class ApplicationsMenu extends Menu {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super("applications", "apps", "Applications")
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
        `
        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));

        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().style.height = "380px";
        this.getMenuDiv().style.overflowY = "auto";

        this.shadowRoot.appendChild(this.getMenuDiv())
        // Action's
        let div = this.shadowRoot.getElementById("applications-div")
        Application.getAllApplicationInfo((infos) => {
            this.shadowRoot.appendChild(this.getMenuDiv())
            let range = document.createRange()
            for (var i = 0; i < infos.length; i++) {
                let applicaiton = infos[i]
                let html = `
                <style>
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
                    }

                </style>
                <div id="${applicaiton._id}_div" class="application-div">
                    <paper-ripple recenters></paper-ripple>
                    <img id="${applicaiton._id}_img"></img>
                    <span id="${applicaiton._id}_span"></span>
                    <a id="${applicaiton._id}_lnk" style="display: none;"></a>
                </div>
            `

                div.appendChild(range.createContextualFragment(html))
                let div_ = this.shadowRoot.getElementById(applicaiton._id + "_div")
                let img = this.shadowRoot.getElementById(applicaiton._id + "_img")
                let lnk = this.shadowRoot.getElementById(applicaiton._id + "_lnk")
                var currentLocation = window.location;
                lnk.href = currentLocation.origin + applicaiton.path;

                let title = this.shadowRoot.getElementById(applicaiton._id + "_span")
                img.src = applicaiton.icon;
                title.innerHTML = applicaiton._id;
                title.title = applicaiton._id;
                
                div_.onclick = ()=>{
                    lnk.click()
                }

            }
            this.shadowRoot.removeChild(this.getMenuDiv())
        }, (err) => {
            console.log(err)
        })
        this.shadowRoot.removeChild(this.getMenuDiv())
    }
}

customElements.define('globular-applications-menu', ApplicationsMenu)