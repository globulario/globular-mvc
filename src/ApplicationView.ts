import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Account } from "./Account";
import { Model } from "./Model";


// web-components.
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";

// Import css styles.
import "../css/Application.css"

import { AccountMenu } from "./components/Account";
import { NotificationMenu } from "./components/Notification";
import { OverflowMenu } from "./components/Menu";
import { ApplicationsMenu } from "./components/Applications";

/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
export class ApplicationView extends View {

    /** The application view component. */
    private layout: Layout

    /** The login panel */
    private login_: Login

    /** The account panel */
    private accountMenu: AccountMenu

    /** The  overflow menu*/
    private overFlowMenu: OverflowMenu

    /** The nofitication panel */
    private notificationMenu: NotificationMenu

    /** The applications menu */
    private applicationsMenu: ApplicationsMenu

    /** various listener's */
    private login_event_listener: string
    private logout_event_listener: string

    private isLogin: boolean;

    constructor() {
        super()

        // The web-component use as layout is named globular-application
        if (document.getElementsByTagName("globular-application") != undefined) {
            this.layout = (<Layout>document.getElementsByTagName("globular-application")[0])
        } else {
            this.layout = new Layout();
            document.body.appendChild(this.layout)
        }

        // set it to false.
        this.isLogin = false;

        // Set the login box...
        this.login_ = new Login();
        this.layout.toolbar().appendChild(this.login_)


        // This contain account informations.
        this.accountMenu = new AccountMenu();

        // This contain account/application notification
        this.notificationMenu = new NotificationMenu();

        // The overflow menu is use to hide menu that dosen't fix in the visual.
        this.overFlowMenu = new OverflowMenu()

        // The applicaiton menu
        this.applicationsMenu = new ApplicationsMenu()

    }

    // Must be call by the model when after it initialisation was done.
    init() {

        // init listener's in the layout.
        this.layout.init()
        this.login_.init()
        this.accountMenu.init()
        this.applicationsMenu.init()
        this.notificationMenu.init()
        
        // Logout event
        Model.eventHub.subscribe("logout_event",
            (uuid: string) => {
                this.logout_event_listener = uuid;
            },
            () => {
                this.onLogout()
            }, true)

        // Login event.
        Model.eventHub.subscribe("login_event",
            (uuid: string) => {
                this.login_event_listener = uuid;
            },
            (account: Account) => {
                this.onLogin(account)
            }, true)

        

        /**
         * The resize listener.
         */
        window.addEventListener('resize', (evt: any) => {
            
            let w = this.layout.width()
            
            if(w <= 500){
                this.overFlowMenu.getMenuDiv().insertBefore(this.applicationsMenu, this.overFlowMenu.getMenuDiv().firstChild)
                this.applicationsMenu.getMenuDiv().classList.remove("bottom")
                this.applicationsMenu.getMenuDiv().classList.add("left")

                if(this.isLogin){
                    this.overFlowMenu.show()

                    this.overFlowMenu.getMenuDiv().appendChild(this.notificationMenu)
                    this.notificationMenu.getMenuDiv().classList.remove("bottom")
                    this.notificationMenu.getMenuDiv().classList.add("left")

                    this.overFlowMenu.getMenuDiv().appendChild(this.accountMenu)
                    this.accountMenu.getMenuDiv().classList.remove("bottom")
                    this.accountMenu.getMenuDiv().classList.add("left")
                }
            }else{
                this.layout.toolbar().insertBefore(this.applicationsMenu, this.layout.toolbar().firstChild)
                this.applicationsMenu.getMenuDiv().classList.remove("left")
                this.applicationsMenu.getMenuDiv().classList.add("bottom")

                if(this.isLogin){
                    this.overFlowMenu.hide()

                    this.layout.toolbar().appendChild(this.notificationMenu)
                    this.notificationMenu.getMenuDiv().classList.remove("left")
                    this.notificationMenu.getMenuDiv().classList.add("bottom")

                    this.layout.toolbar().appendChild(this.accountMenu)
                    this.accountMenu.getMenuDiv().classList.remove("left")
                    this.accountMenu.getMenuDiv().classList.add("bottom")
                }
            }

        });

        window.dispatchEvent(new Event('resize'));
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    // Application action's
    ///////////////////////////////////////////////////////////////////////////////////////

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
     * The title of the application
     * @param title The title.
     */
    setTitle(title: string) {
        this.layout.title().innerHTML = "<span>" + title + "</span>";
    }

    setIcon(imgUrl: string){
        let icon = document.createElement("img")
        icon.src = imgUrl
        icon.style.height = "24px"
        icon.style.width = "24px"
        icon.style.marginRight = "10px" 
        icon.style.marginLeft = "10px" 

        let title = this.layout.title()
        title.style.display = "flex";

        title.insertBefore(icon, title.firstChild)
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

    // Block user input
    wait(msg: string = "wait ...") {
        this.layout.wait(msg)
    }

    // Resume user input.
    resume() {
        this.layout.resume()
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Event listener's
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Login event handler
     * @param accountId The id of the user
     */
    onLogin(account: Account) {
        this.isLogin = true;

        /** implement it as needed */
        this.login_.parentNode.removeChild(this.login_)

        this.layout.toolbar().appendChild(this.notificationMenu)
        this.layout.toolbar().appendChild(this.accountMenu)

        // Append the over flow menu.
        this.layout.toolbar().appendChild(this.overFlowMenu)

        this.overFlowMenu.hide() // not show it at first.

        this.accountMenu.setAccount(account)

        window.dispatchEvent(new Event('resize'));
    }

    /**
     * Logout event handler
     * @param accountId 
     */
    onLogout() {
        this.isLogin = false;

        this.overFlowMenu.hide() // not show it at first.

        /** implement it as needed */
        this.layout.toolbar().appendChild(this.login_)

        // Remove notification menu and account.
        this.accountMenu.parentNode.removeChild(this.notificationMenu)
        this.accountMenu.parentNode.removeChild(this.accountMenu)

        window.dispatchEvent(new Event('resize'));
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Gui function's
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The workspace div where the application draw it content.
     */
    getWorkspace(){
        return this.layout.workspace()
    }

}