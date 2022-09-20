export var AUDIO = AUDIO || {};

AUDIO.VISUALIZER = (function () {
    'use strict';

    var FFT_SIZE = 512;
    var TYPE = {
        'lounge': 'renderLounge'
    };

    /**
     * @description
     * Visualizer constructor.
     *
     * @param {Object} cfg
     */
    function Visualizer(cfg) {
        this.isPlaying = false;
        this.autoplay = cfg.autoplay || false;
        this.loop = cfg.loop || false;
        this.canvas = document.getElementById(cfg.canvas) || {};
        this.canvasCtx = this.canvas.getContext('2d') || null;
        this.ctx = null;
        this.analyser = null;
        this.sourceNode = null;
        this.frequencyData = [];
        this.style = cfg.style || 'lounge';
        this.barWidth = cfg.barWidth || 2;
        this.barHeight = cfg.barHeight || 2;
        this.barSpacing = cfg.barSpacing || 5;
        this.barColor = cfg.barColor || '#ffffff';
        this.shadowBlur = cfg.shadowBlur || 10;
        this.shadowColor = cfg.shadowColor || '#ffffff';
        this.font = cfg.font || ['12px', 'Helvetica'];
        this.gradient = null;
        this.title = ""
        this.featuring = ""
        this.author = ""
        this.url = ""
        this.time = "00:00:00"
    }


    /**
     * Set the context reference
     */
    Visualizer.prototype.setContext = function (ctx) {
        this.ctx = ctx;
        return this;
    }

    /**
     * @description
     * Set buffer analyser.
     *
     * @return {Object}
     */
    Visualizer.prototype.setAnalyser = function () {
        this.analyser = this.ctx.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.6;
        this.analyser.fftSize = FFT_SIZE;
        return this;
    };

    /**
     * @description
     * Set frequency data.
     *
     * @return {Object}
     */
    Visualizer.prototype.setFrequencyData = function () {
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        return this;
    };

    /**
     * @description
     * Set source buffer and connect processor and analyser.
     *
     * @return {Object}
     */
    Visualizer.prototype.setBufferSourceNode = function (sourceNode) {
        if(!sourceNode){
            return
        }else{
            this.analyser.disconnect()
        }
        
        
        this.sourceNode = sourceNode;
        this.sourceNode.connect(this.analyser);

        return this;
    };


    /**
     * @description
     * Set canvas gradient color.
     *
     * @return {Object}
     */
    Visualizer.prototype.setCanvasStyles = function () {
        this.gradient = this.canvasCtx.createLinearGradient(0, 0, 0, 300);
        this.gradient.addColorStop(1, this.barColor);
        this.canvasCtx.fillStyle = this.gradient;
        this.canvasCtx.shadowBlur = this.shadowBlur;
        this.canvasCtx.shadowColor = this.shadowColor;
        this.canvasCtx.font = this.font.join(' ');
        this.canvasCtx.textAlign = 'center';
        return this;
    };

    /**
     * @description
     * Bind click events.
     *
     * @return {Object}
     */
    Visualizer.prototype.bindEvents = function () {
        this.canvas.onclick = (e) => {
            e.stopPropagation();
            if (this.onclick) {
                this.onclick()
            }
        }
    };

    /**
     * @description
     * Play sound from the given buffer.
     *
     * @param  {Object} buffer
     */
    Visualizer.prototype.start = function (time) {
 
        this.isPlaying = true;
        this.renderFrame();
    };

    /**
     * @description
     * Stop the visualiser
     */
    Visualizer.prototype.stop = function () {
        this.isPlaying = false;
        this.renderTime()
    }

    /**
     * @description
     * Pause current sound.
     */
    Visualizer.prototype.pause = function () {
        this.isPlaying = false;
    };

    /**
     * @description
     * On audio data stream error fn.
     *
     * @param  {Object} e
     */
    Visualizer.prototype.onError = function (e) {
        console.info('Error decoding audio file. -- ', e);
    };

    /**
     * @description
     * Render frame on canvas.
     */
    Visualizer.prototype.renderFrame = function () {
        requestAnimationFrame(this.renderFrame.bind(this));
        this.analyser.getByteFrequencyData(this.frequencyData);

        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderTime();
        this.renderText();
        this.renderByStyleType();
    };

    /**
     * @description
     * Render audio author and title.
     */
    Visualizer.prototype.renderText = function () {
        var cx = this.canvas.width / 2;
        var cy = this.canvas.height / 2;
        var correction = 10;

        let author = ""
        let featuring = ""

        if (this.author) {
            author = "by " + this.author
        }

        if (this.featuring) {
            featuring = "ft. " + this.featuring
        }

        this.canvasCtx.textBaseline = 'top';
        this.canvasCtx.fillText(author, cx + correction, cy);
        this.canvasCtx.fillText(featuring, cx + correction, cy + 20);

        this.canvasCtx.font = parseInt(this.font[0], 10) + 8 + 'px ' + this.font[1];
        this.canvasCtx.textBaseline = 'bottom';

        this.canvasCtx.fillText(this.title, cx + correction, 80);
        this.canvasCtx.font = this.font.join(' ');
    };

    /**
     * @description
     * Render audio time.
     */
    Visualizer.prototype.renderTime = function () {
        if (this.featuring) {
            this.canvasCtx.fillText(this.time, this.canvas.width / 2 + 10, this.canvas.height / 2 + 60);
        } else {
            if (this.author) {
                this.canvasCtx.fillText(this.time, this.canvas.width / 2 + 10, this.canvas.height / 2 + 40);
            } else {
                this.canvasCtx.fillText(this.time, this.canvas.width / 2 + 10, this.canvas.height / 2 + 20);
            }
        }
    };

    /**
     * @description
     * Render frame by style type.
     *
     * @return {Function}
     */
    Visualizer.prototype.renderByStyleType = function () {
        return this[TYPE[this.style]]();
    };

    /**
     * @description
     * Render lounge style type.
     */
    Visualizer.prototype.renderLounge = function () {
        var cx = this.canvas.width / 2;
        var cy = this.canvas.height / 2;
        var radius = 140;
        var maxBarNum = Math.floor((radius * 2 * Math.PI) / (this.barWidth + this.barSpacing));
        var slicedPercent = Math.floor((maxBarNum * 25) / 100);
        var barNum = maxBarNum - slicedPercent;
        var freqJump = Math.floor(this.frequencyData.length / maxBarNum);

        for (var i = 0; i < barNum; i++) {
            var amplitude = this.frequencyData[i * freqJump];
            var alfa = (i * 2 * Math.PI) / maxBarNum;
            var beta = (3 * 45 - this.barWidth) * Math.PI / 180;
            var x = 0;
            var y = radius - (amplitude / 12 - this.barHeight);
            var w = this.barWidth;
            var h = amplitude / 6 + this.barHeight;

            this.canvasCtx.save();
            this.canvasCtx.translate(cx + this.barSpacing, cy + this.barSpacing);
            this.canvasCtx.rotate(alfa - beta);
            this.canvasCtx.fillRect(x, y, w, h);
            this.canvasCtx.restore();
        }
    };

    /**
     * @description
     * Create visualizer object instance.
     *
     * @param  {Object} cfg
     * {
     *     autoplay: <Bool>,
     *     loop: <Bool>,
     *     canvas: <String>,
     *     style: <String>,
     *     barWidth: <Integer>,
     *     barHeight: <Integer>,
     *     barSpacing: <Integer>,
     *     barColor: <String>,
     *     shadowBlur: <Integer>,
     *     shadowColor: <String>,
     *     font: <Array>
     * }
     * @return {Function}
     * @private
     */
    function _createVisualizer(cfg) {
        var visualizer = new Visualizer(cfg);

        return function () {
            visualizer
                .setCanvasStyles()
                .bindEvents();

            return visualizer;
        };

    }

    /**
     * @description
     * Get visualizer instance.
     *
     * @param  {Object} cfg
     * @return {Object}
     * @public
     */
    function getInstance(cfg) {
        return _createVisualizer(cfg)();
    }

    /**
     * @description
     * Visualizer module API.
     *
     * @public
     */
    return {
        getInstance: getInstance
    };
})();
