
import parser from 'iptv-playlist-parser'
import { GetAudioByIdRequest, GetVideoByIdRequest } from "globular-web-client/title/title_pb.js";
import { Application } from "../Application";
import { fireResize, formatBoolean } from "./utility.js";
import { secondsToTime } from "./Audio.js";
import { generatePeerToken, getUrl, Model } from '../Model';
import { SetVideoConversionRequest } from "globular-web-client/file/file_pb.js";
import { File } from "../File";


let __videos__ = {}
let __audios__ = {}

export function setVideo(video) {
    __videos__[video.getId()] = video
}

export function setAudio(audio) {
    __audios__[audio.getId()] = audio
}


// retreive video with a given id.
function getVideoInfo(globule, id, callback) {

    if (__videos__[id]) {
        callback(__videos__[id])
        return
    }
    generatePeerToken(globule, token => {
        let rqst = new GetVideoByIdRequest
        rqst.setIndexpath(globule.config.DataPath + "/search/videos")
        rqst.setVidoeid(id)

        globule.titleService.getVideoById(rqst, { application: Application.application, domain: globule.domain, token: token })
            .then(rsp => {
                let video = rsp.getVideo()
                video.globule = globule
                callback(video, token)
            })
            .catch(err => {
                callback(null, null)
            })
    })

}

function getAudioInfo(globule, id, callback) {
    if (__audios__[id]) {
        callback(__audios__[id])
        return
    }
    
    generatePeerToken(globule, token => {
        let rqst = new GetAudioByIdRequest
        rqst.setIndexpath(globule.config.DataPath + "/search/audios")
        rqst.setAudioid(id)

        globule.titleService.getAudioById(rqst, { application: Application.application, domain: globule.domain, token: token })
            .then(rsp => {
                let audio = rsp.getAudio()
                audio.globule = globule
                callback(audio, token)
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
           
            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;
            }
                
            ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
            }

            #container { 
                overflow-y: auto;
                overflow-x: hidden;
                background-color: black;
                height: 100%;
            }

            #items{
                display: table;
                border-collapse: separate;
                flex-flow: 1;
                padding-bottom: 50px;
                max-width: 100vw;
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
        this.videoPlayer = null;
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

    play(item, restart, resume) {
        this.index = this.items.indexOf(item);
        let url = new URL(item.url)
        let globule = Model.getGlobule(url.hostname)
        getVideoInfo(globule, item.id, (video, token) => {

            let url = decodeURIComponent(item.url)
            url = url.split("?")[0]
            url += "?application=" + Model.application

            if (video) {
                if (restart)
                    localStorage.removeItem(video.getId()) // play the video at start...

                if (resume)
                    this.videoPlayer.play(url, globule, video)

            } else {

                getAudioInfo(globule, item.id, (audio) => {
                    if (audio)
                        if (File.hasLocal) {
                            // Get the file path part from the url and test if a local copy exist, if so I will use it.
                            File.hasLocal(path, exists => {
                                if (exists) {
                                    var parser = document.createElement('a');
                                    parser.href = url
                                    this.audioPlayer.play(decodeURIComponent(parser.pathname), globule, audio, true)
                                } else {
                                    this.audioPlayer.play(url, globule, audio)
                                }
                            })
                        } else {
                            this.audioPlayer.play(url, globule, audio)
                        }

                })
            }

        })
    }

    playNext() {
        if (this.index < this.items.length - 1) {
            this.index++
            this.setPlaying(this.items[this.index], true, true)
        } else {
            this.index = 0
            this.items.forEach(item => {
                item.stopPlaying()
                item.classList.remove("playing")
            })
            let loop = false
            if (this.audioPlayer) {
                loop = this.audioPlayer.loop
            } else if (this.videoPlayer) {
                loop = this.videoPlayer.loop
            }

            if (loop) {
                this.setPlaying(this.items[this.index], true, true)
            }
        }
    }

    stop() {
        this.index = 0
        this.items.forEach(item => {
            item.stopPlaying()
            item.classList.remove("playing")
        })

        let item = this.items[this.index]
        // set the scoll position...
        item.scrollIntoView({ behavior: 'smooth' })
    }

    playPrevious() {
        if (this.index > 0) {
            this.index--
            this.setPlaying(this.items[this.index], true, true)
        }
    }

    load(txt, globule, player, callback) {
        // keep refrence to the audio player.
        if (player.constructor.name == "Audio_AudioPlayer") {
            this.audioPlayer = player;
        } else if (player.constructor.name == "Video_VideoPlayer") {
            this.videoPlayer = player;
        }

        this.itmes = []

        generatePeerToken(globule, token => {
            // if a playlist is given directly...
            if (txt.startsWith("#EXTM3U")) {
                const result = parser.parse(txt)
                this.playlist = result;
                this.refresh(callback)
                fireResize()
            } else {
                let url = getUrl(globule)

                // url += txt
                //url += path
                txt.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })

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
                    this.refresh(callback)
                    fireResize()
                };

                xhr.send();
            }
        })

    }

    refresh(callback) {
        // clear the content...
        this.innerHTML = ""

        let newPlayListItem = (index) => {
            let item = this.playlist.items[index]
            if (item) {
                new PlayListItem(item, this, index, (item_) => {

                    item_.onmouseover = () => {
                        if (!item_.isPlaying) {
                            item_.hidePauseButton()
                            item_.showPlayButton()
                        }
                    }

                    item_.onmouseleave = () => {
                        if (!item_.isPlaying) {
                            item_.hidePlayButton()
                            item_.hidePauseButton()
                        }
                    }

                    this.items.push(item_)
                    this.appendChild(item_)

                    if (this.playlist.items.length == this.items.length) {
                        this.orderItems()

                        // play the first item...
                        if (this.items.length > 0) {
                            this.setPlaying(this.items[0], true, true)
                        }

                        callback()
                    } else {
                        newPlayListItem(this.items.length)
                    }

                })
            }
        }

        // start recursion
        newPlayListItem(this.items.length)


    }

    setPlaying(item, restart, resume) {
        this.items.forEach(item => {
            item.stopPlaying()
            item.classList.remove("playing")
        })

        this.index = this.items.indexOf(item);
        item.setPlaying()
        this.play(item, restart, resume)
        item.classList.add("playing")

        if (this.audioPlayer != null) {
            this.audioPlayer.setTarckInfo(this.index, this.items.length)
        } else if (this.videoPlayer != null) {
            this.videoPlayer.setTarckInfo(this.index, this.items.length)
        }


        // set the scoll position...
        item.scrollIntoView({ behavior: 'smooth' })
    }

    pausePlaying() {
        let item = this.items[this.index]
        if (item)
            item.pausePlaying()
    }

    resumePlaying() {
        let item = this.items[this.index]
        if (item)
            this.setPlaying(item, false, false)
    }

    orderItems() {
        // sort by items index...
        this.innerHTML = ""
        let suffle = false;
        if (this.audioPlayer) {
            suffle = this.audioPlayer.shuffle
        } else if (this.videoPlayer) {
            suffle = this.videoPlayer.shuffle
        }
        if (suffle) {
            this.items = shuffleArray(this.items)
        } else {
            this.items = this.items.sort((a, b) => {
                return a.index - b.index
            })
        }

        this.items.forEach(item => this.appendChild(item))
    }

    count() {
        return this.items.length
    }
}

