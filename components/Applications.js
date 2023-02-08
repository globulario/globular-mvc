// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icon/iron-icon.js';
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-icons/editor-icons'
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/iron-autogrow-textarea/iron-autogrow-textarea.js';
import '@polymer/paper-radio-button/paper-radio-button.js';
import '@polymer/paper-radio-group/paper-radio-group.js';

import { Menu } from './Menu';
import { Application } from '../Application';

import { getAllApplicationsInfo } from 'globular-web-client/api';
import { AddApplicationActionsRqst, AddApplicationActionsRsp, DeleteApplicationRqst, RemoveApplicationActionRqst } from 'globular-web-client/resource/resource_pb';
import { Model } from '../Model';
import { SearchableList } from './List';
import { GetAllActionsRequest } from 'globular-web-client/services_manager/services_manager_pb';
import { ApplicationView } from '../ApplicationView';
import { UninstallApplicationRequest } from 'globular-web-client/applications_manager/applications_manager_pb';

/**
 * Login/Register functionality.
 */
export class ApplicationsMenu extends Menu {
    // attributes.

    // Create the application view.
    constructor() {
        super("applications", "apps", "Applications")
        let html = `
            <style>
                       
                #applications_menu_div{
                    background-color: var(--palette-background-paper);
                }

                #applications-div {
                    display: none;
                    height: 100%;
                    flex-wrap: wrap;
                    padding: 10px;
                    width: 300px;

                }

            </style>
            <div id="applications-div">
                <globular-applications-panel id="application-panel-toolbar-menu"></globular-applications-panel>
            </div>
        `

        this.shadowRoot.appendChild(this.getMenuDiv())

        let range = document.createRange()
        this.getMenuDiv().innerHTML = "" // remove existing elements.
        this.getMenuDiv().appendChild(range.createContextualFragment(html));
        this.getMenuDiv().style.height = "380px";
        this.getMenuDiv().style.overflowY = "auto";
    }

    init() {

        this.shadowRoot.appendChild(this.getMenuDiv())

        // Action's
        this.getMenuDiv().querySelector("#application-panel-toolbar-menu").init(() => {
            this.shadowRoot.querySelector(`#applications-div`).style.display = "flex"
            this.shadowRoot.removeChild(this.getMenuDiv())
        });



    }
}

customElements.define('globular-applications-menu', ApplicationsMenu)

/**
 * Login/Register functionality.
 */
export class ApplicationsPanel extends HTMLElement {
    // attributes.

    // Create the application view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.size = "normal"
        this.iconSize = 56;
        if (this.hasAttribute("size")) {
            this.size = this.getAttribute("size")
        }

        if (this.size == "large") {
            this.iconSize = 64
        }

        this.shadowRoot.innerHTML = `
        <style>
       
            .container {
                display: inline-flex;
                flex-flow: wrap;
            }

            .application-div {
                display: flex;
                position: relative;
                flex-direction: column;
                align-items: center;
                width:  ${this.iconSize * 1.25}px;
                margin: 5px;
                padding: 25px;
                border-radius: 5px;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .application-div img{
                filter: invert(0%);
            }
            
            .application-div:hover{
                cursor: pointer;
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .application-div img{
                height: ${this.iconSize}px;
                width:  ${this.iconSize}px;
            }

            .application-div span{
                margin-top: 5px;
                color: #404040;
                display: inline-block;
                font-family: 'Google Sans',Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
                font-size: 1rem;
                letter-spacing: .09px;
                line-height: 16px;
                width: 125px;
                text-align: center;
                color: var(--palette-text-primary);
            }

            .application-div.normal span{
                font-size: .85rem;
                width: 100%;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .application-div.normal{
                padding: 10px;
            }

        </style>
        <div class="container"></div>
        `

    }


    // The connection callback.
    connectedCallback() {

    }

    init(callback) {

        Application.getAllApplicationInfo((infos) => {
            let range = document.createRange()
            for (var i = 0; i < infos.length; i++) {
                let application = infos[i]
                let html = `
                <div id="${application.getId()}_div" class="application-div">
                    <paper-ripple recenters></paper-ripple>
                    <img id="${application.getId()}_img"></img>
                    <span id="${application.getId()}_span"></span>
                    <a id="${application.getId()}_lnk" style="display: none;"></a>
                </div>
                <paper-tooltip for="${application.getId()}_div" style="font-size: .85rem;" role="tooltip" tabindex="-1">${application.getDescription()}</paper-tooltip>
                `
                let container = this.shadowRoot.querySelector(".container")
                container.appendChild(range.createContextualFragment(html))
                let div_ = container.querySelector(`#${application.getId()}_div`)

                if (div_ != null) {
                    if (this.size == "normal") {
                        div_.classList.add("normal")
                    }

                    let img = this.shadowRoot.getElementById(application.getId() + "_img")
                    let lnk = this.shadowRoot.getElementById(application.getId() + "_lnk")
                    var currentLocation = window.location;
                    lnk.href = currentLocation.origin + application.getPath();

                    let title = this.shadowRoot.getElementById(application.getId() + "_span")
                    img.src = application.getIcon();
                    title.innerHTML = application.getId();
                    title.title = application.getId();

                    if (application.getAlias().length > 0) {
                        title.innerHTML = application.getAlias()
                    }

                    div_.onclick = () => {
                        lnk.click()
                    }

                    // Keep the image up to date.
                    Application.eventHub.subscribe(`update_application_${application.getId()}_settings_evt`,
                        (uuid) => {

                        },
                        (__applicationInfoStr__) => {
                            // Set the icon...
                            let application = JSON.parse(__applicationInfoStr__)
                            img.src = application.icon;
                        }, false)
                } else {
                    console.log("no found ", div_)
                }
            }

            if (callback != undefined) {
                callback()
            }
        }, (err) => {
            console.log(err)
            if (callback != undefined) {
                callback()
            }
        })
    }
}

