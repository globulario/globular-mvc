import { Account } from "./Account";
import { Setting } from "./components/Settings";


/**
 * 
 */
export class UserSettings {

    private account: any;

    // This is where the setting is display.
    constructor(account: Account, generalSettings: any, securitySettings: any) {
        this.account = account

        // The user general setting
        console.log(account)


        // The profile picture.
        let userPictureSetting = new Setting("Photo", "Change profile picture." )
        generalSettings.appendChild(userPictureSetting)

        
        // The user name.
        let userNameSetting = new Setting("Name", account.userName)
        generalSettings.appendChild(userNameSetting)

        // The user email address.
        let userEmailSetting = new Setting("Email", account.email)
        generalSettings.appendChild(userEmailSetting)

    }



}


