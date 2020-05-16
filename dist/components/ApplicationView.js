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
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
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
var ApplicationView = /** @class */ (function (_super) {
    __extends(ApplicationView, _super);
    // attributes.
    // Create the applicaiton view.
    function ApplicationView() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    // The connection callback.
    ApplicationView.prototype.connectedCallback = function () {
        this.shadowRoot.innerHTML = "\n        <style>\n          app-header {\n            background-color: #00897B;\n            color: #fff;\n          }\n          paper-icon-button {\n            --paper-icon-button-ink-color: white;\n          }\n          app-drawer-layout:not([narrow]) [drawer-toggle] {\n            display: none;\n          }\n        </style>\n        \n        <app-drawer-layout>\n          <app-drawer slot=\"drawer\">\n            <app-toolbar>\n                <slot name=\"side\"></slot>\n            </app-toolbar>\n          </app-drawer>\n          <app-header-layout>\n            <app-header slot=\"header\" reveals fixed effects=\"waterfall\">\n              <app-toolbar>\n                <paper-icon-button icon=\"menu\" drawer-toggle></paper-icon-button>\n                <div main-title><slot name=\"toolbar\"></slot></div>\n              </app-toolbar>\n            </app-header>\n            <slot name=\"content\"></slot>\n          </app-header-layout>\n        </app-drawer-layout>\n    ";
        if (this.hasAttribute("welcome")) {
            this.displayMessage(this.getAttribute("welcome"), 3000);
        }
    };
    ApplicationView.prototype._getErrorMessage = function (err) {
        try {
            var errObj = err;
            if (typeof err === 'string' || err instanceof String) {
                errObj = JSON.parse(err);
            }
            else if (errObj.message != undefined) {
                errObj = JSON.parse(errObj.message);
            }
            if (errObj.ErrorMsg != undefined) {
                console.log(errObj);
                return errObj.ErrorMsg;
            }
            else {
                return err;
            }
        }
        catch (_a) {
            console.log(err);
            return err;
        }
    };
    /**
     * Display a message to the user.
     * @param msg The message to display in toast!
     */
    ApplicationView.prototype.displayMessage = function (err, duration) {
        return M.toast({ html: this._getErrorMessage(err), displayLength: duration });
    };
    return ApplicationView;
}(HTMLElement));
export { ApplicationView };
customElements.define('globular-application', ApplicationView);
//# sourceMappingURL=ApplicationView.js.map