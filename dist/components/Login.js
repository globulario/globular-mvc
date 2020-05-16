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
/**
 * This is a web-component.
 */
var Login = /** @class */ (function (_super) {
    __extends(Login, _super);
    // attributes.
    // Create the applicaiton view.
    function Login() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    // The workspace div.
    Login.prototype.getWorkspace = function () {
        this.shadowRoot.getElementById("workspace");
    };
    // The connection callback.
    Login.prototype.connectedCallback = function () {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n        <span>Login</span>\n      ";
    };
    return Login;
}(HTMLElement));
export { Login };
customElements.define('globular-login', Login);
//# sourceMappingURL=Login.js.map