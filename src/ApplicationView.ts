import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Layout } from "./components/Layout";
import { Account } from "./Application";
import { Model } from "./Model";

/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
export class ApplicationView extends View {
    
    /** The application view component. */
    private layout: Layout

    /** various listener's */
    private login_event_listener: string
    private logout_event_listener: string

    constructor() {
        super()

        // The web-component use as layout is named globular-application
        if (document.getElementsByTagName("globular-application") != undefined) {
            this.layout = (<Layout>document.getElementsByTagName("globular-application")[0])
        } else {
            this.layout = new Layout();
            document.body.appendChild(this.layout)
        }



    }

    ///////////////////////////////////////////////////////////////////////////////////////
    // Application action's
    ///////////////////////////////////////////////////////////////////////////////////////

    // Must be call by the model when after initialisation.
    init(){
        // Event listner's

        // Logout event
        Model.eventHub.subscribe("logout_event",
            (uuid: string) => {
                this.logout_event_listener = uuid;
            },
            (accountId: string) => {
                this.onLogout(accountId)
            }, false)

        // Login event.
        Model.eventHub.subscribe("login_event",
            (uuid: string) => {
                this.login_event_listener = uuid;
            },
            (accountId: string) => {
                this.onLogin(accountId)
            }, false)
    }

    /**
     * Free ressource here.
     */
    close() {
        // Disconnect event listener's
        Model.eventHub.unSubscribe("login_event", this.login_event_listener)
        Model.eventHub.unSubscribe("logout_event", this.logout_event_listener)
    }

    /**
     * Refresh various component.
     */
    update() {

    }

    /**
     * Call by the model when user is login
     * @param account 
     */
    login(account: Account) {
        /** Implement it as needed */
    }

    /**
     * Call by the model when the user is logout.
     * @param account 
     */
    logout(account: Account) {
        /** Implement it as needed */
    }

    /**
     * Try to extract error message from input object.
     * @param err Can be a string or object, in case of object I will test if the object contain a field named 'message'
     */
    private getErrorMessage(err: any) {
        try {
            let errObj = err;
            if (typeof err === 'string' || err instanceof String) {
                errObj = JSON.parse(<string>err);
            } else if (errObj.message != undefined) {
                errObj = JSON.parse(errObj.message)
            }

            if (errObj.ErrorMsg != undefined) {
                console.log(errObj)
                return errObj.ErrorMsg
            } else {
                return err
            }

        } catch{
            console.log(err)
            return err;
        }
    }

    /**
     * Display a message to the user.
     * @param msg The message to display in toast!
     */
    public displayMessage(err: any, duration: number) {
        return M.toast({ html: this.getErrorMessage(err), displayLength: duration });
    }


    //////////////////////////////////////////////////////////////////////////////////////////
    // Event listener's
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Login event handler
     * @param accountId The id of the user
     */
    onLogin(accountId: string) {
        /** implement it as needed */
    }

    /**
     * Logout event handler
     * @param accountId 
     */
    onLogout(accountId: string) {
        /** implement it as needed */
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Gui function's
    //////////////////////////////////////////////////////////////////////////////////////////


}