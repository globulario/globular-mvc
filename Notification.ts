import { Model } from "./Model";

export enum NotificationType{
    User =0,
    Application = 1,
    System = 2   
}

/**
 * Notification are use to send end user information about a application state
 * or actions he have to do.
 */
export class Notification  extends Model{
    private _id: string;
    public get id(): string {
        return this._id;
    }

    public set id(value: string) {
        this._id = value;
    }

    private _mac: string;
    public get mac(): string {
        return this._mac;
    }
    public set mac(value: string) {
        this._mac = value;
    }

    private _type: NotificationType;
    public get type(): NotificationType {
        return this._type;
    }
    public set type(value: NotificationType) {
        this._type = value;
    }

    private _recipient: string;
    public get recipient(): string {
        return this._recipient;
    }
    public set recipient(value: string) {
        this._recipient = value;
    }

    private _sender: string;
    public get sender(): string {
        return this._sender;
    }
    public set sender(value: string) {
        this._sender = value;
    }

    private _text: string;
    public get text(): string {
        return this._text;
    }
    public set text(value: string) {
        this._text = value;
    }

    private _date: Date;
    public get date(): Date {
        return this._date;
    }
    public set date(value: Date) {
        this._date = value;
    }

    /**
     * Contain the notification informations.
     * @param type 
     * @param recipient 
     * @param text 
     */
    constructor(mac?:string, sender?: string, type?:NotificationType, recipient?: string, text?: string, date?:Date){
        super();

        this._mac = mac
        this._recipient = recipient;
        this._type = type;
        this._text = text;
        this._sender = sender;

        // set the date or create it...
        if(date!=undefined){
            this._date = date
        }else{
            this._date = new Date()
        }
        
        this._id = this._date.getTime().toString(); // I will use the date a id.
    }

    toString(): string {
        return JSON.stringify({_id:this._id, _mac:this._mac, _text:this._text, _type:this._type, _recipient:this._recipient, _sender:this.sender, _date: Math.floor(this._date.getTime())/1000})
    }

    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json: string):any{
        return Notification.fromObject(JSON.parse(json))
    }

    /**
     * Initialyse the notification from object.
     * @param obj 
     */
    static fromObject(obj: any): any{
        let notification = new Notification()
        notification._mac = obj._mac
        notification._id = obj._id
        notification._text = obj._text
        notification._recipient = obj._recipient
        notification._sender = obj._sender

        if(obj._type == 0){
            notification._type = NotificationType.User
        }else{
            notification._type = NotificationType.Application
        }

        notification._date = new Date(obj._date * 1000)
        return notification;
    }
}
