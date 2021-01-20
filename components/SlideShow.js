
import '@polymer/paper-card/paper-card.js';

const shownClass = 'shown';
const hiddenClass = 'hidden';
const slideSelector = '.slide';

export class SlideShow extends HTMLElement {
    constructor() {
        super()
        this.slides;
        this.currentSlide = this.getSlideParam();
        this.slideCount = 0;
        this.rotate = true;
        this.defaultInterval = 30;
        this.slideInterval;
        this.slidesClasses = [];
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const template = document.createElement('template');
        this.shadowRoot.innerHTML = `
        <style>
            :root {
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
 
            .row {
                display: flex;
                -ms-flex-wrap: wrap;
                flex-wrap: wrap;
                margin-right: -1rem;
                margin-left: -1rem;
            }
            
            .slides-container {
                position: relative;
                width: var(--slidewidth);
                height: var(--slideContainerHeight);
                overflow: hidden;
                margin: 0 auto;
            }
            
            .slide {
                position: absolute;
                width: var(--slidewidth);
                height: var(--slideHeight);
                background-color: var(--offWhite);
                box-sizing: border-box;
                padding-bottom: 10px;
                animation: slideOut 0.5s ease forwards;
                z-index: 0;
            }
            
            .slide.hidden {
                position: absolute;
                right: var(--offScreen);
            }
            
            .slide.shown {
                animation: slideIn 0.5s ease forwards;
                z-index: 1
            }

            #container{
                display: flex;
                flex-direction: column;
            }
            
            @keyframes slideIn {
                0% { 
                    transform: translate(var(--offScreen));
                }
                100% { 
                    transform: translate(var(--inScreen));
                }
            }
            
            @keyframes slideOut {
                0% { 
                    transform: translate(var(--inScreen));
                }
                100% { 
                    transform: translate(var(--offScreenRight)); 
                }
            }
        </style>
        <paper-card class="container">
            <slot name="slides"></slot>
        </paper-card>
        `
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.slides = document.querySelectorAll(slideSelector);
        this.setSlidesClassesList();
        this.staticSlideClass = this.slidesClasses[0];
        this.setRotate();
        if (this.rotate) {
            this.setSlideCount();
            this.initSlidesShow();
        } else {
            this.showSlide(this.staticSlideClass);
        }
    }

    /**
     * set slide list with selector located in second position of the slide class
     * * * @example class="slide qualite-possible"
     **/
    setSlidesClassesList() {
        Array.from(this.slides).forEach(slide => {
            this.slidesClasses.push(`.${slide.classList.item(1)}`);
        })
    }

    /**
     * use to whow a specifc slide whithout rotation
     * * @example ?rotate=false&slide=3
     * *use to whow a set rotation speed 
     * * @example ?interval=1
     **/
    setRotate() {
        const url = new URL(window.location.href);
        const rotateParam = url.searchParams.get('rotate')
        const paramSlide = Number(url.searchParams.get('slide'));
        const rotation = rotateParam === 'false' ? false: true;
        const paramInterval = Number(url.searchParams.get('interval'));
        if (!rotation) this.rotate = rotation;
        if (!this.rotate) this.staticSlideClass = this.slidesClasses[paramSlide - 1];
        this.setSlideInterval(paramInterval || this.defaultInterval);
    }

    getSlideParam() {
        const url = new URL(window.location.href);
        const slideNumber = url.searchParams.get('slide');
        return slideNumber ? slideNumber - 1 : 0;
    }

    setSlideInterval(interval) {
        this.slideInterval = interval * 1000; // secondes en millisecondes
    }

    initSlidesShow() {
        this.showCurrentSlide();
        setInterval(() => {
            this.showNextSlide()
        }, this.slideInterval);
    }

    showNextSlide() {
        Array.from(this.slides).forEach(slide => {
            slide.classList.remove(shownClass);
        });
        this.showCurrentSlide();
    }

    showCurrentSlide() {
        if (this.currentSlide === this.slideCount) this.currentSlide = 0;
        this.currentSlide = ++this.currentSlide;
        if (this.slidesClasses.length) {
            sessionStorage.setItem('currentSlide', this.currentSlide);
            this.showSlide(this.slidesClasses[this.currentSlide - 1]);
        }
    }

    showSlide(currentSlideClass) {
        const slide = document.querySelector(currentSlideClass);
        slide.classList.remove(hiddenClass);
        slide.classList.add(shownClass);
        this.addClassToBody(currentSlideClass);
    }

    addClassToBody(currentSlideClass) {
        document.body.classList.value = currentSlideClass.replace('.', '');
    }

    setSlideCount() {
        this.slideCount = this.slides.length;
    }
}

customElements.define('globular-slide-show', SlideShow);