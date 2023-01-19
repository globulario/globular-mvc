import { GetFileAudiosRequest, GetFileTitlesRequest, GetFileVideosRequest } from "globular-web-client/title/title_pb";
import { Application } from "../Application";
import { Model } from "../Model";
import { getTheme } from "./Theme";


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
        let name = path.split("/")[path.split("/").length - 1]


        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            ${getTheme()}
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
                height: 20px;
                width: 20px;
            }

            #link-div:hover{
                cursor: pointer;
            }

            #link-div{
                
            }

        </style>

        <div id="link-div" style="display: flex; flex-direction: column; align-items: center; width: fit-content; margin: 5px; height: fit-content;">
            <div style="display: flex; flex-direction: column; border: 1px solid var(--palette-divider); padding: 5px; border-radius: 2.5px;">
            <div style="display: flex; align-items: center; width: 100%;">
                <span class="title" style="flex-grow: 1;"></span>
            </div>
            <div style="position: relative;">
                <img style="height: 72px; width: fit-content; max-width: 172px;" src="${thumbnail}">
                <div class="shortcut-icon">
                    <iron-icon icon="icons:reply"></iron-icon>
                </div> 
                <paper-ripple></paper-ripple>
            </div>
            </div>
            <span id="link-name" style="font-size: .85rem; padding: 2px; display: block; max-width: 128px; word-break: break-all;">${name}</span>
           
        </div>
        `

        let lnk = this.shadowRoot.querySelector("#link-div")
        lnk.onclick = () => {
            Model.eventHub.publish("follow_link_event_", { path: path, domain: domain }, true)
        }

        let globule = Model.getGlobule(domain)
        getVideoInfo(globule, path,
            videos => {
                if(videos.length > 0){
                    this.shadowRoot.querySelector("#link-name").innerHTML = videos[0].getDescription()
                }
            },
            err => {
                getTitleInfo(globule, path,
                    titles => {
                        if(titles.length > 0){
                            this.shadowRoot.querySelector("#link-name").innerHTML = titles[0].getName()
                        }

                    },
                    err => {
                        
                        getAudioInfo(globule, path,
                            audios => {
                                if(audios.length > 0){
                                    this.shadowRoot.querySelector("#link-name").innerHTML = audios[0].getTitle()
                                }
                            }, err => { })
                    })
            })

    }

}

customElements.define('globular-link', Link)