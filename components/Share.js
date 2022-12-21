import "@polymer/iron-icons/social-icons";
import { GeneratePeerTokenRequest } from "globular-web-client/authentication/authentication_pb";
import { GetResourcePermissionRqst, GetResourcePermissionsRqst, Permission, Permissions, SetResourcePermissionsRqst } from "globular-web-client/rbac/rbac_pb";
import { CreateNotificationRqst, Notification, NotificationType } from "globular-web-client/resource/resource_pb";
import * as getUuidByString from "uuid-by-string";
import { Account } from "../Account";
import { Application } from "../Application";
import { ApplicationView } from "../ApplicationView";
import { Group } from "../Group";
import { generatePeerToken, Model } from "../Model";
import { Menu } from './Menu';
import { getTheme } from "./Theme";
import { randomUUID } from "./utility";
import { Wizard } from "./Wizard";
import {Link} from "./Link"
import { Notification as Notification_ } from '../Notification';

/**
 * Login/Register functionality.
 */
export class ShareMenu extends Menu {

    // Create the application view.
    constructor() {
        super("share", "social:share", "Share")

        // The panel to manage shared content.
        this.sharePanel = null;

        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if (this.sharePanel.parentNode == undefined) {
                Model.eventHub.publish("_display_share_panel_event_", this.sharePanel, true)
            }

        }

    }

    // Initialyse the share panel.
    init(account) {

        if (this.sharePanel == null) {
            this.account = account;
            // init once...
            this.sharePanel = new SharePanel(account);
        }
    }
}

customElements.define('globular-share-menu', ShareMenu)

/**
 * Sample empty component
 */
export class SharePanel extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(account) {
        super()

        // keep local account in memory...
        this.account = account;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container {
                display: flex;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                width: 95%;
                margin-left: 2.5%;
                padding-left: 10px;
            }

            #share_div{
                display: flex;
                flex-wrap: wrap;
            }

            #title_div{
                display: flex;
                flex-wrap: wrap;
            }

            h1{

                margin: 0px; 
                margin-left: 10px;
            }

            h2{
                margin-bottom: 4px; 
                margin-left: 10px;
                border-bottom: 1px solid var(--palette-divider);
                width: 80%;
            }


        </style>
        <paper-card id="container">
            <div style="display: flex; justify-content: center;">
                <h1 style="flex-grow: 1;">Shared Resources...</h1>
                <paper-icon-button id="close-btn" icon="icons:close"></paper-icon-button>
            </div>
            <div id="share_div">
                <globular-subjects-view></globular-subjects-view>
            </div>
        </paper-card>
        `

        this.onclose = null

        // simply close the watching content...
        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }
        }


    }

}

customElements.define('globular-share-panel', SharePanel)


/**
 * create a new permission for a given resource.
 */
export class ShareResourceMenu extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.files = [];

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{

            }

            #share-resource-btn {
                height: 18px;
            }

            #share-resource-btn:hover{
                cursor: pointer;
            }

        </style>
        <div id="container">
            <iron-icon id="share-resource-btn" icon="social:share">
            </iron-icon>
        </div>
        `
        // give the focus to the input.
        this.shadowRoot.querySelector("#share-resource-btn").onclick = (evt) => {
            evt.stopPropagation();

            this.share()
        }

    }

    setFiles(files) {
        this.files = files;
    }

    share() {
        let shareResourceWizard = new ShareResourceWizard(this.files)
        shareResourceWizard.show()

    }
}

customElements.define('globular-share-resource-menu', ShareResourceMenu)


/**
 * Sample empty component
 */
export class ShareResourceWizard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(files) {
        super()

        this.files = files;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            paper-card{
                display: flex;
                flex-direction: column;
                border-left: 1px solid var(--palette-divider);
                border-right: 1px solid var(--palette-divider);
            }

            .header {
                display: flex;
                color: var(--palette-text-accent);
                background-color: var(--palette-primary-accent);
                align-items: center;
            }

            .title {
                flex-grow: 1;
            }

        </style>
        <paper-card>
            <div class="header">
                <iron-icon icon="social:share" style="padding-left: 10px;"></iron-icon>
                <span class="title"> </span>
                <paper-icon-button icon="icons:close"></paper-icon-button>
            </div>
            <slot> </slot>
        </paper-card>
        `

        // give the focus to the input.
        let wizard = new Wizard(800)

        // Here I will set the wizard pages...
        let range = document.createRange()
        let files_page = `
            <div class="globular-wizard-page" style="display: flex; flex-wrap: wrap; height: 500px; overflow-y: auto;">
        `

        // The welcome pages...
        files.forEach(file => {
            let title = null
            let name = file.name;

            if (file.titles) {
                title = file.titles[0]
                name = title.getName()
                if (title.getEpisode() > 0) {
                    name += " S" + title.getSeason() + "-E" + title.getEpisode()
                }

            } else if (file.videos) {
                title = file.videos[0]
                name = title.getDescription()
            } else if (file.audios) {
                title = file.audios[0]
                name = title.getTitle()
            }

            let uuid = "_" + getUuidByString(file.path)

            let file_page = `
            <div style="display: flex; flex-direction: column; align-items: center; width: fit-content; margin: 5px; height: fit-content; ">
                <div style="display: flex; flex-direction: column; border: 1px solid var(--palette-divider); padding: 5px; border-radius: 2.5px;">
                    <div style="display: flex; align-items: center; width: 100%;">
                        <paper-checkbox checked  id="${uuid + "_checkbox"}"></paper-checkbox>
                        <span class="title" style="flex-grow: 1;"></span>
                        <iron-icon class="wizard-file-infos-btn" id="${uuid + "_infos_btn"}" icon="icons:info"></iron-icon>
                    </div>
        
