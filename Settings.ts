//import { SetEmailResponse } from "globular-web-client/admin/admin_pb";
import { ClearAllLogRqst, DeleteLogRqst, DeleteLogRsp, GetLogRqst, GetLogRsp, LogInfo, Occurence } from "globular-web-client/log/log_pb";
import { Account } from "./Account";
import { Application } from "./Application";
import { ApplicationView } from "./ApplicationView";
import { FileExplorer } from "./components/File";
import { RoleManager} from "./components/Role"
import { GroupManager} from "./components/Group"
import { ImageCropperSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting, RadioGroupSetting } from "./components/Settings";
import { Model } from "./Model";
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/hardware-icons";
import "@polymer/iron-icons/notification-icons";
import { ApplicationManager } from "./components/Applications";
import { PeersManager } from "./components/Peers";
import { OrganizationManager } from "./components/Organization";
import { AccountManager } from "./components/Account";

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
        let userSettingsPage = <any>settingsPanel.appendSettingsPage("User");

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

        // The default theme...
        /*let userThemeDefault = new RadioGroupSetting("Theme", "Ligth mode or dark mode")
        if(localStorage.getItem(account.id)!=null){
            userThemeDefault.setValue(JSON.parse(localStorage.getItem(account.id)))
        }
        generalSettings.addSetting(userThemeDefault)*/
        

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
export class RoleSettings extends Settings {
    roleManager: RoleManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("notification:enhanced-encryption", "Roles");

        let roleSettingPage = <any>settingsPanel.appendSettingsPage("Roles");

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
                padding-left: 8px;
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

        settingsMenu.appendSettingsMenuItem("social:people", "Groups");

        let groupSettingPage = <any>settingsPanel.appendSettingsPage("Groups");

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
                padding-left: 8px;
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

export class OrganizationSettings extends Settings {
    organizationManager: OrganizationManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("social:domain", "Organizations");

        let organizationSettingPage = <any>settingsPanel.appendSettingsPage("Organizations");

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
                padding-left: 8px;
                padding-top: 16px;
            }

            .subtitle{
                font-size: 1rem;
                text-align: left;
                padding-bottom: 15px;
            }

            </style>
            <div class="title">
                Organizations 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Aggregation of accouts, groups, roles and applications used to manage permissions</span>
        `

        // Display the file explorer...
        organizationSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.organizationManager = new OrganizationManager()
        organizationSettingPage.appendChild(this.organizationManager)

    }
}

export class ApplicationsSettings extends Settings {
    applicationManager: ApplicationManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("icons:settings-applications", "Applications");

        let applicationsSettingPage = <any>settingsPanel.appendSettingsPage("Applications");

        // Append a title.
        let html = `
            <div class="title">
                Applications 
            </div>
            <div class="subtitle-div">
                <span class="subtitle" style="font-size: 1rem; flex-grow: 1;">Manage applications</span>
                <paper-icon-button id="install-application-btn" icon="add" title="install application"> </paper-icon-button>
            </div>
        `

        // Display the file explorer...
        applicationsSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.applicationManager = new ApplicationManager()
        applicationsSettingPage.appendChild(this.applicationManager)

        // Here is to code to get the list of available applications from the package manager.
        let installApplicationBtn = applicationsSettingPage.querySelector("#install-application-btn")

        // Install application
        installApplicationBtn.onclick = ()=>{
            // So here I will get the list of availble package from the pacakage manager.
            console.log("----------> look for applications at ", Model.globular.config.Discoveries)
            // Get all package infos from that localisation.
        }

    }
}

export class PeersSettings extends Settings {
   peersManager: PeersManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("social:share", "Peers");

        let peersSettingPage = <any>settingsPanel.appendSettingsPage("Peers");

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
                padding-left: 8px;
                padding-top: 16px;
            }

            .subtitle{
                font-size: 1rem;
                text-align: left;
                padding-bottom: 15px;
            }

            </style>
            <div class="title">
                Peers 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Manage peers permissions</span>
        `

        // Display the file explorer...
        peersSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.peersManager = new PeersManager()
        peersSettingPage.appendChild(this.peersManager)

    }
}

