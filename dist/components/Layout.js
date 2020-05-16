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
    // The workspace div.
    Layout.prototype.getWorkspace = function () {
        this.shadowRoot.getElementById("workspace");
    };
    // The connection callback.
    Layout.prototype.connectedCallback = function () {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n        <style>\n          app-header {\n            background-color: #00897B;\n            color: #fff;\n          }\n          paper-icon-button {\n            --paper-icon-button-ink-color: white;\n          }\n          app-drawer-layout:not([narrow]) [drawer-toggle] {\n            display: none;\n          }\n        </style>\n    \n        <app-drawer-layout>\n          <app-drawer slot=\"drawer\">\n            <app-toolbar>\n                <slot name=\"side-menu\"></slot>\n            </app-toolbar>\n          </app-drawer>\n          <app-header-layout>\n            <app-header slot=\"header\" reveals fixed effects=\"waterfall\">\n              <app-toolbar>\n                <paper-icon-button icon=\"menu\" drawer-toggle></paper-icon-button>\n                <div main-title><slot name=\"toolbar\"></slot></div>\n              </app-toolbar>\n            </app-header>\n            <slot id=\"workspace\" name=\"content\"></slot>\n          </app-header-layout>\n        </app-drawer-layout>\n    ";
    };
    return Layout;
}(HTMLElement));
export { Layout };
customElements.define('globular-application', Layout);
//# sourceMappingURL=Layout.js.map