                    <img style="height: 72px; width: fit-content; max-width: 172px;" src="${file.thumbnail}"></img>
                </div>
                <span style="font-size: .85rem; padding: 2px; display: block; max-width: 128px; word-break: break-all;" title=${file.path}> ${name}</span>
            </div>
            `

            files_page += file_page;

        })

        files_page += "</div>"

        wizard.appendPage(range.createContextualFragment(files_page).children[0])

        // Now the user, group application and organization page...
        let subjects_page = `
        <div class="globular-wizard-page" style="height: 500px; overflow-y: auto;">
            <div style="display: flex; height: 100%;">
                <globular-subjects-view style="height: 100%; min-width: 250px; border-right: 1px solid var(--palette-divider)"></globular-subjects-view>
                <globular-subjects-selected style="height: 100%; margin-left: 20px; flex-grow: 1"></globular-subjects-selected>
            </div>
        </div>
        `
        wizard.appendPage(range.createContextualFragment(subjects_page).children[0])

        let subjectsView = wizard.querySelector("globular-subjects-view")
        let selectedSubjects = wizard.querySelector("globular-subjects-selected")


        let shared_permissions_page = `
        <div  class="globular-wizard-page" style="height: 500px; overflow-y: auto;">
            <globular-shared-subjects-permissions></globular-shared-subjects-permissions>
        </div>
        `
        wizard.appendPage(range.createContextualFragment(shared_permissions_page).children[0])

        let sharedSubjectsPermission = wizard.querySelector("globular-shared-subjects-permissions")

        // Append account 
        subjectsView.on_account_click = (accountDiv, account) => {
            accountDiv.account = account;
            selectedSubjects.appendAccount(accountDiv)

        }

        // Append group
        subjectsView.on_group_click = (groupDiv, group) => {
            groupDiv.group = group;
            selectedSubjects.appendGroup(groupDiv)

        }

        // if account are remove or append...
        subjectsView.on_accounts_change = () => {
            sharedSubjectsPermission.setAccounts(selectedSubjects.getAccounts())
        }

        subjectsView.on_groups_change = () => {
            sharedSubjectsPermission.setGroups(selectedSubjects.getGroups())
        }


        let summary = `
        <div  class="globular-wizard-page" style="max-height: 500px; overflow-y: auto;">
            <div style="display: flex;">
                <iron-icon style="height: 84px; width: 84px; fill: var(--palette-success-main);" icon="icons:check-circle"></iron-icon>
                <div style="display: flex; flex-direction: column; margin-left: 30px; padding-left: 30px; border-left: 1px solid var(--palette-divider);">
                    <p style="flex-grow: 1;">  
                        Resources permissions was successfully created for
                    </p>
                    <div style="display: flex; flex-wrap: wrap;" id="resources"></div>
                    <p>
                        The following user's will be notified of their new access
                    </p>

