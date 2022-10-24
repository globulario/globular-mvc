import { getTheme } from "./Theme.js";
import parser from 'iptv-playlist-parser'
import { GetAudioByIdRequest, GetVideoByIdRequest } from "globular-web-client/title/title_pb.js";
import { Application } from "../Application";
import { fireResize, formatBoolean } from "./utility.js";
import { secondsToTime } from "./Audio.js";
import { generatePeerToken, Model } from '../Model';
import { SetVideoConversionRequest } from "globular-web-client/file/file_pb.js";
import { File } from "../File";


 let __videos__ = {}
 let __audios__ = {}

export function setVideo(video){
    __videos__[video.getId()] = video
}

export function setAudio(audio){
    __audios__[audio.getId()] = audio
}


// retreive video with a given id.
function getVideoInfo(globule, id, callback) {
    console.log("get video with id: ", id)
    if(__videos__[id]){
        callback(__videos__[id])
        return 
    }
    generatePeerToken(globule.config.Mac, token => {
        let rqst = new GetVideoByIdRequest
        rqst.setIndexpath(globule.config.DataPath + "/search/videos")
        rqst.setVidoeid(id)

        globule.titleService.getVideoById(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
            .then(rsp => {
                callback(rsp.getVideo(), token)
            })
            .catch(err => {
                callback(null, null)
            })
    })

}

function getAudioInfo(globule, id, callback) {
    if(__audios__[id]){
        callback(__audios__[id])
        return 
    }
    generatePeerToken(globule.config.Mac, token => {
        let rqst = new GetAudioByIdRequest
        rqst.setIndexpath(globule.config.DataPath + "/search/audios")
        rqst.setAudioid(id)

        globule.titleService.getAudioById(rqst, { application: Application.application, domain: globule.config.Domain, token: token })
            .then(rsp => {
                callback(rsp.getAudio(), token)
            })
            .catch(err => {
                callback(null, null)
            })
    })
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
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
                flex-flow: 1;

            }

            #container {
                position: relative;
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: auto;
            }

            ::slotted(globular-playlist-item) {
                display: table-row;
                padding: 2px;
            }

            ::slotted(.playing) {
                -webkit-box-shadow: inset 5px 5px 15px 5px #152635; 
                box-shadow: inset 5px 5px 15px 5px #152635;
            }

        </style>
        <div id="container">
            <div id="items">
                <slot></slot>
            </div>
        </div>
        `


        // give the focus to the input.
        this.style.display = "table"
        this.playlist = null;
        this.audioPlayer = null;
        this.globule = null;
        this.items = []
    }

    // The connection callback.
    connectedCallback() {
        fireResize()
    }

    clear() {
        this.items = []
        this.index = 0
    }

    play(item) {
        this.index = this.items.indexOf(item);

        getVideoInfo(this.globule, item.id, (video, token) => {

            let url = decodeURIComponent(item.url)
            url = url.split("?")[0]
            url += "?application=" + Model.application

            if (video) {
                if (token) {
                    url += "&token=" + token
                }
                this.videoPlayer.play(url, this.globule, video)
            } else {

                getAudioInfo(this.globule, item.id, (audio, token) => {
                    if (token) {
                        url += "&token=" + token
                    }
                    if(audio)
                    if (File.hasLocal) {
                        // Get the file path part from the url and test if a local copy exist, if so I will use it.
                        let url_ = url.replace("://", "")
                        let path = url_.substring(url_.indexOf("/"), url_.indexOf("?"))
                        File.hasLocal(path, exists => {
                            if (exists) {
                                this.audioPlayer.play(path, this.globule, audio, true)
                            } else {
                                this.audioPlayer.play(url, this.globule, audio)
                            }
                        })
                    } else {
                        this.audioPlayer.play(url, this.globule, audio)
                    }
                       
                })
            }

        })
    }

    playNext() {
        if (this.index < this.items.length - 1) {
            this.index++
            this.setPlaying(this.items[this.index])
        } else {
            this.index = 0
            this.items.forEach(item => {
                item.stopPlaying()
                item.classList.remove("playing")
            })
            if (this.audioPlayer.loop) {
                this.setPlaying(this.items[this.index])
            }
        }
    }

    stop() {
        console.log("stop was call")
        this.index = 0
        this.items.forEach(item => {
            item.stopPlaying()
            item.classList.remove("playing")
        })

        let item = this.items[this.index]
        this.shadowRoot.querySelector("#container").scrollTo({ top: item.offsetTop - 10, behavior: 'smooth' });
    }

    playPrevious() {
        if (this.index > 0) {
            this.index--
            this.setPlaying(this.items[this.index])
        } else {
            console.log("no more item to play!")
        }
    }

    load(txt, globule, audioPlayer) {
        // keep refrence to the audio player.
        this.audioPlayer = audioPlayer;
        this.globule = globule
        this.itmes = []

        generatePeerToken(globule.config.Mac, token => {
            // if a playlist is given directly...
            if (txt.startsWith("#EXTM3U")) {
                const result = parser.parse(txt)
                this.playlist = result;
                this.refresh()
                fireResize()
            } else {
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

                url += txt

                url += "?application=" + Model.application
                if (token) {
                    url += "&token=" + token
                }

                // Fetch the playlist file, using xhr for example
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.overrideMimeType("audio/x-mpegurl"); // Needed, see below.
                xhr.onload = (evt) => {
                    const result = parser.parse(evt.target.response)
                    this.playlist = result;
                    this.refresh()
                    fireResize()
                };

                xhr.send();
            }
        })


    }

    refresh() {
        // clear the content...
        this.innerHTML = ""
        this.playlist.items.forEach(item => {
            let item_ = new PlayListItem(item, this, this.items.length, this.globule)

            item_.onmouseover = () => {
                if (item_.isPlaying) {
                    item_.showPauseButton()
                    item_.hidePlayButton()
                } else {
                    item_.hidePauseButton()
                    item_.showPlayButton()
                }
            }

            item_.onmouseleave = () => {
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

        this.orderItems()

        // play the first item...
        if (this.items.length > 0) {
            this.setPlaying(this.items[0])
        }
    }

    setPlaying(item) {
        this.items.forEach(item => {
            item.stopPlaying()
            item.classList.remove("playing")
        })

        this.index = this.items.indexOf(item);
        item.setPlaying()
        this.play(item)
        item.classList.add("playing")

        this.audioPlayer.setTarckInfo(this.index, this.items.length)

        // set the scoll position...
        this.shadowRoot.querySelector("#container").scrollTo({ top: item.offsetTop - 10, behavior: 'smooth' });
    }

    pausePlaying() {
        let item = this.items[this.index]
        if (item)
            item.pausePlaying()
    }

    resumePlaying() {
        let item = this.items[this.index]
        if (item)
            this.setPlaying(item)
    }

    orderItems() {
        // sort by items index...
        this.innerHTML = ""
        if (this.audioPlayer.shuffle) {
            this.items = shuffleArray(this.items)
        } else {
            this.items = this.items.sort((a, b) => {
                return a.index - b.index
            })
        }

        this.items.forEach(item => this.appendChild(item))
    }
}

customElements.define('globular-playlist', PlayList)

/**
 * Sample empty component
 */
export class PlayListItem extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(item, parent, index, globule) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.item = item;
        this.parent = parent;
        this.index = index;
        this.audio = null;
        this.video = null;


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
                color: white;
                max-width: 400px;
            }

            :host-context(globular-playlist) {
                display: table;
            }

            .cell img {
                height: 48px;
                border-left: 1px solid black;
                border-bottom: 1px solid black;
                border-right: 1px solid #424242;
                border-top: 1px solid #424242;
            }

            .cell {
                display: table-cell;
                vertical-align: middle;
                padding: 5px;
                color: white;
            }

            iron-icon:hover {
                cursor: pointer;
            }

        </style>

        <div class="cell">
            <iron-icon id="play-arrow" style="--iron-icon-fill-color: white;" title="Play" style="visibility: hidden;" icon="av:play-arrow"></iron-icon>
            <iron-icon id="pause" style="--iron-icon-fill-color: white;" title="Pause" style="visibility: hidden; display: none;" icon="av:pause"></iron-icon>
        </div>
        <div class="cell">
            <img id="title-image"></img>
        </div>
        <div class="cell">
            <div style="display: flex; flex-direction: column; padding-left: 10px; padding-rigth: 10px;">
                <div id="title-div" class="title"></div>
                <div style="font-size: .85rem; display: flex;">
                    <span id="title-artist-span" style="flex-grow: 1; max-width: 400px;" class="author"></span>
                    <span id="title-duration-span"> </span>
                </div>
            </div>
        </div>
        `

        // give the focus to the input.
        this.playBtn = this.shadowRoot.querySelector("#play-arrow")
        this.pauseBtn = this.shadowRoot.querySelector("#pause")
        this.titleDuration = this.shadowRoot.querySelector("#title-duration-span")

        this.playBtn.onclick = () => {
            this.parent.setPlaying(this)
            this.hidePlayButton()
            this.showPauseButton()
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
        this.globule = globule

        // init the uderlying info...
        getAudioInfo(globule, this.id, audio => {
            this.audio = audio;
            if (audio == null) {
                getVideoInfo(globule, this.id, video => {
                    this.video = video
                    if (video == null) {
                        console.log("no information found for item ", item)
                    }
                })
            } else {
                this.shadowRoot.querySelector("#title-div").innerHTML = audio.getTitle()
                this.shadowRoot.querySelector("#title-artist-span").innerHTML = audio.getArtist()
                this.shadowRoot.querySelector("#title-image").src = audio.getPoster().getContenturl()
                if (this.audio.getDuration())
                    this.titleDuration.innerHTML = this.parseDuration(this.audio.getDuration())
            }
        })
    }


    // load item if not already loaded and get it image url...
    getImage(callback) {
        if (this.audio) {
            callback(this.audio.getPoster().getContenturl())
            return
        }

        if (this.video) {
            callback(this.video.getPoster().getContenturl())
            return
        }

        getAudioInfo(this.globule, this.id, audio => {
            if (audio == null) {
                getVideoInfo(this.globule, this.id, video => {
                    if (video != null) {
                        this.video = video
                        callback(this.video.getPoster().getContenturl())
                    }
                })
            } else {
                this.audio = audio
                callback(this.audio.getPoster().getContenturl())

            }
        })
    }

    // extract the duration info from the raw data.
    parseDuration(duration) {
        // display the track lenght...
        let obj = secondsToTime(duration)
        var hours = obj.h
        var min = obj.m
        var sec = obj.s
        let hours_ = (hours < 10) ? '0' + hours : hours;
        let minutes_ = (min < 10) ? '0' + min : min;
        let seconds_ = (sec < 10) ? '0' + sec : sec;

        if (hours > 0)
            return hours_ + ":" + minutes_ + ":" + seconds_;

        if (min > 0)
            return minutes_ + ":" + seconds_;

        return seconds_ + "'s";
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

    pausePlaying() {
        this.playBtn.style.visibility = "visible"
        this.pauseBtn.style.visibility = "hidden"
        this.isPlaying = false;
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
