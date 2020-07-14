var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icons/image-icons';
import '@polymer/paper-input/paper-input.js';
var Camera = /** @class */ (function (_super) {
    __extends(Camera, _super);
    function Camera() {
        var _this = _super.call(this) || this;
        _this._camera = null;
        _this._video = null;
        _this._canvas = null;
        _this._photo = null;
        _this._openbutton = null;
        _this._startbutton = null;
        _this._closebutton = null;
        _this._width_inupt = null;
        // Set default attribute values.
        _this._width = 640; // We will scale the photo width to this
        _this._height = 0; // This will be computed based on the input stream
        _this.streaming = false;
        _this._stream = null;
        // Set the shadow dom.
        _this.attachShadow({ mode: 'open' });
        return _this;
    }
    Object.defineProperty(Camera.prototype, "width", {
        get: function () {
            return this._width;
        },
        set: function (w) {
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
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Camera.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: false,
        configurable: true
    });
    // The connection callback.
    Camera.prototype.connectedCallback = function () {
        var _this = this;
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = "\n            <style>\n                .camera {\n                }\n\n                .camera video{\n                    background-color: white;\n                }\n\n                .camera .card-actions{\n                    display: flex;\n                }\n\n                .output{\n                    display: flex;\n                    flex-direction: column; \n                    justify-items: center;\n                    align-items: center;\n                }\n\n                #close_btn{\n                    \n                }\n\n            </style>\n\n            <paper-icon-button id=\"openbutton\" icon=\"image:camera-alt\"></paper-icon-button>\n\n            <paper-card id=\"camera\" class=\"camera\" style=\"display: none;\">\n                <div class=\"card-content\">\n                    <video id=\"video\"></video>\n                </div>\n                <div class=\"card-actions\">\n                    <paper-icon-button id=\"close_btn\" icon=\"close\"></paper-icon-button>\n                    <span style=\"flex-grow: 1;\"></span>\n                    <paper-icon-button id=\"startbutton\" icon=\"image:add-a-photo\"></paper-icon-button>\n                    <paper-input label=\"width\" type=\"number\" no-label-float  id=\"width-input\" style=\"padding-left: 10px; width: 5em; text-align: right; vertical-align: baseline;\">\n                        <div slot=\"suffix\">px</div>\n                    </paper-input>\n                </div>\n            </paper-card>\n\n            <canvas id=\"canvas\" style=\"display: none;\">\n            </canvas>\n\n            <div class=\"output\" style=\"display: flex;>\n              <img id=\"photo\" alt=\"The screen capture will appear in this box.\">\n            </div>\n        ";
        this._width_inupt = this.shadowRoot.getElementById('width-input');
        this._video = this.shadowRoot.getElementById('video');
        this._canvas = this.shadowRoot.getElementById('canvas');
        this._photo = this.shadowRoot.getElementById('photo');
        this._startbutton = this.shadowRoot.getElementById('startbutton');
        this._openbutton = this.shadowRoot.getElementById('openbutton');
        this._closebutton = this.shadowRoot.getElementById('close_btn');
        this._camera = this.shadowRoot.getElementById('camera');
        var play = function (ev) {
            if (!_this._streaming) {
                _this._streaming = true;
            }
        };
        /**
         * Display the camera.
         */
        this._openbutton.onclick = function () {
            _this._openbutton.style.display = "none";
            _this._video.addEventListener('canplay', play, false);
            /**
             * This function's job is to request access to the user's webcam, initialize the
             * output <img> to a default state, and to establish the event listeners needed to
             * receive each frame of video from the camera and react when the button is clicked
             * to capture an image.
             */
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(function (stream) {
                _this._stream = stream;
                _this._video.srcObject = stream;
                _this.width = _this._width;
                _this._video.play();
                _this._camera.style.display = "";
                _this._startbutton.addEventListener('click', function (ev) {
                    _this.takepicture();
                    ev.preventDefault();
                }, false);
            })
                .catch(function (err) {
                console.log("An error occurred: " + err);
            });
        };
        this._closebutton.onclick = function () {
            _this._camera.style.display = "none";
            _this._openbutton.style.display = "";
            _this._video.pause();
            _this._stream.getTracks()[0].stop();
            _this._video.currentTime = 0;
            _this._video.removeEventListener('canplay', play);
        };
        /**
         * Rezise the camera input.
         */
        this._width_inupt.onchange = function () {
            _this.width = _this._width_inupt.value;
        };
    };
    Camera.prototype.takepicture = function () {
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
    };
    /**
     * Clear the canvas.
     */
    Camera.prototype.clearphoto = function () {
        var context = this._canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, this._canvas.width, this._canvas.height);
        var data = this._canvas.toDataURL('image/png');
        this._photo.setAttribute('src', data);
    };
    Camera.prototype.disconnectedCallback = function () {
    };
    return Camera;
}(HTMLElement));
export { Camera };
customElements.define('globular-camera', Camera);
//# sourceMappingURL=Camera.js.map