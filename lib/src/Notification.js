"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationType = void 0;
const Model_1 = require("./Model");
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["Application"] = 1] = "Application";
    NotificationType[NotificationType["User"] = 2] = "User";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
/**
 * Notification are use to send end user information about a application state
 * or actions he have to do.
 */
class Notification extends Model_1.Model {
    /**
     * Contain the notification informations.
     * @param type
     * @param recipient
     * @param text
     */
    constructor(type, recipient, text, date) {
        super();
        this._recipient = recipient;
        this._type = type;
        this._text = text;
        // set the date or create it...
        if (date != undefined) {
            this._date = date;
        }
        else {
            this._date = new Date();
        }
        this._id = this._date.getTime().toString(); // I will use the date a id.
    }
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }
    get type() {
        return this._type;
    }
    set type(value) {
        this._type = value;
    }
    get recipient() {
        return this._recipient;
    }
    set recipient(value) {
        this._recipient = value;
    }
    get sender() {
        return this._sender;
    }
    set sender(value) {
        this._sender = value;
    }
    get text() {
        return this._text;
    }
    set text(value) {
        this._text = value;
    }
    get date() {
        return this._date;
    }
    set date(value) {
        this._date = value;
    }
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    static fromString(json) {
        return Notification.fromObject(JSON.parse(json));
    }
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    static fromObject(obj) {
        let notification = new Notification();
        notification._id = obj._id;
        notification._text = obj._text;
        notification._recipient = obj._recipient;
        notification._sender = obj._sender;
        if (obj._type == 1) {
            notification._type = NotificationType.Application;
        }
        else {
            notification._type = NotificationType.User;
        }
        notification._date = new Date(obj._date);
        return notification;
    }
}
exports.Notification = Notification;
