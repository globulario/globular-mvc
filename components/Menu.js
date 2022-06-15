// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import { getTheme } from "./Theme";
import { Model } from '../Model';

/**
 * Login/Register functionality.
 */
export class Menu extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(id, icon, text) {
        super()
        this.id = id;
        this.icon = icon;
        this.keepOpen = false;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #${this.id}_div {
                display: flex;
                position: relative;
                background: transparent;
            }

            .menu-btn{
                margin: 0px 10px 0px 10px;
            }

            .btn{
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
            }

            .btn:hover{
                cursor: pointer;
            }

            .left{
                right: 47px;
                top: 0px;
            }

            .bottom{
                right: -16px;
                top: 54px;
            }

            #overflow_menu_div{
                background-color: var(--palette-background-default);
            }

            #${this.id}_menu_div{
                display: flex;
                flex-direction: column;
                color: var(--palette-text-accent);
                position: absolute;
                background-color: var(--palette-background-paper);
            }

            #${this.id}_img{
                width: 32px;
                height: 32px;
                border-radius: 16px;
                border: 1px solid transparent;
                display: none;
            }

            #${this.id}_img:hover{
                cursor: pointer;
            }

            #${this.id}_icon{
                display: none;
            }

        </style>

        <div id="${this.id}_div" class="menu-btn">
            <div id="${this.id}_picture_div" class="btn">
                <iron-icon id="${this.id}_icon" icon="${this.icon}"></iron-icon>
                <img id="${this.id}_img"></img>
                <paper-ripple class="circle" recenters></paper-ripple>
            </div>
            <paper-tooltip id="${this.id}_tooltip" for="${this.id}_picture_div" style="font-size: 10pt;">${text}</paper-tooltip>
            <paper-card id="${this.id}_menu_div" class="menu-div bottom">
                <slot name="${this.id}"></slot>
            </paper-card>
        </div>
    `
        // this is execute each time the element is connect in the dom.
        this.parentNode_ = this.parentNode

        // Get the menu div
        this.menu = this.shadowRoot.getElementById(this.id + "_menu_div")

        // Remove it from the layout...
        this.menu.parentNode.removeChild(this.menu)

        // Can be use to change the onclick default handler.
        this.onclick = null;

    }

    // The connection callback.
    connectedCallback() {
        let img = this.shadowRoot.getElementById(this.id + "_img")
        let ico = this.shadowRoot.getElementById(this.id + "_icon")
        if (img.src.length == 0) {
            ico.style.display = "block";
        }

        let menuPictureDiv = this.shadowRoot.getElementById(this.id + "_picture_div")

        // Remove the menu if the the mouse is not over the button or the menu.
        let handler = (evt) => {
            var menu = this.shadowRoot.getElementById(this.id + "_menu_div")
            if (menu != null) {
                var rectMenu = menu.getBoundingClientRect();
                var overMenu = evt.x > rectMenu.x && evt.x < rectMenu.right && evt.y > rectMenu.y && evt.y < rectMenu.bottom

                var btn = this.shadowRoot.getElementById(this.id + "_picture_div")
                var rectBtn = btn.getBoundingClientRect();
                var overBtn = evt.x > rectBtn.x && evt.x < rectBtn.right && evt.y > rectBtn.y && evt.y < rectBtn.bottom

                if (!overBtn && !overMenu && !this.keepOpen) {
                    document.removeEventListener("click", handler)
                    let icon = this.getIconDiv().querySelector("iron-icon")
                    if (img.src.length == 0){
                        icon.style.removeProperty("--iron-icon-fill-color")
                    }
                    menu.parentNode.removeChild(menu)
                }
            }
        };

        // Here I will display the user notification panel.
        menuPictureDiv.onclick = (evt) => {
           
            // hide the icon div if image is not undefined.
            let img = this.shadowRoot.getElementById(this.id + "_img")
            let ico = this.shadowRoot.getElementById(this.id + "_icon")
            let icon = this.getIconDiv().querySelector("iron-icon")

            if (img.src.length == 0) {
                ico.style.display = "block";
                //icon.style.setProperty("--iron-icon-fill-color", "var(--palette-primary-main)")
            }

            // test if the menu is set.
            let menu = this.shadowRoot.getElementById(this.id + "_menu_div");
    
            // simply remove it if it already exist.
            if (menu != undefined) {
                var rectMenu = menu.getBoundingClientRect();
                var overMenu = evt.x > rectMenu.x && evt.x < rectMenu.right && evt.y > rectMenu.y && evt.y < rectMenu.bottom
                if (!overMenu) {
                    document.removeEventListener("click", handler)
                    menu.parentNode.removeChild(menu)
                    if (img.src.length == 0){
                        icon.style.removeProperty("--iron-icon-fill-color")
                    }
                }
                return;
            }

            let menuDiv = this.shadowRoot.getElementById(this.id + "_div")
            menuDiv.appendChild(this.menu)

            // set the handler.
            document.addEventListener("click", handler);
        }
    }

    /**
     * Return the body of the menu.
     */
    getMenuDiv() {
        return this.menu
    }

    /**
     * Return the icon div.
     */
    getIconDiv() {
        return this.shadowRoot.getElementById(this.id + "_picture_div")
    }

    /**
     * Return the image div.
     */
    getImage() {
        return this.shadowRoot.getElementById(this.id + "_img")
    }

    /**
     * Return the image div.
     */
    getIcon() {
        return this.shadowRoot.getElementById(this.id + "_icon")
    }

    /**
     * Hide the menu.
     */
    hide() {
        if (this.parentNode != undefined) {
            this.parentNode_ = this.parentNode
        }

        if (this.parentNode_ != undefined) {
            if (this.parentNode_.contains(this)) {
                this.parentNode_.removeChild(this)
            }
        }
    }

    /**
     * Show the menu.
     */
    show() {
        if (this.parentNode_ != undefined) {
            this.parentNode_.appendChild(this)
        }
    }

    // Set account information.
    init() {

        /** Nothing to do here... */
        // On logout I must reset the icon and the image.
        Model.eventHub.subscribe("logout_event_",
            (uuid) => { },
            () => {
                let ico = this.shadowRoot.getElementById(this.id + "_icon")
                let img = this.shadowRoot.getElementById(this.id + "_img")

                if (img != undefined) {
                    img.src = "";
                    img.style.display = "none";
                    ico.style.display = "block";
                }

            },
            true, this)
    }
}

/**
 * Login/Register functionality.
 */
export class OverflowMenu extends Menu {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super("overflow", "more-vert", "Application menus")
        this.keepOpen = true;
    }

    init() {
        /** Nothing to do here. */
    }
}

customElements.define('globular-overflow-menu', OverflowMenu)