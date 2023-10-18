//import { SetEmailResponse } from "globular-web-client/admin/admin_pb";
import { ClearAllLogRqst, DeleteLogRqst, DeleteLogRsp, GetLogRqst, GetLogRsp, LogInfo } from "globular-web-client/log/log_pb";
import { Account } from "./Account";
import { Application } from "./Application";
import { ApplicationView } from "./ApplicationView";
import { RoleManager } from "./components/Role"
import { GroupManager } from "./components/Group"
import { ImageCropperSetting, SettingsMenu, SettingsPanel, ComplexSetting, EmailSetting, StringSetting, RadioGroupSetting, OnOffSetting, NumberSetting, ActionSetting, VideoConversionErrorsManager, VideoConversionLogsManager, PasswordSetting } from "./components/Settings";
import { Model } from "./Model";
import "@polymer/iron-icons/maps-icons";
import "@polymer/iron-icons/social-icons";
import "@polymer/iron-icons/hardware-icons";
import "@polymer/iron-icons/notification-icons";
import { ApplicationManager } from "./components/Applications";
import { PeersManager } from "./components/Peers";
import { OrganizationManager } from "./components/Organization";
import { AccountManager, ExternalAccountManager } from "./components/Account";
import { StartProcessVideoRequest, StopProcessVideoRequest, IsProcessVideoRequest, SetVideoConversionRequest, SetVideoStreamConversionRequest, SetStartVideoConversionHourRequest, SetMaximumVideoConversionDelayRequest, VideoConversionError, GetVideoConversionErrorsRequest, GetVideoConversionErrorsResponse, ClearVideoConversionErrorRequest, ClearVideoConversionErrorsRequest, VideoConversionLog, ClearVideoConversionLogsRequest, ClearVideoConversionLogsResponse, ClearVideoConversionErrorResponse, ClearVideoConversionErrorsResponse, GetVideoConversionLogsRequest, GetVideoConversionLogsResponse } from "globular-web-client/file/file_pb";
import { GetServiceConfigurationByIdRequest } from "globular-web-client/config_manager/config_pb";
import { PermissionsManager, ResourcesPermissionsManager } from "./components/Permissions";

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
    }

    public save() {
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
        let imageCropperSettings = new ImageCropperSetting("Picture", "Change the user picture", account.id, account.profilePicture)
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

        // Change the password.
        let userPasswordSetting = new ComplexSetting("Password", "Change account password")
        generalSettings.addSetting(userPasswordSetting)

        let passowrdSetting = new PasswordSetting("Password", "Change account password")
        userPasswordSetting.addSetting(passowrdSetting)

        generalSettings.addSetting(userPasswordSetting)

        // The user email address.
        let userEmailSetting = new EmailSetting("Email", "Change the user email")
        userEmailSetting.setValue(account.email)
        generalSettings.addSetting(userEmailSetting)


        // The set the application mode...
        let displayModeSelector = new RadioGroupSetting("Theme", "Ligth mode or dark mode")
        displayModeSelector.setChoices(["light", "dark"])
        displayModeSelector.onSelect = (value) => {
            if (localStorage.getItem(account.id) != null) {
                let theme = localStorage.getItem(account.id + "_theme")
                let html = document.querySelector("html")
                if (theme != null) {
                    if (theme != value) {
                        displayModeSelector.setValue(value)
                        localStorage.setItem(account.id + "_theme", value)
                        localStorage.setItem("globular_theme", value)
                        html.setAttribute("theme", value)
                    }
                } else {
                    localStorage.setItem(account.id + "_theme", value)
                    localStorage.setItem("globular_theme", value)
                    html.setAttribute("theme", value)
                }
            } else {
                localStorage.setItem(account.id + "_theme", value)
                localStorage.setItem("globular_theme", value)
                html.setAttribute("theme", value)
            }
        }

        let theme = localStorage.getItem(account.id + "_theme")
        let html = document.querySelector("html")
        if (theme != null) {
            displayModeSelector.setValue(theme)
            html.setAttribute("theme", theme)
        } else if (html.getAttribute("theme") != null) {
            displayModeSelector.setValue(html.getAttribute("theme"))
        } else {
            displayModeSelector.setValue("light")
        }
        generalSettings.addSetting(displayModeSelector)


        Application.eventHub.subscribe("save_settings_evt",
            (uuid: string) => {

            },
            (needSave: boolean) => {
                if (needSave) {
                    // set the change.
                    account.firstName = firstNameSetting.getValue();
                    account.lastName = lastNameSetting.getValue();
                    account.middleName = middleNameSetting.getValue();
                    account.profilePicture = imageCropperSettings.getValue();

                    account.save(
                        () => {
                            imageCropperSettings.setValue(account.profilePicture)
                        },
                        (err: any) => {
                            console.log(err)
                        })
                } else {
                    // revert the change.
                    firstNameSetting.setValue(account.firstName)
                    lastNameSetting.setValue(account.lastName)
                    middleNameSetting.setValue(account.middleName)
                    imageCropperSettings.setValue(account.profilePicture)
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
                padding-bottom: 35px;
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
                padding-bottom: 35px;
            }

            </style>
            <div class="title">
                Organizations 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Aggregation of accounts, groups, roles and applications used to manage permissions</span>
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
        installApplicationBtn.onclick = () => {
            // So here I will get the list of availble package from the pacakage manager.

            // Get all package infos from that localisation.
        }

    }
}

export class PeersSettings extends Settings {
    peersManager: PeersManager;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("hardware:computer", "Peers");

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
 * Model to save application settings.
 */
export class ResourcesPermissionsSettings extends Settings {

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("icons:lock", "Permissions");
        let groupSettingPage = <any>settingsPanel.appendSettingsPage("Permissions");

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
                padding-bottom: 35px;
            }

            </style>
            <div class="title">
                Resources Permissions 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Manage resources permissions ex: blog, group, file, application...</span>
        `
        // Display the file explorer...
        groupSettingPage.appendChild(document.createRange().createContextualFragment(html));

        groupSettingPage.appendChild(new ResourcesPermissionsManager())

    }
}

// Return the list of conversion errors
function getConversionErrors(callback: (errors: Array<VideoConversionError>) => void) {

    let rqst = new GetVideoConversionErrorsRequest
    Model.globular.fileService.getVideoConversionErrors(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
        address: Model.address
    }).then((rsp: GetVideoConversionErrorsResponse) => {
        callback(rsp.getErrorsList())
    }).catch(err => {
        ApplicationView.displayMessage(err, 3000)
    })
}

function getConversionLogs(callback: (errors: Array<VideoConversionLog>) => void) {
    let rqst = new GetVideoConversionLogsRequest
    Model.globular.fileService.getVideoConversionLogs(rqst, {
        token: localStorage.getItem("user_token"),
        application: Model.application,
        domain: Model.domain,
        address: Model.address
    }).then((rsp: GetVideoConversionLogsResponse) => {
        callback(rsp.getLogsList())
    }).catch(err => {
        ApplicationView.displayMessage(err, 3000)
    })
}

/**
 * Model to manage users account settings.
 */
export class VideoSettings extends Settings {
    private needSave: boolean;
    private config: any;

    // The application.
    constructor(settingsMenu: SettingsMenu, settingsPanel: SettingsPanel) {
        super(settingsMenu, settingsPanel);

        settingsMenu.appendSettingsMenuItem("maps:local-movies", "Video");

        let viedoSettingPage = <any>settingsPanel.appendSettingsPage("Video");

        // Create general user settings ...
        let conversionSettings = viedoSettingPage.appendSettings("Conversion", "Video Conversion settings");

        // Enable/Disable video conversion.
        let enableConversionSetting = new OnOffSetting("convert to MP4", "enable/disable automatic video conversion")
        enableConversionSetting.setValue(true)
        conversionSettings.addSetting(enableConversionSetting)

        let enableStreamConversionSetting = new OnOffSetting("convert MP4 to HLS", "enable/disable automatic video stream conversion")
        enableStreamConversionSetting.setValue(true)
        conversionSettings.addSetting(enableStreamConversionSetting)

        let startConversionHour = new NumberSetting("start conversion hour", "The conversion will begin at this hour")
        startConversionHour.setValue("00:00")
        startConversionHour.getElement().setAttribute("type", "time")
        startConversionHour.getElement().setAttribute("max", "24:00")
        startConversionHour.getElement().setAttribute("min", "00:00")
        conversionSettings.addSetting(startConversionHour)

        let maxConversionDelay = new NumberSetting("maximum conversion delay", "Maximum conversion runing time, stop processing new file past this delay (in hours)")
        maxConversionDelay.setValue("08:00")
        maxConversionDelay.getElement().setAttribute("type", "time")
        maxConversionDelay.getElement().setAttribute("max", "24:00")
        maxConversionDelay.getElement().setAttribute("min", "00:00")
        conversionSettings.addSetting(maxConversionDelay)

        let fileServerConfig = Model.globular.getConfigs("file.FileService")[0]
        let rqst_ = new GetServiceConfigurationByIdRequest
        rqst_.setId(fileServerConfig.Id)

        Model.globular.configurationService.getServiceConfigurationById(rqst_, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp => {
            let configStr = rsp.getConfig()
            this.config = JSON.parse(configStr)
            enableConversionSetting.setValue(this.config.AutomaticVideoConversion)
            enableStreamConversionSetting.setValue(this.config.AutomaticStreamConversion)
            startConversionHour.setValue(this.config.StartVideoConversionHour)
            maxConversionDelay.setValue(this.config.MaximumVideoConversionDelay)

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })


        enableConversionSetting.onchange = () => {
            // this.conversionSettings.KeepAlive = keepAlive.getValue()
            let conversion = enableConversionSetting.getValue()
            if (conversion) {
                enableStreamConversionSetting.style.display = "flex"
                startConversionHour.style.display = "flex"
                maxConversionDelay.style.display = "flex"
            } else {
                enableStreamConversionSetting.style.display = "none"
                startConversionHour.style.display = "none"
                maxConversionDelay.style.display = "none"
            }

            // keep in local value
            this.config.AutomaticVideoConversion = conversion

            this.needSave = true
        }

        // The stream conversion setting.
        enableStreamConversionSetting.onchange = () => {
            // this.conversionSettings.KeepAlive = keepAlive.getValue()
            let conversion = enableStreamConversionSetting.getValue()

            // keep in local value
            this.config.AutomaticStreamConversion = conversion

            this.needSave = true
        }

        startConversionHour.onchange = () => {
            // this.conversionSettings.KeepAlive = keepAlive.getValue()
            let value = startConversionHour.getValue()

            // keep in local value
            this.config.StartVideoConversionHour = value

            this.needSave = true
        }

        maxConversionDelay.onchange = () => {
            // this.conversionSettings.KeepAlive = keepAlive.getValue()
            let value = maxConversionDelay.getValue()

            // keep in local value
            this.config.MaximumVideoConversionDelay = value

            this.needSave = true
        }

        // The convert button will start video processing...
        let startConvertVideoAction = new ActionSetting("Start", "Convert video to MP4 or HLS", () => {
            // Application.globular.ldapService.
            let rqst = new StartProcessVideoRequest
            Model.globular.fileService.startProcessVideo(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain,
                address: Model.address
            }).then(rsp => {
                stopConvertVideoAction.style.display = "flex"
                startConvertVideoAction.style.display = "none"
                ApplicationView.displayMessage("video conversion is running...", 3500)
            }).catch(err => {
                ApplicationView.displayMessage(err, 3000)
            })
        })

        conversionSettings.addSetting(startConvertVideoAction)


        // The convert button will start video processing...
        let stopConvertVideoAction = new ActionSetting("Stop", "Stop video conversion...", () => {
            // Application.globular.ldapService.
            let rqst = new StopProcessVideoRequest
            Model.globular.fileService.stopProcessVideo(rqst, {
                token: localStorage.getItem("user_token"),
                application: Model.application,
                domain: Model.domain,
                address: Model.address
            }).then(rsp => {
                stopConvertVideoAction.style.display = "none"
                startConvertVideoAction.style.display = "flex"
                ApplicationView.displayMessage("video conversion is stopped...", 3500)
            }).catch(err => {
                ApplicationView.displayMessage(err, 3000)
            })
        })

        conversionSettings.addSetting(stopConvertVideoAction)

        let rqst = new IsProcessVideoRequest
        Model.globular.fileService.isProcessVideo(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(rsp => {
            if (rsp.getIsprocessvideo()) {
                stopConvertVideoAction.style.display = "flex"
                startConvertVideoAction.style.display = "none"
            } else {
                stopConvertVideoAction.style.display = "none"
                startConvertVideoAction.style.display = "flex"
            }

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })


        // Need save...
        Application.eventHub.subscribe("save_settings_evt",
            (uuid: string) => {

            },
            () => {
                if (this.needSave) {
                    this.saveSetConversion(enableConversionSetting.getValue())
                    this.saveSetStreamConversion(enableStreamConversionSetting.getValue())
                    this.saveMaxConversionDelay(maxConversionDelay.getValue())
                    this.saveStartConversionHour(startConversionHour.getValue())
                }
            })

        //////////////////// Now the convertion log's info to make it interface interactive.
        let conversionLogsSettings = viedoSettingPage.appendSettings("Logs", "Convertion activity summary")

        let videoConversionLogsManager = new VideoConversionLogsManager(this.clearVideoConversionLogs, this.refreshVideoConversionLogs)
        conversionLogsSettings.addSetting(videoConversionLogsManager)
        getConversionLogs(logs => {
            videoConversionLogsManager.setLogs(logs)

            Model.getGlobules().forEach(g => {
                // I will now listen for conversion event...
                g.eventHub.subscribe("conversion_log_event", uuid => { }, evt => {
                    let obj = JSON.parse(evt)
                    let log = new VideoConversionLog()
                    log.setLogTime(obj.logTime)
                    log.setPath(obj.path)
                    log.setStatus(obj.status)
                    log.setMsg(obj.msg)
                    videoConversionLogsManager.setLog(log)
                }, false)
            })

        })

        //////////////////// Now the conversion error //////////////////
        // Create general user settings ...
        let conversionErrorsSettings = viedoSettingPage.appendSettings("Errors", "List of conversion errors");

        // Here I will create the interface to display the list of errors and remove error from the list to.
        let videoConversionErrorsManager = new VideoConversionErrorsManager(this.deletVideoConversionError, this.clearVideoConversionErrors, this.refreshVideoConversionErrors)

        conversionErrorsSettings.addSetting(videoConversionErrorsManager)

        getConversionErrors(errors => {

            videoConversionErrorsManager.setErrors(errors)
            Model.getGlobules().forEach(g => {
                // I will now listen for conversion event...
                g.eventHub.subscribe("conversion_log_error", uuid => { }, evt => {
                    let obj = JSON.parse(evt)
                    let err = new VideoConversionError
                    err.setError(obj.error)
                    err.setPath(obj.path)
                    videoConversionErrorsManager.setError(err)
                }, false)
            })

        })
    }

    refreshVideoConversionLogs(callback: (logs: Array<VideoConversionLog>) => void) {
        getConversionLogs(logs => {
            callback(logs)
        })
    }

    clearVideoConversionLogs() {
        let rqst = new ClearVideoConversionLogsRequest
        Model.globular.fileService.clearVideoConversionLogs(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then((rsp: ClearVideoConversionLogsResponse) => {
            ApplicationView.displayMessage("log clear", 3000)
        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    deletVideoConversionError(err: VideoConversionError) {
        let rqst = new ClearVideoConversionErrorRequest
        rqst.setPath(err.getPath())
        Model.globular.fileService.clearVideoConversionError(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then((rsp: ClearVideoConversionErrorResponse) => {
            ApplicationView.displayMessage("error was deleted, you can try to convert the video again", 3000)
        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    refreshVideoConversionErrors(callback: (errors: Array<VideoConversionError>) => void) {
        getConversionErrors(errors => {
            callback(errors)
        })
    }

    clearVideoConversionErrors() {
        let rqst = new ClearVideoConversionErrorsRequest
        Model.globular.fileService.clearVideoConversionErrors(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then((rsp: ClearVideoConversionErrorsResponse) => {
            ApplicationView.displayMessage("all video convesion are deleted, file in that list will not be convert", 3000)
        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    // Set|Reset automatic conversion.
    saveSetConversion(value: boolean) {
        // Set video Conversion parameter...
        let rqst = new SetVideoConversionRequest;
        rqst.setValue(value);
        Model.globular.fileService.setVideoConversion(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(() => {

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    // Set|Reset automatic steam conversion.
    saveSetStreamConversion(value: boolean) {
        // Set video Conversion parameter...
        let rqst = new SetVideoStreamConversionRequest;
        rqst.setValue(value);
        Model.globular.fileService.setVideoStreamConversion(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(() => {

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }

    // Set|Reset start conversion time.
    saveStartConversionHour(value: string) {
        // Set video Conversion parameter...
        let rqst = new SetStartVideoConversionHourRequest;
        rqst.setValue(value);
        Model.globular.fileService.setStartVideoConversionHour(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(() => {

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }


    // Set|Reset maximum conversion delay.
    saveMaxConversionDelay(value: string) {
        // Set video Conversion parameter...
        let rqst = new SetMaximumVideoConversionDelayRequest;
        rqst.setValue(value);
        Model.globular.fileService.setMaximumVideoConversionDelay(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
        }).then(() => {

        }).catch(err => {
            ApplicationView.displayMessage(err, 3000)
        })
    }
}

/**
 * Model to manage users account settings.
 */
export class UsersSettings extends Settings {

    localAccountManager: AccountManager;

    externalAccountManager: ExternalAccountManager;

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
                padding-bottom: 35px;
            }

            </style>
            <div class="title">
                Accounts 
            </div>
            <span class="subtitle" style="font-size: 1rem;">Manage local accounts</span>
        `

        // Display the file explorer...
        accountSettingPage.appendChild(document.createRange().createContextualFragment(html));
        this.localAccountManager = new AccountManager()
        accountSettingPage.appendChild(this.localAccountManager)

        // Now the external account use to display account not managed by the server but that can access ressources via
        // peer connections.
        this.externalAccountManager = new ExternalAccountManager()
        accountSettingPage.appendChild(this.externalAccountManager)

    }


}

