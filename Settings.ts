//import { SetEmailResponse } from "globular-web-client/admin/admin_pb";
import { ClearAllLogRqst, DeleteLogRqst, DeleteLogRsp, GetLogRqst, GetLogRsp, LogInfo } from "globular-web-client/log/log_pb";
import { Account } from "./Account";
import { Application } from "./Application";
import { ApplicationView } from "./ApplicationView";
import { FileExplorer } from "./components/File";
import { RoleManager} from "./components/Role"
import { GroupManager} from "./components/Group"
import { ImageCropperSetting, ImageSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting, TextAreaSetting } from "./components/Settings";
import { Model } from "./Model";
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/notification-icons";

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
                            const data = JSON.stringify(info)
                            Application.eventHub.publish(`update_application_${info._id}_settings_evt`, data, false)
                        },
                        (err: any) => {
                            ApplicationView.displayMessage(err, 3000)
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
export class RoleSettings extends Settings {
    roleManager: RoleManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.settingsMenu.appendSettingsMenuItem("notification:enhanced-encryption", "Roles");

        let roleSettingPage = <any>this.settingsPanel.appendSettingsPage("Roles");

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

            .subtitle{
                font-size: 1rem;
                text-align: left;
                padding-bottom: 15px;
            }

            </style>
            <div class="title">
                Roles 
            </div>
            <span class="subtitle" style="font-size: 1rem;">roles are defines in package.json </span>
        `
        // Display the file explorer...
        roleSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.roleManager = new RoleManager()
        roleSettingPage.appendChild(this.roleManager)
    }


}


/**
 * Model to save application settings.
 */
export class GroupSettings extends Settings {
    groupManager: GroupManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        this.settingsMenu.appendSettingsMenuItem("social:people", "Groups");

        let groupSettingPage = <any>this.settingsPanel.appendSettingsPage("Groups");

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

            .subtitle{
                font-size: 1rem;
                text-align: left;
                padding-bottom: 15px;
            }

            </style>
            <div class="title">
                Groups 
            </div>
            <span class="subtitle" style="font-size: 1rem;">groups are use to manage ressource access like files.</span>
        `
        // Display the file explorer...
        groupSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.groupManager = new GroupManager()
        groupSettingPage.appendChild(this.groupManager)

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
        this.fileExplorer.setRoot("/applications/" + Model.application)
        this.fileExplorer.init()

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
        // Display the file explorer...
        fileSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.fileExplorer.open(fileSettingPage)
        this.fileExplorer.hideActions()
    }


}

/**
 * Model to save application settings.
 */
export class LogSettings extends Settings {

