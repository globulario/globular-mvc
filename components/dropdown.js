

/**
 * Dropdown component
 */
export class Dropdown extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super();
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
    this.unitList = false;

    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `  
    <style>
       

        #container {
            display: block;
        }

        .data-automation {
            outline: 0px;
            cursor: default;
            user-select: none;
            left: 0px;
            height: 20px;
            font-size: 11px;
            padding: 6px 8px;
        }

        .listbox {
            z-index: 100;
            top: var(--top-style);
            width: var(--width-style);
            height: var(--top-height);
            margin-left: var(--margin-left-style);
            opacity: 100;
            background-color: rgb(77, 77, 77);
            border-color: rgb(51, 51, 51);
            border-radius: 3px;
            transform: translate3d(-33px, -8px, 0px);
            position: absolute;
            border-width: 1px;
            border-style: solid;
            box-shadow: rgba(0, 0, 0, 0.15) 0px 5px 10px;
            display: none;
            overflow: auto;
        }

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

        .listbox::-webkit-scrollbar {
          width: 5px;
        }
            
        .listbox::-webkit-scrollbar-track {
            background: var(--palette-background-default);
        }
        
        .listbox::-webkit-scrollbar-thumb {
            background: var(--palette-divider); 
        }

        .text-item {
            min-width: 20px;
            align-self: center;
            margin-left: 5px;
            color: rgb(217, 217, 217);
            display: flex;
        }

        .data-automation:hover {
            background-color: rgba(94, 94, 94);
        }

        .bem-Svg {
            display: none;
        }
 
        </style>

        <div id="container">
        <div id="unit-select" style="display:flex;height: 25px;background-color:var(--unit-select-color);align-items: center;justify-content: space-around;">
        <input id="input-select" style="display:var(--input-dropdown-display);font-size: 10px;background-color: transparent;border-width: 0px;width:26px;color: rgb(166, 166, 166);" type="text" autocomplete="off" data-wf-text-input="true" value="" ></input>           
       <span class="text-item" id="unit-selected">AR</span>
        </div>

        <div id="list-box"  class="listbox">
                
            
                      <div id="data-automation-list" style:"font-size: 14px;">
                      <slot></slot>
                      </div>
                </div>
            </div>
        </div>
    </div>
    `;
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container");
    this.listBox = this.shadowRoot.querySelector(".listbox");
    this.dataAutomationList = this.shadowRoot.querySelector("#data-automation-list");
    
    let range = document.createRange();
    let items = []
    while(this.children.length > 0){
        items.push(this.children[0])
        this.removeChild(this.children[0])
    }

    for(var i=0; i < items.length; i++){
      let unitListbox_html = `
        <div  role="option" cursor="default" tabindex="0" class="data-automation">
            <div style="display: flex; flex-direction: row; align-items: center;">
                <div style="align-self: center; margin: 3px;">
                    <div style="width: 13px;"></div>
                    <svg data-icon="CheckMedium" aria-hidden="true" focusable="false" width="13" height="11" viewBox="0 0 13 11" class="bem-Svg" style="display:none;">
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M11 2L5.5 8.5 2 5"></path>
                    </svg>
                </div>
                <div class="text-item">                                             
                    <span style="margin-left: 5px;" id="slot-content"></span>
                </div>
            </div>
        </div>
        `

    
      this.dataAutomationList.appendChild(
        range.createContextualFragment(unitListbox_html)
      );
      
      // Get the last element in the list.
      let item = this.dataAutomationList.children[this.dataAutomationList.children.length - 1]
      item.querySelector("#slot-content").appendChild(items[i])

      // Add click event.
      item.addEventListener("click", (evt) => {
        evt.stopPropagation();

        let uncheck = this.shadowRoot.querySelectorAll(".bem-Svg");
        uncheck.forEach(function (unchecks) {
          unchecks.style.display = "none";
        });
        
        let check = item.querySelector(".bem-Svg");
        check.style.display = "block";
        UnitSelect.innerHTML = item.querySelector("#slot-content").innerHTML;
        this.listBox.style.display = "none";
      });
     
    }

    let UnitSelect = this.shadowRoot.querySelector("#unit-selected");
    UnitSelect.onclick = () => {
      this.listBox.style.display = "block";
    };

  }

  hideInput(){
    this.shadowRoot.querySelector("#input-select").style.display = "none";
  }
  showInput(){
    this.shadowRoot.querySelector("#input-select").style.display = "block";
  }

}

customElements.define("globular-dropdown", Dropdown);