/**
 * Model to save application settings.
 */
export class LogSettings extends Settings {

    private infos: Array<LogInfo>
    private table: any;
    private header: any;
    private errorCheckBox: any;
    private warningCheckBox: any;
    private infoCheckBox: any;

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


        this.errorCheckBox = <any>logSettingPage.querySelector("#error_log_checkbox");
        this.warningCheckBox = <any>logSettingPage.querySelector("#warning_log_checkbox");
        this.infoCheckBox = <any>logSettingPage.querySelector("#info_log_checkbox");


        this.infoCheckBox.onclick = this.warningCheckBox.onclick = this.errorCheckBox.onclick = () => {
            this.table.clear(); // remove all values...
            if (this.errorCheckBox.checked) {
                this.getLogs("error/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        console.log(err)
                    })

                this.getLogs("fatal/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        console.log(err)
                    })
            }
            if (this.warningCheckBox.checked) {
                this.getLogs("warning/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        console.log(err)
                    })
            }

            if (this.infoCheckBox.checked) {
                this.getLogs("info/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        console.log(err)
                    })

                this.getLogs("debug/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                       console.log(err)
                    })

                this.getLogs("trace/" + Application.application + "/*",
                    (infos: Array<LogInfo>) => {
                        this.setInfos(infos)
                    },
                    (err: any) => {
                        console.log(err)
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
                if (this.errorCheckBox.checked) {
                    this.clearLogs("error/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })

                    this.clearLogs("fatal/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })
                }

                // Remove warnings
                if (this.warningCheckBox.checked) {
                    this.clearLogs("warning/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })
                }

                // Remove debug, info and tace.
                if (this.infoCheckBox.checked) {
                    this.clearLogs("info/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })

                    this.clearLogs("debug/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })


                    this.clearLogs("trace/" + Application.application + "/*", () => {
                        this.table.clear();
                    }, (err: any) => { ApplicationView.displayMessage(err, 300) })
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
                headerCell.onrender = (div: any, occurences: number, row: number, column: number) => {
                    if (occurences != undefined) {
                        div.style.justifySelf = "flex-start"
                        div.style.display = "flex"
                        div.style.alignItems = "center"
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
                                        ${occurences}
                                    </div>
                                </div>
                                <iron-collapse class="permissions" id="collapse-panel" style="display: flex; flex-direction: column; margin: 5px;">
                
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

                        // Now I will set the occurence infromations...
                        // TODO here I will get more infos about occurences...
                        /**occurences.forEach(o => {
                            let html = `
                                <div style="display: flex; padding: 2px;">
                                    <div>${new Date(o.getDate() * 1000).toLocaleString()} </div>
                                    <div style="padding-left: 10px;">${o.getUserid() + " " + o.getApplication()}</div>
                                </div>
                            `
                            collapse_panel.appendChild(range.createContextualFragment(html))

                        })*/

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

        this.getLogs("error/"+Application.application+"/*",
            (infos: Array<LogInfo>) => {
                this.setInfos(infos)
            },
            (err: any) => {
                console.log(err)
            })

    }

    setInfos(infos: Array<LogInfo>) {
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
            this.table.data.push([level, info.getOccurences(), info.getMethod(), info.getMessage()])
        })
        this.table.refresh()
    }

    /**
     * Clear all logs from the database.
     * @param successCallback On logs clear
     * @param errorCallback On error
     */
    clearLogs(query: string, successCallback: () => void, errorCallback: (err: any) => void) {
        let rqst = new ClearAllLogRqst
        rqst.setQuery(query)

        Model.globular.logService.clearAllLog(rqst, {
            token: localStorage.getItem("user_token"),
            application: Model.application,
            domain: Model.domain,
            address: Model.address
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
            address: Model.address
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
            address: Model.address
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

