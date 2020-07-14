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
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import { Menu } from './Menu';
import { Model } from '../Model';
/**
 * Login/Register functionality.
 */
var AccountMenu = /** @class */ (function (_super) {
    __extends(AccountMenu, _super);
    // attributes.
    // Create the applicaiton view.
    function AccountMenu() {
        return _super.call(this, "account", "account-circle", "session") || this;
    }
    AccountMenu.prototype.init = function () {
        //super.init()
    };
    // Set the account information.
    AccountMenu.prototype.setAccount = function (account) {
        var _this = this;
        var html = "\n            <style>\n                #accout-menu-header{\n                    display: flex;\n                    font-size: 12pt;\n                    line-height: 1.6rem;\n                    align-items: center;\n                }\n\n                #account-header-id{\n                    font-weight: 500;\n                }\n\n                #account-header-id{\n                    \n                }\n\n                #icon-div iron-icon{\n                    height: 40px;\n                    width: 40px;\n                    padding-right: 10px;\n                }\n\n                #profile-picture{\n                    width: 40px;\n                    height: 40px;\n                    padding-right: 10px;\n                    border-radius: 20px;\n                    border: 1px solid transparent;\n                    display: none;\n                }\n\n                #profile-picture:hover{\n                    cursor: pointer;\n                }\n\n                #icon-div iron-icon:hover{\n                    cursor: pointer;\n                }\n\n            </style>\n\n            <div class=\"card-content\">\n                <input type=\"file\" style=\"display: none;\" id=\"profil_picture_selector\">\n                <div id=\"accout-menu-header\">\n                    <div id=\"icon-div\" title=\"click here to change profile picture\">\n                        <iron-icon id=\"profile-icon\" icon=\"account-circle\"></iron-icon>\n                        <img id=\"profile-picture\"></img>\n                    </div>\n                    <div>\n                        <span id=\"account-header-id\">\n                            " + account._id + "\n                        </span>\n                        <span id=\"account-header-email\">\n                            " + account.email + "\n                        </span>\n                    </div>\n                </div>\n            </div>\n        ";
        var range = document.createRange();
        this.getMenuDiv().innerHTML = ""; // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        html = " \n        <style>\n            .card-actions{\n                display: flex;\n                justify-content: flex-end;\n            }\n        </style>\n        <div class=\"card-actions\">\n            <paper-button id=\"logout_btn\" >logout \n                <iron-icon style=\"padding-left: 5px;\" icon=\"exit-to-app\"></iron-icon> \n            </paper-button>\n        </div>\n        ";
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        if (account.profilPicture_ != undefined) {
            this.setProfilePicture(account.profilPicture_);
        }
        // Action's
        this.shadowRoot.appendChild(this.getMenuDiv());
        // The logout event.
        this.shadowRoot.getElementById("logout_btn").onclick = function () {
            Model.eventHub.publish("logout_event_", {}, true);
        };
        // Display the file selection window.
        this.shadowRoot.getElementById("icon-div").onclick = function (evt) {
            evt.stopPropagation();
            _this.keepOpen = true;
            _this.shadowRoot.getElementById("profil_picture_selector").click();
            setTimeout(function () {
                _this.keepOpen = false;
            }, 100);
        };
        // The profile image selection.
        this.shadowRoot.getElementById("profil_picture_selector").onchange = function (evt) {
            var r = new FileReader();
            var file = evt.target.files[0];
            r.onload = function () {
                // Here I will set the image to a size of 64x64 pixel instead of keep the original size.
                var img = new Image();
                img.onload = function () {
                    var thumbSize = 64;
                    var canvas = document.createElement("canvas");
                    canvas.width = thumbSize;
                    canvas.height = thumbSize;
                    var c = canvas.getContext("2d");
                    c.drawImage(img, 0, 0, thumbSize, thumbSize);
                    Model.eventHub.publish("update_profile_picture_event_", canvas.toDataURL("image/png"), true);
                    _this.setProfilePicture(canvas.toDataURL("image/png"));
                };
                img.src = r.result.toString();
            };
            try {
                r.readAsDataURL(file); // read as BASE64 format
            }
            catch (err) {
                console.log(err);
            }
        };
        this.shadowRoot.removeChild(this.getMenuDiv());
    };
    /**
     * Set the profile picture with the given data url.
     * @param {*} dataUrl
     */
    AccountMenu.prototype.setProfilePicture = function (dataUrl) {
        this.getIcon().style.display = "none";
        this.getImage().style.display = "block";
        this.getImage().src = dataUrl;
        // The profile in the menu.
        var isClose = this.shadowRoot.getElementById("profile-picture") == undefined;
        if (isClose) {
            this.shadowRoot.appendChild(this.getMenuDiv());
        }
        var img = this.shadowRoot.getElementById("profile-picture");
        var ico = this.shadowRoot.getElementById("profile-icon");
        ico.style.display = "none";
        img.style.display = "block";
        img.src = dataUrl;
        if (isClose) {
            this.shadowRoot.removeChild(this.getMenuDiv());
        }
    };
    return AccountMenu;
}(Menu));
export { AccountMenu };
customElements.define('globular-account-menu', AccountMenu);
//# sourceMappingURL=Account.js.map