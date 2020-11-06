/**
 * Login/Register functionality.
 */
export class NotificationMenu extends Menu {
    applicationNotificationsDiv: HTMLElement;
    userNotificationsDiv: HTMLElement;
    userNotificationsBtn: HTMLElement;
    applicationNotificationBtn: HTMLElement;
    userNotificationsCollapse: HTMLElement;
    applicationNotificationsCollapse: HTMLElement;
    applicationNotificationsPanel: HTMLElement;
    userNotificationsPanel: HTMLElement;
    notificationCount: Element;
    account_notification_listener: string;
    clear(): void;
    setNotificationCount(): void;
    setUserNofications(notifications: any): void;
    clearUserNotifications(): void;
    setApplicationNofications(notifications: any): void;
    clearApplicationNotifications(): void;
    appendNofication(parent: any, notification: any): void;
}
import { Menu } from "./Menu";
