import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Account } from "./Account";
import { Model } from "./Model";


// web-components.
import { Layout } from "./components/Layout";
import { Login } from "./components/Login";
import { AccountMenu } from "./components/Account";
import { NotificationMenu } from "./components/Notification";
import { OverflowMenu } from "./components/Menu";
import { ApplicationsMenu } from "./components/Applications";
import { Camera } from "./components/Camera";
import { FileExplorer} from "./components/File"
import { SearchBar} from "./components/Search"
import { ContactsMenu} from "./components/Contact"
import { ConversationPanel} from "./components/Conversation"
import { Wizard} from "./components/Wizard"

// This variable is there to give acces to wait and resume...
export let applicationView: ApplicationView;

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

    /** The contact menu */
    private contactsMenu: ContactsMenu

    /** The camera */
    private _camera: Camera;
    public get camera(): Camera {
        return this._camera;
    }

    /** The file explorer */
    private _fileExplorer: FileExplorer
    public get fileExplorer(): FileExplorer {
        return this._fileExplorer
    }

    /** The seach bar */
    private _searchBar: SearchBar;
    public get searchBar(): SearchBar {
        return this._searchBar;
    }

    /** various listener's */
    private login_event_listener: string
    private logout_event_listener: string

    /** The conversation panel */
    private _conversation_panel: ConversationPanel;
    public get conversation_panel(): ConversationPanel {
        return this._conversation_panel;
    }

    private _isLogin: boolean;
    public get isLogin(): boolean {
        return this._isLogin;
    }
    public set isLogin(value: boolean) {
        this._isLogin = value;
    }

    private icon: any;

    /** The current displayed view... */
    protected activeView: View;

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
        this.applicationsMenu = new ApplicationsMenu();

        // The concact menu
        this.contactsMenu = new ContactsMenu();

        // The camera can be use to take picture.
        this._camera = new Camera();

        // The search bar to give end user the power to search almost anything...
        this._searchBar = new SearchBar();

        // That function will be call when the file is saved.
        this._camera.onsaved = (path: string, name: string) => {
            console.log("----> save success!")
        }

        // Now the save funciton..
        this._camera.onsave = (picture: any) => {
            // save image from the picture.
            console.log("save picture:", picture)
        }

        // The file explorer object.
        
        this._fileExplorer = new FileExplorer();

        // Set the onerror callback for the component.
        this._fileExplorer.onerror = (err:any)=>{
            //this.displayMessage(err, 4000)
        }
        
        // Initialyse conversation panel.
        this._conversation_panel = new ConversationPanel();

        // set the global varialbe...
        applicationView = this

    }

    // Must be call by the model when after it initialisation was done.
    init() {

        // init listener's in the layout.
        this.layout.init()
        this.login_.init()
        this.accountMenu.init()
        this.applicationsMenu.init()
        this.notificationMenu.init()
        this.contactsMenu.init()

        // Here I will set contact menu actions.
        this.contactsMenu.onInviteConctact = (email:string) =>{
            this.displayMessage("<iron-icon icon='send' style='margin-right: 10px;'></iron-icon><div>Invitation was sent to "+ email + "</div>", 3000)
        }

        // The file explorer object.
        this._fileExplorer.init();

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

            if (w <= 500) {
                this.overFlowMenu.getMenuDiv().insertBefore(this.applicationsMenu, this.overFlowMenu.getMenuDiv().firstChild)
                this.applicationsMenu.getMenuDiv().classList.remove("bottom")
                this.applicationsMenu.getMenuDiv().classList.add("left")

                if (this.isLogin) {
                    this.overFlowMenu.show()

                    this.overFlowMenu.getMenuDiv().appendChild(this.contactsMenu)
                    this.contactsMenu.getMenuDiv().classList.remove("bottom")
                    this.contactsMenu.getMenuDiv().classList.add("left")

                    this.overFlowMenu.getMenuDiv().appendChild(this.notificationMenu)
                    this.notificationMenu.getMenuDiv().classList.remove("bottom")
                    this.notificationMenu.getMenuDiv().classList.add("left")

                    this.overFlowMenu.getMenuDiv().appendChild(this.accountMenu)
                    this.accountMenu.getMenuDiv().classList.remove("bottom")
                    this.accountMenu.getMenuDiv().classList.add("left")
                }
            } else {
                this.layout.toolbar().insertBefore(this.applicationsMenu, this.layout.toolbar().firstChild)
                this.applicationsMenu.getMenuDiv().classList.remove("left")
                this.applicationsMenu.getMenuDiv().classList.add("bottom")

                if (this.isLogin) {
                    this.overFlowMenu.hide()
                    
                    this.layout.toolbar().appendChild(this.contactsMenu)
                    this.contactsMenu.getMenuDiv().classList.remove("left")
                    this.contactsMenu.getMenuDiv().classList.add("bottom")

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
     * Free resource here.
     */
    close() {
        // Disconnect event listener's
        Model.eventHub.unSubscribe("login_event", this.login_event_listener)
        Model.eventHub.unSubscribe("logout_event", this.logout_event_listener)
        super.close()
    }

    /**
     * Clear the workspace.
     */
    clear() {
        this.getWorkspace().innerHTML = ""
        if (this.activeView != null) {
            this.activeView.hide()
        }
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

    setIcon(imgUrl: string) {
        let icon = document.createElement("img")
        icon.id = "application_icon"

        icon.src = imgUrl
        icon.style.height = "24px"
        icon.style.width = "24px"
        icon.style.marginRight = "10px"
        icon.style.marginLeft = "10px"

        let title = this.layout.title()
        title.style.display = "flex";

        title.insertBefore(icon, title.firstChild)
        this.icon = icon;
    }

    /**
     * The icon
     */
    getIcon() {
        return this.icon
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
                return errObj.ErrorMsg
            } else {
                return err
            }

        } catch{
            if (err.message != undefined){
                return err.message
            }
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
        if(this.login_.parentNode != null){
            this.login_.parentNode.removeChild(this.login_)
        }

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

        this.getWorkspace().innerHTML = ""

        window.dispatchEvent(new Event('resize'));
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Gui function's
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * The workspace div where the application draw it content.
     */
    getWorkspace(): any {
        return this.layout.workspace()
    }

    /**
     * The side menu that contain application actions.
     */
    getSideMenu(): any {
        let sideMenu = this.layout.sideMenu()
        sideMenu.style.display = "flex";
        sideMenu.style.flexDirection = "column";
        sideMenu.style.width = "100%";
        sideMenu.style.marginTop = "24px";
        return sideMenu
    }


    // In case of application view 
    setView(view: View) {
        this.activeView = view;
    }

    hideSideMenu() {
        (<any>this.layout.appDrawer).toggle();
    }

    /**
     * Create a side menu button div.
     */
    createSideMenuButton(id: string, text: string, icon: string): any {
        let html = `
        <style>
            .side_menu_btn{
                display: flex;
                position: relative;
                align-items: center;
                font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
                font-size: 1rem;
                letter-spacing: .2px;
                color: #202124;
                text-shadow: none;
            }

            .side_menu_btn:hover{
                cursor: pointer;
            }

        </style>
        <div id="${id}" class="side_menu_btn">
            <paper-ripple recenters></paper-ripple>
            <paper-icon-button id="${id}_close_btn" icon="${icon}"></paper-icon-button>
            <span style="flex-grow: 1;">${text}</span>
        </div>
        `

        let range = document.createRange()
        this.getSideMenu().insertBefore(range.createContextualFragment(html), this.getSideMenu().firstChild);

        return document.getElementById(id)
    }
}