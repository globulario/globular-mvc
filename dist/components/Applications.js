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
import '@polymer/iron-icons/editor-icons';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import { Menu } from './Menu';
import { Application } from '../Application';
/**
 * Login/Register functionality.
 */
var ApplicationsMenu = /** @class */ (function (_super) {
    __extends(ApplicationsMenu, _super);
    // attributes.
    // Create the applicaiton view.
    function ApplicationsMenu() {
        return _super.call(this, "applications", "apps", "Applications") || this;
    }
    ApplicationsMenu.prototype.init = function () {
        var _this = this;
        var html = "\n            <style>\n                #applications-div {\n                    display: flex;\n                    flex-wrap: wrap;\n                    padding: 10px;\n                    width: 300px;\n                }\n            </style>\n            <div id=\"applications-div\">\n                \n            </div>\n        ";
        var range = document.createRange();
        this.getMenuDiv().innerHTML = ""; // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().style.height = "380px";
        this.getMenuDiv().style.overflowY = "auto";
        this.shadowRoot.appendChild(this.getMenuDiv());
        // Action's
        var div = this.shadowRoot.getElementById("applications-div");
        Application.getAllApplicationInfo(function (infos) {
            _this.shadowRoot.appendChild(_this.getMenuDiv());
            var range = document.createRange();
            var _loop_1 = function () {
                var applicaiton = infos[i];
                var html_1 = "\n                <style>\n                    .application-div {\n                        display: flex;\n                        position: relative;\n                        flex-direction: column;\n                        align-items: center;\n                        height: 80px;\n                        width: 80px;\n                        margin: 5px;\n                        padding: 5px;\n                        border-radius: 5px;\n                        transition: background 0.2s ease,padding 0.8s linear;\n                    }\n\n                    .application-div:hover{\n                        cursor: pointer;\n                        background-color: #dbdbdb;\n                    }\n\n                    .application-div img{\n                        height: 56px;\n                        width: 56px;\n                    }\n\n                    .application-div span{\n                        margin-top: 5px;\n                        color: #404040;\n                        display: inline-block;\n                        font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;\n                        font-size: 14px;\n                        letter-spacing: .09px;\n                        line-height: 16px;\n                        overflow: hidden;\n                        text-overflow: ellipsis;\n                        white-space: nowrap;\n                        width: 76px;\n                        text-align: center;\n                    }\n\n                </style>\n                <div id=\"" + applicaiton._id + "_div\" class=\"application-div\">\n                    <paper-ripple recenters></paper-ripple>\n                    <img id=\"" + applicaiton._id + "_img\"></img>\n                    <span id=\"" + applicaiton._id + "_span\"></span>\n                    <a id=\"" + applicaiton._id + "_lnk\" style=\"display: none;\"></a>\n                </div>\n            ";
                div.appendChild(range.createContextualFragment(html_1));
                var div_ = _this.shadowRoot.getElementById(applicaiton._id + "_div");
                var img = _this.shadowRoot.getElementById(applicaiton._id + "_img");
                var lnk = _this.shadowRoot.getElementById(applicaiton._id + "_lnk");
                currentLocation = window.location;
                lnk.href = currentLocation.origin + applicaiton.path;
                var title = _this.shadowRoot.getElementById(applicaiton._id + "_span");
                img.src = applicaiton.icon;
                title.innerHTML = applicaiton._id;
                title.title = applicaiton._id;
                div_.onclick = function () {
                    lnk.click();
                };
            };
            var currentLocation;
            for (var i = 0; i < infos.length; i++) {
                _loop_1();
            }
            _this.shadowRoot.removeChild(_this.getMenuDiv());
        }, function (err) {
            console.log(err);
        });
        this.shadowRoot.removeChild(this.getMenuDiv());
    };
    return ApplicationsMenu;
}(Menu));
export { ApplicationsMenu };
customElements.define('globular-applications-menu', ApplicationsMenu);
//# sourceMappingURL=Applications.js.map