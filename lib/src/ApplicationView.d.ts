import { View } from "./View";
import * as M from "materialize-css";
import "materialize-css/sass/materialize.scss";
import { Account } from "./Account";
import { Camera } from "./components/Camera";
export declare let applicationView: ApplicationView;
/**
 * Application view made use of Web-component and Materialyse to create a basic application
 * layout that can be use as starting point to any web-application.
 */
export declare class ApplicationView extends View {
    /** The application view component. */
    private layout;
    /** The login panel */
    private login_;
    /** The account panel */
    private accountMenu;
    /** The  overflow menu*/
    private overFlowMenu;
    /** The nofitication panel */
    private notificationMenu;
    /** The applications menu */
    private applicationsMenu;
    /** The camera */
    private _camera;
    get camera(): Camera;
    /** various listener's */
    private login_event_listener;
    private logout_event_listener;
    private _isLogin;
    get isLogin(): boolean;
    set isLogin(value: boolean);
    private icon;
    /** The current displayed view... */
    protected activeView: View;
    constructor();
    init(): void;
    /**
     * Free ressource here.
     */
    close(): void;
    /**
     * Clear the workspace.
     */
    clear(): void;
    /**
     * Refresh various component.
     */
    update(): void;
    /**
     * The title of the application
     * @param title The title.
     */
    setTitle(title: string): void;
    setIcon(imgUrl: string): void;
    /**
     * The icon
     */
    getIcon(): any;
    /**
     * Try to extract error message from input object.
     * @param err Can be a string or object, in case of object I will test if the object contain a field named 'message'
     */
    private getErrorMessage;
    /**
     * Display a message to the user.
     * @param msg The message to display in toast!
     */
    displayMessage(err: any, duration: number): M.Toast;
    wait(msg?: string): void;
    resume(): void;
    /**
     * Login event handler
     * @param accountId The id of the user
     */
    onLogin(account: Account): void;
    /**
     * Logout event handler
     * @param accountId
     */
    onLogout(): void;
    /**
     * The workspace div where the application draw it content.
     */
    getWorkspace(): any;
    /**
     * The side menu that contain application actions.
     */
    getSideMenu(): any;
    setView(view: View): void;
    hideSideMenu(): void;
    /**
     * Create a side menu button div.
     */
    createSideMenuButton(id: string, text: string, icon: string): any;
}
