// Polymer dependencies
import { PolymerElement, html } from '@polymer/polymer';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import { DropdownMenuElement } from './dropdownMenu.js';
import { theme } from "../Theme.js"

// contain the base class menu.
import './menuItem';

// List of imported functionality.
import { createElement } from "../element"
import { isString } from "../utility"

/**
 * That class must be use to create menu.
 */
export class PopupMenuElement extends DropdownMenuElement {
    constructor() {
        super();

        // Drop down menu members.
        this.parent = null
        this.panel = null
        this.items = []
    }

    /**
     * The internal component properties.
     */
    static get properties() {
        return {
            pagesize: Number,
            color: String,
            background: String,
            overColor: String,
            overBackground: String
        }
    }

    static get template() {
        return html`
        <style>
            ${theme}
            menu-item-element{
                display: flex; 
                background-color: var(--palette-background-paper); 
                color: var(--palette-text-primary);
                padding-left: 5px;
                padding-right: 5px;
            }
            
            .menu_item_div{
            display: block; 
            position: relative; 
            z-index: 1; 
            padding: 2px 4px 2px 4px; 
            min-width: 150px; 
            transition: all .2s ease; 
            position: relative; 
            z-index: 1; 
            padding: 2px 4px 2px 4px;  
            transition: all .2s ease; 
            color: ${this.color}
            }

            .dropdown_submenu_items{
            display: none;
            position: absolute;
            z-index: 100;
            left: 0px;
            margin-left: 2px;
            margin-top: 2px;
            -webkit-box-shadow: var(--dark-mode-shadow);
            -moz-box-shadow: var(--dark-mode-shadow);
            box-shadow: var(--dark-mode-shadow);
            }
        </style>
        <slot></slot>
    `;
    }

    /**
     * That function is call when the table is ready to be diplay.
     */
    ready() {
        super.ready();
        this.style.display = "inline-flex"
        this.style.flexDirection = "column"
    }

}

customElements.define('popup-menu-element', PopupMenuElement);