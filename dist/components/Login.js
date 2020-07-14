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
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { Model } from '../Model';
/**
 * Login/Register functionality.
 */
var Login = /** @class */ (function (_super) {
    __extends(Login, _super);
    // attributes.
    // Create the applicaiton view.
    function Login() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        _this.loginBox = new LoginBox();
        _this.registerBox = new RegisterBox();
        return _this;
    }
    Login.prototype.getWorkspace = function () {
        return document.getElementById("workspace");
    };
    // The connection callback.
    Login.prototype.connectedCallback = function () {
        var _this = this;
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n        <style>\n \n            #login_div span:hover{\n                cursor:pointer;\n            }\n\n            #login_div {\n                display: flex;\n            }\n\n            #login_div:hover{\n                cursor: pointer;\n            }\n\n            #login_div paper-button {\n                font-size: 1rem;\n            }\n\n        </style>\n        <span id=\"login_div\">\n            <paper-button id=\"register_btn\">register</paper-button>\n            <paper-button id=\"login_btn\">login</paper-button>\n        </span>\n      ";
        // The login panel.
        this.shadowRoot.getElementById("login_btn").onclick = function () {
            if (_this.registerBox.parentNode != undefined) {
                _this.registerBox.parentNode.removeChild(_this.registerBox);
            }
            // Append the login box in the workspace.
            _this.getWorkspace().appendChild(_this.loginBox);
        };
        this.shadowRoot.getElementById("register_btn").onclick = function () {
            if (_this.loginBox.parentNode != undefined) {
                _this.loginBox.parentNode.removeChild(_this.loginBox);
            }
            // Append the login box in the workspace.
            _this.getWorkspace().appendChild(_this.registerBox);
        };
        this.loginDiv = this.shadowRoot.getElementById("login_div");
        this.registerBtn = this.shadowRoot.getElementById("register_btn");
        this.loginBtn = this.shadowRoot.getElementById("login_btn");
    };
    Login.prototype.init = function () {
        // Here I will connect the event listener's
    };
    return Login;
}(HTMLElement));
export { Login };
customElements.define('globular-login', Login);
/**
 * Login box
 */
var LoginBox = /** @class */ (function (_super) {
    __extends(LoginBox, _super);
    // attributes.
    // Create the applicaiton view.
    function LoginBox() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    // The connection callback.
    LoginBox.prototype.connectedCallback = function () {
        var _this = this;
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n        <style>\n\n            paper-input iron-icon{\n                margin-right: 10px;\n            }\n\n            #login_box{\n                z-index: 1000;\n                display: flex;\n                flex-direction: column;\n                margin-top: 15vh;\n                min-width: 340px;\n                position: relative;\n            }\n\n            #login_box .card-actions {\n                display: flex;\n                justify-content: flex-end;\n            }\n\n            #login_box paper-checkbox {\n                margin: 20px 0px 10px 2px;\n            }\n\n            .card-title{\n                position: absolute;\n                top: -40px;\n                font-size: 1rem;\n                text-transform: uppercase;\n\n                color: var(--cr-primary-text-color);\n                font-size: 108%;\n                font-weight: 400;\n                letter-spacing: .25px;\n                margin-bottom: 12px;\n                margin-top: var(--cr-section-vertical-margin);\n                outline: none;\n                padding-bottom: 4px;\n                padding-top: 8px;\n            }\n\n        </style>\n\n        <paper-card id=\"login_box\">\n                <h2 class=\"card-title\">LOGIN</h2>\n                <div class=\"card-content\">\n                    <paper-input id=\"user_input\" label=\"user/email\">\n                        <iron-icon icon=\"account-circle\" slot=\"prefix\"></iron-icon>\n                    </paper-input>\n                    <paper-input id=\"pwd_input\" type=\"password\" label=\"password\">\n                        <iron-icon icon=\"lock\" slot=\"prefix\"></iron-icon>\n                    </paper-input>\n                    <paper-checkbox id=\"remember_me\">Remember me</paper-checkbox>\n                </div>\n                <div class=\"card-actions\">\n                    <paper-button id=\"login_btn\">login</paper-button>\n                    <paper-button id=\"cancel_btn\">cancel</paper-button>\n                </div>\n            </paper-card>\n        ";
        // give the focus to the input.
        var userInput = this.shadowRoot.getElementById("user_input");
        setTimeout(function () {
            userInput.focus();
        }, 100);
        var passwordInput = this.shadowRoot.getElementById("pwd_input");
        var cancelBtn = this.shadowRoot.getElementById("cancel_btn");
        var loginBtn = this.shadowRoot.getElementById("login_btn");
        var remeberMeBtn = this.shadowRoot.getElementById("remember_me");
        // remove the login box from the layout
        cancelBtn.onclick = function () {
            _this.parentNode.removeChild(_this);
            userInput.value = "";
            passwordInput.value = "";
        };
        loginBtn.onclick = function (evt) {
            evt.stopPropagation();
            // Get the user id and pwd.
            var userId = userInput.value;
            var pwd = passwordInput.value;
            _this.parentNode.removeChild(_this);
            // so here I will throw a event.
            Model.eventHub.publish("login_event_", { userId: userId, pwd: pwd }, true);
        };
        // And you remember me, with a lot of rum!
        if (localStorage.getItem("remember_me") != undefined) {
            if (localStorage.getItem("remember_me") != undefined) {
                remeberMeBtn.checked = localStorage.getItem("remember_me") == "true";
            }
            else {
                remeberMeBtn.checked = false;
            }
        }
        remeberMeBtn.onchange = function () {
            localStorage.setItem("remember_me", remeberMeBtn.checked);
            if (remeberMeBtn.checked == false) {
                localStorage.removeItem("remember_me");
            }
        };
    };
    return LoginBox;
}(HTMLElement));
export { LoginBox };
customElements.define('globular-login-box', LoginBox);
/**
 * Register box
 */