    private infos:Array<LogInfo>
    private table: any;
    private header: any;
    private errorCheckBox: any;
    private warningCheckBox:any;
    private infoCheckBox:any;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);
        this.infos = new Array<LogInfo>();
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
                <div style="display: flex; display: flex;flex-grow: 1;align-items: center;">
                    <div>
                        <iron-icon icon="error" class="error"></iron-icon icon>
                        <span>Errors</span>
                        <paper-checkbox id="error_log_checkbox" checked></paper-checkbox>
                    </div>
                    <div>
                        <iron-icon icon="warning" class="warning"></iron-icon icon>
                        <span>Warnings</span>
                        <paper-checkbox id="warning_log_checkbox" ></paper-checkbox>
                    </div>
                    <div>
                        <iron-icon icon="info" class="info"></iron-icon icon>
                        <span>Infos</span>
                        <paper-checkbox  id="info_log_checkbox"></paper-checkbox>
                    </div>
                </div>
                
                <paper-button title="delete diplayed logs." style="align-self: flex-end; font-size: 1rem;">CLEAR</paper-button>

            </div>
        `

        logSettingPage.appendChild(document.createRange().createContextualFragment(html));


        this.errorCheckBox = <any> logSettingPage.querySelector("#error_log_checkbox");
        this.warningCheckBox =  <any> logSettingPage.querySelector("#warning_log_checkbox");
        this.infoCheckBox =  <any> logSettingPage.querySelector("#info_log_checkbox");


        this.infoCheckBox.onclick = this.warningCheckBox.onclick = this.errorCheckBox.onclick = ()=>{
            this.table.clear(); // remove all values...
            if(this.errorCheckBox.checked){
                this.getLogs("/error/" + Model.application + "/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                    this.getLogs("/fatal/" + Model.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        ApplicationView.displayMessage(err, 3000)
                    })
                },
                (err: any) => {
                    ApplicationView.displayMessage(err, 3000)
                })
            }
            if(this.warningCheckBox.checked){
                this.getLogs("/warning/" + Model.application + "/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                },
                (err: any) => {
                    ApplicationView.displayMessage(err, 3000)
                })
            }

            if(this.infoCheckBox.checked){
                this.getLogs("/info/" + Model.application + "/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                    this.getLogs("/debug/" + Model.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                        this.getLogs("/trace/" + Model.application + "/*",
                        (infos: Array<LogInfo>) => {
                            this.setInfos(infos)
                        },
                        (err: any) => {
                            ApplicationView.displayMessage(err, 3000)
                        })
                    },
                    (err: any) => {
                        ApplicationView.displayMessage(err, 3000)
                    })
                },
                (err: any) => {
                    ApplicationView.displayMessage(err, 3000)
                })
            }
            
        }

        logSettingPage.querySelector("paper-button").onclick = () => {

            let data = this.table.getFilteredData();
            if (data.length < this.table.data.length) {

                let deleteRows = (index: number) => {
                    

                    let index_ = parseInt(data[index].index)
                    this.deleteLog(this.infos[index_],
                        () => {
                            // remove the data at given index.
                            this.table.deleteRow(index_)

                            index += 1
                            if (index < data.length) {
                                deleteRows(index)  
                            }
                            

                        },
                        (err: any) => {
                            ApplicationView.displayMessage(err, 3000);
                        })
                }
                let index = 0
                deleteRows(index)
                
            } else {
                // Remove error/fatal logs.
                if(this.errorCheckBox.checked){
                    this.clearLogs("/error/"+ Application.application + "/*",()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})

                    this.clearLogs("/fatal/"+ Application.application+ "/*",()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})
                }
        
                // Remove warnings
                if(this.warningCheckBox.checked){
                    this.clearLogs("/warning/"+ Application.application+ "/*", ()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})
                }
                
                // Remove debug, info and tace.
                if(this.infoCheckBox.checked){
                    this.clearLogs("/info/"+ Application.application+ "/*", ()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})

                    this.clearLogs("/debug/"+ Application.application+ "/*", ()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})


                    this.clearLogs("/trace/"+ Application.application+ "/*", ()=>{
                        this.table.clear();
                    }, (err:any)=>{ApplicationView.displayMessage(err, 300)})
                }
            }
        }

        // Now I will get the 
        this.table = <any>(document.createElement("table-element"));

        // Create the header element.
        this.header = <any>(document.createElement("table-header-element"))
        this.header.fixed = true;
        this.table.appendChild(this.header)
        this.table.rowheight = 120
        this.table.style.width = "1150px"
        this.table.style.maxHeight = "820px";

        let titles = ["Date", "Level", "Account", "Method", "Detail"]

        titles.forEach(title => {
            const headerCell = <any>(document.createElement("table-header-cell-element"))
            headerCell.innerHTML = `<table-sorter-element></table-sorter-element><div>${title}</div> <table-filter-element></table-filter-element>`
            // Now I will set the way I will display the values.
            if (title == "Date") {
                headerCell.width = 200;
                headerCell.onrender = (div: any, value: Date, row: number, colum: number) => {
                    if (value != undefined) {
                        div.style.justifySelf = "flex-start"
                        div.style.display = "flex"
                        div.style.alignItems = "center"

                        div.innerHTML = `
                            <iron-icon icon="delete" style="padding-left: 5px;"></iron-icon>
                            <span>${value.toLocaleString()}</span>
                        `

                        div.children[0].onclick = () => {
                            this.deleteLog(this.infos[row],
                                () => {
                                    this.table.deleteRow(row)
                                },
                                (err: any) => {
                                    ApplicationView.displayMessage(err, 3000)
                                })

                        }

                        div.children[0].onmouseenter = () => {
                            div.children[0].style.cursor = "pointer"
                        }

                        div.children[0].onmouseout = () => {
                            div.children[0].style.cursor = "default"
                        }
                    }
                }
            } else if (title == "Level") {
                headerCell.width = 100;
            } else if (title == "Account") {
                headerCell.width = 150;
            } else if (title == "Method") {
                headerCell.width = 350;
            } else if (title == "Detail") {
                headerCell.width = 350;
                /*
                headerCell.onrender = function (div: any, value: string) {
                    // div.title = value;
                    if (value != undefined) {
                       div.style.overflow = "auto"
                       div.style.display = "flex"
                       let html= `
                        <div style="padding: 5px; text-align: left;">
                            ${value}
                        </div>
                       `
                       div.appendChild(document.createRange().createContextualFragment(html))
                    }

                }
                */
            }

            this.header.appendChild(headerCell)
        })

        logSettingPage.appendChild(this.table);
        this.table.data = [];

        this.getLogs("/error/" + Model.application + "/*",
            (infos: Array<LogInfo>) => {
                this.setInfos(infos)
            },
            (err: any) => {
                ApplicationView.displayMessage(err, 3000)
            })

    }

    setInfos(infos: Array<LogInfo>){
        // Here I will transform the the info to fit into the table.
        infos.forEach((info: LogInfo) => {
            let date = new Date(info.getDate() * 1000);
            let level = ""
            console.log(info.getLevel())
            if (info.getLevel() == 0) {
                level = "fatal"
            } else if (info.getLevel() == 1) {
                level = "error"
            } else if (info.getLevel() == 2) {
                level = "warning"
            } else if (info.getLevel() == 3) {
                level = "info"
            } else if (info.getLevel() == 4) {
                level = "debug"
            } else if (info.getLevel() == 5) {
                level = "trace"
            }

            this.infos.push(info) //keep in the array.
            this.table.data.push([date, level, info.getUsername(), info.getMethod(), info.getMessage()])
        })
        this.table.refresh()
    }

    /**
     * Clear all logs from the database.
     * @param successCallback On logs clear
     * @param errorCallback On error
     */
    clearLogs(query: string, successCallback: () => void, errorCallback: (err: any) => void){
        let rqst = new ClearAllLogRqst
        rqst.setQuery(query)

        Model.globular.logService.clearAllLog(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        }).then((rsp: DeleteLogRsp) => {
            successCallback()
        }).catch(errorCallback)
    }

    /**
     * Delete log a whit a specific key.
     * @param key 
     * @param successCallback 
     * @param errorCallback 
     */
    deleteLog(log: LogInfo, successCallback: () => void, errorCallback: (err: any) => void) {
        let rqst = new DeleteLogRqst
        rqst.setLog(log)
        Model.globular.logService.deleteLog(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        }).then((rsp: DeleteLogRsp) => {
            successCallback()
        })
            .catch(errorCallback)
    }

    /**
     * Return the list of logs of an application.
     * @param query The query to get logs..
     * @param successCallback Return the list of log to be displayed
     * @param errorCallback Return an error if something wrong append.
     */
    getLogs(query: string, successCallback: (infos: Array<LogInfo>) => void, errorCallback: (err: any) => void) {
        let rqst = new GetLogRqst
        rqst.setQuery(query) // test get all error from the server.

        let stream = Model.globular.logService.getLog(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
        });

        let data = new Array<LogInfo>();

        stream.on("data", (rsp: GetLogRsp) => {
            data = data.concat(rsp.getInfosList())
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