
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-slider/paper-slider.js';
import { ApplicationView } from '../ApplicationView';
import { generatePeerToken, getUrl, Model } from "../Model";
import { File as File__ } from "../File"; // File object already exist in js and I need to use it...
import { createThumbmail } from './BlogPost';
import * as Masonry from 'masonry-layout'
import domtoimage from 'dom-to-image';
import { fireResize } from './utility';
import { GetItemDefinitionRequest } from 'globular-web-client/catalog/catalog_pb';

export class ImageCropper extends HTMLElement {
  constructor() {
    super();
    this.oldSrc = '';
    this.croppedImage = null;

    this.attachShadow({ mode: 'open' });
  }

  get width() {
    return this.hasAttribute('width');
  }

  get height() {
    return this.hasAttribute('height');
  }

  get rounded() {
    return this.hasAttribute('rounded');
  }

  setCropImage(dataUrl) {
    this.croppedImage = dataUrl;
  }

  // Set the image from data url.
  setImage(data) {
    this.loadPic({ target: { files: [data] } })
  }

  loadPic(e) {
    this.resetAll();
    var reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.cmp = this;
    reader.onload = function (event) {
      var shdRoot = event.target.cmp.shadowRoot;
      shdRoot.querySelector(".resize-image").setAttribute('src', event.target.result);
      event.target.cmp.oldSrc = event.target.result;
      shdRoot.querySelector(".resize-image").cmp = shdRoot;
      shdRoot.querySelector(".resize-image").onload = function (e) {
        var shdRoot = e.target.cmp;
        shdRoot.querySelector('.slidecontainer').style.display = 'block';
        shdRoot.querySelector('.crop').style.display = 'initial';
        var widthTotal = shdRoot.querySelector(".resize-image").offsetWidth;
        shdRoot.querySelector(".resize-container").style.width = widthTotal + 'px';
        shdRoot.querySelector(".resize-image").style.width = widthTotal + 'px';
        shdRoot.querySelector("#myRange").max = widthTotal + widthTotal;
        shdRoot.querySelector("#myRange").value = widthTotal;
        shdRoot.querySelector("#myRange").min = widthTotal - widthTotal;
      }
    }
  }
  dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    elmnt.ontouchstart = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX || e.targetTouches[0].pageX;
      pos4 = e.clientY || e.targetTouches[0].pageY;
      document.onmouseup = closeDragElement;
      document.ontouchend = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
      document.ontouchmove = elementDrag;
    }
    function elementDrag(e) {
      e = e || window.event;
      // calculate the new cursor position:
      pos1 = pos3 - (e.clientX || e.targetTouches[0].pageX);
      pos2 = pos4 - (e.clientY || e.targetTouches[0].pageY);
      pos3 = (e.clientX || e.targetTouches[0].pageX);
      pos4 = (e.clientY || e.targetTouches[0].pageY);
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() {
      // stop moving when mouse button is released:
      document.onmouseup = '';
      document.ontouchend = '';
      document.onmousemove = '';
      document.ontouchmove = '';
    }
  }
  crop() {
    this.shadowRoot.querySelector('.crop').style.display = 'none';
    this.shadowRoot.querySelector('.reset').style.display = 'initial';
    this.shadowRoot.querySelector('.slidecontainer').style.display = 'none';
    var image = this.shadowRoot.querySelector('.resize-image');

    var resize_canvas = document.createElement('canvas');
    resize_canvas.width = image.offsetWidth;
    resize_canvas.height = image.offsetHeight;
    resize_canvas.getContext('2d').drawImage(image, 0, 0, image.offsetWidth, image.offsetHeight);

    image.setAttribute('src', resize_canvas.toDataURL("image/jepg"));

    var imageContainer = this.shadowRoot.querySelector('.resize-container');
    var centerContainer = this.shadowRoot.querySelector('.center');
    var left = centerContainer.offsetLeft - imageContainer.offsetLeft;
    var top = centerContainer.offsetTop - imageContainer.offsetTop;
    var width = centerContainer.offsetWidth;
    var height = centerContainer.offsetHeight;
    var newTop = centerContainer.offsetTop;
    var newLeft = centerContainer.offsetLeft;

    var crop_canvas = document.createElement('canvas');
    crop_canvas.width = width;
    crop_canvas.height = height;
    crop_canvas.getContext('2d').drawImage(resize_canvas, left, top, width, height, 0, 0, width, height);

    var imageC = this.shadowRoot.querySelector('.imageCropped');
    imageC.src = crop_canvas.toDataURL("image/jepg");
    this.shadowRoot.querySelector('.resize-image').setAttribute('src', '');
  }
  slide(w) {
    this.shadowRoot.querySelector(".resize-container").style.width = (w) + 'px';
    this.shadowRoot.querySelector(".resize-image").style.width = (w) + 'px';
  }
  getCropped() {
    return this.shadowRoot.querySelector(".imageCropped").getAttribute('src');
  }
  resetAll() {
    this.shadowRoot.querySelector(".reset").style.display = 'none';
    this.shadowRoot.querySelector(".crop").style.display = 'none';
    this.shadowRoot.querySelector(".slidecontainer").style.display = 'none';
    this.shadowRoot.querySelector(".resize-container").removeAttribute('style');
    this.shadowRoot.querySelector(".resize-image").setAttribute('src', '');
    this.shadowRoot.querySelector(".imageCropped").setAttribute('src', '');
    this.shadowRoot.querySelector(".resize-image").style.width = '100%';
    this.shadowRoot.querySelector("#myRange").max = 10;
    this.shadowRoot.querySelector("#myRange").value = 5;
    this.shadowRoot.querySelector("#myRange").min = 0;
  }
  reset() {
    this.resetAll();
    this.shadowRoot.querySelector(".resize-image").setAttribute('src', this.oldSrc);
  }
  connectedCallback() {

    this.shadowRoot.innerHTML = `
        <style>
          #container{
            background-color: var(--palette-background-paper);
            color: var(--palette-text-primary);
          }
          .slidecontainer {
            width: 100%;
            display:none;
            z-index: 1;
            position: relative;
            margin-top:8px;
          }
          .slider {
            -webkit-appearance: none;
            width: 100%;
            height: 15px;
            border-radius: 5px;
            background: #d3d3d3;
            outline: none;
            opacity: 0.9;
            -webkit-transition: .2s;
            transition: opacity .2s;
          }
          .slider:hover {
            opacity: 1;
          }
          .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: #2196F3;
            cursor: pointer;
          }
          .slider::-moz-range-thumb {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background: #2196F3;
            cursor: pointer;
            border:none;
          }
          .resize-container {
            position: relative;
            display: inline-block;
            cursor: move;
            margin: 0 auto;
          }
          .resize-container img {
            display: block;
          }
          .resize-container:hover img,
          .resize-container:active img {
            outline: 2px dashed gray;
          }
          .parent{
            width:99%;
            height:99%;
            overflow: hidden;
            position:absolute;
            top:0px;
            left:0px;
          }
          .center{
            position: absolute;
            width: 150px;
            height: 150px;
            top: calc(50% - 150px/2);
            left: calc(50% - 150px/2);
            z-index: 2;
            background: rgba(255, 255, 255, .3);
            border: 2px solid #cecece;
          }
          .imageCropped{
            position: relative;
            left: -2px;
            top: -2px;
          }
          .uploader{
            z-index: 1;
            position: relative;
            display:none;
          }
          .lb_uploader{
            z-index: 1;
            position: relative;
            cursor:pointer;
          }
          .crop, .reset {
            display:none;
          }
          .btn{
            z-index:1;
            position: relative;
            font-size: .85rem;
            border: none;
            color: var(--palette-text-accent);
            background: var(--palette-primary-accent);
            max-height: 32px;
            border: none;
            z-index:1;
          }
        </style>
        <div id="container">
          <label class='lb_uploader' for='uploader'>
            <slot name='select'>
               <paper-button class='btn' toggles raised ><slot name='selectText'>Select</slot></paper-button>
            </slot>
          </label>
          <label class='reset'>
            <slot name='reset'>
              <paper-button class='btn' toggles raised ><slot name='resetText'>Reset</slot></paper-button>
            </slot>
          </label>
          <label class='crop'>
            <slot name='crop'>
              <paper-button class='btn' toggles raised ><slot name='cropText'>Crop</slot></paper-button>
            </slot>
          </label>
          <input type="file" class="uploader" id='uploader'/>
          <div class="slidecontainer">
            <paper-slider id="myRange" class="slider"> </paper-slider>
          </div>
          <div class='parent'>
            <div class="resize-container">
              <img class="resize-image" src="" style='width:100%'>
            </div>
            <div class='center'><img class="imageCropped"></div>
          </div>
        </div>
        `;
    this.shadowRoot.querySelector('.uploader').addEventListener('change', e => {
      this.loadPic(e);
    });
    this.shadowRoot.querySelector('#myRange').addEventListener('immediate-value-change', e => {
      this.slide(e.target.immediateValue);
    });
    this.shadowRoot.querySelector('.crop').addEventListener('click', e => {
      this.crop();
    });
    this.shadowRoot.querySelector('.reset').addEventListener('click', e => {
      this.reset();
    });
    if (this.width) {
      this.shadowRoot.querySelector('.center').style.width = this.getAttribute('width');
      this.shadowRoot.querySelector('.center').style.left = 'calc(50% - ' + this.getAttribute('width') + '/2)';
    }
    if (this.height) {
      this.shadowRoot.querySelector('.center').style.height = this.getAttribute('height');
      this.shadowRoot.querySelector('.center').style.top = 'calc(50% - ' + this.getAttribute('height') + '/2)';
    }
    if (this.rounded) {
      this.shadowRoot.querySelector('.center').style.borderRadius = '200px';
      this.shadowRoot.querySelector('.imageCropped').style.borderRadius = '200px';
    }

    if (this.croppedImage != null) {
      var imageC = this.shadowRoot.querySelector('.imageCropped');
      imageC.src = this.croppedImage;
    }

    this.dragElement(this.shadowRoot.querySelector(".resize-container"));
  }
}

