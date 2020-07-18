import { Model } from "./Model";
export declare enum NotificationType {
    Application = 1,
    User = 2
}
/**
 * Notification are use to send end user information about a application state
 * or actions he have to do.
 */
export declare class Notification extends Model {
    private _id;
    get id(): string;
    set id(value: string);
    private _type;
    get type(): NotificationType;
    set type(value: NotificationType);
    private _recipient;
    get recipient(): string;
    set recipient(value: string);
    private _sender;
    get sender(): string;
    set sender(value: string);
    private _text;
    get text(): string;
    set text(value: string);
    private _date;
    get date(): Date;
    set date(value: Date);
    /**
     * Contain the notification informations.
     * @param type
     * @param recipient
     * @param text
     */
    constructor(type?: NotificationType, recipient?: string, text?: string, date?: Date);
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string): any;
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    static fromObject(obj: any): any;
}