customElements.define('globular-applications-panel', ApplicationsPanel)


/**
 * Globular application manager.
 */
export class ApplicationManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
             <style>
                
                 #container{
                    display: flex;
                    flex-direction: column;
                    position: relative;
                 }

                 
                 .card-content {
                    min-width: 680px;
                    padding: 0px;
                    font-size: 1rem;
                 }

                 @media (max-width: 800px) {
                    .card-content{
                      min-width: 580px;
                    }
                  }
          
                  @media (max-width: 600px) {
                    .card-content{
                      min-width: 380px;
                    }
                  }

                 paper-card {
                    background-color: var(--palette-background-paper);
                    color: var(--palette-text-primary);
                 }
          
             </style>
             <div id="container">
                <paper-card>
                    <div class="card-content" style="padding: 0px;">
                    </div>
                </paper-card>
             </div>
             `

        // give the focus to the input.
        let content = this.shadowRoot.querySelector(".card-content")

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        let displayApplications = () => {
            content.innerHTML = ""

            // Here I will get the list of all roles.
            getAllApplicationsInfo(Model.globular,
                (applications) => {
                    applications.forEach(a => {
                        let panel = new ApplicationPanel(a)
                        content.appendChild(panel)
                    })
                }, err => { ApplicationView.displayMessage(err, 3000) })
        }

        // call once
        displayApplications()

        Model.globular.eventHub.subscribe("refresh_application_evt", uuid => { }, evt => {
            displayApplications()
        }, true)


    }

    // The connection callback.
    connectedCallback() {

    }
}

customElements.define('globular-application-manager', ApplicationManager)



export class ApplicationPanel extends HTMLElement {
    // attributes.
    // Create the applicaiton view.
    constructor(application) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep group informations.
        this.application = application;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                flex-direction: column;
                align-items: center;
                border-bottom: 1px solid var(--palette-background-default);
                background-color: var(--palette-background-paper);
            }

            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            #content{
                padding: 15px;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .header{
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .header:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .title{
                flex-grow: 1;
                margin-left: 16px;
            }
        
            img, iron-icon{
                margin: 8px;
            }
  
            #collapse-panel{
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            .row{
                display: flex;
                color: var(--cr-primary-text-color);
                font-family: Roboto, Arial, sans-serif;
                align-items: center;
                padding: 15px 16px 16px;
                flex-direction: row;
            }

            .row span{
                flex-basis: 156px;
                line-height: 1rem;
                font-size: .6875rem;
                font-weight: 500;
                flex-basis: 156px;
                letter-spacing: .07272727em;
                text-transform: uppercase;
                hyphens: auto;
                word-break: break-word;
                word-wrap: break-word;
            }

            .row img {
                max-width: 64px;
                max-height: 64px;
            }

            .row div{
                flex-grow: 1;
                letter-spacing: .00625em;
                font-size: 1rem;
                font-weight: 400;
                line-height: 1.5rem;
                hyphens: auto;
                word-break: break-word;
                word-wrap: break-word;
            }

            #delete-application-btn{
                margin-bottom: 10px;
                width: 100px;
                align-self: flex-end;
                font-size: .85rem;
                height: fit-content;
                border: none;
                color: var(--palette-text-accent);
                background: var(--palette-warning-dark);
                max-height: 32px;
            }


            #uninstall-application-btn{
                font-size: .85rem;
                max-height: 32px;
            }

            #application-action {
                padding: 5px;
            }

        </style>
        <div id="container">
            <div class="header">
                <img style="width: 32px; height: 32px;" src="${this.application.getIcon()}"></img>
                <span class="title">${this.application.getName() + "@" + this.application.getDomain()}</span>
                <paper-button id="uninstall-application-btn"  >Uninstall</paper-button>
                <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                    <iron-icon  id="hide-btn"  icon="unfold-less" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);" icon="add"></iron-icon>
                    <paper-ripple class="circle" recenters=""></paper-ripple>
                </div>
            </div>
            <iron-collapse id="collapse-panel">
                <div class="row">
                    <span>Icon</span>
                    <img src="${this.application.getIcon()}"></img>
                </div>
                <div class="row">
                    <span>Id</span>
                    <div>${this.application.getId()}</div>
                </div>
                <div class="row">
                    <span>Publisher</span>
                    <div>${this.application.getPublisherid()}</div>
                </div>
                <div class="row">
                    <span>Alias</span>
                    <paper-input value="${this.application.getAlias()}"></paper-input>
                </div>
                <div class="row">
                    <span>Description</span>
                    <paper-textarea value="${this.application.getDescription()}"></paper-input>
                </div>
                <div id="application-action">
                </div>
                <paper-button class="" id="delete-application-btn" raised="" role="button" tabindex="0" animated="" elevation="1" aria-disabled="false">Delete</paper-button>
            </iron-collapse>
        </div>
        `
        
        let content = this.shadowRoot.querySelector("#collapse-panel")
        this.hideBtn = this.shadowRoot.querySelector("#hide-btn")

        let deleteBtn = this.shadowRoot.querySelector("#delete-application-btn")
        deleteBtn.onclick = () => {
            this.onDeleteApplication(application)
        }

        // Get the uninstall button...
        let uninstallBtn = this.shadowRoot.querySelector("#uninstall-application-btn")
        uninstallBtn.onclick = () => {
            this.onUninstallApplication(this.application)
        }

        // Here I will create the searchable actions list.
        let actionsList = new SearchableList("Actions", this.application.getActionsList(),
            (action) => {
                // remove action...
                let rqst = new RemoveApplicationActionRqst
                rqst.setAction(action)
                rqst.setApplicationid(application.getId() + "@" + application.getDomain())
                Model.globular.resourceService.removeApplicationAction(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        actionsList.removeItem(action)
                        ApplicationView.displayMessage("Action " + action + " was removed from application " + application.getId() + "@" + application.getDomain(), 3000)
                    }).catch(err => {
                        console.log(err)
                        ApplicationView.displayMessage(err, 3000)
                    })

            },
            (action) => {
                ApplicationView.displayMessage("Action " + action + " was added to application " + application.getId() + "@" + application.getDomain(), 3000)
            },
            (actions) => {

                // Now I will get the list of all actions install on the server.
                let getAllActionsRqst = new GetAllActionsRequest
                Model.globular.servicesManagerService.getAllActions(getAllActionsRqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        let actions_ = rsp.getActionsList()
                        actions.forEach(a => {
                            actions_.splice(actions_.indexOf(a), 1);
                        });

                        // sort the array.
                        actions_.sort()

                        let html = `
                        <style>
                           
                            #add-application-action-panel{
                                position: absolute;
                                right: 0px;
                                z-index: 1;
                            }
                            .card-content{
                                overflow-y: auto;
                                max-height: 260px;
                                
                                overflow-y: auto;
                            }
        
                        </style>
                        <paper-card id="add-application-action-panel">
                            <div style="display: flex; align-items: center;">
                                <div style="flex-grow: 1; padding: 5px;">
                                    Add Action
                                </div>
                                <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                            </div>
                            <div class="card-content">
                                <div></div>
                            </div>
                        </paper-card>
                        `

                        let headerDiv = actionsList.getHeader()
                        let panel = headerDiv.querySelector("#add-application-action-panel")

                        if (panel == undefined) {
                            headerDiv.appendChild(document.createRange().createContextualFragment(html))
                            panel = headerDiv.querySelector("#add-application-action-panel")
                            panel.style.top = (headerDiv.offsetHeight / 2) + 14 + "px";
                            let closeBtn = panel.querySelector("#cancel-btn")
                            closeBtn.onclick = () => {
                                panel.parentNode.removeChild(panel)
                            }

                            actions_.forEach(a => {

                                let html = `
                                <div class="item-div" style="">
                                    <span style="flex-grow: 1;">${a}</span>
                                    <paper-icon-button id="add-action-btn" icon="add" role="button" tabindex="0" aria-disabled="false"></paper-icon-button>
                                </div>
                                `
                                let content = panel.querySelector(".card-content")
                                content.appendChild(document.createRange().createContextualFragment(html))
                                let actionDiv = content.children[content.children.length - 1]
                                let actionAddBtn = actionDiv.children[1]
                                actionAddBtn.onclick = () => {

                                    let rqst = new AddApplicationActionsRqst
                                    rqst.setApplicationid(application.getId() + "@" + application.getDomain())
                                    rqst.setActionsList([a])
                                    Model.globular.resourceService.addApplicationActions(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") })
                                        .then(rsp => {

                                            actionDiv.parentNode.removeChild(actionDiv)
                                            actionsList.appendItem(a)

                                            // call the onadditem.
                                            actionsList.onadditem(a)
                                        }).catch(err => {
                                            ApplicationView.displayMessage(err, 3000)
                                        })

                                }

                            })
                        }


                    }).catch(err => {
                        console.log(err)
                        ApplicationView.displayMessage(err, 3000)
                    })
            })

        actionsList.style.padding = "15px 16px 16px"
        content.querySelector("#application-action").appendChild(actionsList)

        // give the focus to the input.
        this.hideBtn.onclick = () => {
            let button = this.shadowRoot.querySelector("#hide-btn")
            if (button && content) {
                if (!content.opened) {
                    button.icon = "unfold-more"
                } else {
                    button.icon = "unfold-less"
                }
                content.toggle();
            }
        }


    }

    onDeleteApplication(application) {
        let toast = ApplicationView.displayMessage(
            `
          <style>
           
            #yes-no-contact-delete-box{
              display: flex;
              flex-direction: column;
            }
    
            #yes-no-contact-delete-box globular-contact-card{
              padding-bottom: 10px;
            }
    
            #yes-no-contact-delete-box div{
              display: flex;
              padding-bottom: 10px;
            }
    
            paper-button{
              font-size: .85rem;
              height: 32px;
            }
    
          </style>
          <div id="yes-no-contact-delete-box">
            <div>Your about to delete application named ${application.getName() + "@" + application.getDomain()}</div>
            <div>Is it what you want to do? </div>
            <div style="justify-content: flex-end;">
              <paper-button id="yes-delete-contact">Yes</paper-button>
              <paper-button id="no-delete-contact">No</paper-button>
            </div>
          </div>
          `,
            15000 // 15 sec...
        );

        let yesBtn = document.querySelector("#yes-delete-contact")
        let noBtn = document.querySelector("#no-delete-contact")

        // On yes
        yesBtn.onclick = () => {

            let rqst = new DeleteApplicationRqst
            rqst.setApplicationid(application.getId() + "@" + application.getDomain())
            Model.globular.resourceService.deleteApplication(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: localStorage.getItem("user_token") }).then((rsp) => {
                ApplicationView.displayMessage(
                    "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Application named " +
                    application.getName() +
                    " was deleted!</div>",
                    3000
                );
                Model.globular.eventHub.publish("refresh_application_evt", {}, true)
                toast.dismiss();
            }).catch(e => {
                ApplicationView.displayMessage(e, 3000)
                toast.dismiss();
            })

        }

        noBtn.onclick = () => {
            toast.dismiss();
        }
    }

    onUninstallApplication(application) {
        let toast = ApplicationView.displayMessage(
            `
          <style>
          
            #yes-no-contact-delete-box{
              display: flex;
              flex-direction: column;
            }
    
            #yes-no-contact-delete-box globular-contact-card{
              padding-bottom: 10px;
            }
    
            #yes-no-contact-delete-box div{
              display: flex;
              padding-bottom: 10px;
            }
    
            paper-button{
              font-size: .85rem;
              height: 32px;
            }
    
          </style>
          <div id="yes-no-contact-delete-box">
            <div>Your about to uninstall application named ${application.getName() + "@" + application.getDomain()}</div>
            <div>Is it what you want to do? </div>
            <div style="justify-content: flex-end;">
              <paper-button id="yes-uninstall-btn">Yes</paper-button>
              <paper-button id="no-uninstall-btn">No</paper-button>
            </div>
          </div>
          `,
            15000 // 15 sec...
        );

        let yesBtn = document.querySelector("#yes-uninstall-btn")
        let noBtn = document.querySelector("#no-uninstall-btn")

        // On yes
        yesBtn.onclick = () => {

            let rqst = new UninstallApplicationRequest
            rqst.setApplicationid(application.getId() + "@" + application.getDomain())
            Model.globular.applicationsManagerService.uninstallApplication(rqst, { domain: Model.domain, address: Model.address, application: Model.application, token: localStorage.getItem("user_token") }).then((rsp) => {
                ApplicationView.displayMessage(
                    "<iron-icon icon='communication:message' style='margin-right: 10px;'></iron-icon><div>Application named " +
                    application.getName() +
                    " was uninstall!</div>",
                    3000
                );
                Model.globular.eventHub.publish("refresh_application_evt", {}, true)
                toast.dismiss();
            }).catch(e => {
                ApplicationView.displayMessage(e, 3000)
                toast.dismiss();
            })

        }

        noBtn.onclick = () => {
            toast.dismiss();
        }
    }
}

customElements.define('globular-application-panel', ApplicationPanel)