                    <div style="display: flex; flex-wrap: wrap;" id="paticipants"></div>
                </div>
            </div>
        </div>
        `

        wizard.setSummaryPage(range.createContextualFragment(summary).children[0])

        wizard.ondone = (summary_page) => {
            // Here I will get read element from the interface to get permissions infos...
            let permissions = sharedSubjectsPermission.getPermissions()

            this.setFilesPermissions(permissions, files, errors => {
                let participants = selectedSubjects.getAccounts()
                let groups = selectedSubjects.getGroups()

                // display the list of resource...
                let getMembers = (index) => {
                    let group = groups[index]

                    group.getMembers(members => {
                        // append members...
                        members.forEach(member => {
                            if (participants.filter(p => p.id + "@" + p.domain === member.id + "@" + member.domain).length == 0) {
                                participants.push(member)
                            }
                        })
                        index++
                        if (index < groups.length) {
                            getMembers(index)
                        } else {
                            displayParticipants()
                        }
                    })
                }


                let displayResources = () => {
                    let resourcesDiv = summary_page.querySelector("#resources")
                    files.forEach(file => {
                        let title = null
                        let name = file.name;

                        if (file.titles) {
                            title = file.titles[0]
                            name = title.getName()
                            if (title.getEpisode() > 0) {
                                name += " S" + title.getSeason() + "-E" + title.getEpisode()
                            }

                        } else if (file.videos) {
                            title = file.videos[0]
                            name = title.getDescription()
                        } else if (file.audios) {
                            title = file.audios[0]
                            name = title.getTitle()
                        }

                        let uuid = "_" + getUuidByString(file.path)
                        let fileDiv = `
                        <div style="display: flex; flex-direction: column; align-items: center; width: fit-content; margin: 5px; height: fit-content; ">
                            <div style="display: flex; flex-direction: column; border: 1px solid var(--palette-divider); padding: 5px; border-radius: 2.5px;">
                                <div style="display: flex; align-items: center; width: 100%;">
                                    <span class="title" style="flex-grow: 1;"></span>
                                    <iron-icon style="fill: var(--palette-success-main);" id="${uuid + "_success"}" icon="icons:check-circle"></iron-icon>
                                    <iron-icon style="fill: var(--palette-secondary-main);" id="${uuid + "_error"}" icon="icons:error"></iron-icon>
                                </div>
                                <img style="height: 72px; width: fit-content; max-width: 172px;" src="${file.thumbnail}"></img>
                            </div>
                            <span style="font-size: .85rem; padding: 2px; display: block; max-width: 128px; word-break: break-all;" title=${file.path}> ${name}</span>
                        </div>
                        `
                        resourcesDiv.appendChild(range.createContextualFragment(fileDiv))

                        // Here I will display error in the interface if ther some...
                        if (errors[file.path]) {
                            resourcesDiv.querySelector(`#${uuid + "_success"}`).style.display = "none"
                            resourcesDiv.querySelector(`#${uuid + "_error"}`).title = errors[file.path].message

                        } else {
                            resourcesDiv.querySelector(`#${uuid + "_error"}`).style.display = "none"
                            
                            participants.forEach(contact => {
                                // So here I will send a notification to the participant with the share information...
                                let rqst = new CreateNotificationRqst
                                let notification = new Notification

                                notification.setDate(parseInt(Date.now() / 1000)) // Set the unix time stamp...
                                notification.setId(randomUUID())
                                notification.setRecipient(contact.id + "@" + contact.domain)
                                notification.setSender(Application.account.id + "@" + Application.account.domain)
                                notification.setNotificationType(NotificationType.USER_NOTIFICATION)

                                let date = new Date()
                                let msg = `
                                <div style="display: flex; flex-direction: column; padding: 16px;">
                                    <div>
                                    ${date.toLocaleString()}
                                    </div>
                                    <div>
                                        <div style="display: flex; flex-direction: column;">
                                                <p>
                                                    ${Application.account.name} has share file with you,
                                                </p>

                                                <globular-link path="${file.path}" thumbnail="${file.thumbnail}" domain="${file.domain}"></globular-link>
      
                                            </div>
                                   
                                    </div>
                                </div>
                                `

                                notification.setMessage(msg)
                                rqst.setNotification(notification)

                                // Create the notification...
                                let globule = Model.getGlobule(contact.domain)
                                generatePeerToken(globule, token=>{
                                    globule.resourceService.createNotification(rqst, {
                                        token: token,
                                        application: Model.application,
                                        domain: contact.domain,
                                        address: Model.address
                                    }).then((rsp) => {
                                        /** nothing here... */
                                        let notification_ = new Notification_
                                        notification_.id = notification.getId()
                                        notification_.date = date
                                        notification_.sender = notification.getSender()
                                        notification_.recipient = notification.getRecipient()
                                        notification_.text = notification.getMessage()
                                        notification_.type = 0
        
                                        // Send notification...
                                        Model.getGlobule(contact.domain).eventHub.publish(contact.id + "@" + contact.domain + "_notification_event", notification_.toString(), false)
                                    }).catch(err => {
                                        ApplicationView.displayMessage(err, 3000);
                                        console.log(err)
                                    })
                                })
           
                            })
                        }
                    })
                }

                let displayParticipants = () => {
                    let participantsDiv = summary_page.querySelector("#paticipants")
                    let range = document.createRange()

                    // set style...
                    participantsDiv.appendChild(range.createContextualFragment(`
                    <style>
                        .infos {
                            margin: 2px;
                            padding: 4px;
                            display: flex;
                            flex-direction: column;
                            border-radius: 4px;
                            align-items: center;
                            transition: background 0.2s ease,padding 0.8s linear;
                            background-color: var(--palette-background-paper);
                            color: var(--palette-text-primary);
                        }
            
                        .infos img{
                            max-height: 64px;
                            max-width: 64px;
                            border-radius: 32px;
                        }
            
                        .infos span{
                            font-size: 1rem;
                            margin-left: 10px;
                        }
                    </style>
                    `))

                    participants.forEach(a => {
                        let uuid = "_" + getUuidByString(a.id + "@" + a.domain)
                        let html = `
                        <div id="${uuid}" class="infos">
                            <img src="${a.profilePicture}"> </img>
                            <span>${a.name}</span>
                        </div>
                        `
                        participantsDiv.appendChild(range.createContextualFragment(html))
                    })

                    // display resources...
                    displayResources()
                }

                if (groups.length == 0) {
                    displayParticipants()
                } else {
                    getMembers(0)
                }
            })


        }

        this.appendChild(wizard)

        // So he I will connect events...
        files.forEach(file => {
            let title = null
            let video = null
            let audio = null
            if (file.titles) {
                title = file.titles[0]
            } else if (file.videos) {
                video = file.videos[0]
            } else if (file.audios) {
                audio = file.audios[0]
            }

            let uuid = "_" + getUuidByString(file.path)

            let infos_btn = this.querySelector(`#${uuid + "_infos_btn"}`)
            if (title) {
                infos_btn.onclick = () => {
                    this.showTitleInfo(title)
                }
            } else if (video) {
                infos_btn.onclick = () => {
                    this.showVideoInfo(video)
                }
            } else {
                infos_btn.style.display = "none"
            }

            infos_btn.onmouseover = () => {
                infos_btn.style.cursor = "pointer"
            }
            infos_btn.onmouseleave = () => {
                infos_btn.style.cursor = "default"
            }

            let checkbox = this.querySelector(`#${uuid + "_checkbox"}`)
            file.selected = true;
            checkbox.onclick = () => {
                file.selected = checkbox.checked;
                console.log(file.path, " is selected ", file.selected)
            }

        })

        // make the wizard modal...
        this.modal = document.createElement("div")
        this.modal.style.position = "absolute"
        this.modal.style.top = "0px"
        this.modal.style.bottom = "0px"
        this.modal.style.left = "0px"
        this.modal.style.right = "0px"
        this.modal.style.backgroundColor = "rgba(0,0,0,.45)"

        // Close the wizard...
        wizard.onclose = () => {
            this.close()
        }

        // Cancel button...
        this.shadowRoot.querySelector("paper-icon-button").onclick = () => {
            this.close()
        }
    }

    // save permission, it will return map of errors if some permissions can't be set 
    // for a given file.
    setFilesPermissions(permissions_, files, callback) {

        let errors = {}

        // save permissions.
        let saveFilePermissions = (f, permissions, callback, errorCallback) => {
            /** todo write the code to save the permission. */
            console.log("save permissions: ", permissions)
            let rqst = new SetResourcePermissionsRqst
            let globule = f.globule
            rqst.setPath(f.path)
            rqst.setResourcetype("file")
            rqst.setPermissions(permissions)
            generatePeerToken(globule, token => {
                globule.rbacService.setResourcePermissions(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: token })
                    .then(() => { console.log("save permission successfully!"); callback(); })
                    .catch(err => {
                        errorCallback(err)
                    })
            })
        }

        let setPermissions = (index) => {
            if (index == files.length) {
                callback(errors)
                return
            }

            let f = files[index]
            let permissions = new Permissions
            permissions.setPath(f.path)
            permissions.setResourceType("file")

            let rqst = new GetResourcePermissionsRqst
            rqst.setPath(f.path)

            generatePeerToken(f.globule, token => {
                f.globule.rbacService.getResourcePermissions(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: token }).then(
                    rsp => {
                        permissions = rsp.getPermissions()
                        console.log("permission find for file ", f.path, permissions)
                        // so here I will merge the value for permission_ (taken from the interface)
                        // and the existing permissions from the backend.
                        permissions_.allowed.forEach(p => {

                            // Get existing allowed permission accounts list.
                            let allowed = permissions.getAllowedList()

                            // The existing permission with the same name
                            let p_ = allowed.filter(p__ => p__.getName() == p.getName())[0]
                            if (p_) {
                                let accounts_lst = p.getAccountsList()
                                accounts_lst.forEach(a => {
                                    let accounts_lst_ = p_.getAccountsList()
                                    if (accounts_lst_.filter(a_ => a_ == a).length == 0) {
                                        accounts_lst_.push(a)
                                    }
                                    p_.setAccountsList(accounts_lst_)
                                })

                                let groups_lst = p.getGroupsList()
                                groups_lst.forEach(g => {
                                    let groups_lst_ = p_.getGroupsList()
                                    if (groups_lst_.filter(g_ => g_ == g).length == 0) {
                                        groups_lst_.push(g)
                                    }
                                    p_.setGroupsList(groups_lst_)
                                })
                            } else {
                                // no permission with that name exist so I will simply append the new one...
                                permissions.addAllowed(p)
                            }
                        })

                        // Now the denied permissions.
                        permissions_.denied.forEach(p => {

                            // Get existing allowed permission accounts list.
                            let denied = permissions.getDeniedList()

                            // The existing permission with the same name
                            let p_ = denied.filter(p__ => p__.getName() == p.getName())[0]
                            if (p_) {
                                let accounts_lst = p.getAccountsList()
                                accounts_lst.forEach(a => {
                                    let accounts_lst_ = p_.getAccountsList()
                                    if (accounts_lst_.filter(a_ => a_ == a).length == 0) {
                                        accounts_lst_.push(a)
                                    }
                                    p_.setAccountsList(accounts_lst_)
                                })

                                let groups_lst = p.getGroupsList()
                                groups_lst.forEach(g => {
                                    let groups_lst_ = p_.getGroupsList()
                                    if (groups_lst_.filter(g_ => g_ == g).length == 0) {
                                        groups_lst_.push(g)
                                    }
                                    p_.setGroupsList(groups_lst_)
                                })
                            } else {
                                // no permission with that name exist so I will simply append the new one...
                                permissions.addDenied(p)
                            }
                        })

                        // next file...
                        saveFilePermissions(f, permissions, () => {
                            setPermissions(++index)
                        }, err => { console.log("---------->", err); errors[f.path] = err; setPermissions(++index) })

                    }).catch(err => {

                        let msg = JSON.parse(err.message);
                        if (msg.ErrorMsg.startsWith("item not found")) {
                            permissions.setAllowedList(permissions_.allowed)
                            permissions.setDeniedList(permissions_.denied)
                            saveFilePermissions(f, permissions, () => {
                                setPermissions(++index)
                            }, err => { console.log("---------------> ", err); errors[f.path] = err; setPermissions(++index) })

                        }
                    })
            })
        }

        // start setting permissions.
        let index = 0;
        if (files.length > 0) {
            setPermissions(index)
        }

    }

    showVideoInfo(video) {
        let uuid = randomUUID()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="padding: 15px; background: var(--palette-background-default); border-top: 1px solid var(--palette-background-paper); border-left: 1px solid var(--palette-background-paper);">
            <globular-informations-manager id="video-info-box"></globular-informations-manager>
        </paper-card>
        `
        let videoInfoBox = document.getElementById("video-info-box")


        if (videoInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            videoInfoBox = document.getElementById("video-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"
            videoInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        videoInfoBox.setVideosInformation([video])
    }

    showTitleInfo(title) {
        let uuid = randomUUID()
        let html = `
        <paper-card id="video-info-box-dialog-${uuid}" style="padding: 15px; background: var(--palette-background-default); border-top: 1px solid var(--palette-background-paper); border-left: 1px solid var(--palette-background-paper);">
            <globular-informations-manager id="title-info-box"></globular-informations-manager>
        </paper-card>
        `
        let titleInfoBox = document.getElementById("title-info-box")
        if (titleInfoBox == undefined) {
            let range = document.createRange()
            document.body.appendChild(range.createContextualFragment(html))
            titleInfoBox = document.getElementById("title-info-box")
            let parent = document.getElementById("video-info-box-dialog-" + uuid)
            parent.style.position = "fixed"
            parent.style.top = "75px"
            parent.style.left = "50%"
            parent.style.transform = "translate(-50%)"

            titleInfoBox.onclose = () => {
                parent.parentNode.removeChild(parent)
            }
        }
        titleInfoBox.setTitlesInformation([title])
    }


    show() {
        document.body.appendChild(this.modal);
        document.body.appendChild(this);
    }

    close() {
        document.body.removeChild(this.modal)
        document.body.removeChild(this)
    }
}

customElements.define('globular-share-resource-wizard', ShareResourceWizard)


/**
 * Display suject (user's, group's, organization's, application's) in accordeon panel...
 */
export class GlobularSubjectsView extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The event listener...
        this.on_accounts_change = null
        this.on_groups_change = null
        this.on_account_click = null
        this.on_group_click = null
        this.on_application_click = null
        this.on_organization_click = null
    }

    // The connection callback.
    connectedCallback() {

        // set the account...
        this.account = Application.account

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #subjects-div{
                display: flex;
                flex-direction: column;
                margin-right: 25px;
            }

            .vertical-tabs {
                display: flex;
                flex-direction: column;
            }

            .vertical-tab {
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .vertical-tab span{
                position: relative;
                width: 100%;
            }

            .subject-div{
                padding-left: 10px;
                width: 100%;
                display: flex;
                flex-direction: column;
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid var(--palette-divider);
            }

            .infos {
                margin: 2px;
                padding: 4px;
                display: flex;
                border-radius: 4px;
                align-items: center;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }
            
            .infos img{
                max-height: 64px;
                max-width: 64px;
                border-radius: 32px;
            }

            .infos iron-icon{
                height: 32px;
                width: 32px;
            }

            .infos span{
                font-size: 1rem;
                margin-left: 10px;
            }

            .infos:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
                cursor: pointer;
            }

            .selector:hover {
                cursor: pointer;
            }

            .selector {
                text-decoration: underline;
                padding: 2px;
            } 

            .counter{
                font-size: 1rem;
            }

            .group-members .infos{
                flex-direction: column;
            }

            .group-members .infos:hover{
                -webkit-filter: invert(0%);
                filter: invert(0%);
                cursor: default;
            }

            .group-members .infos img{
                max-height: 32px;
                max-width: 32px;
                border-radius: 16px;
            }

            #organizations-tab {
                display: none;
            }

            #applications-tab{
                display: none;
            }
        </style>
        
        <div id="subjects-div">
            <div class="vertical-tabs">
                <div class="vertical-tab" id="accounts-tab">
                    <span class="selector" id="accounts-selector">
                        Account's <span class="counter" id="accounts-counter"></span>
                        <paper-ripple recenters=""></paper-ripple>
                    </span>
                
                    <iron-collapse  id="accounts-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                        <div class="subject-div" id="accounts-div">
                        </div>
                    </iron-collapse>
                </div>
                <div class="vertical-tab" id="groups-tab">
                    <span class="selector" id="groups-selector">
                        Group's <span class="counter" id="groups-counter">
                        <paper-ripple recenters=""></paper-ripple>
                    </span>
                
                    <iron-collapse id="groups-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                        <div class="subject-div" id="groups-div">
                        </div>
                    </iron-collapse>
                </div>
                <div class="vertical-tab" id="organizations-tab">
                    <span class="selector" id="organizations-selector">
                        Organization's <span class="counter" id="organizations-counter">
                        <paper-ripple  recenters=""></paper-ripple>
                    </span>
                
                    <iron-collapse id="organizations-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                        <div class="subject-div" id="organizations-div">
                        </div>
                    </iron-collapse>
                </div>
                <div class="vertical-tab" id="applications-tab">
                    <span class="selector" id="applications-selector">
                        Application's  <span class="counter" id="applications-counter">
                        <paper-ripple  recenters=""></paper-ripple>
                    </span>
                    <iron-collapse id="applications-collapse-panel" style="display: flex; flex-direction: column; width: 100%;">
                        <div class="subject-div" id="applications-div">
                        </div>
                    </iron-collapse>
                </div>
            </div>
        </div>
        `

        // Vertical tabs... (accordeon...)
        let accountsTab = this.shadowRoot.querySelector("#accounts-tab").querySelector("#accounts-selector")
        let accountsCount = this.shadowRoot.querySelector("#accounts-tab").querySelector("#accounts-counter")
        let accountsDiv = this.shadowRoot.querySelector("#accounts-div")

        let groupsTab = this.shadowRoot.querySelector("#groups-tab").querySelector("#groups-selector")
        let groupsCount = this.shadowRoot.querySelector("#groups-tab").querySelector("#groups-counter")
        let groupsDiv = this.shadowRoot.querySelector("#groups-div")

        let organizationsTab = this.shadowRoot.querySelector("#organizations-tab").querySelector("#organizations-selector")
        let organizationsCount = this.shadowRoot.querySelector("#organizations-tab").querySelector("#organizations-counter")
        let organizationsDiv = this.shadowRoot.querySelector("#organizations-div")

        let applicationsTab = this.shadowRoot.querySelector("#applications-tab").querySelector("#applications-selector")
        let applicationsCount = this.shadowRoot.querySelector("#applications-tab").querySelector("#applications-counter")
        let applicationsDiv = this.shadowRoot.querySelector("#applications-div")


        // Get collapse panel...
        let accounts_collapse_panel = this.shadowRoot.querySelector("#accounts-collapse-panel")
        let groups_collapse_panel = this.shadowRoot.querySelector("#groups-collapse-panel")
        let organizations_collapse_panel = this.shadowRoot.querySelector("#organizations-collapse-panel")
        let applications_collapse_panel = this.shadowRoot.querySelector("#applications-collapse-panel")

        accountsTab.onclick = () => {
            accounts_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        groupsTab.onclick = () => {
            groups_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
        }

        applicationsTab.onclick = () => {
            applications_collapse_panel.toggle();
            if (organizations_collapse_panel.opened) {
                organizations_collapse_panel.toggle()
            }
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        organizationsTab.onclick = () => {
            organizations_collapse_panel.toggle();
            if (accounts_collapse_panel.opened) {
                accounts_collapse_panel.toggle()
            }
            if (applications_collapse_panel.opened) {
                applications_collapse_panel.toggle()
            }
            if (groups_collapse_panel.opened) {
                groups_collapse_panel.toggle()
            }
        }

        // So here I will initialyse the list of accounts...
        Account.getAccounts("{}", accounts => {
            let range = document.createRange()
            let count = 0

            accounts.forEach(a => {

                if (a.id != "sa" && a.id != this.account.id) {
                    let uuid = "_" + getUuidByString(a.id + "@" + a.domain)
                    let html = `
                        <div id="${uuid}" class="infos">
                            <img src="${a.profilePicture}"> </img>
                            <span>${a.email}</span>
                        </div>
                        `
                    let fragment = range.createContextualFragment(html)
                    accountsDiv.appendChild(fragment)

                    let accountDiv = accountsDiv.querySelector(`#${uuid}`)
                    accountDiv.onclick = () => {
                        if (this.on_account_click) {
                            // return the account and the div.
                            if (this.on_account_click) {
                                if (accountsDiv.querySelector(`#${uuid}`)) {
                                    this.on_account_click(accountDiv, a)
                                    accountsCount.innerHTML = `(${accountsDiv.children.length})`
                                } else {
                                    // Here the div was remove from the list and so I will simply put it back...
                                    accountsDiv.appendChild(accountDiv)
                                    accountsCount.innerHTML = `(${accountsDiv.children.length})`
                                }

                                // fire the account change event...
                                if (this.on_accounts_change) {
                                    this.on_accounts_change()
                                }
                            }
                        }
                    }

                    count++
                }
            })

            accountsCount.innerHTML = `(${count})`

            accountsTab.click() // display list of account'(s)

            // Now the groups.
            Group.getGroups(groups => {
                let range = document.createRange()
                groupsCount.innerHTML = `(${groups.length})`
                // init groups...
                let getGroup = (index) => {
                    let g = groups[index]
                    if (g) {
                        let uuid = "_" + getUuidByString(g.id + "@" + g.domain)
                        let html = `
                        <div id="${uuid}" class="infos" style="flex-direction: column;">
                            <div style="display: flex; align-self: flex-start; align-items: center;">
                                <iron-icon id="Contacts_icon" icon="social:people" style="display: block;"></iron-icon>
                                <span>${g.name}</span>
                            </div>
                        `
                        g.getMembers(members => {
                            html += `<div class="group-members" style="display: flex; flex-wrap: wrap;">`
                            members.forEach(a => {
                                let uuid = "_" + getUuidByString(a.id + "@" + a.domain)
                                html += `
                                <div id="${uuid}" class="infos">
                                    <img src="${a.profilePicture}"> </img>
                                    <span>${a.name}</span>
                                </div>
                                `
                            })
                            html += "</div>"
                            index++
                            if (index < groups.length) {
                                getGroup(index)
                            } else {
                                html += "</div>"
                                groupsDiv.appendChild(range.createContextualFragment(html))
                                let groupDiv = groupsDiv.querySelector("#" + uuid)
                                groupDiv.onclick = (evt) => {
                                    evt.stopPropagation()
                                    if (this.on_group_click) {
                                        if (groupsDiv.querySelector(`#${uuid}`)) {
                                            this.on_group_click(groupDiv, g)
                                            groupsCount.innerHTML = `(${groupsDiv.children.length})`
                                        } else {
                                            // Here the div was remove from the list and so I will simply put it back...
                                            groupsDiv.appendChild(groupDiv)
                                            groupsCount.innerHTML = `(${groupsDiv.children.length})`
                                        }
                                    }
                                    // fire the account change event...
                                    if (this.on_groups_change) {
                                        this.on_groups_change()
                                    }
                                }
                            }
                        })


                    }
                }

                let index = 0;
                getGroup(index)
            }, err => ApplicationView.displayMessage(err, 3000))

        }, err => ApplicationView.displayMessage("fail to retreive accouts with error: ", err))
    }


}

customElements.define('globular-subjects-view', GlobularSubjectsView)


/**
 * Sample empty component
 */
export class GlobularSubjectsSelected extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                display: flex;
                flex-direction: column;
            }

            .infos {
                margin: 2px;
                padding: 4px;
                display: flex;
                flex-direction: column;
                border-radius: 4px;
                align-items: center;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .infos img{
                max-height: 64px;
                max-width: 64px;
                border-radius: 32px;
            }

            .infos span{
                font-size: 1rem;
                margin-left: 10px;
            }

            .infos:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
                cursor: pointer;
            }


            .group-members .infos{
                flex-direction: column;
            }

            .group-members .infos:hover{
                -webkit-filter: invert(0%);
                filter: invert(0%);
                cursor: default;
            }

            .group-members .infos img{
                max-height: 32px;
                max-width: 32px;
                border-radius: 16px;
            }


        </style>
        <div id="container">
            <div style="display: flex; flex-direction: column;">
                <span>Choose who to share with...</span>
                <div id="accounts-div" style="display: flex; flex-wrap: wrap; margin-top: 20px;"></div>
                <div id="groups-div" style="display: flex; flex-wrap: wrap; margin-top: 20px;"></div>
            </div>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

    }

    // Call search event.
    appendAccount(accountDiv) {
        this.shadowRoot.querySelector("#accounts-div").appendChild(accountDiv)
    }

    // Return the list of accounts.
    getAccounts() {
        let accounts = []
        for (var i = 0; i < this.shadowRoot.querySelector("#accounts-div").children.length; i++) {
            let accountDiv = this.shadowRoot.querySelector("#accounts-div").children[i]
            accounts.push(accountDiv.account)
        }

        return accounts;
    }

    // Return the list of groups
    getGroups() {
        let groups = []
        for (var i = 0; i < this.shadowRoot.querySelector("#groups-div").children.length; i++) {
            let groupDiv = this.shadowRoot.querySelector("#groups-div").children[i]
            groups.push(groupDiv.group)
        }

        return groups;
    }

    appendGroup(groupDiv) {
        this.shadowRoot.querySelector("#groups-div").appendChild(groupDiv)
    }
}

