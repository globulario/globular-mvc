import { ApplicationView } from "../ApplicationView"

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

    ApplicationView.layout.workspace().appendChild(mininizeableBar)

    // first of all I will find the close button
    let buttons = header.querySelectorAll("paper-icon-button")
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].icon) {
            if (buttons[i].icon == "icons:close") {

                // append minimizeable element to the bar...
                let group = mininizeableBar.insertMinimizable(element, id, name, icon)

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
                        element.maximize()
                        element.style.display = ""
                        group.parentNode.style.display = ""

                        // set back the close button to it original place.
                        closeBtn.style.position = ""
                        closeBtn.style.top = ""
                        closeBtn.style.left = ""
                        header.insertBefore(closeBtn, header.firstChild)
                        group.isVisible = false
                        if(group.children.length == 0){
                            group.parentNode.style.display = "none"
                        }else if(group.children.length == 1){
                            if(group.children[0].children.length == 0){
                                group.parentNode.style.display = "none"
                            }
                        }
                    }
                })


                // The onclick event...
                let minimizeBtn = header.querySelector("#minimize-btn")
                minimizeBtn.onclick = () => {
                    maximizeBtn.style.display = "block"
                    group.isVisible = false
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
                position: fixed;
                bottom: 10px;
                z-index: 10;
                transform: translateX(-50%);
                left: 50%;
            }

            ::slotted(globular-minimizeable-group){
                margin-right: 12px;
            }

        </style>
        <div id="container">
            <slot></slot>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")

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

        // 
    }

    maximize(div) {

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

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                background-color: var(--palette-primary-accent);
                color: var(--palette-text-primary);
                box-shadow: rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px;
                border-radius: 5px;
                display: none;
            }

            .big{
                --iron-icon-height: 32px;
                --iron-icon-width: 32px;
            }

            .active{
                border-bottom: 1px solid rgb(12, 72, 98);
            }

        </style>
        <div id="container">
            <div style="position: relative;">
                <iron-icon style="padding: 5px;" class="big" icon="${icon}"></iron-icon>
                <paper-ripple style="border-radius: 5px;" recenters></paper-ripple>
            </div>
            <slot><slot>
        </div>
        `
        // give the focus to the input.
        let container = this.shadowRoot.querySelector("#container")
        this.isVisible = false; // keep vvisibility state.

        container.onclick = ()=>{
            let elements = document.getElementsByTagName("globular-minimizeable-element")
            for(var i=0; i < elements.length; i++){
                elements[i].hide()
            }

            let groups = document.getElementsByTagName("globular-minimizeable-group")
            for(var i=0; i < elements.length; i++){
                groups[i].resetActive()
            }
            // background-color: rgb(0, 179, 255);

            if(!this.isVisible){
                for(var i=0; i < this.children.length; i++){
                    this.children[i].show()
                }
                this.isVisible = true;
                this.setActive();

            }else{
                this.isVisible = false;
            }
        }
    }

    setActive(){
        let container = this.shadowRoot.querySelector("#container")
        container.classList.add("active")
    }

    resetActive(){
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
        let minimizeable = this.querySelector("#" + id)
        minimizeable.minimize()
        this.shadowRoot.querySelector("#container").style.display = "block"
    }

    maximize(id) {
        this.shadowRoot.querySelector("#container").style.display = "none"
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
        setTimeout(()=>{
            if(this.element.isMinimized){
                this.hide()
            }
        }, 2000)
    }

    hide() {
        this.element.style.display = "none"
    }

    show() {
        this.element.style.display = ""
    }

}

customElements.define('globular-minimizeable-element', MinimizeableElement)