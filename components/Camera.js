

import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/image-icons';
import '@polymer/iron-icons/av-icons';
import '@polymer/paper-input/paper-input.js';
import { getTheme } from "./Theme";
import { dataURIToBlob } from './utility';
export class Camera extends HTMLElement {

    constructor() {
        super()
        this.type = ""
        this._device = null;
        this._camera = null;
        this._video = null;
        this._audio = null;
        this._canvas = null;
        this._photo = null;
        this._openButton = null;
        this._takePictureButton = null;
        this._closeButton = null;
        this._width_inupt = null;
        this._saveButton = null;
        this._deleteButton = null;
        this._camera_options = null;

        // The record blink button
        this.recording_interval = null;

        // That event will be call when a picture is taken.
        // It will return the image.
        this.onpicture = null;

        // Called When the camera is open
        this.onopen = null;

        // Called when the camera is close.
        this.onclose = null;

        // Called when video is recorded.
        this.onvideo = null;

        // Set default attribute values.
        this._width = 640;
        if (this.hasAttribute("width")) {
            this._width = parseInt(this.getAttribute("width"));
        }
        this.streaming = false;
        this._stream = null;
        this._recorder = null;
        this._data = null

        // save callback.
        this.onsaveimage = null;
        this.onsavevideo = null;

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

    }

    get width() {
        return this._width;
    }

    set width(w) {
        this._width = w
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
                ${getTheme()}

                .camera {
                    position: relative;
                }

                .camera .card-actions{
                    display: flex;
                }

                .camera .card-content{
                    padding-top: 24px;
                    position: relative;
                }

                .output{
                    display: flex;
                    flex-direction: column; 
                    justify-items: center;
                    align-items: center;
                }

                #camera_options{
                    position: absolute;
                    z-index: 1;
                    top: 4px;
                    left: 16px;
                    border: none;
                    outline: none;
                    scroll-behavior: smooth;
                }

