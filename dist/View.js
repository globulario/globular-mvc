import { Model } from "./Model";
/**
 * That class made use of the web-component applcation view.
 */
var View = /** @class */ (function () {
    function View() {
        this.listeners = new Array();
    }
    // Refresh the view.
    View.prototype.update = function () {
    };
    // Initialyse view listener and other stuff. Must be call after model is init.
    View.prototype.init = function () {
    };
    View.prototype.appendListener = function (name, uuid) {
        this.listeners.push({ name: name, uuid: uuid });
    };
    // Explicitly close the view.
    View.prototype.close = function () {
        // Close the project.
        this.listeners.forEach(function (listener) {
            Model.eventHub.unSubscribe(listener.name, listener.uuid);
        });
    };
    // Display a user message.
    View.prototype.displayMessage = function (msg, delay) {
    };
    // Block user input
    View.prototype.wait = function (msg) {
    };
    // Resume user input.
    View.prototype.resume = function () {
    };
    View.prototype.clear = function () {
    };
    View.prototype.show = function () {
    };
    View.prototype.hide = function () {
    };
    View.prototype.getWorkspace = function () {
    };
    return View;
}());
export { View };
//# sourceMappingURL=View.js.map