window.customElements.define('globular-image-cropper', ImageCropper);

/**
 * Classic image viewer
 */
export class ImageViewer extends HTMLElement {

  constructor() {
    super();
    this.onclose = null;

    let shadowRoot = this.attachShadow({ mode: 'open' });

    shadowRoot.innerHTML = `
      <style>
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
            
        ::-webkit-scrollbar-track {
            background: var(--palette-background-default);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--palette-divider); 
        }
        
        .modal {
          z-index: 3000;
          display: none;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0, 0, 0, 0.94);
          font-family: Verdana,sans-serif;
          display:flex;
          justify-content:center;
          align-items: center;
        }
        #info {
          background-color:#2196F3;
          left:88px;
          font-size:18px;
          text-align:center;
          color:white;
          margin-top:8px;
          padding: 5px 16px;
        }
        #leftA {
          position:absolute;
          top:53%;
          left:0%;
          transform:translate(0%,-53%);
          font-size:30px;
          background-color: #3e3c3c99;
          color:white;
        }
        #rightA {
          position:absolute;
          top:53%;
          right:0%;
          transform:translate(0%,-53%);
          font-size:30px;
          background-color: #3e3c3c99;
          color:white;
        }
        .btn, .button {
          border: none;
          display: inline-block;
          padding: 8px 16px;
          vertical-align: middle;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          background-color: inherit;
          text-align: center;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn, .button {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        .display-topright {
          position: absolute;
          right: 0;
          top: 0;
        }
        .display-topleft {
          position: absolute;
          left: 20px;
          top: 0;
          font-size:25px;
          text-align:center;
          color:white;
          margin-top:5px;
        }
        .container, .w3-panel {
          padding: 0.01em 16px;
        }
        .image {
          max-width: 100%;
          height: auto;
        }
        img {
          vertical-align: middle;
          border-style: none;
        }
        @media (max-width:768px){
          .modal{
            padding-top:50px;
          }
        }
      </style>
      <div id="imageViewer" class="modal" >
        <span id='closeBtn' class="button display-topright" style='color:white;font-size:30px;'>
        ×
        </span>
        <div id='counter' class='display-topleft' ></div>
        <div id='info' class='display-topleft btn' style="display: none;">
          Description
        </div>
        <div class="container">
          <slot name='images'><span style='color:white;'>No images to show</span></slot>
          <div id='leftA' class="button" >❮</div>
          <div id='rightA' class="button" >❯</div>
        </div>
      </div>`;

    shadowRoot.querySelector('#closeBtn').addEventListener('click', e => {
      this.style.display = 'none';
      if (this.onclose != undefined) {
        this.onclose()
      }
    });

    if (this.noinfo) {
      shadowRoot.querySelector('#info').style.display = 'none';
    }

    //right arrow event
    shadowRoot.querySelector('#rightA').addEventListener('click', e => {
      this.nextImage();
    });

    //left arrow event
    shadowRoot.querySelector('#leftA').addEventListener('click', e => {
      this.prevImage();
    });

  }

