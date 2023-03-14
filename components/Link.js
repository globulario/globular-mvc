import { GetFileAudiosRequest, GetFileTitlesRequest, GetFileVideosRequest } from "globular-web-client/title/title_pb";
import * as getUuidByString from "uuid-by-string";
import { Application } from "../Application";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";
import { generateUUID, randomUUID } from "./utility";



// Now I will test if imdb info are allready asscociated.
function getTitleInfo(globule, path, callback) {
    let rqst = new GetFileTitlesRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/titles")

    rqst.setFilepath(path)

    globule.titleService.getFileTitles(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            callback(rsp.getTitles().getTitlesList())
        })
        .catch(err => {
            // so here no title was found...

            callback([])
        })
}

function getVideoInfo(globule, path, callback) {

    let rqst = new GetFileVideosRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/videos")
    rqst.setFilepath(path)

    globule.titleService.getFileVideos(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let videos = rsp.getVideos().getVideosList()
            callback(videos)
        })
        .catch(err => {
            callback([])
        })
}

function getAudioInfo(globule, path, callback) {

    let rqst = new GetFileAudiosRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/audios")
    rqst.setFilepath(path)

    globule.titleService.getFileAudios(rqst, { application: Application.application, domain: globule.domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            let audios = rsp.getAudios().getAudiosList()
            callback(audios)
        })
        .catch(err => {
            callback([])
        })
}

/**
 * Sample empty component
 */
export class Link extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        let path = this.getAttribute("path")
        let thumbnail = this.getAttribute("thumbnail")
        let domain = this.getAttribute("domain")
        let alias = this.getAttribute("alias")
        if(!alias){
            alias = ""
        }
        
        let name = path.split("/")[path.split("/").length - 1]
        this.ondelete = null;
        let id = "_" + randomUUID()

        // Connect observer, so the attribute can be dynamic...
        var observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "attributes") {
                    if (!mutation.target.hasAttribute("deleteable")) {
                        mutation.target.resetDeleteable()
                    } else {
                        mutation.target.setDeleteable()
                    }
                }
            });
        });

        observer.observe(this, {
            attributes: true //configure it to listen to attribute changes
        });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            #container{
               
                
            }
            
            .shortcut-icon {
                position: absolute;
                bottom: -5px;
                left: 0px;
            }

            .shortcut-icon iron-icon{
                background: white;
                fill: black;
                height: 16px;
                width: 16px;
            }

            #content{
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            #content:hover{
                cursor: pointer;
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            img {
                height: 48px; 
                width: fit-content; 
                max-width: 96px;
            }


            span{
                font-size: .85rem; 
                padding: 2px; 
                display: block; 
                word-break: break-all;
                max-width: 96px;
            }

            #delete-lnk-btn {
                height: 16px;
                width: 16px;
                flex-grow: 1; 
                --iron-icon-fill-color:var(--palette-text-primary);
            }

            .btn-div{
                position: relative;
                display: flex; 
                width: 24px; 
                height: 24px; 
                justify-content: center; 
                align-items: center;
                position: relative;
                margin-bottom: 4px;
            }

            .btn-div:hover {
                cursor: pointer;
            }

        </style>

        <div id="${id}-link-div" style="display: flex; flex-direction: column; align-items: center; width: fit-content; margin: 5px; height: fit-content;">
            <div style="display: flex; align-items: flex-end; width: 100%;">
                <div class="btn-div" style="visibility: hidden;">
                    <iron-icon  id="delete-lnk-btn"  icon="close"></iron-icon>
                    <paper-ripple class="circle"></paper-ripple>
                </div>
            </div>
            <div id="content" style="display: flex; flex-direction: column; border: 1px solid var(--palette-divider); padding: 5px; border-radius: 2.5px;">
                <div style="position: relative;">
                    <img style="" src="${thumbnail}">
                    <div class="shortcut-icon">
                        <iron-icon icon="icons:reply"></iron-icon>
                    </div> 
                    <paper-ripple></paper-ripple>
                </div>
            </div>
            <span id="link-name">${alias.length>0?alias:name}</span>
           
        </div>
        `

        let lnk = this.shadowRoot.querySelector(`#content`)
        lnk.onclick = () => {
            Model.eventHub.publish("follow_link_event_", { path: path, domain: domain }, true)
        }

        this.shadowRoot.querySelector(".btn-div").onclick = (evt) => {
            evt.stopPropagation()

            if (document.getElementById(`${id}-yes-no-link-delete-box`)) {
                return
            }

            // Here I will ask the user for confirmation before actually delete the contact informations.
            let toast = ApplicationView.displayMessage(
                `
            <style>
             
              #yes-no-link-delete-box{
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              #yes-no-link-delete-box globular-link-card{
                padding-bottom: 10px;
              }

              #yes-no-link-delete-box div{
                display: flex;
                padding-bottom: 10px;
              }

            </style>
            <div id="${id}-yes-no-link-delete-box">
              <div>Your about to delete link</div>
              <div style="display: flex; align-items; center; justify-content: center;">
                ${this.outerHTML}
              </div>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-delete-link">Yes</paper-button>
                <paper-button raised id="no-delete-link">No</paper-button>
              </div>
            </div>
            `,
                60000 // 1 min...
            );

            let yesNoDiv = document.getElementById(`${id}-yes-no-link-delete-box`)
            let yesBtn = yesNoDiv.querySelector("#yes-delete-link")
            let noBtn = yesNoDiv.querySelector("#no-delete-link")
            yesNoDiv.querySelector("globular-link").removeAttribute("deleteable")

            // On yes
            yesBtn.onclick = () => {
                toast.dismiss();

                if (this.ondelete) {
                    this.ondelete()
                }

                this.parentNode.removeChild(this)
            }

            noBtn.onclick = () => {
                toast.dismiss();
            }

            toast.id = id
        }

        let globule = Model.getGlobule(domain)
        getVideoInfo(globule, path,
            videos => {
                if (videos.length > 0) {
                    this.shadowRoot.querySelector("#link-name").innerHTML = videos[0].getDescription()
                }
            },
            err => {
                getTitleInfo(globule, path,
                    titles => {
                        if (titles.length > 0) {
                            this.shadowRoot.querySelector("#link-name").innerHTML = titles[0].getName()
                        }

                    },
                    err => {

                        getAudioInfo(globule, path,
                            audios => {
                                if (audios.length > 0) {
                                    this.shadowRoot.querySelector("#link-name").innerHTML = audios[0].getTitle()
                                }
                            }, err => { })
                    })
            })

    }

    connectedCallback() {
        if (this.hasAttribute("deleteable")) {
            this.setDeleteable()
        }
    }

    setDeleteable() {
        this.shadowRoot.querySelector(".btn-div").style.visibility = "visible";
    }

    resetDeleteable() {
        this.shadowRoot.querySelector(".btn-div").style.visibility = "hidden";
    }
}

customElements.define('globular-link', Link)