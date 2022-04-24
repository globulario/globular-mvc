
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import "@polymer/iron-icons/av-icons";
import { theme } from "./Theme";
import { Model } from '../Model';
import { Countdown } from './Countdown';

export class SlideShow extends HTMLElement {
    constructor(delay) {
        super()

        // Set the default delay values...
        if(delay==undefined){
            delay = 15
        }

        this.attachShadow({ mode: 'open' });
        this.interval = null;
        this.isRunning = false;
        this.countdown = null;
        this.startBtn = null;
        this.lastActiveSlide = null;

        // Settings event
        Model.eventHub.subscribe(
            "settings_event_",
            (uuid) => {
                this.settings_event_listener = uuid;

            },
            () => {
                this.stop();
                
            },
            true, this
        );

        // Settings event
        Model.eventHub.subscribe(
            "save_settings_evt",
            (uuid) => {
                this.save_settings_event_listener = uuid;
            },
            (saveSetting) => {
                this.start()
            },
            true, this
        );

        // default is fiteen seconds.
        this.delay = 1000 * delay // transform it in milisecond.
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
                        color: var(--palette-text-accent);
                        --paper-icon-button-ink-color: var(--palette-text-accent);
                    }

                    #slides{
                        position: relative;
                    }
               
                </style>
                <paper-icon-button id="start-btn" icon="av:play-circle-filled"></paper-icon-button>
                <paper-card id="container" class="container slides-container">
                    <div id="slides" >
                        <slot></slot>
                    </div>
                    <footer id="footer">
                    </footer>
                </paper-card>
                `

        this.startBtn = this.shadowRoot.getElementById("start-btn")
        this.startBtn.parentNode.removeChild(this.startBtn)

        // equivalent to <globular-count-down id="countdown" countdown="${this.delay / 1000}" diameter="38" stroke="3" ></globular-count-down>
        this.countdown = new Countdown(this.delay / 1000, 38, 3)
        this.countdown.id = "countdown"
        this.countdown.oncountdone = ()=>{
            if (this.isRunning) {
                this.rotateSlide();
                this.start()
            }
        }

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

    connectedCallback() {
        // Here I will add each slides in order to create theire marker...
        for(var i=0; i < this.childNodes.length; i++){
            let slide = this.childNodes[i]
            // That will create the slide marker
            this.createMarker(slide.id)
        }
    }

    setDelay(delay){
        this.delay = delay * 1000

        // The countdown must be recreate...
        let parentNode = this.countdown.parentNode;
        if(parentNode != null){
            parentNode.removeChild(this.countdown)
        }
        this.countdown.stop();
        this.countdown = new Countdown(this.delay / 1000, 38, 3)
        this.countdown.id = "countdown"
        this.countdown.oncountdone = ()=>{
            if (this.isRunning) {
                this.rotateSlide();
                this.start()
            }
        }

        if(parentNode != null){
            parentNode.appendChild(this.countdown)
            this.countdown.start()
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
        let id = slide.children[0].id

        // In the case of existing slide I will only set 
        // the slide itself.
        if (this.querySelector("#" + id) != undefined) {
            let toDelete = this.querySelector("#" + id)
            this.replaceChild(slide, toDelete)
        }else{
            this.appendChild(slide)
        }

        // Create the marker.
        this.createMarker(id)


        // Set the slide order...
        this.orderSlides();
    }

    createMarker(id){
        // if the marker already exist I will do nothing.
        if( this.shadowRoot.getElementById(id) !=undefined){
            return
        }

        let marker = document.createElement("span");
        marker.style.position = "relative";
        let ripple = document.createElement("paper-ripple");
        ripple.classList.add("circle")
        ripple.setAttribute("recenters", "")
        marker.appendChild(ripple)
        marker.classList.add("marker")
        marker.id =  id 
        marker.style.borderColor = this.lastChild.marker
        this.shadowRoot.getElementById("footer").appendChild(marker)
        marker.onclick = () => {
            this.stop();

            // Here I will rotate the slide.
            while (this.childNodes[1].id != id) {
                let firstChild = this.firstChild
                this.removeChild(firstChild)
                this.appendChild(firstChild)
            }

            let markers = this.shadowRoot.querySelectorAll(".marker")
            for (var i = 0; i < markers.length; i++) {
                markers[i].style.backgroundColor = "";
            }

            let marker = this.shadowRoot.getElementById(id)
            marker.style.backgroundColor = marker.style.borderColor

            // Here I will append the start button into the marker.
            marker.appendChild(this.startBtn)

            this.orderSlides();
        }
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
        return this.children; // empty array
    }


    // Rotate the slide to one position
    rotateSlide() {
        if (this.children.length == 0) {
            return
        }

        this.orderSlides();

        // rotate the slides.
        let w = this.firstElementChild.offsetWidth;
        this.shadowRoot.getElementById("slides").style.transition = "all 1s ease-out"
        this.shadowRoot.getElementById("slides").style.transform = `translateX(${-1 * w}px)`

        // Wait the time of animation delay and set back the div at it start position.
        setTimeout(() => {
            
            if (this.children.length == 0) {
                return
            }

            this.countdown.style.display = "none";
            this.shadowRoot.getElementById("slides").style.transition = 'none';
            this.shadowRoot.getElementById("slides").style.transform = `none`;
            let firstChild = this.firstElementChild
            this.removeChild(firstChild)
            this.appendChild(firstChild)
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
            if (this.startBtn.parentNode != undefined) {
                return;
            }

            this.countdown.style.display = "block"
            this.isRunning = true;
            if (this.countdown.parentNode == undefined && this.lastActiveSlide != undefined) {
                this.lastActiveSlide.appendChild(this.countdown);
            }

            this.countdown.start();
        }
    }

    /**
     * Stop the slideshow
     */
    stop() {

        // Stop the running loop.
        this.countdown.stop()
        this.countdown.style.display = "none"
        if (this.countdown.parentNode != undefined) {
            this.lastActiveSlide = this.countdown.parentNode;
            this.countdown.parentNode.removeChild(this.countdown);
        }

        this.isRunning = false
        this.startBtn.style.display = "block";
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