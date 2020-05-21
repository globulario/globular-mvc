import { Model } from "./Model";

enum NotificationType{
    Application = 1,
    User =2
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
    constructor(type:NotificationType, recipient: string, text: string, date?:Date){
        super();

        this._recipient = recipient;
        this._type = type;
        this._text = text;

        // set the date or create it...
        if(date!=undefined){
            this._date = date
        }else{
            this._date = new Date()
        }
        
        this._id = this._date.getTime().toString(); // I will use the date a id.
    }
}
