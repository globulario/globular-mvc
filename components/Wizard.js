import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-badge/paper-badge.js';
import '@polymer/paper-tooltip/paper-tooltip.js';
import '@polymer/paper-radio-button/paper-radio-button.js';
import '@polymer/paper-radio-group/paper-radio-group.js';
import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-spinner/paper-spinner.js';
import { theme } from "./Theme";
import { Model } from '../Model';

/**
 * Search Box
 */
export class Wizard extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // The list of page.
        this.pages = [];

        // The list of steps buttons.
        this.stepsButton = [];

        // the page content.
        this.content = null;

        // the div where action are listed.
        this.stepsDiv = null;

        // the last page to display before closing the wizard
        this.summaryPage = null;

        // the initial width
        this.width = 500;

        // the current index.
        this.index = 0;

        // A function pointer call we the all is done
        this.ondone = null;

        // A function call before close the wizard
        this.onclose = null;
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            paper-card h3 {
                margin-block-end: 0px;
            }

            paper-input iron-icon{
                margin-right: 10px;
            }

            paper-tooltip p{
                min-width:200px; 
                font-size: 1.35em;
            }

            .step-number{
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                 margin: 0px 10px 0px 10px;
                width: 30px;
                height: 30px;
                border-radius: 17px;
                border:  2px solid var(--palette-action-disabled);
                color: var(--palette-action-disabled);
            }

            .step-number paper-ripple {
                display: none;
            }

            .step-number paper-ripple:hover {
                cursor: pointer;
            }

            .step-number.disable{
                border:  2px solid var(--palette-action-disabled);
                background-color: var(--palette-action-disabledBackground);
            }

            .step-number.active{
                border-color: var(--palette-action-active);
                color: var(--palette-text-primary);
                background-color: var(--palette-background-paper);
            }

            .step-number.active paper-ripple {
                display: block;
            }


            .step-number.disable paper-ripple {
                display: block;
            }

            #container{
                overflow: hidden;
            }

            #pages{
                display: flex;
                transition: transform .6666s;
            }

            .card-content {
                padding: 0px;
                margin: 0px;
            }

            .step-number:hover{
                cursor: pointer;
            }

        </style>

        <paper-card id="container">

            <div class="card-content" id="card-content">
                <div id="pages"></div>
                <div id="summary_page"></div>
            </div>

            <div class="card-actions" id="card-actions">
                <div id="step-numbers" style="display: flex; flex-grow: 1;"></div>
                <paper-button id="previous_btn" style="display:none">previous</paper-button>
                <paper-button id="next_btn">next</paper-button>
                <paper-button id="done_btn" style="display:none">Done</paper-button>
                <paper-button id="close_btn" style="display:none">Close</paper-button>
            </div>
        </paper-card>
        `
        this.container = this.shadowRoot.getElementById("container")
        this.content = this.shadowRoot.getElementById("card-content")
        this.pagesDiv = this.shadowRoot.getElementById("pages")
        this.stepsDiv = this.shadowRoot.getElementById("card-actions")
        this.stepsNumberDiv = this.shadowRoot.getElementById("step-numbers")

        this.container.style.width = this.width + "px"
        this.container.style.overflow = "hidden"

        // Action 
        this.nexBtn = this.shadowRoot.getElementById("next_btn")
        this.previousBtn = this.shadowRoot.getElementById("previous_btn")
        this.doneBtn = this.shadowRoot.getElementById("done_btn")
        this.closeBtn = this.shadowRoot.getElementById("close_btn")

        // go to next page.
        this.nexBtn.onclick = () => {
            this.next()
        }

        this.previousBtn.onclick = () => {
            this.previous()
        }


        this.doneBtn.onclick = () =>{
            // hide the content.
            this.nexBtn.style.display = "none"
            this.previousBtn.style.display = "none"
            this.doneBtn.style.display = "none"
            this.stepsNumberDiv.style.display = "none"
            this.pagesDiv.style.display = "none"
            this.pagesDiv.style.transform = `translate(0px)`
            // Show the close btn.
            this.closeBtn.style.display = "block"

            // append the summary page.
            if(this.summaryPage != undefined){
                this.getElementById("summary_page").appendChild(this.summaryPage)
            }
            if(this.ondone != null){
                this.ondone()
            }
        }

        // Close the wizard.
        this.closeBtn.onclick = ()=>{
            this.parentNode.removeChild(this)
            if(this.onclose != null){
                this.onclose()
            }
        }
    }

    // The first page of the wizard to explain what will follow.
    getPage(index) {
        return this.pages[index];
    }

    // Use it to get elment from inside wizard dom.
    getElementById(id) {
        return this.shadowRoot.getElementById(id)
    }

    // Return list of element by their classname.
    getElementsByClassName(className) {
        return this.shadowRoot.querySelectorAll("." + className)
    }

    // Set the summary page.
    setSummaryPage(content){
        this.summaryPage = document.createElement("div")
        content.style.padding = "15px"
        this.summaryPage.style.minWidth = this.width + "px"
        this.summaryPage.style.maxWidth = this.width + "px"
        this.summaryPage.appendChild(content)
    }

    // Append a configuration page.
    appendPage(content) {
        // Create the page div.
        let page = document.createElement("div")
        content.style.padding = "15px"
        page.id = "page_" + this.pages.length + 1
        page.style.minWidth = this.width + "px"
        page.style.maxWidth = this.width + "px"

        page.appendChild(content)

        this.pagesDiv.appendChild(page)
        let stepNumberBtn = document.createElement("div")
        stepNumberBtn.className = "step-number"
        stepNumberBtn.innerHTML = `
            ${this.pages.length}
            <paper-ripple class="circle" recenters></paper-ripple>`

        stepNumberBtn.index = this.pages.length

        this.stepsNumberDiv.appendChild(stepNumberBtn)
        if (stepNumberBtn.index == 0) {
            stepNumberBtn.classList.add("active")
        }

        this.pages.push(this.content.lastElementChild)

        this.stepsButton.push(stepNumberBtn)

        // set the step number button action.
        stepNumberBtn.onclick = () => {
            if (!stepNumberBtn.classList.contains("active") && !stepNumberBtn.classList.contains("disable")) {
                return;
            }

            this.index = stepNumberBtn.index

            for (var i = 0; i < this.pages.length; i++) {
                if (this.stepsButton[i].classList.contains("active") || this.stepsButton[i].classList.contains("disable")) {
                    this.stepsButton[i].classList.remove("active")
                    this.stepsButton[i].classList.add("disable")
                }
            }

            this.stepsButton[this.index].classList.add("active")
            this.pagesDiv.style.transform = `translate(${this.index * this.width * -1}px)`

            // show the next button.
            if (this.index < this.pages.length - 1 &&  this.pages.length > 1) {
                this.nexBtn.style.display = "block"
            }else{
                this.nexBtn.style.display = "none"
            }

            // show the close button
            if (this.index == this.pages.length - 1) {
                this.nexBtn.style.display = "none"
                this.doneBtn.style.display = "block"
            }else{
                this.doneBtn.style.display = "none"
            }

            // show the previous button
            if (this.index > 0 && this.pages.length > 1) {
                this.previousBtn.style.display = "block";
            }else{
                this.previousBtn.style.display = "none";
            }
        }

    }

    disableNextBtn() {
        this.nexBtn.setAttribute("disabled")
    }

    enableNextBtn() {
        this.nexBtn.removeAttribute("disabled")
    }

    /**
     * Display the next page.
     */
    next() {
        
        if (this.index < this.pages.length - 1) {
            this.index++
            this.nexBtn.style.display = "block"
            this.pagesDiv.style.transform = `translate(${this.index * this.width * -1}px)`
        }

        // show the close button
        if (this.index == this.pages.length - 1) {
            this.nexBtn.style.display = "none"
            this.doneBtn.style.display = "block"
        }

        // show the previous button
        if (this.pages.length > 1) {
            this.previousBtn.style.display = "block";
        }

        // Now the steps button.
        for (var i = 0; i < this.pages.length; i++) {
            if (this.stepsButton[i].classList.contains("active") || this.stepsButton[i].classList.contains("disable")) {
                this.stepsButton[i].classList.remove("active")
                this.stepsButton[i].classList.add("disable")
            }
        }

        this.stepsButton[this.index].classList.add("active")

        // publish local event.
        if (!this.stepsButton[this.index].classList.contains("disable")) {
            Model.eventHub.publish("wizard_next_page_evt", {index: this.index, nextBtn: this.stepsButton[this.index]}, true)
        }

    }

    previous() {
        if (this.index > 0) {
            this.index--
            this.pagesDiv.style.transform = `translate(${this.index * this.width * -1}px)`
        }

        if (this.index == 0) {
            this.previousBtn.style.display = "none";
        }

        if (this.pages.length > 1 && this.index < this.pages.length - 1) {
            this.nexBtn.style.display = "block";
            this.doneBtn.style.display = "none"
        } else {
            this.doneBtn.style.display = "block"
        }

        for (var i = 0; i < this.pages.length; i++) {
            if (this.stepsButton[i].classList.contains("active") || this.stepsButton[i].classList.contains("disable")) {
                this.stepsButton[i].classList.remove("active")
                this.stepsButton[i].classList.add("disable")
            }
        }
        this.enableNextBtn()
        this.stepsButton[this.index].classList.add("active")
    }

    
}

customElements.define('globular-wizard', Wizard)