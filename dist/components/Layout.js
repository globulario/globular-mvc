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
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-layout/demo/sample-content.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-spinner/paper-spinner.js';
import '@polymer/iron-selector/iron-selector.js';
import { Model } from '../Model';
/**
 * This is a web-component.
 */
var Layout = /** @class */ (function (_super) {
    __extends(Layout, _super);
    // attributes.
    // Create the applicaiton view.
    function Layout() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    // The connection callback.
    Layout.prototype.connectedCallback = function () {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n          <style>\n\n          app-header {\n            background-color: var(--md-toolbar-color);\n            color: var(--md-toolbar-text-color)\n          }\n          \n          app-drawer app-toolbar{ \n              background-color: var(--primary-background-color);\n              color: var(--primary-text-color);\n              height: 100vh;\n              display: flex;\n              flex-direction: column;\n              overflow-y: auto;\n          }\n          \n          paper-icon-button {\n            --paper-icon-button-ink-color: white;\n          }\n          \n          app-drawer-layout:not([narrow]) [drawer-toggle] {\n            display: none;\n          }\n          \n          #contentContainer {\n              min-height: calc(100vh - var(--md-toolbar-height));\n              background-color: var(--primary-background-color);\n              color: var(--primary-text-color);\n          }\n          \n          #header-toolbar {\n            height: var(--md-toolbar-height);\n          }\n          \n          #main-title {\n            display: flex;\n            width: 100%;\n            align-items: center;\n          }\n          \n          #toolbar {\n            display: flex;\n          }\n          \n          #title {\n            flex-grow: 1;\n          }\n          \n          #workspace {\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n          }\n          \n          #waiting_div_text div{\n            text-align: center;\n          }\n          </style>\n      \n          <app-drawer-layout id=\"layout\" fullbleed force-narrow>\n            <app-drawer id=\"app-drawer\" slot=\"drawer\">\n              <app-toolbar>\n                  <slot id=\"side-menu\" name=\"side-menu\"></slot>\n              </app-toolbar>\n            </app-drawer>\n            <app-header-layout>\n              <app-header slot=\"header\" fixed effects=\"waterfall\">\n                <app-toolbar id=\"header-toolbar\">\n                  <paper-icon-button id=\"menu-btn\" icon=\"menu\" drawer-toggle>\n                    <paper-ripple class=\"circle\" recenters></paper-ripple>\n                  </paper-icon-button>\n                  <div id=\"main-title\">\n                    <slot name=\"title\"></slot>\n                    <slot name=\"toolbar\"></slot>\n                  </div>\n                </app-toolbar>\n              </app-header>\n              <slot name=\"workspace\"></slot>\n            </app-header-layout>\n          </app-drawer-layout>\n      ";
        // keep reference of left 
        this.appDrawer = this.shadowRoot.getElementById("app-drawer");
        this.menuBtn = this.shadowRoot.getElementById("menu-btn");
        this.hideSideBar();
    };
    Layout.prototype.showSideBar = function () {
        // Set the side menu.
        var layout = this.shadowRoot.getElementById("layout");
        layout.insertBefore(this.appDrawer, layout.firstChild);
        // Set the menu button
        var toolbar = this.shadowRoot.getElementById("header-toolbar");
        toolbar.insertBefore(this.menuBtn, toolbar.firstChild);
    };
    Layout.prototype.hideSideBar = function () {
        this.menuBtn.parentNode.removeChild(this.menuBtn);
        this.appDrawer.parentNode.removeChild(this.appDrawer);
    };
    // Get layout zone.
    Layout.prototype.init = function () {
        // Connect the event listener's
        var _this = this;
        // Here I will connect the event listener's
        Model.eventHub.subscribe("login_event", function (uuid) {
            /** nothing to do here. */
        }, function (data) {
            // Here the user is log in...
            _this.showSideBar();
        }, true);
        Model.eventHub.subscribe("logout_event", function (uuid) {
            /** nothing to do here. */
        }, function (data) {
            // Here the user is log out...
            _this.hideSideBar();
        }, true);
    };
    Layout.prototype.width = function () {
        return this.shadowRoot.getElementById("layout").offsetWidth;
    };
    /**
     * That contain the application title.
     */
    Layout.prototype.title = function () {
        return document.getElementById("title");
    };
    /**
     * The toolbar contain the application menu.
     */
    Layout.prototype.toolbar = function () {
        return document.getElementById("toolbar");
    };
    /**
     * Return the side menu
     */
    Layout.prototype.sideMenu = function () {
        return document.getElementById("side-menu");
    };
    /**
     * Return the workspace
     */
    Layout.prototype.workspace = function () {
        return document.getElementById("workspace");
    };
    /**
     * Block user input and wait until resume.
     * @param {*} msg
     */
    Layout.prototype.wait = function (msg) {
        if (msg == undefined) {
            msg = "wait...";
        }
        if (this.shadowRoot.getElementById("waiting_div") != undefined) {
            this.shadowRoot.getElementById("waiting_div_text").innerHTML = msg;
        }
        else {
            var html = "\n        <style>\n          #waiting_div_text div{\n            text-align: center;\n          }\n        </style>\n        <div id=\"waiting_div\" style=\"position: fixed; background-color: rgba(0, 0, 0, 0.2); top:0px; left: 0px; right: 0px; bottom:0px; display: flex; flex-direction: column; align-items: center; justify-content: center;\">\n          <paper-spinner style=\"width: 4.5rem; height: 4.5rem;\" active></paper-spinner>\n          <span id=\"waiting_div_text\" style=\"margin-top: 4.5rem; font-size: 1.2rem; display: flex; flex-direction: column; justify-content: center; align-items: center;\">" + msg + "</span>\n        </div>\n      ";
            this.shadowRoot.appendChild(document.createRange().createContextualFragment(html));
        }
    };
    /**
     * Remove the waiting div.
     */
    Layout.prototype.resume = function () {
        var waitingDiv = this.shadowRoot.getElementById("waiting_div");
        if (waitingDiv != undefined) {
            waitingDiv.parentNode.removeChild(waitingDiv);
        }
    };
    return Layout;
}(HTMLElement));
export { Layout };
customElements.define('globular-application', Layout);
//# sourceMappingURL=Layout.js.map