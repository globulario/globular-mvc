
//************Popup */*************************** */

export class Popup extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super();
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });

    // This will be call when the backdrop is click.
    this.onclose = null;

    this.frombtn = false;
    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
          <style>
           
              #content{
                  display: none;
                  background-color: var(--palette-background-paper);
                  color: var(--palette-text-primary);
              }
              #backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: rgba(0,0,0,0.75);
                z-index: 10;
                display: none;
                opacity:0;
                pointer-events:none;
            }
              
              paper {
                  max-width: 238px;
                  min-width: 200px;
                  max-height: 514px;
                  padding: 500px;
                  margin-left: 850px;
                
              }
              .popup {

              }
              #popup:hover {
                cursor: pointer;
                color: rgb(235, 235, 235);
            }
  
          </style>
          
          <slot id="content"></slot>  
          <div id="popup" class="popup" style="z-index: 100;position: absolute;right: 0px;"></div>
          `;

    // give the focus to the input.

    this.popup = this.shadowRoot.querySelector("#popup");
    document.addEventListener("click", (evt) => {
      if (this.popup.children.length == 0) {
        return;
      }

      // let x = evt.clientX;
      // let y = evt.clientY;
      // let xpop = parseInt(this.popup.style.marginLeft);
      // let ypop = parseInt(this.popup.style.marginTop);
      // if (x > xpop + 250 || y > ypop + 110 || y + 5 < ypop) {


      //   // this.append(...this.popup.childNodes);
      //   // this.popup.parentNode.removeChild(this.popup);
      //   // this.backdrop = document.querySelector("#backdrop");
      //   // this.backdrop.parentNode.removeChild(this.backdrop)
      // }
    }, true);

    // this.popup.click();

  }



  closePopup() {
    this.append(...this.popup.childNodes);
    this.popup.parentNode.removeChild(this.popup);
    this.backdrop = document.querySelector("#backdrop");
    this.backdrop.parentNode.removeChild(this.backdrop)
    if (this.onclose != null) {
      this.onclose()
    }
  }

  connectedCallback() {
    //this.popup.innerHTML = this.innerHTML;
  }

  getScreenCordinates(obj) {
    var p = {};
    if (obj == null) {
      obj = this;
    }

    p.x = obj.offsetLeft;
    p.y = obj.offsetTop;
    while (obj.offsetParent) {
      p.x = p.x + obj.offsetParent.offsetLeft;
      p.y = p.y + obj.offsetParent.offsetTop;
      if (obj == document.getElementsByTagName("body")[0]) {
        break;
      } else {
        obj = obj.offsetParent;
      }
    }
    return p;
  }

  offset() {
    let el = this;
    var rect = el.getBoundingClientRect(),
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  // Call search event.
  onPopup(x, y) {
    //y = 0; // test
    // this.popup.parentNode.removeChild(this.popup);

    let range = document.createRange()
    let backdrop_html = `
            <div id="backdrop" style="position:absolute;right: 0px;top: 0;width: 240px;height: 100vh;background: rgba(0,0,0,0.75);opacity:1;pointer-events:all;"></div>         
            `;

    document.body.appendChild(range.createContextualFragment(backdrop_html))
    this.popup.append(...this.childNodes);
    this.setPosition(this, x, y);
    // Append the tooltip in the container div.
    document.body.appendChild(this.popup);

    let backdrop_ = document.querySelector("#backdrop");
    backdrop_.addEventListener("click", (evt) => {

      this.closePopup()

    });
  }

  fromBtn() {
    this.frombtn = true;
  }

  setPosition(element, x, y) {
    let position = this.getScreenCordinates(element);
    this.popup.style.right = x + "px";
    this.popup.style.marginTop = position.y + y + "px";

    if (this.frombtn === true) {
      this.popup.childNodes[3].childNodes[1].childNodes[1].childNodes[3].style.gridTemplateColumns =
        "repeat(4, 1fr)";
      this.popup.childNodes[3].childNodes[1].childNodes[1].childNodes[3].childNodes[1].style.display =
        "none";
    }
  }


}



customElements.define("globular-popup", Popup);