var RegisterBox = /** @class */ (function (_super) {
    __extends(RegisterBox, _super);
    // attributes.
    // Create the applicaiton view.
    function RegisterBox() {
        var _this = _super.call(this) || this;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    // The connection callback.
    RegisterBox.prototype.connectedCallback = function () {
        var _this = this;
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n            <style>\n\n                paper-input iron-icon{\n                    margin-right: 10px;\n                }\n\n                #register_box{\n                    z-index: 1000;\n                    display: flex;\n                    flex-direction: column;\n                    margin-top: 15vh;\n                    min-width: 340px;\n                    position: relative;\n                }\n\n                #register_box .card-actions {\n                    display: flex;\n                    justify-content: flex-end;\n                }\n\n                .card-title{\n                    position: absolute;\n                    top: -40px;\n                    font-size: 1rem;\n                    text-transform: uppercase;\n                    color: var(--cr-primary-text-color);\n                    font-size: 108%;\n                    font-weight: 400;\n                    letter-spacing: .25px;\n                    margin-bottom: 12px;\n                    margin-top: var(--cr-section-vertical-margin);\n                    outline: none;\n                    padding-bottom: 4px;\n                    padding-top: 8px;\n                }\n\n            </style>\n\n            <paper-card id=\"register_box\">\n                    <h2 class=\"card-title\">REGISTER</h2>\n                    <div class=\"card-content\">\n                        <paper-input id=\"user_input\" label=\"user\">\n                            <iron-icon icon=\"account-circle\" slot=\"prefix\"></iron-icon>\n                        </paper-input>\n                        <paper-input id=\"email_input\" label=\"email\">\n                            <iron-icon icon=\"mail\" slot=\"prefix\"></iron-icon>\n                        </paper-input>\n                        <paper-input id=\"pwd_input\" type=\"password\" label=\"password\">\n                            <iron-icon icon=\"lock\" slot=\"prefix\"></iron-icon>\n                        </paper-input>\n                        <paper-input id=\"retype_pwd_input\" type=\"password\" label=\"retype password\">\n                            <iron-icon icon=\"lock\" slot=\"prefix\"></iron-icon>\n                        </paper-input>\n                    </div>\n                    <div class=\"card-actions\">\n                        <paper-button id=\"register_btn\">register</paper-button>\n                        <paper-button id=\"cancel_btn\">cancel</paper-button>\n                    </div>\n            </paper-card>\n        ";
        var cancelBtn = this.shadowRoot.getElementById("cancel_btn");
        var registerBtn = this.shadowRoot.getElementById("register_btn");
        var userInput = this.shadowRoot.getElementById("user_input");
        setTimeout(function () {
            userInput.focus();
        }, 100);
        var emailInput = this.shadowRoot.getElementById("email_input");
        var passwordInput = this.shadowRoot.getElementById("pwd_input");
        var retypePasswordInput = this.shadowRoot.getElementById("retype_pwd_input");
        // remove the login box from the layout
        cancelBtn.onclick = function () {
            _this.parentNode.removeChild(_this);
            userInput.value = "";
            passwordInput.value = "";
            retypePasswordInput.value = "";
            emailInput.value = "";
        };
        // Register an new user.
        registerBtn.onclick = function () {
            var userId = userInput.value;
            var pwd = passwordInput.value;
            var repwd = retypePasswordInput.value;
            var email = emailInput.value;
            _this.parentNode.removeChild(_this);
            // so here I will throw a event.
            Model.eventHub.publish("register_event_", { userId: userId, email: email, pwd: pwd, repwd: repwd }, true);
        };
    };
    return RegisterBox;
}(HTMLElement));
export { RegisterBox };
customElements.define('globular-register-box', RegisterBox);
//# sourceMappingURL=Login.js.map