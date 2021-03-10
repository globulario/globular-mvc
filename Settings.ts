import { SetEmailResponse } from "globular-web-client/admin/admin_pb";
import { GetLogRqst, GetLogRsp, LogInfo } from "globular-web-client/log/log_pb";
import { Account } from "./Account";
import { Application } from "./Application";
import { FileExplorer } from "./components/File";
import { ImageCropperSetting, ImageSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting, TextAreaSetting } from "./components/Settings";
import { Model } from "./Model";
import { mergeTypedArrays, uint8arrayToStringMethod } from "./Utility"
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
                if (needSave) {
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
                } else {
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
        if (info.description != undefined) {
            description = info.description;
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
                            Application.eventHub.publish(`update_application_${info._id}_settings_evt`, data, false)
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
    fileExplorer: FileExplorer;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.settingsMenu.appendSettingsMenuItem("folder-shared", "Files");

        let fileSettingPage = <any>this.settingsPanel.appendSettingsPage("Files");

        this.fileExplorer = new FileExplorer;
        this.fileExplorer.setRoot("/" + Model.application)

        // Append a title.
        let html = `
            <style>
            .title {
                font-size: 1.25rem;
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

/**
 * Model to save application settings.
 */
export class LogSettings extends Settings {
    fileExplorer: FileExplorer;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.settingsMenu.appendSettingsMenuItem("error", "Errors");
        let logSettingPage = <any>this.settingsPanel.appendSettingsPage("Errors");

        // Append a title.
        let html = `
            <style>
            .title {
                position: relative;
                display: flex;
                font-size: 1.25rem;
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

            .title  div{
                display: flex;
                align-items: stretch;
                padding-right: 25px;
            }

            .title  span{
                padding-left: 4px;
                padding-right: 10px;
            }

            .warning{
                --iron-icon-fill-color: var(--google-yellow-700);
            }

            .error{
                --iron-icon-fill-color: var(--error-color);
            }

            .info{
                --iron-icon-fill-color: var(--google-blue-700);
            }

            paper-checkbox {
                align-self: center;
                --paper-checkbox-size: 1rem;
                padding-bottom: 2px;
            }

            </style>
            <div class="title ">
                <div>
                    <iron-icon icon="error" class="error"></iron-icon icon>
                    <span>Errors</span>
                    <paper-checkbox checked></paper-checkbox>
                </div>
                <div>
                    <iron-icon icon="warning" class="warning"></iron-icon icon>
                    <span>Warnings</span>
                    <paper-checkbox></paper-checkbox>
                </div>
                <div>
                    <iron-icon icon="info" class="info"></iron-icon icon>
                    <span>Infos</span>
                    <paper-checkbox></paper-checkbox>
                </div>
            </div>
        `

        logSettingPage.appendChild(document.createRange().createContextualFragment(html));

        // Now I will get the 
        var table = <any>(document.createElement("table-element"));
        console.log(table)

        // Create the header element.
        var header = <any>(document.createElement("table-header-element"))

        table.appendChild(header)
        table.rowheight = 29
        table.style.width = "1150px"
        table.style.maxHeight = "800px";
        
        let titles = ["Date", "Level", "Account", "Method", "Detail"]

        // Create the table filter and sorter...

        titles.forEach(title => {
            const headerCell = <any>(document.createElement("table-header-cell-element"))
            headerCell.innerHTML = `<table-sorter-element></table-sorter-element><div>${title}</div> <table-filter-element></table-filter-element>`
            // Now I will set the way I will display the values.
            if (title == "Date") {
                headerCell.width = 200;
                headerCell.onrender = function (div: any, value: Date) {
                    if (value != undefined) {
                        div.innerHTML = value.toLocaleString();
                    }
                }
            }else if(title=="Level"){
                headerCell.width = 100;
            }else if(title=="Account"){
                headerCell.width = 150;
            }else if(title=="Method"){
                headerCell.width = 425;
            }else if(title=="Detail"){
                headerCell.width = 225;
                headerCell.onrender = function (div: any, value: string) {
                    console.log(value)
                    div.title = value;
                    if (value != undefined) {
                        console.log(value.length)
                        if(value.length > 50){
                            div.innerHTML = value.substr(0, 25) + "...";
                        }else{
                            div.innerHTML = value;
                        }
                    }
                }
            }
            
            header.appendChild(headerCell)
        })

        logSettingPage.appendChild(table);
        table.data = [];

        this.getLogs("/error/" + Model.application + "/*", 
            (infos:Array<LogInfo>)=>{
                console.log(infos)
                header.fixed = true;
                // Here I will transform the the info to fit into the table.
                infos.forEach((info:LogInfo)=>{
                    let date = new Date(info.getDate() * 1000);
                    let level = ""
                    console.log(info.getLevel())
                    if(info.getLevel() == 0){
                        level = "fatal"
                    }else if(info.getLevel() == 1){
                        level = "error"
                    }else if(info.getLevel() == 2){
                        level = "warning"
                    }else if(info.getLevel() == 3){
                        level = "info"
                    }else if(info.getLevel() == 4){
                        level = "debug"
                    }else if(info.getLevel() == 5){
                        level = "trace"
                    }

                    table.data.push([date, level, info.getUsername(), info.getMethod(), info.getMessage()])
                })
                table.refresh()
            }, 
            (err:any)=>{
                console.log(err)
            })

    }

    /**
     * Return the list of logs of an application.
     * @param query The query to get logs..
     * @param successCallback Return the list of log to be displayed
     * @param errorCallback Return an error if something wrong append.
     */
    getLogs(query:string, successCallback:(infos: Array<LogInfo>)=>void, errorCallback:(err:any)=>void){
        let rqst = new GetLogRqst
        rqst.setQuery(query) // test get all error from the server.

        let stream = Model.globular.logService.getLog(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        });

        let data = new Array<LogInfo>();

        stream.on("data", (rsp: GetLogRsp) => {
            data =  data.concat(rsp.getInfosList())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                successCallback(data)
            } else {
                // In case of error I will return an empty array
                errorCallback(status.details)
            }
        });


    }
}