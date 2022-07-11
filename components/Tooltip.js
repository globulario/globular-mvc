import { getTheme } from "./Theme.js";

/**
 * Sample empty component
 */
export class Tooltip extends HTMLElement {
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
            #container{
                
            }

            .overlay{
                position: relative;
                
            }

        </style>
        <div id="tooltip">
        </div>
        <div id="container">
            <slot>
            </slot>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")
        this.tooltip = this.shadowRoot.querySelector("#tooltip")
        this.tooltip.parentNode.removeChild(this.tooltip)
        this.timeout = null

        this.onmouseover = (evt) => {
            let txt = this.getAttribute("tooltip")
            this.tooltip.innerHTML = ""
            document.body.appendChild(this.tooltip)
            this.timeout = setTimeout(() => {
                this.onTooltip(txt)
            }, 1000)
        }

        this.onmouseout = (evt) => {
            document.body.removeChild(this.tooltip)
            this.tooltip.innerHTML = ""
            if(this.timeout != undefined){
                clearTimeout(this.timeout)
                this.timeout = null
            }
        }


    }

    connectedCallback() {

    }

    getScreenCordinates() {
        var p = {};
        let obj = this
        p.x = obj.offsetLeft;
        p.y = obj.offsetTop;
        while (obj.offsetParent) {
            p.x = p.x + obj.offsetParent.offsetLeft;
            p.y = p.y + obj.offsetParent.offsetTop;
            if (obj == document.getElementsByTagName("body")[0]) {
                break;
            }
            else {
                obj = obj.offsetParent;
            }
        }
        return p;
    }

    offset() {
        let el = this
        var rect = el.getBoundingClientRect(),
            scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    }

    // Call search event.
    onTooltip(text) {
        // 224 is the max width
        let width = 224

        // Here I will append the text div into the container...
        document.body.appendChild(document.createRange().createContextualFragment(`<div id="tooltip_text" style="z-index:200;display:inline-flex; opacity: 1; color: rgb(54, 54, 54); max-width: ${width}px; box-sizing: border-box; position: relative; padding: 6px; font-size: 11px; line-height: 16px;">${text}</div>`))
        let tooltip_text = document.body.querySelector("#tooltip_text")

        // https://codepen.io/dpip/pen/PgBRME
        // Position the ballon to top l
        width = tooltip_text.offsetWidth;
        let height = tooltip_text.offsetHeight

        // The ballon triangle size length
        let l = 6
        // The triangle ballon position
        let offset = .95;
        // Set the tooltip position.
        if (this.hasAttribute("side")) {
            if (this.getAttribute("side") == "right") {
                offset = .05
            } else if (this.getAttribute("center") == "center") {
                offset = .5
            }
        }

        // if(this.hasAttribute("position")=="")

        // The left of triangle
        let left = offset * (width - 2 * l)
        // The right of triange
        let right = (1 - offset) * (width - 2 * l)

        let position = this.getScreenCordinates()
        let x = position.x - ((width * offset) - this.container.offsetWidth)
        let y = position.y - height - 10

        let path = `M0 2a 2 -2 0 0 1 2 -2h${width}a 2 2 0 0 1 2 2v${height}a -2 2 0 0 1 -2 2l-${right} 0 -${l} ${l} -${l} -${l} -${left} 0a -2 -2 0 0 1 -2 -2z`
        if (this.hasAttribute("position")) {
            if (this.getAttribute("position") == "bottom") {
                path = `M0 2a 2 -2 0 0 1 2 -2l${left} 0 ${l} -${l} ${l} ${l} ${right} 0a 2 2 0 0 1 2 2v${height}a -2 2 0 0 1 -2 2h-${width}a -2 -2 0 0 1 -2 -2z`
                y = position.y + this.container.offsetHeight + 20
            }
        }

        let html = `
            <div id="container" style="position: absolute; pointer-events: none; top: ${y}px; left:  ${x}px;">
                <svg viewBox="0 0 ${width} ${height}" style="display: block; overflow: visible; position: absolute; width: ${width}px; height: ${height}px; border-radius: 0px; color: rgb(230, 230, 230); border-color: rgb(33, 33, 33);">
                    <defs>
                        <clipPath id="balloon-clip-32590">
                        <path d="${path}"></path>
                        </clipPath>
                    </defs>
                    <path d="${path}" clip-path="url(#balloon-clip-32590)" fill="#e6e6e6" style="stroke-width: 0px; stroke: black;"></path>
                </svg>
                
            </div>
        `
        this.tooltip.appendChild(document.createRange().createContextualFragment(html))

        // Append the tooltip in the container div.
        document.body.querySelector("#container").appendChild(tooltip_text)

    }
}

customElements.define('globular-tooltip', Tooltip)