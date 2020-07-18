"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Camera = void 0;
require("@polymer/paper-icon-button/paper-icon-button.js");
require("@polymer/iron-icons/iron-icons.js");
require("@polymer/iron-icons/image-icons");
require("@polymer/paper-input/paper-input.js");
const Layout_1 = require("./Layout");
class Camera extends HTMLElement {
    constructor() {
        super();
        this._camera = null;
        this._video = null;
        this._canvas = null;
        this._photo = null;
        this._openbutton = null;
        this._startbutton = null;
        this._closebutton = null;
        this._width_inupt = null;
        // Set default attribute values.
        this._width = 640;
        this.streaming = false;
        this._stream = null;
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }
    get width() {
        return this._width;
    }
    set width(w) {
        this._width = w;
        this._height = this._video.videoHeight / (this._video.videoWidth / this._width);
        /**
         * After calling HTMLMediaElement.play() on the <video>, there's a (hopefully brief)
         * period of time that elapses before the stream of video begins to flow. To avoid
         * blocking until that happens, we add an event listener to video for the canplay event,
         * which is delivered when the video playback actually begins. At that point, all the
         * properties in the video object have been configured based on the stream's format.
         */
        this._video.setAttribute('width', this._width);
        this._video.setAttribute('height', this._height);
        this._canvas.setAttribute('width', this._width);
        this._canvas.setAttribute('height', this._height);
        this._width_inupt.value = this._width;
    }
    get height() {
        return this._height;
    }
    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
            <style>
                ${Layout_1.theme}

                .camera {
                }

                .camera .card-actions{
                    display: flex;
                }

                .output{
                    display: flex;
                    flex-direction: column; 
                    justify-items: center;
                    align-items: center;
                }

                #close_btn{
                    
                }

            </style>

            <paper-icon-button id="openbutton" icon="image:camera-alt"></paper-icon-button>

            <paper-card id="camera" class="camera" style="display: none;">
                <div class="card-content">
                    <video id="video"></video>
                </div>
                <div class="card-actions">
                    <paper-icon-button id="close_btn" icon="close"></paper-icon-button>
                    <span style="flex-grow: 1;"></span>
                    <paper-icon-button id="startbutton" icon="image:add-a-photo"></paper-icon-button>
                    <paper-input label="width" type="number" no-label-float  id="width-input" style="padding-left: 10px; width: 5em; text-align: right; vertical-align: baseline;">
                        <div slot="suffix">px</div>
                    </paper-input>
                </div>
            </paper-card>

            <canvas id="canvas" style="display: none;"></canvas>

            <div class="output" style="display: flex;">
              <img id="photo" alt="The screen capture will appear in this box.">
            </div>
        `;
        this._width_inupt = this.shadowRoot.getElementById('width-input');
        this._video = this.shadowRoot.getElementById('video');
        this._canvas = this.shadowRoot.getElementById('canvas');
        this._photo = this.shadowRoot.getElementById('photo');
        this._startbutton = this.shadowRoot.getElementById('startbutton');
        this._openbutton = this.shadowRoot.getElementById('openbutton');
        this._closebutton = this.shadowRoot.getElementById('close_btn');
        this._camera = this.shadowRoot.getElementById('camera');
        let play = (ev) => {
            if (!this._streaming) {
                this._streaming = true;
            }
        };
        /**
         * Display the camera.
         */
        this._openbutton.onclick = () => {
            this._openbutton.style.display = "none";
            this._video.addEventListener('canplay', play, false);
            /**
             * This function's job is to request access to the user's webcam, initialize the
             * output <img> to a default state, and to establish the event listeners needed to
             * receive each frame of video from the camera and react when the button is clicked
             * to capture an image.
             */
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then((stream) => {
                this._stream = stream;
                this._video.srcObject = stream;
                this.width = this._width;
                this._video.play();
                this._camera.style.display = "";
                this._startbutton.addEventListener('click', (ev) => {
                    this.width = this._width_inupt.value;
                    this.takepicture();
                    ev.preventDefault();
                }, false);
            })
                .catch(function (err) {
                console.log("An error occurred: " + err);
            });
        };
        this._closebutton.onclick = () => {
            this._camera.style.display = "none";
            this._openbutton.style.display = "";
            this._video.pause();
            this._stream.getTracks()[0].stop();
            this._video.currentTime = 0;
            this._video.removeEventListener('canplay', play);
        };
        /**
         * Rezise the camera input.
         */
        this._width_inupt.onchange = () => {
            this.width = this._width_inupt.value;
        };
    }
    takepicture() {
        /*this._canvas.style.display = "block"*/
        var context = this._canvas.getContext('2d');
        if (this._width && this._height) {
            this._canvas.width = this._width;
            this._canvas.height = this._height;
            context.drawImage(this._video, 0, 0, this._width, this._height);
            var data = this._canvas.toDataURL('image/png');
            this._photo.setAttribute('src', data);
        }
        else {
            this.clearphoto();
        }
    }
    /**
     * Clear the canvas.
     */
    clearphoto() {
        var context = this._canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        var data = this._canvas.toDataURL('image/png');
        this._photo.setAttribute('src', data);
    }
    /**
     * When the web component is disconnect.
     */
    disconnectedCallback() {
    }
}
exports.Camera = Camera;
customElements.define('globular-camera', Camera);