  connectedCallback() {
    if (this.children.length != 0) {
      var ch = this.children;
      var cant = ch.length;
      for (var i = 0; i < cant; i++) {
        ch[i].style.maxHeight = '75vh'
        if (this.parentNode.tagName == "BODY")
          ch[i].style.maxHeight = 'calc(100vh - 20px)';
      }
    }
  }

  get noinfo() {
    return this.hasAttribute('noinfo');
  }

  populateChildren() {
    if (this.children.length != 0) {
      var ch = this.children;
      var cant = ch.length;
      for (var i = 0; i < cant; i++) {
        if (i == 0)
          ch[i].style.display = 'block';
        else
          ch[i].style.display = 'none';

        ch[i].style.margin = 'auto';
        ch[i].style.maxWidth = '100%';
        ch[i].style.maxHeight = '75vh'
      }
      //counter
      this.shadowRoot.querySelector('#counter').innerHTML = '1/' + cant;
    } else {
      //hide the arrows
      this.shadowRoot.querySelector('#leftA').style.display = 'none';
      this.shadowRoot.querySelector('#rightA').style.display = 'none';
    }
  }

  activeImage(index) {
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      ch[i].style.display = 'none';
    }
    ch[index].style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (index + 1) + '/' + (cant);
  }

  addImage(e) {
    e.slot = "images"
    this.appendChild(e);
    this.populateChildren();
    //show the arrows
    this.shadowRoot.querySelector('#leftA').style.display = 'block';
    this.shadowRoot.querySelector('#rightA').style.display = 'block';
  }

  loadImgFrom(ele) {
    var el = ele.querySelectorAll('img');
    this.style.display = 'block';
    this.innerHTML = '';
    for (var i = 0; i < el.length; i++) {
      var src = el[i].getAttribute('src')
      src += "?application=" + Model.application;
      if (localStorage.getItem("user_token") != undefined) {
        src += "&token=" + localStorage.getItem("user_token");
      }
      var newPic = document.createElement('img');
      newPic.setAttribute('slot', 'images');
      newPic.setAttribute('src', src);

      //if have data-info
      if (el[i].getAttribute('data-info'))
        newPic.setAttribute('data-info', el[i].getAttribute('data-info'));

      //adding to the component
      this.addImage(newPic);
    }
  }

  infoClick(title, fn) {
    this.shadowRoot.querySelector('#info').innerHTML = title;
    this.shadowRoot.querySelector('#info').addEventListener('click', function func(event) {
      fn(event);
    });
  }

  nextImage() {
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      if (ch[i].style.display == 'block') {
        var actived = ch[0];
        var index = 0;
        if (i < (cant - 1)) {
          actived = ch[i + 1];
          index = i + 1;
        }
      }
      ch[i].style.display = 'none';
    }
    actived.style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (index + 1) + '/' + (cant);
  }

  prevImage() {
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      if (ch[i].style.display == 'block') {
        var actived = ch[cant - 1];
        var index = cant - 1;
        if (i > 0) {
          actived = ch[i - 1];
          index = i - 1;
        }
      }
      ch[i].style.display = 'none';
    }
    actived.style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (index + 1) + '/' + (cant);
  }

}
window.customElements.define('globular-image-viewer', ImageViewer);