/**
 * Model to manage users account settings.
 */
export class UsersSettings extends Settings {
  
    accountManager: AccountManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("social:people", "Accounts");

        let accountSettingPage = <any>settingsPanel.appendSettingsPage("Accounts");

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
                padding-left: 8px;
                padding-top: 16px;
            }

            .subtitle{
                font-size: 1rem;
                text-align: left;
                padding-bottom: 15px;
            }

            </style>
            <div class="title">
                Accounts 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Account manager to set account setting's</span>
        `

        // Display the file explorer...
        accountSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.accountManager = new AccountManager()
        accountSettingPage.appendChild(this.accountManager)

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
        settingsMenu.appendSettingsMenuItem("error", "Logs");
        let logSettingPage = <any>settingsPanel.appendSettingsPage("Logs");

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
                padding-left: 8px;
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
                this.getLogs("/error/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                    this.getLogs("/fatal/*",
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
                this.getLogs("/warning/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                },
                (err: any) => {
                    ApplicationView.displayMessage(err, 3000)
                })
            }

            if(this.infoCheckBox.checked){
                this.getLogs("/info/*",
                (infos: Array<LogInfo>) => {
                    this.setInfos(infos)
                    this.getLogs("/debug/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                        this.getLogs("/trace/*",
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

        let titles = ["Level", "Occurences", "Method", "Detail"]

        titles.forEach(title => {
            const headerCell = <any>(document.createElement("table-header-cell-element"))
            headerCell.innerHTML = `<table-sorter-element></table-sorter-element><div>${title}</div> <table-filter-element></table-filter-element>`
            // Now I will set the way I will display the values.
            if (title == "Occurences") {
                headerCell.width = 320;
                headerCell.onrender = (div: any, occurences: Array<Occurence>, row: number, column: number) => {
                    if (occurences != undefined) {
                        div.style.justifySelf = "flex-start"
                        div.style.display = "flex"
                        div.style.alignItems = "center"
                        console.log(occurences)
                        div.parentNode.style.position = "relative"
                        // Display the list of occurrences as needed..
                        div.innerHTML = `
                            <div style="position: absolute; top: 0px; left: 0px; bottom: 0px; right: 0px;">
                                <div style="display: flex;">
                                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                                        <iron-icon  id="collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                                        <paper-ripple class="circle" recenters=""></paper-ripple>
                                    </div>
                                    <div style="flex-grow: 1;">
                                        ${occurences.length}
                                    </div>
                                </div>
                                <iron-collapse class="permissions" id="collapse-panel" style="display: flex; flex-direction: column; width: 90%;">
                
                                </iron-collapse>
                            </div>
                            
                        `

                        let collapse_btn = div.querySelector("#collapse-btn")
                        let collapse_panel = div.querySelector("#collapse-panel")
                        collapse_btn.onclick = () => {
                            if (!collapse_panel.opened) {
                                collapse_btn.icon = "unfold-more"
                            } else {
                                collapse_btn.icon = "unfold-less"
                            }
                            collapse_panel.toggle();
                        }

                        let range = document.createRange()
                        occurences.sort((a:Occurence, b:Occurence) =>{return b.getDate() - a.getDate()})

                        // Now I will set the occurence infromations...
                        occurences.forEach(o =>{
                            let html = `
                                <div style="display: flex; padding: 2px;">
                                    <div>${new Date(o.getDate() * 1000).toLocaleString()} </div>
                                    <div style="padding-left: 10px;">${ o.getUserid() + " " + o.getApplication() }</div>
                                </div>
                            `
                            collapse_panel.appendChild(range.createContextualFragment(html))
                            
                        })

                    }
                }
            } else if (title == "Level") {
                headerCell.width = 100;
            } else if (title == "Method") {
                headerCell.width = 360;
            } else if (title == "Detail") {
                headerCell.width = 380;

            }

            this.header.appendChild(headerCell)
        })

        logSettingPage.appendChild(this.table);
        this.table.data = [];

        this.getLogs("/error/*",
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
   
            let level = ""
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
            this.table.data.push([level, info.getOccurencesList(), info.getMethod(), info.getMessage()])
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
     * Delete log a with a specific key.
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