customElements.define('globular-playlist', PlayList)

/**
 * Sample empty component
 */
export class PlayListItem extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(item, parent, index, callback) {

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
                width: 100%;
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
                padding: 10px 5px 10px 5px;
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
                    <span id="title-artist-span" style="flex-grow: 1; max-width: 400px;  min-width: 160px;" class="author"></span>
                    <span id="title-duration-span"> </span>
                </div>
            </div>
        </div>
        `

        // give the focus to the input.
        this.playBtn = this.shadowRoot.querySelector("#play-arrow")
        this.pauseBtn = this.shadowRoot.querySelector("#pause")
        this.titleDuration = this.shadowRoot.querySelector("#title-duration-span")
        this.needResume = false

        this.playBtn.onclick = () => {
            if (this.needResume) {
                this.parent.setPlaying(this, false, true)
            } else {
                this.parent.setPlaying(this, true, true)
            }

            this.hidePlayButton()
            this.showPauseButton()
        }

        this.pauseBtn.onclick = () => {
            this.hidePauseButton()
            this.showPlayButton()
            if (this.parent.audioPlayer) {
                this.parent.audioPlayer.pause()
            } else if (this.parent.videoPlayer) {
                this.parent.videoPlayer.stop()
                this.needResume = true
            }
        }

        this.isPlaying = false;
        this.id = item.tvg.id;
        this.url = item.url
        this.src = item.tvg.url
        let url = new URL(item.url)
        this.globule = Model.getGlobule(url.hostname)

        // init the uderlying info...
        getAudioInfo(this.globule, this.id, audio => {
            this.audio = audio;
            if (audio == null) {
                getVideoInfo(this.globule, this.id, video => {
                    if (video != null) {
                        this.video = video
                        this.shadowRoot.querySelector("#title-div").innerHTML = video.getDescription()
                        this.shadowRoot.querySelector("#title-artist-span").innerHTML = video.getPublisherid().getName()
                        this.shadowRoot.querySelector("#title-image").src = video.getPoster().getContenturl()
                        if (this.video.getDuration())
                            this.titleDuration.innerHTML = this.parseDuration(this.video.getDuration())

                        callback(this)
                    }
                })
            } else {
                this.shadowRoot.querySelector("#title-div").innerHTML = audio.getTitle()
                this.shadowRoot.querySelector("#title-artist-span").innerHTML = audio.getArtist()
                this.shadowRoot.querySelector("#title-image").src = audio.getPoster().getContenturl()
                if (this.audio.getDuration())
                    this.titleDuration.innerHTML = this.parseDuration(this.audio.getDuration())
                callback(this)
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
        this.playBtn.style.visibility = "hidden"
        this.pauseBtn.style.visibility = "visible"
        this.hidePlayButton()
        this.showPauseButton()
        this.isPlaying = true;
    }

    pausePlaying() {
        this.playBtn.style.visibility = "visible"
        this.pauseBtn.style.visibility = "hidden"
        this.hidePauseButton()
        this.showPlayButton()
        this.isPlaying = false;
    }

    stopPlaying() {
        this.playBtn.style.visibility = "hidden"
        this.pauseBtn.style.visibility = "hidden"
        this.pauseBtn.style.display = "none"
        this.playBtn.style.display = "block"
        this.isPlaying = false;
        this.needResume = false;
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
