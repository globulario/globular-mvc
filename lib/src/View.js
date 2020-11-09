"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
const Model_1 = require("./Model");
/**
 * That class made use of the web-component applcation view.
 */
class View {
    constructor() {
        this.listeners = new Array();
    }
    // Refresh the view.
    update() {
    }
    // Initialyse view listener and other stuff. Must be call after model is init.
    init() {
    }
    appendListener(name, uuid) {
        this.listeners.push({ name: name, uuid: uuid });
    }
    // Explicitly close the view.
    close() {
        // Close the project.
        this.listeners.forEach((listener) => {
            Model_1.Model.eventHub.unSubscribe(listener.name, listener.uuid);
        });
    }
    // Display a user message.
    displayMessage(msg, delay) {
    }
    // Block user input
    wait(msg) {
    }
    // Resume user input.
    resume() {
    }
    clear() {
    }
    show() {
    }
    hide() {
    }
    getWorkspace() {
    }
}
exports.View = View;
