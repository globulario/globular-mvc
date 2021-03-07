import { Account } from "./Account";
import { Application } from "./Application";
import { FileExplorer } from "./components/File";
import { ImageCropperSetting, ImageSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting, TextAreaSetting } from "./components/Settings";
import { Model } from "./Model";

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
        let userPictureSetting = new ComplexSetting("Picture", "Change profile picture.")
        generalSettings.addSetting(userPictureSetting)

        // Here I will append the image cropper in order for the user to change it profile
        // picture.
        let imageCropperSettings = new ImageCropperSetting("Picture", "Change the user picture", account.id, account.profilPicture)
        userPictureSetting.addSetting(imageCropperSettings)

        // The user name.
        let userNameSetting = new ComplexSetting("Name", "Change the user name")

        // Set the user setting complex content.
        let firstNameSetting = new StringSetting("First Name", "Enter your first name here.")
        firstNameSetting.setValue(account.firstName)
        userNameSetting.addSetting(firstNameSetting)
        
        let lastNameSetting = new StringSetting("Last Name", "Enter your Last name here.")
        lastNameSetting.setValue(account.lastName)
        userNameSetting.addSetting(lastNameSetting)

        let middleNameSetting = new StringSetting("Middle Name", "Enter middle letter/name")
        middleNameSetting.setValue(account.middleName)
        userNameSetting.addSetting(middleNameSetting)

        generalSettings.addSetting(userNameSetting)

        // The user email address.
        let userEmailSetting = new EmailSetting("Email", "Change the user email")
        userEmailSetting.setValue(account.email)
        generalSettings.addSetting(userEmailSetting)

        Application.eventHub.subscribe("save_settings_evt",
            (uuid: string) => {

            },
            (needSave: boolean) => {
                if(needSave){
                    // set the change.
                    account.firstName = firstNameSetting.getValue();
                    account.lastName = lastNameSetting.getValue();
                    account.middleName = middleNameSetting.getValue();
                    account.profilPicture = imageCropperSettings.getValue();

                    account.save(
                        () => {
                            console.log("account was saved!")
                            imageCropperSettings.setValue(account.profilPicture)
                        },
                        (err: any) => {
                            console.log("------>", err)
                        })
                }else{
                    // revert the change.
                    firstNameSetting.setValue(account.firstName)
                    lastNameSetting.setValue(account.lastName)
                    middleNameSetting.setValue(account.middleName)
                    imageCropperSettings.setValue(account.profilPicture)
                }
            }, true)


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

        let info = Application.getApplicationInfo(application.name)

        this.settingsMenu.appendSettingsMenuItem("settings-applications", "Application");

        let applicationSettingPage = <any>this.settingsPanel.appendSettingsPage("Application");

        let generalSettings = applicationSettingPage.appendSettings("General", "General application settings.");

        // The application icon
        let applicationSetting = new ComplexSetting("Icon", "Change application icon")
        let iconSetting = new ImageSetting("Icon", "Click here to change " + application.name + " icon")
        let icon = info.icon
        iconSetting.setValue(icon)

        applicationSetting.addSetting(iconSetting);

        generalSettings.addSetting(applicationSetting)

        // Application name and title must be change by the developper only...
        let descriptionSetting = new TextAreaSetting("Description", "")
        let description = "";
        if(info.description!=undefined){
            description =info.description;
        }
        
        descriptionSetting.setValue(description)
        generalSettings.addSetting(descriptionSetting)


        // Here If the application setting have change.
        Application.eventHub.subscribe(`update_application_${application.id}_settings_evt`,
            (uuid: string) => {

            },
            (info: any) => {
                // Set the icon...
                iconSetting.setValue(info["icon"])

            }, false)


        // subscribe to local event save settings.
        Application.eventHub.subscribe("save_settings_evt",
            (uuid: string) => {

            },
            (needSave: boolean) => {
                if (needSave) {
                    // Set the infos.
                    Application.saveApplicationInfo(application.name, { "icon": iconSetting.getValue(), "description": descriptionSetting.getValue() },
                        (info: any) => {
                            console.log("infos was saved!")
                            const data = JSON.stringify(info)
                            Application.eventHub.publish(`update_application_${info._id}_settings_evt`, data , false)
                            console.log(data)
                        },
                        (err: any) => {
                            application.displayMessage(err, 3000)
                            iconSetting.setValue(icon) // set back the value...
                            descriptionSetting.setValue(description)
                        })
                } else {
                    iconSetting.setValue(icon) // set back the value...
                    descriptionSetting.setValue(description)
                }
            }, true)
    }

}

/**
 * Model to save application settings.
 */
export class FileSettings extends Settings {
    fileExplorer:FileExplorer;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);
    
        console.log(Model.application);

        this.settingsMenu.appendSettingsMenuItem("folder-shared", "Files");

        let fileSettingPage = <any>this.settingsPanel.appendSettingsPage("Files");
        
        this.fileExplorer = new FileExplorer;
        this.fileExplorer.setRoot("/"+ Model.application)
 
        // Append a title.
        let html = `
            <style>
            .title {
                font-size: 1rem;
                text-transform: uppercase;
                color: var(--cr-primary-text-color);
                font-weight: 400;
                letter-spacing: .25px;
                margin-bottom: 12px;
                margin-top: var(--cr-section-vertical-margin);
                outline: none;
                padding-bottom: 4px;
                padding-top: 16px;
            }
            </style>
            <div class="title">
                Files & Directories
            </div>
        `

        fileSettingPage.appendChild(document.createRange().createContextualFragment(html));
        fileSettingPage.appendChild(this.fileExplorer);
        this.fileExplorer.setAttribute("maximized", "true")
        this.fileExplorer.setAttribute("hideactions", "true")

        
    }


}