customElements.define('globular-subjects-selected', GlobularSubjectsSelected)


/**
 * Set shared subject permission...
 */
export class SharedSubjectsPermissions extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {

        super()

        this.accounts = []

        this.groups = []

        this.applications = []

        this.organizations = []


        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #permissions{
                display: table;
                width: 100%;
            }

            .subject-div{
                padding-left: 10px;
                width: 100%;
                display: flex;
                flex-direction: column;
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid var(--palette-divider);
            }

            #permissions-header {
                display: table-row;
                font-size: 1.0rem;
                font-weight: 400;
                color: var(--palette-text-secondary);
                border-bottom: 2 px solid;
                border-color: var(--palette-divider);
                width: 100%;
            }

            .infos {
                margin: 2px;
                padding: 4px;
                display: flex;
                border-radius: 4px;
                align-items: center;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }
            
            .infos img{
                max-height: 32px;
                max-width: 32px;
                border-radius: 16px;
            }

            .infos span{
                font-size: 1rem;
                margin-left: 10px;
            }

            #organizations-tab {
                display: none;
            }

        </style>
        <div id="container" style="display: flex; flex-direction: column;">
            <div class="title">Set subject's permissions... </div>
            <div id="permissions" style="margin-top: 20px;">
                <div id="permissions-header" style="display: table-row;">
                    <div style="display: table-cell;">
                        Subject
                    </div>
                    <div style="display: table-cell;">
                        Read
                    </div>
                    <div style="display: table-cell;">
                        Write
                    </div>
                    <div style="display: table-cell;">
                        Delete
                    </div>
                </div>
            </div>
        </div>
        `
        // give the focus to the input.


    }

    // Call search event.
    setAccounts(accounts) {
        this.accounts = accounts;

        this.refresh()
    }

    setGroups(groups) {
        this.groups = groups;

        this.refresh()
    }

    // Refresh the permission selector.
    refresh() {
        let permissions = this.shadowRoot.querySelector("#permissions")
        for (var i = 1; i < permissions.children.length; i++) {
            permissions.children[i].style.display = "none"
        }

        let range = document.createRange()

        let setSubjectRow = (s) => {
            let uuid = "_" + getUuidByString(s.id + "@" + s.domain)
            let html = `
            <style>
                iron-icon:hover{
                    cursor: pointer;
                }

                .cell {
                    display: table-cell; 
                    vertical-align: middle;
                    border-bottom: 1px solid var(--palette-divider);

                }
                .cell iron-icon {
                    fill: var(--palette-text-primary);
                }
            </style>
            <div class="subject-permissions-row" style="display: table-row;" id="${uuid}_row">
                <div class="cell">
                    <div id="${uuid}" class="infos">
                        <img> </img>
                        <iron-icon id="group-icon"></iron-icon>
                        <span>${s.name}</span>
                    </div>
                </div>
                <div class="cell">
                    <iron-icon class="permission-icon" name="read" icon="icons:check" id="${uuid}_read"></iron-icon>
                </div>
                <div class="cell">
                    <iron-icon class="permission-icon" name="write" icon="icons:remove" id="${uuid}_write"></iron-icon>
                </div>
                <div class="cell">
                    <iron-icon class="permission-icon" name="delete" icon="icons:remove"  id="${uuid}_delete"></iron-icon>
                </div>
            </div>
            `
            // set user permissions.
            if (!permissions.querySelector("#" + uuid)) {
                permissions.appendChild(range.createContextualFragment(html))

                // so here I will set the action...
                let icons = permissions.querySelectorAll(".permission-icon")
                for (var i = 0; i < icons.length; i++) {
                    let icon = icons[i]
                    icon.onclick = () => {
                        if (icon.getAttribute("icon") == "icons:check") {
                            icon.setAttribute("icon", "icons:block")
                        } else if (icon.getAttribute("icon") == "icons:remove") {
                            icon.setAttribute("icon", "icons:check")
                        } else if (icon.getAttribute("icon") == "icons:block") {
                            icon.setAttribute("icon", "icons:remove")
                        }
                    }
                }

            }

            // set display...
            let row = permissions.querySelector("#" + uuid + "_row")
            row.subject = s
            row.style.display = "table-row"
            if (s.profilePicture) {
                row.querySelector("img").src = s.profilePicture
                row.querySelector("#group-icon").style.display = "none"
            } else {
                row.querySelector("img").style.display = "none"
                row.querySelector("#group-icon").icon = "social:people"
            }

        }

        // create row for accounts...
        this.accounts.forEach(a => {
            setSubjectRow(a)
        })

        // create row for groups...
        this.groups.forEach(g => {
            setSubjectRow(g)
        })

    }

    // extract permission infos from the interface.
    getPermissions() {
        let permissions = { allowed: [], denied: [] }
        let permissionsDiv = this.shadowRoot.querySelector("#permissions")
        let rows = permissionsDiv.querySelectorAll(".subject-permissions-row")

        let allowed_read_permission = new Permission
        allowed_read_permission.setName("read")
        permissions.allowed.push(allowed_read_permission)

        let allowed_write_permission = new Permission
        allowed_write_permission.setName("write")
        permissions.allowed.push(allowed_write_permission)

        let allowed_delete_permission = new Permission
        allowed_delete_permission.setName("delete")
        permissions.allowed.push(allowed_delete_permission)

        let denied_read_permission = new Permission
        denied_read_permission.setName("read")
        permissions.denied.push(denied_read_permission)

        let denied_write_permission = new Permission
        denied_write_permission.setName("write")
        permissions.denied.push(denied_write_permission)

        let denied_delete_permission = new Permission
        denied_delete_permission.setName("delete")
        permissions.denied.push(denied_delete_permission)


        for (var i = 0; i < rows.length; i++) {
            let row = rows[i]
            let icons = row.querySelectorAll(".permission-icon")

            /** The read permission */
            if (icons[0].icon == "icons:check") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_read_permission.getAccountsList()
                    lst.push(accountId)
                    allowed_read_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_read_permission.getGroupsList()
                    lst.push(groupId)
                    allowed_read_permission.setGroupsList(lst)
                }
            } else if (icons[0].icon == "icons:block") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_read_permission.getAccountsList()
                    lst.push(accountId)
                    denied_read_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_read_permission.getGroupsList()
                    lst.push(groupId)
                    denied_read_permission.setGroupsList(lst)
                }
            }

            /** The write permission */
            if (icons[1].icon == "icons:check") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_write_permission.getAccountsList()
                    lst.push(accountId)
                    allowed_write_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_write_permission.getGroupsList()
                    lst.push(groupId)
                    allowed_write_permission.setGroupsList(lst)
                }
            } else if (icons[1].icon == "icons:block") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_write_permission.getAccountsList()
                    lst.push(accountId)
                    denied_write_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_write_permission.getGroupsList()
                    lst.push(groupId)
                    denied_write_permission.setGroupsList(lst)
                }
            }

            /** The delete permission */
            if (icons[2].icon == "icons:check") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_delete_permission.getAccountsList()
                    lst.push(accountId)
                    allowed_delete_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = allowed_delete_permission.getGroupsList()
                    lst.push(groupId)
                    allowed_delete_permission.setGroupsList(lst)
                }
            } else if (icons[2].icon == "icons:block") {
                if (row.subject instanceof Account) {
                    let accountId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_delete_permission.getAccountsList()
                    lst.push(accountId)
                    denied_delete_permission.setAccountsList(lst)
                } else if (row.subject instanceof Group) {
                    let groupId = row.subject.id + "@" + row.subject.domain
                    let lst = denied_delete_permission.getGroupsList()
                    lst.push(groupId)
                    denied_delete_permission.setGroupsList(lst)
                }
            }
        }

        return permissions;
    }

}

customElements.define('globular-shared-subjects-permissions', SharedSubjectsPermissions)