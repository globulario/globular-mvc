import { Model } from './Model';
import { ApplicationView } from "./ApplicationView";
import { Account } from "./Account";
import { NotificationType, Notification } from './Notification';
/**
 * That class can be use to create any other application.
 */
export declare class Application extends Model {
    static uuid: string;
    static language: string;
    private static infos;
    protected name: string;
    protected title: string;
    protected account: Account;
    private login_event_listener;
    private register_event_listener;
    private logout_event_listener;
    private update_profile_picture_listener;
    private delete_notification_event_listener;
    /**
     * Create a new application with a given name. The view
     * can be any ApplicationView or derived ApplicationView class.
     * @param name The name of the application.
     */
    constructor(name: string, title: string, view: ApplicationView);
    /**
     * Connect the listner's and call the initcallback.
     * @param initCallback
     * @param errorCallback
     * @param configurationPort
     */
    init(initCallback: () => void, errorCallback: (err: any) => void): void;
    /**
     * Return the list of all applicaitons informations.
     * @param callback
     * @param errorCallback
     */
    static getAllApplicationInfo(callback: (infos: Array<any>) => void, errorCallback: (err: any) => void): void;
    /**
     * Return application infos.
     * @param id
     */
    static getApplicationInfo(id: string): any;
    /**
     * Return partial information only.
     */
    toString(): string;
    /**
     * Refresh the token and open a new session if the token is valid.
     */
    private refreshToken;
    /**
     * Refresh the token to keep it usable.
     */
    private startRefreshToken;
    /**
     * Register a new account with the application.
     * @param name The account name
     * @param email The account email
     * @param password The account password
     */
    register(name: string, email: string, password: string, confirmPassord: string, onRegister: (account: Account) => void, onError: (err: any) => void): Account;
    /**
     * Login into the application
     * @param email
     * @param password
     */
    login(email: string, password: string, onLogin: (account: Account) => void, onError: (err: any) => void): void;
    /**
     * Close the current session explicitelty.
     */
    logout(): void;
    /**
     * Exit application.
     */
    exit(): void;
    /**
     * Initialyse the user and application notifications
     */
    private initNotifications;
    /**
     * Send application notifications.
     * @param notification The notification can contain html text.
     */
    sendNotifications(notification: Notification, callback: () => void, onError: (err: any) => void): void;
    /**
     *  Retreive the list of nofitications
     * @param callback The success callback with the list of notifications.
     * @param errorCallback The error callback with the error message.
     */
    getNotifications(type: NotificationType, callback: (notifications: Array<Notification>) => void, errorCallback: (err: any) => void): void;
    removeNotification(notification: Notification): void;
    /**
     * Remove all notification.
     */
    clearNotifications(type: NotificationType): void;
}
