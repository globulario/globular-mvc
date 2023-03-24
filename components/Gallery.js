import { ImageViewer } from './Image'
import { ApplicationView } from '../ApplicationView'

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
        #leftA {
            font-size:16px;
            background-color: #3e3c3c99;
            color:white;
            text-align: left;
          }
          #rightA {
            font-size:16px;
            background-color: #3e3c3c99;
            color:white;
            text-align: right;
          }

          .feature{
            position: relative;
          }

          paper-icon-button {
            position: absolute;
            top: 0px;
            left: 0px;
            background-color: black;
            height: 25px;
            width: 25px;
          }

          globular-image-viewer {
            position: fixed;
            top: 0px;
            bottom: 0px;
            left: 0px;
            right: 0px;
          }

        </style>
        <div class="container">

            <div class="feature">
                <figure class="featured-item image-holder r-3-2 transition"></figure>
                <paper-icon-button id="delete-btn" style="position: absolute; display: none;" icon="icons:close"></paper-icon-button>
            </div>
            
            <div class="gallery-wrapper">
                <div class="gallery">
                </div>
            </div>
            
            <div class="controls">
                <div id='leftA' class="move-btn left" >❮</div>
                <div id='rightA' class="move-btn right" >❯</div>
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
        this.images = []

        // connect event listener's
        this.leftBtn.ontouchstart = this.leftBtn.onmouseenter = e => this.moveLeft(e);
        this.leftBtn.ontouchend = this.leftBtn.onmouseleave = e => this.stopMovement(e);
        this.rightBtn.ontouchstart = this.rightBtn.onmouseenter = e => this.moveRight(e);
        this.rightBtn.ontouchend =  this.rightBtn.onmouseleave = e => this.stopMovement(e);

        this.deleteBtn = this.shadowRoot.querySelector("#delete-btn")

        this.deleteBtn.onclick = () => {

            const url = new URL(this.featured().image.src);

            // Here I will ask the user for confirmation before actually delete the contact informations.
            let toast = ApplicationView.displayMessage(
                `
            <style>
             
              #yes-no-picture-delete-box{
                display: flex;
                flex-direction: column;
              }

              #yes-no-picture-delete-box globular-picture-card{
                padding-bottom: 10px;
              }

              #yes-no-picture-delete-box div{
                display: flex;
                padding-bottom: 10px;
              }

            </style>
            <div id="yes-no-picture-delete-box">
              <div>Your about to remove image from the gallery</div>
              <img style="height: 256px; object-fit: contain; width: 100%;" src="${this.featured().image.src}"></img>
              <span style="font-size: .75rem;">${decodeURIComponent(url.pathname)}</span>
              <div>Is it what you want to do? </div>
              <div style="justify-content: flex-end;">
                <paper-button raised id="yes-delete-picture">Yes</paper-button>
                <paper-button raised id="no-delete-picture">No</paper-button>
              </div>
            </div>
            `,
                60 * 1000 // 60 sec...
            );

            let yesBtn = document.querySelector("#yes-delete-picture")
            let noBtn = document.querySelector("#no-delete-picture")

            // On yes
            yesBtn.onclick = () => {

                // so here I will remove the image...
                this.images = this.images.filter(e => e !== this.featured().image.src);

                toast.dismiss();
                ApplicationView.displayMessage(
                    `<div style="display: flex; flex-direction: column;">
                        <span style="font-size: .85rem;">${url.pathname}</span>
                        <span>was remove from the gallery</span>
                     </div>`,
                    3000
                );

                this.setImages(this.images)
                if(this.onremoveimage){
                    
                    this.onremoveimage(decodeURIComponent(url.pathname))
                }
            }

            noBtn.onclick = () => {
                toast.dismiss();
            }

        }
    }

    setEditable() {
        // so here I will display the delete image button.
        this.deleteBtn.style.display = "block"
    }

    resetEditable() {
        this.deleteBtn.style.display = "none"
    }

    getImage(index){
        return this.images[index]
    }

    setImages(images) {
        // keep reference to images.
        this.images = images

        let controls = this.shadowRoot.querySelector(".controls")
        if(this.images.length > 1){
            controls.style.display = "block"
        }else{
            controls.style.display = "none"
        }

        //Set Initial Featured Image
        // The image viewer to display image to it full size
        this.imageViewer = new ImageViewer
        this.imageViewer.style.position = "fixed"
        this.imageViewer.style.top = "0px"
        this.imageViewer.style.left = "0px"
        this.imageViewer.style.right = "0px"
        this.imageViewer.style.bottom = "0px"

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