/**
 * That class made use of the web-component applcation view.
 */
var View = /** @class */ (function () {
    function View() {
    }
    // Refresh the view.
    View.prototype.update = function () {
    };
    // Initialyse view listener and other stuff. Must be call after model is init.
    View.prototype.init = function () {
    };
    // Explicitly close the view.
    View.prototype.close = function () {
    };
    // Display a user message.
    View.prototype.displayMessage = function (msg, delay) {
        console.log(msg);
    };
    return View;
}());
export { View };
//# sourceMappingURL=View.js.map