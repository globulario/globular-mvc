import { getTheme } from "./Theme.js";
import parser from 'iptv-playlist-parser'
import { Model } from "../Model";
import { GetVideoByIdRequest } from "globular-web-client/title/title_pb.js";
import { Application } from "../Application";

// retreive video with a given id.
function getVideoInfo(globule, id, callback) {

    let rqst = new GetVideoByIdRequest
    rqst.setIndexpath(globule.config.DataPath + "/search/videos")
    rqst.setVidoeid(id)

    globule.titleService.getVideoById(rqst, { application: Application.application, domain: globule.config.Domain, token: localStorage.getItem("user_token") })
        .then(rsp => {
            callback(rsp.getVideo())
        })
        .catch(err => {
            console.log(err)
            callback([])
        })
}

/**
 * A play list is accociated with a directory. So you must specify the path
 * where media files can be read...
 */
export class PlayList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(dir) {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.index = 0;

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #items{
                display: table;
                border-collapse: separate;
                border-spacing: 10px;
            }

            #container {
                display: flex;
                flex-direction: column;
            }

            ::slotted(globular-playlist-item) {
                display: table-row;
            }

        </style>
        <div id="container">
            <div id="playing">
            </div>
            <div id="items">
                <slot></slot>
            </div>
        </div>
        `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.style.display = "table"
        this.playlist = null;
        this.audioPlayer = null;
        this.globule = null;
        this.items = []
    }

    // The connection callback.
    connectedCallback() {

    }

    play(item) {
        this.index = item.index;
        // this.audioPlayer.play(path, globule, title)
        getVideoInfo(this.globule, item.id, video => {
            this.audioPlayer.play(item.url, this.globule, video)
        })
    }

    playNext() {
        if (this.index < this.items.length - 1) {
            this.index++
            this.setPlaying(this.items[this.index])
        } else {
            console.log("no more item to play!")
        }
    }

    playPrevious() {
        if (this.index > 0) {
            this.index--
            this.setPlaying(this.items[this.index])
        } else {
            console.log("no more item to play!")
        }
    }

    load(path, globule, audioPlayer) {

        // keep refrence to the audio player.
        this.audioPlayer = audioPlayer;
        this.globule = globule

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

        // Fetch the playlist file, using xhr for example
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.overrideMimeType("audio/x-mpegurl"); // Needed, see below.

        xhr.onload = (evt) => {
            const result = parser.parse(evt.target.response)
            this.playlist = result;
            this.refresh()
        };

        xhr.send();
    }

    refresh() {
        // clear the content...
        this.shadowRoot.querySelector("#playing").innerHTML = ""
        this.innerHTML = ""
        this.playlist.items.forEach(item => {
            let item_ = new PlayListItem(item, this, this.items.length)

            item_.onmouseenter = () => {
                //item_.style.cursor = "pointer"
                if (item_.isPlaying) {
                    item_.showPauseButton()
                    item_.hidePlayButton()
                } else {
                    item_.hidePauseButton()
                    item_.showPlayButton()
                }
            }

            item_.onmouseleave = () => {
                //item_.style.cursor = "default"
                if (item_.isPlaying) {
                    item_.showPlayButton()
                    item_.hidePauseButton()
                } else {
                    item_.hidePlayButton()
                    item_.hidePauseButton()
                }
            }

            this.items.push(item_)
            this.appendChild(item_)
        })

        // play the first item...
        if (this.items.length > 0) {
            this.setPlaying(this.items[0])
        }
    }

    setPlaying(item) {
        console.log("display the playing item...")
        this.items.forEach(item => {
            item.stopPlaying()
        })
        this.index = item.index;
        item.setPlaying()
        this.play(item)
    }
}

customElements.define('globular-playlist', PlayList)

/**
 * Sample empty component
 */
export class PlayListItem extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(item, parent, index) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.item = item;
        this.parent = parent;
        this.index = index;

        // extract info from the name.
        let titleInfo = this.parseName(item.name)

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{
                
            }

            #container img{
                height: 48px;
            }

            .title{
                font-size: 1rem;
            }

            :host-context(globular-playlist) {
                display: table;
            }

            .cell img {
                height: 48px;
            }

            .cell {
                display: table-cell;
                vertical-align: middle;
            }

            iron-icon:hover {
                cursor: pointer;
            }

        </style>

        <div class="cell">
            <iron-icon id="play-arrow" title="Play" style="visibility: hidden;" icon="av:play-arrow"></iron-icon>
            <iron-icon id="pause" title="Pause" style="visibility: hidden; display: none;" icon="av:pause"></iron-icon>
        </div>
        <div class="cell">
            <img src="${this.item.tvg.logo}"></img>
        </div>
        <div class="cell">
            <div style="display: flex; flex-direction: column; padding-left: 10px; padding-rigth: 10px;">
                <div class="title">${titleInfo.title}</div>
                <div style="font-size: .85rem">
                    <span class="author">${titleInfo.author.length > 0 ? " by " + titleInfo.author : ""}</span>
                    <span class="featuring"> ${titleInfo.featuring.length > 0 ? " ft. " + titleInfo.featuring : ""}</span>
                </div>
            </div>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.playBtn = this.shadowRoot.querySelector("#play-arrow")
        this.pauseBtn = this.shadowRoot.querySelector("#pause")

        this.playBtn.onclick = () => {
            this.parent.setPlaying(this)
        }

        this.pauseBtn.onclick = () => {
            this.hidePauseButton()
            this.showPlayButton()
            this.parent.audioPlayer.pause()
        }

        this.isPlaying = false;
        this.id = item.tvg.id;
        this.url = item.url
        this.src = item.tvg.url
    }

    // extract the duration info from the raw data.
    parseDuration(raw) {

    }

    // Parse the name and split the information from it...
    parseName(name) {
        name = name.replace("|", " - ").replace("Official Music Video", "") // make use of - instead of | as separator.

        if (name.indexOf(" - ") == -1) {
            return { title: name, author: "", featuring: "" }
        }
        // Try the best to get correct values...
        let title_ = name.split(" - ")[1].replace(/FEAT./i, "ft.");
        let feat = ""

        if (title_.indexOf(" ft.") != -1) {
            feat = title_.split(" ft.")[1]
            title_ = title_.split(" ft.")[0]
        } else if (title_.indexOf("(ft.") != -1) {
            feat = title_.split("(ft.")[1].replace(")", 0)
            title_ = title_.split(" ft.")[0]
        }

        title_ = title_.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ").replace(/LYRICS/i, "");


        let author = name.split(" - ")[0].replace(/FEAT./i, "ft.").trim()

        if (author.indexOf(" ft.") != -1) {
            feat = author.split(" ft.")[1]
            author = author.split(" ft.")[0]
        } else if (author.indexOf("(ft.") != -1) {
            feat = author.split("(ft.")[1].replace(")", 0)
            author = author.split(" ft.")[0]
        }

        feat = feat.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ");
        author = author.replace(/ *\([^)]*\) */g, " ").replace(/ *\[[^)]*\] */g, " ");

        return { title: title_, author: author, featuring: feat }
    }

    setPlaying() {
        this.playBtn.style.visibility = "visible"
        this.pauseBtn.style.visibility = "hidden"
        this.isPlaying = true;
    }

    stopPlaying() {
        this.playBtn.style.visibility = "hidden"
        this.pauseBtn.style.visibility = "hidden"
        this.pauseBtn.style.display = "none"
        this.playBtn.style.display = "block"
        this.isPlaying = false;
    }

    showPlayButton() {
        this.pauseBtn.style.display = "none"
        this.playBtn.style.display = "block"
        this.pauseBtn.style.visibility = "hidden"
        this.playBtn.style.visibility = "visible"
    }

    hidePlayButton() {
        //this.playBtn.style.display = "none"
        this.playBtn.style.visibility = "hidden"
    }

    hidePauseButton() {
        this.pauseBtn.style.display = "none"
        this.pauseBtn.style.visibility = "hidden"
    }

    showPauseButton() {
        this.pauseBtn.style.display = "block"
        this.playBtn.style.display = "none"
        this.pauseBtn.style.visibility = "visible"
        this.playBtn.style.visibility = "hidden"
    }

}

customElements.define('globular-playlist-item', PlayListItem)
