import { getTheme } from "./Theme.js";
import { deleteFile, readDir, uploadFiles } from "globular-web-client/api";
import { Model } from '../Model'
import { File } from '../File'
import { ApplicationView } from "../ApplicationView";
import * as getUuidByString from "uuid-by-string";
import "@polymer/iron-icons/av-icons";
import { Application } from "../Application";
import { Account } from "../Account";
import { Contact, SetAccountContactRqst } from "globular-web-client/resource/resource_pb.js";

/**
 * Sample empty component
 */
export class Ringtones extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.account = null;


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}

            #container{
                display: flex;
                flex-direction: column;
            }

            #ringtones{
                display: flex;
                flex-direction: column;
                max-height: 150px;
                overflow-y: auto;
                border-top: 1px solid var(--palette-action-disabled);
            }

            #ringtone-div{
                display: flex;
                flex-direction: row;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                --iron-icon-fill-color: var(--palette-text-primary);
                align-items: center;
                font-size: .95rem;
                min-width: 300px;
            }

        </style>

        <div  id="container">
            <div id="ringtone-div">
                
                <div id="ringtone"></div>
                <paper-icon-button id="ringtones-button" icon="arrow-drop-down"></paper-icon-button>
                <span style="flex-grow: 1;"></span>
                <paper-icon-button id="upload-button" icon="icons:file-upload"></paper-icon-button>

            </div>
            <div id="ringtones" style="display: none;">
                <slot></slot>
            </div>
        </div>
        `

        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        let ringtonesDiv = this.shadowRoot.querySelector("#ringtones")

        this.shadowRoot.querySelector("#ringtones-button").onclick = () => {
            if (ringtonesDiv.style.display == "none") {
                ringtonesDiv.style.display = "flex"
                this.shadowRoot.querySelector("#upload-button").style.display = "flex"
            } else {
                ringtonesDiv.style.display = "none"
                this.shadowRoot.querySelector("#upload-button").style.display = "none"
            }
        }

        // upload a new ringtone
        this.shadowRoot.querySelector("#upload-button").onclick = () => {
            console.log("upload ring tone!")
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = ".mp3"
            input.click();

            input.onchange = (evt) => {
                const files = evt.target.files
                if (files && files[0]) {

                    let globule = Application.getGlobule(Application.account.session.domain)

                    // set the path...
                    let path = "/" + Model.application + "/" + this.getAttribute("dir")

                    uploadFiles(globule, localStorage.getItem("user_token"), path, files, ()=>{
                        let f = files[0]
                        f.path = path + "/" + f.name
                        let ringtone = new Ringtone(f, this)
                        this.insertBefore(ringtone, this.children[0])
                    })
                }
            }
        }
    }

    // The connection callback.
    connectedCallback() {

        if (this.children.length > 0) {
            return;
        }

        // Now I will save the contact ringtone...
        Account.getAccount(this.getAttribute("account"), contact => {
            this.account = contact;

            Account.getContacts(Application.account, `{"_id":"${contact.id + "@" + contact.domain}"}`, contacts => {
                if (contacts[0].ringtone) {
                    this.account.ringtone = contacts[0].ringtone
                }


                // Now I will set the file...
                let path = Model.globular.config.WebRoot + "/webroot/" + Model.application + "/" + this.getAttribute("dir")
                readDir(Model.globular, path, false, (data) => {
                    let dir = File.fromObject(data)
                    dir.files.forEach(f => {
                        let ringtone = new Ringtone(f, this)
                        this.appendChild(ringtone)
                    });

                    // set the firt ringtone by default...
                    if (this.children.length > 0 && !this.account.ringtone) {
                        this.setRingtone(this.children[0])
                    } else {
                        let id = "_" + getUuidByString(this.account.ringtone)
                        let ringtone = this.querySelector("#" + id)
                        this.setRingtone(ringtone)
                    }

                }, err => ApplicationView.displayMessage(err, 3000))
            }, err => ApplicationView.displayMessage(err, 3000))

        }, err => ApplicationView.displayMessage(err, 3000))

    }

    deleteRingtone(ringtone) {


            let toast = ApplicationView.displayMessage(
                `
              <style>
               ${getTheme()}
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
                <div>Your about to delete ringtone named ${ringtone.file.name}</div>
                <div>Is it what you want to do? </div>
                <div style="justify-content: flex-end;">
                  <paper-button id="yes-delete-btn">Yes</paper-button>
                  <paper-button id="no-delete-btn">No</paper-button>
                </div>
              </div>
              `,
                15000 // 15 sec...
            );
    
            let yesBtn = document.querySelector("#yes-delete-btn")
            let noBtn = document.querySelector("#no-delete-btn")
    
            // On yes
            yesBtn.onclick = () => {

                let globule = Application.getGlobule(Application.account.session.domain)
                deleteFile(globule, ringtone.file.path,
                    () => {
                        this.removeChild(ringtone)
                        toast.dismiss();
                        ApplicationView.displayMessage("the ringtone " + ringtone.file.name, " was deleted", 3000)
                    },
                    err => { ApplicationView.displayMessage(err, 3000) })

            }

            noBtn.onclick = () => {
                toast.dismiss();
            }
    }

    setRingtone(ringtone) {

        // set back the actual ringtone in the list
        ringtone.hideSetButton()
        ringtone.hideDeleteButton()

        if (this.shadowRoot.querySelector("#ringtone").children.length > 0) {
            let ringtone_ = this.shadowRoot.querySelector("#ringtone").children[0]
            ringtone_.showSetButton()
            ringtone_.showDeleteButton()
            this.appendChild(ringtone_)
        }

        // set the new ringtone.
        this.shadowRoot.querySelector("#ringtone").appendChild(ringtone)

        let ringtonesDiv = this.shadowRoot.querySelector("#ringtones")
        ringtonesDiv.style.display = "none"
        this.shadowRoot.querySelector("#upload-button").style.display = "none"


        // set the file path.
        this.account.ringtone = ringtone.file.path

        // Here I will return the value with it
        let rqst = new SetAccountContactRqst
        rqst.setAccountid(Application.account.id + "@" + Application.account.domain)

        let contact = new Contact
        contact.setId(this.account.id + "@" + this.account.domain)
        contact.setStatus("accepted")
        contact.setRingtone(this.account.ringtone)
        if (this.account.profilPicture)
            contact.setProfilepicture(this.account.profilPicture)

        contact.setInvitationtime(Math.round(Date.now() / 1000))
        rqst.setContact(contact)
        let token = localStorage.getItem("user_token")

        // call persist data
        Model.getGlobule(Application.account.domain).resourceService
            .setAccountContact(rqst, {
                token: token,
                application: Model.application,
                domain: Model.domain
            })
            .then((rsp) => {
                // Here I will return the value with it
                console.log("contact was save!")
            })
            .catch(err => ApplicationView(err, 3000));
    }

}

customElements.define('globular-ringtones', Ringtones)

/**
 * Sample empty component
 */
export class Ringtone extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(file, parent) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.id = "_" + getUuidByString(file.path)

        this.parent = parent;

        this.file = file;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                display: flex;
                align-items: center;

            }
        </style>
        <div id="container">

            <paper-icon-button id="play-button" icon="av:play-arrow"></paper-icon-button>
            <paper-icon-button id="stop-button" icon="av:stop" style="display: none;"></paper-icon-button>

            <span style="flex-grow: 1;">${file.name}</span>

            <paper-button id="delete-button" style="font-size: .75em;">delete</paper-button>
            <paper-button id="set-button" style="font-size: .75em;">set</paper-button>

        </div>
        `

        // give the focus to the input.
        this.playBtn = this.shadowRoot.querySelector("#play-button")
        this.stopBtn = this.shadowRoot.querySelector("#stop-button")
        this.setButton = this.shadowRoot.querySelector("#set-button")
        this.deleteButton = this.shadowRoot.querySelector("#delete-button")

        let globule = Application.getGlobule(Application.account.session.domain)
        let url = globule.config.Protocol + "://" + globule.config.Domain
        if (window.location != globule.config.Domain) {
            if (globule.config.AlternateDomains.indexOf(window.location.host) != -1) {
                url = globule.config.Protocol + "://" + window.location.host
            }
        }

        if (globule.config.Protocol == "https") {
            if (globule.config.PortHttps != 443)
                url += ":" + globule.config.PortHttps
        } else {
            if (globule.config.PortHttps != 80)
                url += ":" + globule.config.PortHttp
        }

        let path = file.path
        path = path.replace(globule.config.WebRoot, "")

        path.split("/").forEach(item => {
            item = item.trim()
            if (item.length > 0) {
                url += "/" + encodeURIComponent(item)
            }
        })

        url += "?application=" + Model.application
        if (localStorage.getItem("user_token") != undefined) {
            url += "&token=" + localStorage.getItem("user_token")
        }

        this.audio = null;
        this.url = url;

        this.playBtn.onclick = () => {
            this.play()
        }

        this.stopBtn.onclick = () => {
            this.stop()
        }

        this.setButton.onclick = () => {
            let ringtones = this.parent.getElementsByTagName("globular-ringtone")
            for (var i = 0; i < ringtones.length; i++) {
                ringtones[i].stop()
            }
            this.parent.setRingtone(this)
        }

        this.deleteButton.onclick = () => {
            let ringtones = this.parent.getElementsByTagName("globular-ringtone")
            for (var i = 0; i < ringtones.length; i++) {
                ringtones[i].stop()
            }

            this.parent.deleteRingtone(this)
        }

    }

    // The connection callback.
    connectedCallback() {

    }

    hideSetButton() {
        this.setButton.style.display = "none"
    }

    showSetButton() {
        this.setButton.style.display = ""
    }

    hideDeleteButton() {
        this.deleteButton.style.display = "none"
    }

    showDeleteButton() {
        this.deleteButton.style.display = ""
    }

    // Call search event.
    play() {

        // stop currently selected ringtone...
        let ringtones = this.parent.getElementsByTagName("globular-ringtone")
        for (var i = 0; i < ringtones.length; i++) {
            ringtones[i].stop()
        }

        this.playBtn.style.display = "none"
        this.stopBtn.style.display = ""
        if (this.audio == null) {
            this.audio = new Audio(this.url)
        }

        this.audio.play()
    }

    stop() {
        this.playBtn.style.display = ""
        this.stopBtn.style.display = "none"
        if (this.audio != null) {
            this.audio.pause()
        }

    }
}

customElements.define('globular-ringtone', Ringtone)
