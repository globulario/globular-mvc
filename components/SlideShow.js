
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import "@polymer/iron-icons/av-icons";
import { theme } from "./Theme";
import "./Countdown"

export class SlideShow extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' });
        this.timeout = null;
        this.interval = null;
        this.isRunning = false;
        this.countdown = null;
        this.startBtn = null;
    }

    connectedCallback() {
        // default is fiteen seconds.
        this.delay = 1000 * 15
        if (this.hasAttribute("delay")) {
            this.delay = parseInt(this.getAttribute("delay")) * 1000
        }

        this.shadowRoot.innerHTML = `
        <style>
        ${theme}
            :host {
                --slidewidth: 1080px;
                --footerHeight: 40px;
                --slideContainerHeight: 1920px; 
                --slideHeight: calc(var(--slideContainerHeight) - var(--footerHeight));
                --inScreen: 0px;
                --offScreen: -1080px;
                --offScreenRight: var(--slidewidth);
            }


            .slides-container {
                position: relative;
                width: var(--slidewidth);
                height: var(--slideContainerHeight);
                overflow: hidden;
                margin: 0 auto;
            }
            
            footer {
                display: flex;
                justify-content: center;
                align-items: center;
                position: absolute;
                bottom: 20px;
                left: 0;
                width: 100%;
                height: var(--footerHeight);
                z-index: 99;
            }
            
            footer > span {
                position: relative;
                height: 40px;
                width: 40px;
                border-radius: 2rem;
                border: solid white;
                border-width: 3px;
                margin: 0 1rem;
            }
            
            #container{
                display: flex;
                flex-direction: column;
            }

            #countdown{
                position: absolute;
                top: 1px;
                left: 1px;
            }

            .marker:hover {
                cursor: pointer;
            }

            #start-btn{
                display: none;
                position: absolute;
            }
       
        </style>
        <paper-card id="container" class="container slides-container">
            <slot id="slides" name="slides"></slot>
            <footer id="footer">
                <globular-count-down id="countdown" countdown="${this.delay / 1000}" diameter="38" stroke="3" ></globular-count-down>
                <paper-icon-button id="start-btn" icon="av:play-circle-filled"></paper-icon-button>
            </footer>
            
        </paper-card>
        `

        this.startBtn = this.shadowRoot.getElementById("start-btn")
        this.countdown = this.shadowRoot.getElementById("countdown")

        this.startBtn.onclick = (evt) => {
            evt.stopPropagation();
            this.startBtn.style.display = "none"
            this.startBtn.parentNode.removeChild(this.startBtn)
            let markers = this.shadowRoot.querySelectorAll(".marker")
            for (var i = 0; i < markers.length; i++) {
                markers[i].style.backgroundColor = "";
            }
            this.start()
        }

        if (this.hasAttribute("backgroundColor")) {
            this.shadowRoot.getElementById("start-btn").getElementById("container").style.backgroundColor = this.getAttribute("backgroundColor")
        }
    }

    /**
     * Append a slide into the slideshow.
     * @param {*} html 
     */
    appendSlide(html) {

        // Here I will create the slide.
        let range = document.createRange()
        let slide = range.createContextualFragment(html)
        document.getElementById("slides").style.display = "relative"
        document.getElementById("slides").appendChild(slide)

        let marker = document.createElement("span");
        marker.style.position = "relative";
        let ripple = document.createElement("paper-ripple");
        ripple.classList.add("circle")
        ripple.setAttribute("recenters", "")
        marker.appendChild(ripple)
        marker.classList.add("marker")
        marker.id = document.getElementById("slides").lastChild.id
        marker.style.borderColor = document.getElementById("slides").lastChild.marker
        this.shadowRoot.getElementById("footer").appendChild(marker)
        let markeyId = document.getElementById("slides").lastChild.id

        marker.onclick = () => {
            this.stop();

            // Here I will rotate the slide.
            while (document.getElementById("slides").childNodes[1].id != markeyId) {
                let firstChild = document.getElementById("slides").firstChild
                document.getElementById("slides").removeChild(firstChild)
                document.getElementById("slides").appendChild(firstChild)
            }

            let markers = this.shadowRoot.querySelectorAll(".marker")
            for (var i = 0; i < markers.length; i++) {
                markers[i].style.backgroundColor = "";
            }

            let marker = this.shadowRoot.getElementById(markeyId)
            marker.style.backgroundColor = marker.style.borderColor

            // Here I will append the start button into the marker.
            marker.appendChild(this.startBtn)

            this.orderSlides();
        }

        // Set the slide order...
        this.orderSlides();

    }

    // set slice position
    orderSlides() {
        let slides = this.getSlides();
        for (var i = 0; i < slides.length; i++) {
            let s = slides[i]
            s.style.left = (i - 1) * s.offsetWidth + "px"
            let marker = this.shadowRoot.getElementById(s.id)
            if (i == 1) {
                this.countdown.setColor(marker.style.borderColor);
                marker.appendChild(this.countdown)
            }
        }

    }

    getSlides() {
        if (document.getElementById("slides") != undefined) {
            if (document.getElementById("slides").childNodes) {
                return document.getElementById("slides").childNodes
            }
        }
        return []; // empty array
    }


    // Rotate the slide to one position
    rotateSlide() {
        if (document.getElementById("slides") == undefined) {
            return
        }

        this.orderSlides();

        // rotate the slides.
        let firstChild = document.getElementById("slides").firstChild
        let w = firstChild.offsetWidth;
        document.getElementById("slides").style.transition = "all 1s ease-out"
        document.getElementById("slides").style.transform = `translateX(${-1 * w}px)`

        // Wait the time of animation delay and set back the div at it start position.
        setTimeout(() => {
            if (document.getElementById("slides") == undefined) {
                return
            }
            this.countdown.style.display = "none";
            document.getElementById("slides").style.transition = 'none';
            document.getElementById("slides").style.transform = `none`;
            document.getElementById("slides").removeChild(firstChild)
            document.getElementById("slides").appendChild(firstChild)
            this.orderSlides();
            this.countdown.start();
            this.countdown.style.display = "block";
        }, 1000)

    }

    /**
     * Start the slide show
     */
    start() {
        if (!this.isRunning) {
            this.countdown.style.display = "block"
            this.isRunning = true;
            this.countdown.start();
        }
        this.timeout = setTimeout(() => {
            // Remove the previous inteval...
            if (this.isRunning) {
                this.rotateSlide();
                this.start()
            }
        }, this.delay)
    }

    /**
     * Stop the slideshow
     */
    stop() {
        // Stop the running loop.
        this.countdown.stop()
        this.countdown.style.display = "none"
        this.countdown.parentNode.removeChild(this.countdown);

        if (this.timeout != null) {
            clearTimeout(this.timeout)
            this.timeout = null
            this.isRunning = false
            this.startBtn.style.display = "block";
        }
        console.log("the side show is now stopped!")
    }


}

customElements.define('globular-slide-show', SlideShow);


/**
 * Accept contact button.
 */
export class Slide extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.marker = "";
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
        ${theme}
        :host {
            --offWhite: white;
            --slidewidth: 1080px;
            --footerHeight: 40px;
            --slideContainerHeight: 1970px; 
            --slideHeight: var(--slideContainerHeight);
            --offScreen: -1080px;
            --offScreenRight: var(--slidewidth);
        }
           
        </style>

        <slot name="content"></slot>
        `

        this.style.position = "absolute";
        this.style.backgroundColor = "var(--offWhite)";
        this.style.boxSizing = "border-box";
        this.style.zIndex = "0"
        this.style.width = "var(--slidewidth)"
        this.style.height = "var(--slideHeight)"
        this.marker = this.getAttribute("marker")
    }
}

customElements.define('globular-slide', Slide)