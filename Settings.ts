import { Account } from "./Account";
import { Application } from "./Application";
import { ImageSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting } from "./components/Settings";

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
        let userPictureSetting = new ComplexSetting("Photo", "Change profile picture.")        
        generalSettings.addSetting(userPictureSetting)

        // The user name.
        let userNameSetting = new ComplexSetting("Name", "Change the user name")
        
        // Set the user setting complex content.
        userNameSetting.addSetting(new StringSetting("First Name", "Enter your first name here."))
        userNameSetting.addSetting(new StringSetting("Last Name", "Enter your Last name here."))

        generalSettings.addSetting(userNameSetting)
        
        // The user email address.
        let userEmailSetting = new EmailSetting("Email", "Change the user email")
        userEmailSetting.setValue(account.email)
        generalSettings.addSetting(userEmailSetting)

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
        let applicationSetting = new ComplexSetting("Icon", "Change application icon")
        let iconSetting = new ImageSetting("Icon", "Click here to change " + application.name + " icon")
        applicationSetting.addSetting(iconSetting);

        generalSettings.addSetting(applicationSetting)


        // The application name.
        let applicationNameSetting = new StringSetting("Name", "Change the application name")
        applicationNameSetting.setValue(application.name)
        generalSettings.addSetting(applicationNameSetting)

        let applicationTitleSetting = new StringSetting("Title", "Change the application")
        applicationTitleSetting.setValue(application.title)
        generalSettings.addSetting(applicationTitleSetting)

        let securitySettings = applicationSettingPage.appendSettings("Security", "Permissions and access settings.")
    }

}