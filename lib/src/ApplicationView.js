"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationView = exports.applicationView = void 0;
const View_1 = require("./View");
const M = require("materialize-css");
require("materialize-css/sass/materialize.scss");
const Model_1 = require("./Model");
// web-components.
const Layout_1 = require("./components/Layout");
const Login_1 = require("./components/Login");
const Account_1 = require("./components/Account");
const Notification_1 = require("./components/Notification");
const Menu_1 = require("./components/Menu");
const Applications_1 = require("./components/Applications");
const Camera_1 = require("./components/Camera");
const File_1 = require("./components/File");
const Search_1 = require("./components/Search");
/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
class ApplicationView extends View_1.View {
    constructor() {
        super();
        // The web-component use as layout is named globular-application
        if (document.getElementsByTagName("globular-application") != undefined) {
            this.layout = document.getElementsByTagName("globular-application")[0];
        }
        else {
            this.layout = new Layout_1.Layout();
            document.body.appendChild(this.layout);
        }
        // set it to false.
        this.isLogin = false;
        // Set the login box...
        this.login_ = new Login_1.Login();
        this.layout.toolbar().appendChild(this.login_);
        // This contain account informations.
        this.accountMenu = new Account_1.AccountMenu();
        // This contain account/application notification
        this.notificationMenu = new Notification_1.NotificationMenu();
        // The overflow menu is use to hide menu that dosen't fix in the visual.
        this.overFlowMenu = new Menu_1.OverflowMenu();
        // The applicaiton menu
        this.applicationsMenu = new Applications_1.ApplicationsMenu();
        // The camera can be use to take picture.
        this._camera = new Camera_1.Camera();
        // The search bar to give end user the power to search almost anything...
        this._searchBar = new Search_1.SearchBar();
        // That function will be call when the file is saved.
        this._camera.onsaved = (path, name) => {
            console.log("----> save success!");
        };
        // Now the save funciton..
        this._camera.onsave = (picture) => {
            // save image from the picture.
            console.log("save picture:", picture);
        };
        // The file explorer object.
        this._fileExplorer = new File_1.FileExplorer();
        // Set the onerror callback for the component.
        this._fileExplorer.onerror = (err) => {
            this.displayMessage(err, 4000);
        };
        // set the global varialbe...
        exports.applicationView = this;
    }
    get camera() {
        return this._camera;
    }
    get fileExplorer() {
        return this._fileExplorer;
    }
    get searchBar() {
        return this._searchBar;
    }
    get isLogin() {
        return this._isLogin;
    }
    set isLogin(value) {
        this._isLogin = value;
    }
    // Must be call by the model when after it initialisation was done.
    init() {
        // init listener's in the layout.
        this.layout.init();
        this.login_.init();
        this.accountMenu.init();
        this.applicationsMenu.init();
        this.notificationMenu.init();
        // The file explorer object.
        this._fileExplorer.init();
        // Logout event
        Model_1.Model.eventHub.subscribe("logout_event", (uuid) => {
            this.logout_event_listener = uuid;
        }, () => {
            this.onLogout();
        }, true);
        // Login event.
        Model_1.Model.eventHub.subscribe("login_event", (uuid) => {
            this.login_event_listener = uuid;
        }, (account) => {
            this.onLogin(account);
        }, true);
        /**
         * The resize listener.
         */
        window.addEventListener('resize', (evt) => {
            let w = this.layout.width();
            if (w <= 500) {
                this.overFlowMenu.getMenuDiv().insertBefore(this.applicationsMenu, this.overFlowMenu.getMenuDiv().firstChild);
                this.applicationsMenu.getMenuDiv().classList.remove("bottom");
                this.applicationsMenu.getMenuDiv().classList.add("left");
                if (this.isLogin) {
                    this.overFlowMenu.show();
                    this.overFlowMenu.getMenuDiv().appendChild(this.notificationMenu);
                    this.notificationMenu.getMenuDiv().classList.remove("bottom");
                    this.notificationMenu.getMenuDiv().classList.add("left");
                    this.overFlowMenu.getMenuDiv().appendChild(this.accountMenu);
                    this.accountMenu.getMenuDiv().classList.remove("bottom");
                    this.accountMenu.getMenuDiv().classList.add("left");
                }
            }
            else {
                this.layout.toolbar().insertBefore(this.applicationsMenu, this.layout.toolbar().firstChild);
                this.applicationsMenu.getMenuDiv().classList.remove("left");
                this.applicationsMenu.getMenuDiv().classList.add("bottom");
                if (this.isLogin) {
                    this.overFlowMenu.hide();
                    this.layout.toolbar().appendChild(this.notificationMenu);
                    this.notificationMenu.getMenuDiv().classList.remove("left");
                    this.notificationMenu.getMenuDiv().classList.add("bottom");
                    this.layout.toolbar().appendChild(this.accountMenu);
                    this.accountMenu.getMenuDiv().classList.remove("left");
                    this.accountMenu.getMenuDiv().classList.add("bottom");
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
        Model_1.Model.eventHub.unSubscribe("login_event", this.login_event_listener);
        Model_1.Model.eventHub.unSubscribe("logout_event", this.logout_event_listener);
        super.close();
    }
    /**
     * Clear the workspace.
     */
    clear() {
        this.getWorkspace().innerHTML = "";
        if (this.activeView != null) {
            this.activeView.hide();
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
    setTitle(title) {
        this.layout.title().innerHTML = "<span>" + title + "</span>";
    }
    setIcon(imgUrl) {
        let icon = document.createElement("img");
        icon.id = "application_icon";
        icon.src = imgUrl;
        icon.style.height = "24px";
        icon.style.width = "24px";
        icon.style.marginRight = "10px";
        icon.style.marginLeft = "10px";
        let title = this.layout.title();
        title.style.display = "flex";
        title.insertBefore(icon, title.firstChild);
        this.icon = icon;
    }
    /**
     * The icon
     */
    getIcon() {
        return this.icon;
    }
    /**
     * Try to extract error message from input object.
     * @param err Can be a string or object, in case of object I will test if the object contain a field named 'message'
     */
    getErrorMessage(err) {
        try {
            let errObj = err;
            if (typeof err === 'string' || err instanceof String) {
                errObj = JSON.parse(err);
            }
            else if (errObj.message != undefined) {
                errObj = JSON.parse(errObj.message);
            }
            if (errObj.ErrorMsg != undefined) {
                return errObj.ErrorMsg;
            }
            else {
                return err;
            }
        }
        catch (_a) {
            if (err.message != undefined) {
                return err.message;
            }
            return err;
        }
    }
    /**
     * Display a message to the user.
     * @param msg The message to display in toast!
     */
    displayMessage(err, duration) {
        return M.toast({ html: this.getErrorMessage(err), displayLength: duration });
    }
    // Block user input
    wait(msg = "wait ...") {
        this.layout.wait(msg);
    }
    // Resume user input.
    resume() {
        this.layout.resume();
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    // Event listener's
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Login event handler
     * @param accountId The id of the user
     */
    onLogin(account) {
        this.isLogin = true;
        /** implement it as needed */
        this.login_.parentNode.removeChild(this.login_);
        this.layout.toolbar().appendChild(this.notificationMenu);
        this.layout.toolbar().appendChild(this.accountMenu);
        // Append the over flow menu.
        this.layout.toolbar().appendChild(this.overFlowMenu);
        this.overFlowMenu.hide(); // not show it at first.
        this.accountMenu.setAccount(account);
        window.dispatchEvent(new Event('resize'));
    }
    /**
     * Logout event handler
     * @param accountId
     */
    onLogout() {
        this.isLogin = false;
        this.overFlowMenu.hide(); // not show it at first.
        /** implement it as needed */
        this.layout.toolbar().appendChild(this.login_);
        // Remove notification menu and account.
        this.accountMenu.parentNode.removeChild(this.notificationMenu);
        this.accountMenu.parentNode.removeChild(this.accountMenu);
        this.getWorkspace().innerHTML = "";
        window.dispatchEvent(new Event('resize'));
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    // Gui function's
    //////////////////////////////////////////////////////////////////////////////////////////
    /**
     * The workspace div where the application draw it content.
     */
    getWorkspace() {
        return this.layout.workspace();
    }
    /**
     * The side menu that contain application actions.
     */
    getSideMenu() {
        let sideMenu = this.layout.sideMenu();
        sideMenu.style.display = "flex";
        sideMenu.style.flexDirection = "column";
        sideMenu.style.width = "100%";
        sideMenu.style.marginTop = "24px";
        return sideMenu;
    }
    // In case of application view 
    setView(view) {
        this.activeView = view;
    }
    hideSideMenu() {
        this.layout.appDrawer.toggle();
    }
    /**
     * Create a side menu button div.
     */
    createSideMenuButton(id, text, icon) {
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
        `;
        let range = document.createRange();
        this.getSideMenu().insertBefore(range.createContextualFragment(html), this.getSideMenu().firstChild);
        return document.getElementById(id);
    }
}
exports.ApplicationView = ApplicationView;
