import { getTheme } from "./Theme.js";
import parser from 'iptv-playlist-parser'
import { Model } from "../Model";

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



        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
            #container{

            }
        </style>
        <div id="container">
        </div>
        `

        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")



    }

    // The connection callback.
    connectedCallback() {

    }

    load(path, globule) {

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

        xhr.onload = function () {
            const result = parser.parse(this.response)
            console.log(result)
        };

        xhr.send();
    }
}

customElements.define('globular-playlist', PlayList)