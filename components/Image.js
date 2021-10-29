import { theme } from "./Theme";
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-slider/paper-slider.js';

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

    setCropImage(dataUrl){
      this.croppedImage = dataUrl;
    }
  
    // Set the image from data url.
    setImage(data){
      this.loadPic({target:{files:[data]}})
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
          ${theme}
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
        <div>
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

        if(this.croppedImage != null){
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
class ImageViewer extends HTMLElement {

  constructor () {
    super();
    this.onclose = null;

    let shadowRoot = this.attachShadow({mode: 'open'});

    shadowRoot.innerHTML = `
      <style>
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
        if(this.onclose!=undefined){
          this.onclose()
        }
      });

      if(this.noinfo){
        shadowRoot.querySelector('#info').style.display='none';
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

  get noinfo() {
    return this.hasAttribute('noinfo');
  }

  populateChildren(){
    if(this.children.length!=0){
      var ch = this.children;
      var cant = ch.length;
      for (var i = 0; i < cant; i++) {
        if(i == 0)
          ch[i].style.display = 'block';
        else
          ch[i].style.display = 'none';

        ch[i].style.margin = 'auto';
        ch[i].style.maxWidth = '100%';
        ch[i].style.maxHeight = '600px';
      }
      //counter
      this.shadowRoot.querySelector('#counter').innerHTML = '1/'+cant;
    } else {
      //hide the arrows
      this.shadowRoot.querySelector('#leftA').style.display = 'none';
      this.shadowRoot.querySelector('#rightA').style.display = 'none';
    }
  }

  activeImage(e){
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      ch[i].style.display = 'none';
    }
    ch[e].style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (e+1)+'/'+(cant);
  }

  addImage(e){
    this.appendChild(e);
    this.populateChildren();
    //show the arrows
    this.shadowRoot.querySelector('#leftA').style.display = 'block';
    this.shadowRoot.querySelector('#rightA').style.display = 'block';
  }

  loadImgFrom(ele){
    var el = ele.querySelectorAll('img');
    this.style.display = 'block';
    this.innerHTML = '';
    for (var i = 0; i < el.length; i++) {
      var src = el[i].getAttribute('src') + "?token=" + localStorage.getItem("user_token");
      var newPic = document.createElement('img');
      newPic.setAttribute('slot','images');
      newPic.setAttribute('src',src);

      //if have data-info
      if(el[i].getAttribute('data-info'))
            newPic.setAttribute('data-info',el[i].getAttribute('data-info'));

      //adding to the component
      this.addImage(newPic);
    }
  }

  infoClick(title,fn){
    this.shadowRoot.querySelector('#info').innerHTML = title;
    this.shadowRoot.querySelector('#info').addEventListener('click', function func(event) {
      fn(event);
    });
  }

  nextImage(){
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      if(ch[i].style.display == 'block'){
        var actived = ch[0];
        var index = 0;
        if(i < (cant-1)){
          actived = ch[i + 1];
          index = i + 1;
        }
      }
      ch[i].style.display = 'none';
    }
    actived.style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (index+1)+'/'+(cant);
  }

  prevImage(){
    var ch = this.children;
    var cant = ch.length;
    for (var i = 0; i < cant; i++) {
      if(ch[i].style.display == 'block'){
        var actived = ch[cant-1];
        var index = cant-1;
        if(i > 0){
          actived = ch[i - 1];
          index = i - 1;
        }
      }
      ch[i].style.display = 'none';
    }
    actived.style.display = 'block';
    this.shadowRoot.querySelector('#counter').innerHTML = (index+1)+'/'+(cant);
  }

  connectedCallback () {

  }
}
window.customElements.define('globular-image-viewer', ImageViewer);