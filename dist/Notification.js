var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Model } from "./Model";
export var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["Application"] = 1] = "Application";
    NotificationType[NotificationType["User"] = 2] = "User";
})(NotificationType || (NotificationType = {}));
/**
 * Notification are use to send end user information about a application state
 * or actions he have to do.
 */
var Notification = /** @class */ (function (_super) {
    __extends(Notification, _super);
    /**
     * Contain the notification informations.
     * @param type
     * @param recipient
     * @param text
     */
    function Notification(type, recipient, text, date) {
        var _this = _super.call(this) || this;
        _this._recipient = recipient;
        _this._type = type;
        _this._text = text;
        // set the date or create it...
        if (date != undefined) {
            _this._date = date;
        }
        else {
            _this._date = new Date();
        }
        _this._id = _this._date.getTime().toString(); // I will use the date a id.
        return _this;
    }
    Object.defineProperty(Notification.prototype, "id", {
        get: function () {
            return this._id;
        },
        set: function (value) {
            this._id = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "type", {
        get: function () {
            return this._type;
        },
        set: function (value) {
            this._type = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "recipient", {
        get: function () {
            return this._recipient;
        },
        set: function (value) {
            this._recipient = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "sender", {
        get: function () {
            return this._sender;
        },
        set: function (value) {
            this._sender = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "text", {
        get: function () {
            return this._text;
        },
        set: function (value) {
            this._text = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Notification.prototype, "date", {
        get: function () {
            return this._date;
        },
        set: function (value) {
            this._date = value;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Initialyse model from json object.
     * @param json The class data.
     */
    Notification.fromString = function (json) {
        return Notification.fromObject(JSON.parse(json));
    };
    /**
     * Initialyse the notification from object.
     * @param obj
     */
    Notification.fromObject = function (obj) {
        var notification = new Notification();
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
    };
    return Notification;
}(Model));
export { Notification };
//# sourceMappingURL=Notification.js.map