                #recording-icon{
                    --iron-icon-fill-color: red;
                }

                .blink {
                    animation: blink-animation 1s steps(5, start) infinite;
                    -webkit-animation: blink-animation 1s steps(5, start) infinite;
                  }
                  @keyframes blink-animation {
                    to {
                      visibility: hidden;
                    }
                  }
                  @-webkit-keyframes blink-animation {
                    to {
                      visibility: hidden;
                    }
                  }
            </style>

            <paper-icon-button id="open-button" icon="image:camera-alt"></paper-icon-button>

            <paper-card id="camera" class="camera" style="display: none;">
                <select  id="camera_options"></select >
                <div class="card-content">
                    <video id="video"></video>
                    <img id="photo" style="display: none;">
                </div>
                <div class="card-actions">
                    <paper-icon-button id="close-btn" icon="close"></paper-icon-button>
                    <span style="flex-grow: 1;"></span>
                    <paper-icon-button id="stop-rercoding-button" style="display:none;" icon="av:stop"></paper-icon-button>
                    <paper-icon-button id="recording-button" icon="av:videocam"></paper-icon-button>
                    <div style="display: flex;">
                        <paper-icon-button id="start-button" icon="image:add-a-photo"></paper-icon-button>
                        <paper-input label="width" type="number" no-label-float  id="width-input" style="padding-left: 10px; width: 5em; text-align: right; vertical-align: baseline;">
                            <div slot="suffix">px</div>
                        </paper-input>
                    </div>
                    <div style="display: none;">
                        <paper-icon-button id="save-button" icon="save" ></paper-icon-button>
                        <paper-icon-button id="delete-button" icon="delete"></paper-icon-button>
                    </div>
                </div>
            </paper-card>

            <canvas id="canvas" style="display: none;"></canvas>
        `

        // List of interface buttons and menu.
        this._width_inupt = this.shadowRoot.getElementById('width-input');
        this._video = this.shadowRoot.getElementById('video');
        this._canvas = this.shadowRoot.getElementById('canvas');
        this._photo = this.shadowRoot.getElementById('photo');
        this._takePictureButton = this.shadowRoot.getElementById('start-button');
        this._openButton = this.shadowRoot.getElementById('open-button');
        this._closeButton = this.shadowRoot.getElementById('close-btn')
        this._camera = this.shadowRoot.getElementById('camera');
        this._saveButton = this.shadowRoot.getElementById('save-button');
        this._deleteButton = this.shadowRoot.getElementById('delete-button');
        this._camera_options = this.shadowRoot.getElementById('camera_options');
        this._startRecordingButton = this.shadowRoot.getElementById('recording-button');
        this._stopRecordingButton = this.shadowRoot.getElementById('stop-rercoding-button');


        // get the list of available cameras.
        this._saveButton.ontouchend =  this._saveButton.onclick = () => {
            // create event that save the image/video
            if (this.type == "photo") {
                if (this.onsaveimage != undefined) {
                    this.onsaveimage(this._photo.src)
                }
            } else {
                if (this.onsavevideo != undefined) {
                    this.onsavevideo(this._data)
                }
            }

            // delete the picture.
            this.clearphoto();
        }

        this._camera_options.onchange = () => {
            this._device = this._camera_options.value
            // stop actual camera
            // close existing stream
            if (this._stream != undefined) {
                this._stream.getTracks().forEach(track => {
                    track.stop();
                });
            }

            navigator.mediaDevices.getUserMedia({ audio: true, video: { deviceId: { exact: this._device } }})
                .then((stream) => {
                    this._stream = stream;
                    this._video.srcObject = stream;
                    this._video.play()
                })
                .catch(function (err) {
                    console.log("An error occurred: " + err);
                });

        };

        let play = (ev) => {
            if (!this._streaming) {
                this._streaming = true;
            }
        }

        this.onpen_event_listener = ()=>{
            
            this._openButton.style.display = "none"

            const open = () => {

                this._video.addEventListener('canplay', play, false);

                /**
                 * This function's job is to request access to the user's webcam, initialize the 
                 * output <img> to a default state, and to establish the event listeners needed to 
                 * receive each frame of video from the camera and react when the button is clicked 
                 * to capture an image.
                 */
                navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: this._device } }, audio: true })
                    .then((stream) => {
                        this._stream = stream;
                        this._video.srcObject = stream;
                        this.width = this._width;
                        this._video.play();
                        this._camera.style.display = ""

                        // Take picture event.
                        this._takePictureButton.ontouchend = this._takePictureButton.onclick = (ev) => {
                            this.type = "photo"
                            this.width = this._width_inupt.value
                            this.takepicture();
                            ev.preventDefault();
                        };

                        // Start recording video
                        this._startRecordingButton.ontouchend = this._startRecordingButton.onclick = (ev) => {
                            this.type = "video"
                            // Start recording.
                            this.startRecording()
                            ev.preventDefault();
                        }

                        // Stop recording video.
                        this._stopRecordingButton.ontouchend = this._stopRecordingButton.onclick = (ev) => {
                            this.stopRecording()
                            ev.preventDefault();
                        }


                        if (this.onopen != undefined) {
                            this.onopen();
                        }
                    })
                    .catch(function (err) {
                        console.log("An error occurred: " + err);
                    });

            }

            // Set the list of camera.
            const getCameraSelection = async () => {
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                const options = videoDevices.map(videoDevice => {
                    if (this._device == null) {
                        this._device = videoDevice.deviceId;
                    }
                    return `<option value="${videoDevice.deviceId}">${videoDevice.label}</option>`;
                });
                this._camera_options.innerHTML = options.join('');
                // Open the display.
                open();
            };

            // Create the list of camera if not already exist and open it.
            if (this._camera_options.innerHTML == "") {
                getCameraSelection()
            } else {
                // simply open the camera...
                open();
            }
        }
        
        /**
         * Display the camera.
         */
        this._openButton.onclick = () => {

            this.onpen_event_listener();

        }

        this.close_event_listener= ()=>{
            this._camera.style.display = "none"
            this._openButton.style.display = ""
            this._video.pause();
            const tracks = this._video.srcObject.getTracks();
            tracks.forEach((track) => {
                track.stop();
            });

            this._video.currentTime = 0;
            this._video.removeEventListener('canplay', play);
            this.clearphoto()
            if (this.onclose != null) {
                this.onclose();
            }
        }

        this._closeButton.ontouchend = this._closeButton.onclick = () => {
            this.close_event_listener();
        }

        this._deleteButton.ontouchend = this._deleteButton.onclick = () => {
            this.clearphoto()
        }

        /** 
         * Rezise the camera input.
         */
        this._width_inupt.onchange = () => {
            this.width = this._width_inupt.value;
        }
    }

    

    open() {
        this.onpen_event_listener();
        if (this.onopen != undefined) {
            this.onopen();
        }
    }

    close() {
        this.close_event_listener(); // close the camera.
        if (this.onclose != undefined) {
            this.onclose();
        }
    }

    /** Start recording a video */
    startRecording() {
        this._startRecordingButton.style.display = "none"
        this._takePictureButton.parentNode.style.display = "none"
        this._stopRecordingButton.style.display = "block"
        this._recorder = new MediaRecorder(this._stream);
        this._data = [];
        this._recorder.ondataavailable = event => this._data.push(event.data);
        this._recorder.start();

        // Here I will append an iron icon and make it blink to tell
        // the user is recording a video.
        let recording_icon = document.createElement("iron-icon")
        recording_icon.icon = "av:fiber-manual-record"
        recording_icon.id = "recording-icon"
        recording_icon.style.position = "absolute"
        recording_icon.style.top = "35px"
        recording_icon.style.left = "25px"
        recording_icon.className = "blink"

        recording_icon.style.zIndex = 100;

        let content = this.shadowRoot.querySelector(".card-content")
        content.appendChild(recording_icon)

    }

    /** Stop recording a video */
    stopRecording() {
        this._recorder.stop()

        // Remove the blinking camera button.
        let recording_icon = this.shadowRoot.querySelector("#recording-icon")
        recording_icon.parentNode.removeChild(recording_icon)

        // display the save picture button.
        this._stopRecordingButton.style.display = "none"
        this._saveButton.parentNode.style.display = "flex"

        // Call on picture with the data from the image as blob.
        if (this.onvideo != undefined) {
            this.onvideo(this._data)
        }
    }

    /** Take a picture */
    takepicture() {
        if (this._width && this._height) {
            var context = this._canvas.getContext('2d');
            this._canvas.width = this._width;
            this._canvas.height = this._height;

            context.drawImage(this._video, 0, 0, this._width, this._height);
            var data = this._canvas.toDataURL('image/png');
            this._photo.setAttribute('src', data);

            // Here I will hide the video
            this._video.style.display = "none"
            this._startRecordingButton.style.display = "none"
            this._stopRecordingButton.style.display = "none"
            this._photo.style.display = "block"

            // display the save picture button.
            this._saveButton.parentNode.style.display = "flex"
            this._takePictureButton.parentNode.style.display = "none"

            // Call on picture with the data from the image as blob.
            if (this.onpicture != undefined) {
                this._canvas.toBlob(this.onpicture)
            }

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

        // Here I will hide the video
        this._video.style.display = "block"
        this._stopRecordingButton.style.display = "none"
        this._photo.style.display = "none"

        // display the save picture button.
        this._saveButton.parentNode.style.display = "none"
        this._takePictureButton.parentNode.style.display = "flex"
        this._startRecordingButton.style.display = "block"
        this._stopRecordingButton.style.display = "none"
    }

    /**
     * When the web component is disconnect.
     */
    disconnectedCallback() {

    }
}

customElements.define('globular-camera', Camera)



/**
 * Search Box
 */
export class MediaCall extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${getTheme()}
        </style>
        `

        // test create offer...
    }

}

customElements.define('globular-media-call', MediaCall)