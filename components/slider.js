import { getTheme } from "./Theme.js";

/**
 * Sample empty component
 */
export class Slider extends HTMLElement {
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
                .slider {
                  -webkit-appearance: none;
                  width: 100%;
                  height: 2px;
                  border-radius: 2px;
                  background-color: rgb(124,124,124);
                  outline: none;
                  opacity: 0.7;
                  -webkit-transition: .2s;
                  transition: opacity .2s;
                
                }
                
                .slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background-color: rgb(217,217,217);
                  box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 1px, rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px;
                  cursor: ew-resize;
                }
                
                .slider::-moz-range-thumb {
                  width: 25px;
                  height: 25px;
                  border-radius: 50%;
                  background: rgb(217,217,217);
                  cursor: pointer;
                }
                
                .grid-container {
                    display: grid;
                    grid-column-gap: 10px;
                    grid-template-columns: var(--space-value, 16px 130px 60px) ;
                   
                    padding: 0px;
                  }
                  
                  .css-wg001orm-box-primitive-flexbox {
                    background-color: rgb(43, 43, 43);
                    color: rgb(166, 166, 166);
                    font-size: 20px;
                    text-align: center;
                    font-size: 10px;
                    width: 60px;
                    border-style: solid;
                    border-color: rgb(33, 33, 33);
                    border-width: 1px;
                    border-radius: 2px;
                    display: flex;
                  }   
             
      
        </style>
        <div class="grid-container">
            <div>
              <slot><slot>
            </div>  

            <div>
                <input  type="range" mode="relative" min="-200" max="200" value="0" class="slider" id="myRange">
            </div>
            <div class="css-wg001orm-box-primitive-flexbox">                          
            <globular-dropdown style="--unit-select-color:rgb(43, 43, 43);" >
            <div>PX</div>
            <div>%</div>
            <div>EM</div>
            <div>VW</div>
            <div>VH</div>
            <div>AUTO</div>                         
            </globular-dropdown>    
            </div>
        </div>
    `

    this.globularDropdown = this.shadowRoot.querySelectorAll("globular-dropdown");
    this.globularDropdown.forEach((ele) => {
      ele.shadowRoot.querySelector("#unit-selected").innerHTML = "PX";
      let divSelected = ele.shadowRoot.querySelectorAll(".data-automation");
      for (let i = 0; i < divSelected.length; i++) {
        divSelected[i].addEventListener("click", (evt) => {
          if (i == 5) {
            ele.hideInput()
          }
          else {
            ele.showInput()
          }
        }
        )
      }
    })
    // give the focus to the input.
    this.slider = this.shadowRoot.getElementById("myRange")
    //  this.output = this.shadowRoot.getElementById("spacing")

    this.dropdown = this.shadowRoot.querySelector("globular-dropdown")
    this.output = this.dropdown.shadowRoot.getElementById("input-select")

    // this.unitSelected = this.dropdown.shadowRoot.querySelectorAll(".text-item")
    this.divSelected = this.dropdown.shadowRoot.querySelectorAll(".bem-Svg")

    this.slider.oninput = () => {
      this.output.value = this.slider.value
      this.slider.value = this.output.value
      this.output.style.display = "block"
      if (this.dropdown.shadowRoot.getElementById("unit-select").innerHTML === "AUTO") {
        this.dropdown.shadowRoot.getElementById("unit-select").innerHTML = "PX"
        this.divSelected[0].style.display = "block"
        this.divSelected[5].style.display = "none"
      }

    }
  }
}

customElements.define('globular-slider', Slider)
