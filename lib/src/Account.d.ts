import { Model } from "./Model";
/**
 * Basic account class that contain the user id and email.
 */
export declare class Account extends Model {
    private _id;
    get id(): string;
    set id(value: string);
    private email_;
    get email(): string;
    set email(value: string);
    private hasData;
    private profilPicture_;
    get profilPicture(): string;
    set profilPicture(value: string);
    private firstName_;
    get firstName(): string;
    set firstName(value: string);
    private lastName_;
    get lastName(): string;
    set lastName(value: string);
    private middleName_;
    get middleName(): string;
    set middleName(value: string);
    constructor(id: string, email: string);
    /**
     * Read user data one result at time.
     */
    private readOneUserData;
    /**
     * Must be called once when the session open.
     * @param account
     */
    initData(callback: (account: Account) => void, onError: (err: any) => void): void;
    /**
     * Change the user profil picture...
     * @param dataUrl The data url of the new profile picture.
     * @param onSaveAccount The success callback
     * @param onError The error callback
     */
    changeProfilImage(dataUrl: string, onSaveAccount: (account: Account) => void, onError: (err: any) => void): void;
    /**
     * Save user data into the user_data collection. Insert one or replace one depending if values
     * are present in the firstName and lastName.
     */
    save(callback: (account: Account) => void, onError: (err: any) => void): void;
}
