import { ApplicationView } from "../ApplicationView"
import { fireResize } from "./utility"

var mininizeableBar = null

/**
 * That function is use to manage windows on the desktop. 
 * 
 * @param {*} onMinimize The function must contain the title and the thumbnail of the window.
 */
export function setMinimizeable(header, element, id, name, icon) {
    if (mininizeableBar == null) {
        mininizeableBar = new MininizeableBar()
    }

    // append it to the workspace.
    ApplicationView.layout.workspace().appendChild(mininizeableBar)

    // first of all I will find the close button
    let buttons = header.querySelectorAll("paper-icon-button")
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].icon) {
            if (buttons[i].icon == "icons:close") {

                // append minimizeable element to the bar...
                let group = mininizeableBar.insertMinimizable(element, id, name, icon)

                // Set the minimize listener...
                element.onMinimize = ()=>{
                    group.showContent()
                    setTimeout(()=>{
                        group.hideContent()
                    }, 3500)
                }

                let maximizeBtn = document.createElement("paper-icon-button")
                maximizeBtn.icon = "icons:add"
                maximizeBtn.style.position = "absolute"
                maximizeBtn.style.top = "0px"
                maximizeBtn.style.right = "0px"
                maximizeBtn.style.display = "none"

                let closeBtn = buttons[i];
                closeBtn.insertAdjacentHTML('afterend', `<paper-icon-button id="minimize-btn" icon="icons:remove" style="min-width: 40px; --iron-icon-fill-color: var(--palette-text-accent);"></paper-icon-button>`)
                closeBtn.addEventListener("click", (evt) => {
                    mininizeableBar.removeMinimizable(id, name)
                })

                // Here will add the maximize button...
                maximizeBtn.addEventListener("click", (evt) => {
                    evt.stopPropagation()
                    if (element.isMinimized) {
                        maximizeBtn.style.display = "none"
                        group.maximize(id)

                        // set back the close button to it original place.
                        closeBtn.style.position = ""
                        closeBtn.style.top = ""
                        closeBtn.style.left = ""
                        header.insertBefore(closeBtn, header.firstChild)
                        if (group.children.length == 0) {
                            group.parentNode.style.display = "none"
                        } else if (group.children.length == 1) {
                            if (group.children[0].children.length == 0) {
                                group.parentNode.style.display = "none"
                            }
                        }
                    }
                })


                // The onclick event...
                let minimizeBtn = header.querySelector("#minimize-btn")
                minimizeBtn.onclick = () => {
                    maximizeBtn.style.display = "block"
                    group.parentNode.style.display = ""
                    mininizeableBar.minimize(id, name)

                    // set the close btn
                    closeBtn.style.position = "absolute"
                    closeBtn.style.top = "0px"
                    closeBtn.style.left = "0px"
                    element.appendChild(closeBtn)
                }


                element.style.position = "relative"
                element.appendChild(maximizeBtn)

                break
            }
        }
    }

}


/**
 *  Help to managed windows on a descktop.
 */
