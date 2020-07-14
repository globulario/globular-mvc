var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
/**
 * Login/Register functionality.
 */
var Menu = /** @class */ (function (_super) {
    __extends(Menu, _super);
    // attributes.
    // Create the applicaiton view.
    function Menu(id, icon, text) {
        var _this = _super.call(this) || this;
        _this.id = id;
        _this.icon = icon;
        _this.keepOpen = false;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        // Innitialisation of the layout.
        _this.shadowRoot.innerHTML = "\n        <style>\n            \n            #" + _this.id + "_div {\n                display: flex;\n                position: relative;\n            }\n\n            #" + _this.id + "_div paper-button {\n                font-size: 1rem;\n            }\n\n            .menu-btn{\n                margin: 0px 5px 0px 5px;\n            }\n\n            .btn{\n                height: 40px;\n                width: 40px;\n                display: flex;\n                justify-content: center;\n                align-items: center;\n                position: relative;\n            }\n\n            .btn:hover{\n                cursor: pointer;\n            }\n\n            .left{\n                right: 47px;\n                top: 0px;\n            }\n\n            .bottom{\n                right: 0px;\n                top: 40px;\n            }\n\n            #" + _this.id + "_menu_div{\n                display: flex;\n                flex-direction: column;\n                color: var(--primary-text-color);\n                position: absolute;\n            }\n\n            #" + _this.id + "_img{\n                width: 32px;\n                height: 32px;\n                border-radius: 16px;\n                border: 1px solid transparent;\n                display: none;\n            }\n\n            #" + _this.id + "_img:hover{\n                cursor: pointer;\n            }\n\n        </style>\n\n        <div id=\"" + _this.id + "_div\" class=\"menu-btn\">\n            <div id=\"" + _this.id + "_picture_div\" class=\"btn\">\n                <iron-icon id=\"" + _this.id + "_icon\" icon=\"" + _this.icon + "\"></iron-icon>\n                <img id=\"" + _this.id + "_img\"></img>\n                <paper-ripple class=\"circle\" recenters></paper-ripple>\n            </div>\n            <paper-tooltip id=\"" + _this.id + "_tooltip\" for=\"" + _this.id + "_picture_div\" style=\"font-size: 10pt;\">" + text + "</paper-tooltip>\n            <paper-card id=\"" + _this.id + "_menu_div\" class=\"menu-div bottom\">\n                <slot name=\"" + _this.id + "\"></slot>\n            </paper-card>\n        </div>\n    ";
        // this is execute each time the element is connect in the dom.
        _this.parentNode_ = _this.parentNode;
        // Get the menu div
        _this.menu = _this.shadowRoot.getElementById(_this.id + "_menu_div");
        // Remove it from the layout...
        _this.menu.parentNode.removeChild(_this.menu);
        return _this;
    }
    // The connection callback.
    Menu.prototype.connectedCallback = function () {
        var _this = this;
        var menuPictureDiv = this.shadowRoot.getElementById(this.id + "_picture_div");
        // Remove the menu if the the mouse is not over the button or the menu.
        var handler = function (evt) {
            var menu = _this.shadowRoot.getElementById(_this.id + "_menu_div");
            if (menu != null) {
                var rectMenu = menu.getBoundingClientRect();
                var overMenu = evt.x > rectMenu.x && evt.x < rectMenu.right && evt.y > rectMenu.y && evt.y < rectMenu.bottom;
                var btn = _this.shadowRoot.getElementById(_this.id + "_picture_div");
                var rectBtn = btn.getBoundingClientRect();
                var overBtn = evt.x > rectBtn.x && evt.x < rectBtn.right && evt.y > rectBtn.y && evt.y < rectBtn.bottom;
                if (!overBtn && !overMenu && !_this.keepOpen) {
                    document.removeEventListener("click", handler);
                    menu.parentNode.removeChild(menu);
                }
            }
        };
        // Here I will display the user notification panel.
        menuPictureDiv.onclick = function (evt) {
            // test if the menu is set.
            var menu = _this.shadowRoot.getElementById(_this.id + "_menu_div");
            // simply remove it if it already exist.
            if (menu != undefined) {
                var rectMenu = menu.getBoundingClientRect();
                var overMenu = evt.x > rectMenu.x && evt.x < rectMenu.right && evt.y > rectMenu.y && evt.y < rectMenu.bottom;
                if (!overMenu) {
                    document.removeEventListener("click", handler);
                    menu.parentNode.removeChild(menu);
                }
                return;
            }
            var menuDiv = _this.shadowRoot.getElementById(_this.id + "_div");
            menuDiv.appendChild(_this.menu);
            // set the handler.
            document.addEventListener("click", handler);
        };
    };
    /**
     * Return the body of the menu.
     */
    Menu.prototype.getMenuDiv = function () {
        return this.menu;
    };
    /**
     * Return the icon div.
     */
    Menu.prototype.getIconDiv = function () {
        return this.shadowRoot.getElementById(this.id + "_picture_div");
    };
    /**
     * Return the image div.
     */
    Menu.prototype.getImage = function () {
        return this.shadowRoot.getElementById(this.id + "_img");
    };
    /**
     * Return the image div.
     */
    Menu.prototype.getIcon = function () {
        return this.shadowRoot.getElementById(this.id + "_icon");
    };
    /**
     * Hide the menu.
     */
    Menu.prototype.hide = function () {
        if (this.parentNode != undefined) {
            this.parentNode_ = this.parentNode;
        }
        if (this.parentNode_ != undefined) {
            if (this.parentNode_.contains(this)) {
                this.parentNode_.removeChild(this);
            }
        }
    };
    /**
     * Show the menu.
     */
    Menu.prototype.show = function () {
        if (this.parentNode_ != undefined) {
            this.parentNode_.appendChild(this);
        }
    };
    // Set account information.
    Menu.prototype.init = function () {
        /** Nothing to do here... */
    };
    return Menu;
}(HTMLElement));
export { Menu };
/**
 * Login/Register functionality.
 */
var OverflowMenu = /** @class */ (function (_super) {
    __extends(OverflowMenu, _super);
    // attributes.
    // Create the applicaiton view.
    function OverflowMenu() {
        var _this = _super.call(this, "overflow", "more-vert", "Application menus") || this;
        _this.keepOpen = true;
        return _this;
    }
    OverflowMenu.prototype.init = function () {
        /** Nothing to do here. */
    };
    return OverflowMenu;
}(Menu));
export { OverflowMenu };
customElements.define('globular-overflow-menu', OverflowMenu);
//# sourceMappingURL=Menu.js.map