import { Account } from "./Account";
import { Application } from "./Application";
import { Setting, SettingsMenu, SettingsPanel } from "./components/Settings";

export class Settings {

    protected settingsMenu: SettingsMenu;
    protected settingsPanel: SettingsPanel;

    // That will create a new setting page.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        this.settingsMenu = settingsMenu;
        this.settingsPanel = settingsPanel;
    }

    // Those functions must be impletmented.
    public load() {
        console.log("Load settings...")
    }

    public save() {
        console.log("Save settings...")
    }
}


/**
 * Model for user settings.
 */
export class UserSettings extends Settings {
    
    private account: any;

    // This is where the setting is display.
    constructor(account: Account, settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.account = account

        // Create the settings menu and panel here
        this.settingsMenu.appendSettingsMenuItem("account-box", "User");

        // Create General informations setting's
        let userSettingsPage = <any>this.settingsPanel.appendSettingsPage("User");

        // Create general user settings ...
        let generalSettings = userSettingsPage.appendSettings("General", "Those information's can be view by other's user's");

        // The profile picture.
        let userPictureSetting = new Setting("Photo", "Change profile picture.")
        generalSettings.appendChild(userPictureSetting)

        // The user name.
        let userNameSetting = new Setting("Name", this.account.userName)
        generalSettings.appendChild(userNameSetting)

        // The user email address.
        let userEmailSetting = new Setting("Email", this.account.email)
        generalSettings.appendChild(userEmailSetting)

    }
}

/**
 * Model to save application settings.
 */
export class ApplicationSettings extends Settings {

    // The application.
    private application: Application;

    constructor(application: Application, settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.application = application;

        this.settingsMenu.appendSettingsMenuItem("settings-applications","Application");

        let applicationSettingPage = <any>this.settingsPanel.appendSettingsPage("Application");

        let generalSettings =  applicationSettingPage.appendSettings("General", "General application settings.");

        // The application icon
        let applicationSetting = new Setting("Icon", "Change application icon")
        generalSettings.appendChild(applicationSetting)

        // The application name.
        let applicationNameSetting = new Setting("Name", application.name)
        generalSettings.appendChild(applicationNameSetting)

        let applicationTitleSetting = new Setting("Title", application.title)
        generalSettings.appendChild(applicationTitleSetting)

        let securitySettings = applicationSettingPage.appendSettings("Security", "Permissions and access settings.")
    }

}