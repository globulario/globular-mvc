import { Modal } from "materialize-css";
import { Model } from "./Model";

/**
 * That class made use of the web-component applcation view.
 */
export class View {

    protected listeners: Array<any>;

    constructor() {
        this.listeners = new Array<any>();
    }

    // Refresh the view.
    update() {

    }

    // Initialyse view listener and other stuff. Must be call after model is init.
    init() {

    }

    appendListener(name: string, uuid: string){
        this.listeners.push({name:name, uuid:uuid})
    }

    // Explicitly close the view.
    close() {
        // Close the project.
        this.listeners.forEach((listener: any) => {
            Model.eventHub.unSubscribe(listener.name, listener.uuid)
        })
    }

    // Display a user message.
    displayMessage(msg: any, delay?: number) {
        
    }

    // Block user input
    wait(msg: string) {

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

    getWorkspace(): any {

    }
}