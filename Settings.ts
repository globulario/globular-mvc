import { Account } from "./Account";
import { Application } from "./Application";
import { Setting } from "./components/Settings";

export class Settings {
    constructor() {

    }
}
/**
 * Model for user settings.
 */
export class UserSettings extends Settings {

    private account: any;

    // This is where the setting is display.
    constructor(account: Account, generalSettings: any, securitySettings: any) {
        super();

        this.account = account

        // The profile picture.
        let userPictureSetting = new Setting("Photo", "Change profile picture.")
        generalSettings.appendChild(userPictureSetting)


        // The user name.
        let userNameSetting = new Setting("Name", account.userName)
        generalSettings.appendChild(userNameSetting)

        // The user email address.
        let userEmailSetting = new Setting("Email", account.email)
        generalSettings.appendChild(userEmailSetting)

    }
}

/**
 * Model to save application settings.
 */
export class ApplicationSettings extends Settings {
    private application: Application;

    constructor(application: Application, generalSettings: any, securitySettings: any) {
        super();

        this.application = application;

        // The profile picture.
        let applicationSetting = new Setting("Icon", "Change profile picture.")
        generalSettings.appendChild(applicationSetting)


        // The user name.
        let applicationNameSetting = new Setting("Name", application.name)
        generalSettings.appendChild(applicationNameSetting)
    }

}