export class MininizeableBar extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Keep track of minimized elements.
        this.minimizeables = {}

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
                z-index: 10;
            }

            ::slotted(globular-minimizeable-group){
                margin-left: 6px;
                margin-top: 6px;
            }

            ::slotted(globular-minimizeable-group:hover){
                cursor: pointer;

            }

        </style>
        <div id="container">
            <slot></slot>
        </div>
        `
        // give the focus to the input.
        window.addEventListener('resize', () => {
            // set the postion to 0, 0
            let w = ApplicationView.layout.width();
            let container = this.shadowRoot.querySelector("#container")
            if (w < 500) {
                container.style.flexDirection = "column"
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].setVertical()
                }
            } else {
                container.style.flexDirection = "row"
                for (var i = 0; i < this.children.length; i++) {
                    this.children[i].setHorizontal()
                }
            }
        })
    }

    connectedCallback() {
        fireResize()
    }

    /**
     * Add minizable window in the bar.
     * @param {*} element 
     * @param {*} onMinimize 
     * @param {*} onMaximize 
     * @param {*} onClose 
     * @param {*} onPreview 
     */
    insertMinimizable(element, id, name, icon) {

        let minimizeables = this.querySelector("#" + name)

        if (!minimizeables) {
            // Here I will create the minimizables group...
            minimizeables = new MinimizeableGroup(name, icon)
            minimizeables.id = name
            this.appendChild(minimizeables)
            fireResize() // set the group direction...
        }

        minimizeables.insertMinimizable(element, id, name, icon)
        return minimizeables
    }

    removeMinimizable(id, name) {
        let minimizeables = this.querySelector("#" + name)
        minimizeables.removeMinimizable(id, name)
        if (this.children.length == 0) {
            this.parentNode.removeChild(this)
        }
    }

    minimize(id, name) {
        // Hide the div...
        let minimizeables = this.querySelector("#" + name)
        minimizeables.minimize(id)
    }
}

customElements.define('globular-mininizeable-bar', MininizeableBar)

/**
 * Minimizable elements group
 */
export class MinimizeableGroup extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(name, icon) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.id = name

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                background-color: var(--palette-primary-accent);
                color: var(--palette-text-primary);
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
                border-radius: 3px;
                display: none;
            }

            .big{
                --iron-icon-height: 24px;
                --iron-icon-width: 24px;
            }

            .active{
                border-bottom: 1px solid rgb(12, 72, 98);
            }

            #content{
                display: flex;
                position: absolute;
            }

        </style>
        <div id="container">
            <div style="position: relative;">
                <iron-icon style="padding: 5px;" class="big" icon="${icon}"></iron-icon>
                <paper-ripple style="border-radius: 3px;" recenters></paper-ripple>
                <div id="content">
                    <slot><slot>
                </div>
            </div>
            
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

        container.onclick = () => {

            let isVisible = this.isContentVisible()

            let groups = document.getElementsByTagName("globular-minimizeable-group")
            for (var i = 0; i < groups.length; i++) {
                groups[i].resetActive()
                groups[i].hideContent()
            }

            if (!isVisible) {
                this.showContent()
                this.setActive();
            } else {
                this.hideContent()
            }

        }
    }

    isVisible() {
        let container = this.shadowRoot.querySelector("#container")
        return container.style.display != "none"
    }

    isContentVisible() {
        let content = this.shadowRoot.querySelector("#content")
        return content.style.display != "none"
    }

    hide() {
        let container = this.shadowRoot.querySelector("#container")
        container.style.display = "none"
    }

    show() {
        let container = this.shadowRoot.querySelector("#container")
        container.style.display = "block"
    }

    hideContent() {
        let content = this.shadowRoot.querySelector("#content")
        content.style.display = "none"
    }

    showContent() {
        let content = this.shadowRoot.querySelector("#content")
        content.style.display = "block"
    }

    setActive() {
        let container = this.shadowRoot.querySelector("#container")
        container.classList.add("active")
    }

    resetActive() {
        let container = this.shadowRoot.querySelector("#container")
        container.classList.remove("active")
    }

    // insert the minimizable element.
    insertMinimizable(element, id, onMinimize, onMaximize, onClose, onPreview) {
        if (!this.querySelector("#" + id)) {
            let minimizable = new MinimizeableElement(element, id, onMinimize, onMaximize, onClose, onPreview)
            minimizable.id = id
            this.appendChild(minimizable)
        }
    }

    removeMinimizable(id) {
        let minimizeable = this.querySelector("#" + id)
        if (minimizeable) {
            minimizeable.parentNode.removeChild(minimizeable)
        }

        // no more item to display...
        if (this.children.length == 0) {
            this.parentNode.removeChild(this)
        }
    }

    minimize(id) {

        let minimizeableElement = this.querySelector("#" + id)
        minimizeableElement.style.display = "";
        minimizeableElement.minimize()
    
        let groups = document.getElementsByTagName("globular-minimizeable-group")
        for (var i = 0; i < groups.length; i++) {
            if (this.id != groups[i].id)
                groups[i].hideContent()
            groups[i].resetActive()
        }

        this.resetActive()
        this.show()
        this.showContent()

        setTimeout(() => {
            this.hideContent()
        }, 3500)
    }

    maximize(id) {
        let minimizeableElement = this.querySelector("#" + id)
        minimizeableElement.style.display = "none";
        minimizeableElement.maximize()

    }

    setVertical() {
        let content = this.shadowRoot.querySelector("#content")
        content.style.flexDirection = "column"
        content.style.bottom = ""
        content.style.left = "40px"
        content.style.top = "0px"
    }

    setHorizontal() {
        let content = this.shadowRoot.querySelector("#content")
        content.style.flexDirection = "row"
        content.style.bottom = "40px"
        content.style.left = "0px"
        content.style.top = ""
    }

}

customElements.define('globular-minimizeable-group', MinimizeableGroup)

/**
 * Minimizable element
 */
export class MinimizeableElement extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(element, id) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.element = element;
        this.id = id

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #container{
               
            }
        </style>
        <div id="container">
            <slot><slot>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
    }


    minimize() {
        this.element.minimize()
        this.appendChild(this.element)
    }

    maximize(){
        this.element.maximize()
        this.element.style.display = ""
    }

}

customElements.define('globular-minimizeable-element', MinimizeableElement)