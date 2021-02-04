import { theme } from "./Theme";

// Rewritting of into a webcomponent.
// https://tympanus.net/codrops/2014/10/30/resizing-cropping-images-canvas/

export class ResizableImage extends HTMLElement {
    constructor() {
        super();
        this.event_state = {};
        this.constrain = false;
        this.min_width = 60;
        this.min_height = 60;
        this.max_width = 800;
        this.max_height = 900;
        this.resize_canvas = document.createElement('canvas');


        // Set the shadow dom.
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            
            /** CSS for image resize container **/
            .resize-container {
                position: relative;
                display: inline-block;
                cursor: move;
                margin: 0 auto;
            }
            
            ::slotted(img){
                outline: 2px dashed rgba(222,60,80,.9);
            }

            /** Resize handel **/
            .resize-handle-ne,
            .resize-handle-ne,
            .resize-handle-se,
            .resize-handle-nw,
            .resize-handle-sw {
                position: absolute;
                display: block;
                width: 10px;
                height: 10px;
                background: rgba(222,60,80,.9);
                z-index: 999;
            }

            .resize-handle-nw {
                top: -5px;
                left: -5px;
                cursor: nw-resize;
            }

            .resize-handle-sw {
                bottom: -5px;
                left: -5px;
                cursor: sw-resize;
            }

            .resize-handle-ne {
                top: -5px;
                right: -5px;
                cursor: ne-resize;
            }

            .resize-handle-se {
                bottom: -5px;
                right: -5px;
                cursor: se-resize;
            }

            globular-resizable-image {
                position: relative;
                padding: 4em;
                height: 500px;
                border: 3px solid #49708A;
                max-width: 901px;
                overflow: hidden;
                margin: 0 auto;
            }

        </style>

        <span class="resize-handle resize-handle-nw"></span>
        <span class="resize-handle resize-handle-ne"></span>
        <div class="resize-container">
            <slot> </slot>
        </div>
        <span class="resize-handle resize-handle-se"></span>
        <span class="resize-handle resize-handle-sw"></span>
        `
        this.style.position = "relative";
        this.container = this.shadowRoot.querySelector(".resize-container");

        this.orig_src = new Image();
        this.image_target = this.querySelector("img")
        this.orig_src.src= this.image_target.src;

        // Event listeners...
        let resizing = (e) => {
            
            let mouse = {};

            mouse.x = (e.clientX || e.pageX) + window.scrollX;
            mouse.y = (e.clientY || e.pageY) + window.scrollY;

            console.log("resizing mouse x", mouse.x, "mouse y", mouse.y)

            let width = mouse.x - this.event_state.container_left;
            let height = mouse.y - this.event_state.container_top;
    
            if (this.constrain || e.shiftKey) {
                height = width / this.orig_src.width * this.orig_src.height;
            }

            if (width > this.min_width && height > this.min_height && width < this.max_width && height < this.max_height) {
                this.resizeImage(width, height);

                //let left = this.event_state.container_left;
                //let top = this.event_state.container_top;
                // let offset = this.container.getBoundingClientRect(); // .offset();

                // Without this Firefox will not re-calculate the the image dimensions until drag end
                // this.container.offset({ 'left': left, 'top': top });
            }
        }

        let startResize = (e) => {
            console.log("startResize")
            e.preventDefault();
            // e.stopPropagation();
            this.saveEventState(e);
            document.addEventListener('mouseup', endResize);
            document.addEventListener('mousemove', resizing);

        };

        let endResize = (e) => {
            console.log("endResize")
            e.preventDefault();
            document.removeEventListener('mousemove', resizing);
            document.removeEventListener('mouseup', endResize);
        };

        //$container.on('mousedown', '.resize-handle', startResize);
        this.shadowRoot.querySelectorAll(".resize-handle").forEach((handler) => {
            console.log(handler)
            handler.onmousedown =  startResize;
        })
    }


    saveEventState(e) {
        console.log("saveEventState")
        // Save the initial event details and container state
        this.event_state.container_width = this.container.offsetWidth;
        this.event_state.container_height = this.container.offsetHeight;
        this.event_state.container_left = this.container.offsetLeft;
        this.event_state.container_top = this.container.offsetTop;
        this.event_state.mouse_x = (e.clientX || e.pageX) + window.scrollX;
        this.event_state.mouse_y = (e.clientY || e.pageY) + window.scrollY;

        this.event_state.evnt = e;
    }


    resizeImage(width, height) {
        console.log("resizeImage width" + width + "px height " + height + "px");

        this.resize_canvas.width = width;
        this.resize_canvas.height = height;
        this.resize_canvas.getContext('2d').drawImage(this.orig_src, 0, 0, width, height);
        this.image_target.src = this.resize_canvas.toDataURL("image/png");
        
    };
}



customElements.define("globular-resizable-image", ResizableImage);

/**
 * A simple image editor that can be use to resize and crop image.
 * Usefull for account image or webpage image.
 */
export class ImageEditor extends HTMLElement {
    constructor() {
        super();
        this.container = null;

        // Set the shadow dom.
        this.attachShadow({ mode: "open" });

        // Connect to event.
        this.shadowRoot.innerHTML = `
        `;

        // Get image...
        let img = this.shadowRoot.querySelector(".resize-image")
        let resizableImage = new ResizableImage(img)

    }


}

customElements.define("globular-image-editor", ImageEditor);