/**
 * That component will be use to select image with drag and drop 
 */
export class ImageSelector extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor(label, url) {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });

    /** The title of the image selector */
    if (this.hasAttribute("label")) {
      label = this.getAttribute("label")
    }
    if (!label) {
      label = ""
    }

    /** The url of the selected image (can be undefied or empty string) */
    if (this.hasAttribute("url")) {
      url = this.getAttribute("url")
    }
    if (!url) {
      url = ""
    }

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
      <style>
         
          #container{
              color: var(--palette-text-primary);
          }

          .image-selector{
            max-width: 200px;
            position: relative;
          }

          #delete-cover-image-btn {
            ${url.length == 0 ? "display:none;" : "display: block;"}
            z-index: 100;
            position: absolute;
            top: 0px;
            left: 0px;
            background-color: black;
            --paper-icon-button-ink-color: white;
            --iron-icon-fill-color: white;
            border-bottom: 1px solid var(--palette-divider);
            border-right: 1px solid var(--palette-divider);
            padding: 4px;
            width: 30px;
            height: 30px;
            --iron-icon-width: 24px;
            --iron-icon-height: 24px;
        }

        #drop-zone{
            min-width: 180px;
            transition: background 0.2s ease,padding 0.8s linear;
            background-color: var(--palette-background-default);
            position: relative;
            border: 2px dashed var(--palette-divider);
            border-radius: 5px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
        }

      </style>

      <div id="container">
          <span id="label">${label}</span>
          <div id="drop-zone">
              <div style="position: relative; display: flex;">
                  <paper-icon-button id="delete-cover-image-btn" icon="icons:close"></paper-icon-button>
                  <img class="image-selector" src="${url}"> </img>
                  
              </div>
          </div>
      </div>
      `

    // Set image selector
    this.image = this.shadowRoot.querySelector(".image-selector")
    this.deleteBtn = this.shadowRoot.querySelector("#delete-cover-image-btn")

    // Delete the postser/cover image.
    this.shadowRoot.querySelector("#delete-cover-image-btn").onclick = () => {

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
              <div>Your about to remove ${label} image</div>
                  <img style="max-height: 256px; object-fit: contain; width: 100%;" src="${url}"></img>
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

        // Call the function if defined...
        if (this.ondelete) {
          this.ondelete()
        }

        this.image.removeAttribute("src")
        this.deleteBtn.style.display = "none"
        toast.dismiss();
      }

      noBtn.onclick = () => {
        toast.dismiss();
      }
    }

    // The drag and drop event...
    let imageCoverDropZone = this.shadowRoot.querySelector("#drop-zone")

    imageCoverDropZone.ondragenter = (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
      imageCoverDropZone.style.filter = "invert(10%)"
    }

    imageCoverDropZone.ondragleave = (evt) => {
      evt.preventDefault()
      imageCoverDropZone.style.filter = ""
    }

    imageCoverDropZone.ondragover = (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
    }

    imageCoverDropZone.ondrop = (evt) => {
      evt.stopPropagation();
      evt.preventDefault();

      imageCoverDropZone.style.filter = ""

      if (evt.dataTransfer.files.length > 0) {
        var file = evt.dataTransfer.files[0], reader = new FileReader();
        reader.onload = (event) => {
          let dataUrl = event.target.result
          this.deleteBtn.style.display = "block"
          this.image.src = dataUrl
          if (this.onselectimage) {
            this.onselectimage(dataUrl)
          }
        };
        reader.readAsDataURL(file);
      } else if (evt.dataTransfer.getData('files')) {

        // So here I will try to get the image from drop files from the file-explorer.
        let paths = JSON.parse(evt.dataTransfer.getData('files'))
        let domain = evt.dataTransfer.getData('domain')

        // keep track
        paths.forEach(path => {
          // so here I will read the file
          let globule = Model.getGlobule(domain)
          File__.getFile(globule, path, -1, -1,
            f => {
              generatePeerToken(globule, token => {
                let url = getUrl(globule)
                f.path.split("/").forEach(item => {
                  let component = encodeURIComponent(item.trim())
                  if (component.length > 0) {
                    url += "/" + component
                  }
                })

                url += "?application=" + Model.application;
                url += "&token=" + token
                createThumbmail(url, 500, dataUrl => {
                  this.deleteBtn.style.display = "block"
                  this.image.src = dataUrl
                  if (this.onselectimage) {
                    this.onselectimage(dataUrl)
                  }
                })
              })
            }, err => ApplicationView.displayMessage(err, 3000))
        })
      }
    }
  }

  setImageUrl(url) {
    this.image.src = url
    if (url.length > 0) {
      this.deleteBtn.style.display = "block"
    }
    else {
      this.deleteBtn.style.display = "none"
    }
  }

  getImageUrl() {
    return this.image.src
  }

  // That functions will create images from multiple images and set the result as 
  // results.
  createMosaic(images, callback) {

    let grid = document.createElement("div")
    grid.classList.add("grid")
    grid.setAttribute("data-masonry", '{ "itemSelector": ".grid-item", "columnWidth": 50 }')

    if (images.length > 3) {
      grid.style.width = "300px";
    }

    // must be in the layout...
    grid.style.backgroundColor = "black"
    var masonery = new Masonry(grid, {})
    // Maximum of 9 image...
    images.forEach((img, index) => {
      if (index < 9) {
        img.classList.add("grid-item")
        img.style.maxWidth = "100px"
        img.style.maxHeight = "100px"
        grid.appendChild(img)
      }
    })

    // Display message to the user and take screenshot of the grid...
    let toast = ApplicationView.displayMessage(
      `
      <div style="display: flex; flex-direction: column;">
        <div>Generate cover from content...</div>
        <div id="grid-div" style="background-color: black; min-height: 300px; margin-top: 20px;"></div>
      </div>
      `, 3000)

    // apprend the grid to the 
    toast.el.querySelector("#grid-div").appendChild(grid)
    fireResize()

    // wait for the grid to be organized...
    setTimeout(() => {
      domtoimage.toJpeg(grid, { quality: 0.95 })
        .then((dataUrl) => {
          ///grid.parentNode.style.height = grid.offsetHeight + "px"
          this.image.src = dataUrl;
          callback(dataUrl)
        });
    }, 1000)
  }
}

customElements.define('globular-image-selector', ImageSelector)