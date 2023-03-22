import { ImageViewer } from './Image'


/**
 * Image galery component
 */
export class ImageGallery extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
        *,
        *::before,
        *::after {
            margin: 0;
            padding: 0;
            outline: none;
            box-sizing: border-box;
        }
        
        .container {
            margin: 0 auto;
            max-width: 700px;
            max-height: 100vh;
            background-color: white;
        }
        
        
        /* Useful Classes */
        .xy-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .transition {
            transition: all 350ms ease-in-out;
        }
        
        .r-3-2 {
            width: 100%;
            padding-bottom: 66.667%;
            background-color: #ddd;
        }
        
        .image-holder {
            background-position: center center;
            background-repeat: no-repeat;
            background-size: auto 100%;
        }
        
        /* Main Styles */
        .gallery-wrapper {
            position: relative;
            overflow: hidden;
        }
        
        .gallery {
            position: relative;
            white-space: nowrap;
            font-size: 0;
        }
        
        .item-wrapper {
            cursor: pointer;
            width: 23%; /* arbitrary value */
            display: inline-block;
            background-color: white;
        }
        
        .gallery-item { opacity: 0.5; }
        .gallery-item.active { opacity: 1; }
        
        .controls {
            font-size: 0;
            border-top: none;
        }
        .move-btn {
            display: inline-block;
            width: 50%;
            border: none;
          color: #ccc;
            background-color: transparent;
            padding: 0.2em 1.5em;
        }
        .move-btn:first-child {border-right: none;}
        .move-btn.left  { cursor: w-resize; }
        .move-btn.right { cursor: e-resize; }
        
        </style>
        <div class="container">

            <div class="feature">
                <figure class="featured-item image-holder r-3-2 transition"></figure>
            </div>
            
            <div class="gallery-wrapper">
                <div class="gallery">
                </div>
            </div>
            
            <div class="controls">
                <button class="move-btn left">&larr;</button>
                <button class="move-btn right">&rarr;</button>
            </div>
            
        </div>
        `
        // give the focus to the input.
        this.gallery = this.shadowRoot.querySelector('.gallery');

        this.itemWidth = 23; // percent: as set in css

        this.leftBtn = this.shadowRoot.querySelector('.move-btn.left');
        this.rightBtn = this.shadowRoot.querySelector('.move-btn.right');

        // old the interval...
        this.leftInterval;
        this.rightInterval;

        // scroll speed...
        this.scrollRate = 0.2;
        this.left;

        // connect event listener's
        this.leftBtn.onmouseenter = e => this.moveLeft(e);
        this.leftBtn.onmouseleave = e => this.stopMovement(e);
        this.rightBtn.onmouseenter = e => this.moveRight(e);
        this.rightBtn.onmouseleave = e => this.stopMovement(e);
    }

    setImages(images) {

        //Set Initial Featured Image
        // The image viewer to display image to it full size
        this.imageViewer = new ImageViewer
        this.imageViewer.onclose = () => {
            // remove it from the layout.
            this.imageViewer.parentNode.removeChild(this.imageViewer)
        }

        this.featured().onclick = () => {
            this.imageViewer.activeImage(this.featured().index)
            this.imageViewer.style.display = "block"
            document.body.appendChild(this.imageViewer)
        }

        // remove existing images.
        this.gallery.innerHTML = ""
        let range = document.createRange()

        //Set Images for Gallery and Add Event Listeners
        for (var i = 0; i < images.length; i++) {
            let html = `
           <div class="item-wrapper">
                <figure class="gallery-item image-holder r-3-2 transition"></figure>
            </div>
           `

            this.gallery.appendChild(range.createContextualFragment(html))
            let galleryItem = this.gallery.children[this.gallery.children.length - 1]

            // create the image to display by the image viewer.
            let img = document.createElement("img")
            img.src = images[i]
            this.imageViewer.addImage(img)

            galleryItem.children[0].style.backgroundImage = 'url(' + images[i] + ')';
            let index = i;

            galleryItem.children[0].onclick = e => {
                if (e.target.classList.contains('active')) return;

                this.featured().style.backgroundImage = e.target.style.backgroundImage;
                this.featured().index = index;
                this.featured().image = img

                for (var i = 0; i < this.galleryItems().length; i++) {
                    if (this.galleryItems()[i].classList.contains('active'))
                        this.galleryItems()[i].classList.remove('active');
                }

                e.target.classList.add('active');
            };

            if (i == 0) {
                galleryItem.children[0].classList.add('active')
                this.featured().index = index;
                this.featured().style.backgroundImage = 'url(' + images[0] + ')';
                this.featured().image = img
            }
        }
    }

    featured() {
        return this.shadowRoot.querySelector('.featured-item');
    }

    // Call search event.
    numOfItems() {
        return this.gallery.children.length
    }

    galleryItems() {
        return this.shadowRoot.querySelectorAll('.gallery-item');
    }

    galleryWrapLeft() {
        var first = this.gallery.children[0];
        this.gallery.removeChild(first);
        this.gallery.style.left = -this.itemWidth + '%';
        this.gallery.appendChild(first);
        this.gallery.style.left = '0%';
    }

    galleryWrapRight() {
        var last = this.gallery.children[this.gallery.children.length - 1];
        this.gallery.removeChild(last);
        this.gallery.insertBefore(last, this.gallery.children[0]);
        this.gallery.style.left = '-23%';
    }

    moveLeft() {
        this.left = this.left || 0;

        this.leftInterval = setInterval(() => {
            this.gallery.style.left = this.left + '%';

            if (this.left > - this.itemWidth) {
                this.left -= this.scrollRate;
            } else {
                this.left = 0;
                this.galleryWrapLeft();
            }
        }, 1);
    }

    moveRight() {
        //Make sure there is element to the leftd
        if (this.left > -this.itemWidth && this.left < 0) {
            this.left = this.left - this.itemWidth;

            var last = this.gallery.children[this.gallery.children.length - 1];
            this.gallery.removeChild(last);
            this.gallery.style.left = this.left + '%';
            this.gallery.insertBefore(last, this.gallery.children[0]);
        }

        this.left = this.left || 0;

        this.leftInterval = setInterval(() => {
            this.gallery.style.left = this.left + '%';

            if (this.left < 0) {
                this.left += this.scrollRate;
            } else {
                this.left = -this.itemWidth;
                this.galleryWrapRight();
            }
        }, 1);
    }

    stopMovement() {
        clearInterval(this.leftInterval);
        clearInterval(this.rightInterval);
    }

}

customElements.define('globular-image-gallery', ImageGallery)