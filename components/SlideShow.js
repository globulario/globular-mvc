
import '@polymer/paper-card/paper-card.js';
import { isThisTypeNode } from 'typescript';
//import { theme } from "./Layout";
const shownClass = 'shown';
const hiddenClass = 'hidden';
const slideSelector = '.slide';

export class SlideShow extends HTMLElement {
    constructor() {
        super()
        this.slides;
        this.slideCount = 0;
        this.rotate = true;
        this.defaultInterval = 30;
        this.slideInterval;
        this.slidesClasses = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                --offWhite: white;
                --darkModerateCyan: #52828f;
                --purple: #901054;
                --darkBlue: #1f497d;
                --lightBlue: #0070c0;
                --yellow: #c5d21c;
                --darkGray: gray;
                --bleuPoudre: #43b5e7;
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
                position: absolute;
                bottom: 20px;
                left: 0;
                width: 100%;
                height: var(--footerHeight);
                z-index: 99;
            }
            
            footer > span {
                height: 32px;
                width: 32px;
                border-radius: 2rem;
                border: 3px solid white;
                margin: 0 1rem;
            }
            
            footer > span:first-child {
                border-color: var(--darkModerateCyan)
            }
            
            footer > span:nth-child(2) {
                border-color: var(--purple)
            }
            
            footer > span:last-child {
                border-color: var(--yellow)
            }

            #container{
                display: flex;
                flex-direction: column;
            }
       
        </style>
        <paper-card class="container slides-container">
            <slot id="slides" name="slides"></slot>
            <footer id="footer">
            </footer>
        </paper-card>
        `
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

        let marker = document.createElement("span")
        marker.id =  document.getElementById("slides").lastChild.id
        this.shadowRoot.getElementById("footer").appendChild(marker)

        marker.onclick = () => {
            console.log("---> show slide! and stop auto motion...")
        }

        // Set the slide order...
        this.orderSlides();

    }

    // set slice position
    orderSlides(){
        let slides = this.getSlides();
        for (var i = 0; i < slides.length; i++) {
            let s = slides[i]
            s.style.left = (i - 1) * s.offsetWidth + "px"
            let marker = this.shadowRoot.getElementById(s.id)
            if(i==1){
                console.log(marker.style)
                marker.style.backgroundColor = "lightgray";
            }else{
                marker.style.backgroundColor = ""
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

    rotateSlide() {
        setTimeout(() => {
 
            this.orderSlides();
            // rotate the slides.
            let firstChild = document.getElementById("slides").firstChild
            let w = firstChild.offsetWidth;

            document.getElementById("slides").style.transition = "all 1s ease-out"
            document.getElementById("slides").style.transform = `translateX(${-1*w}px)`

            // Wait the time of animation delay and set back the div at it start position.
            setTimeout(() => {
                document.getElementById("slides").style.transition = 'none';
                document.getElementById("slides").style.transform = `none`;

                document.getElementById("slides").removeChild(firstChild)
                document.getElementById("slides").appendChild(firstChild)
                this.orderSlides();
            }, 1000)


            // rotate again...
            this.rotateSlide()
        }, 3000)
    }

    /**
     * Start the slide show
     */
    start() {

        this.rotateSlide();
    }

    /**
     * Stop the slideshow
     */
    stop() {

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
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
        :host {
            --offWhite: white;
            --slidewidth: 1080px;
            --footerHeight: 40px;
            --slideContainerHeight: 1920px; 
            --slideHeight: calc(var(--slideContainerHeight) - var(--footerHeight));
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
    }
}

customElements.define('globular-slide', Slide)