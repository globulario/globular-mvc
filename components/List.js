import { theme } from "./Theme";

/**
 * Search Box
 */
 export class SearchableList extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(title, list) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
        this.list = list

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            .header{
                display: flex;
                align-items: center;
                width: 100%;
                transition: background 0.2s ease,padding 0.8s linear;
                background-color: var(--palette-background-paper);
            }

            .item-div:hover{
                -webkit-filter: invert(10%);
                filter: invert(10%);
            }

            .item-div{
                padding: 5px;
                display: flex; 
                align-items: center;
            }

            .title{
               
            }
        </style>
        
        <div id="header-div" class="header">
            <div style="flex-grow: 1;  padding: 5px;">
                <span class="title">${title} (${list.length})</span>
                <paper-input type="text" label="Filter" width="100"></paper-input>
            </div>
            <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                <iron-icon  id="action-add-btn"  icon="add" style="flex-grow: 1; --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                <paper-ripple class="circle" recenters=""></paper-ripple>
            </div>
        </div>
        <div id="shadow-div" style="width: 100%; height: 5px;"></div>
        <div id="items-div" style="width: 100%;max-height: 300px; min-width: 550px; overflow-y: auto; maring-top: 5px; margin-bottom: 5px;"></div>
        `

        let listDiv = this.shadowRoot.querySelector("#items-div")
        let headerDiv =  this.shadowRoot.querySelector("#header-div")
        let shadowDiv = this.shadowRoot.querySelector("#shadow-div")
        // set the header shadow...
        listDiv.onscroll = ()=>{
            if(listDiv.scrollTop == 0){
                shadowDiv.style.boxShadow = ""
            }else{
                shadowDiv.style.boxShadow = "inset 0px 5px 6px -3px rgb(0 0 0 / 40%)"
            }
        }

       // Here I will display the filter input.
       let filterInput = this.shadowRoot.querySelector("paper-input")
       this.filter = ""
       filterInput.onkeyup = ()=>{
           this.filter = filterInput.value;
           this.displayItems()
       }

        // Here I will create the action list...
        this.displayItems()
    }

    // That function display items.
    displayItems(){
        // clean up the list of items.
        let listDiv = this.shadowRoot.querySelector("#items-div")
        listDiv.innerHTML = ""

        this.list.sort().forEach((item) => {
            let html = `
            <div class="item-div" style="">
                <span style="flex-grow: 1;">${item}</span>
                <paper-icon-button icon="delete"></paper-icon-button>
            </div>`
            let div = document.createRange().createContextualFragment(html)
            if(item.toUpperCase().indexOf(this.filter.toUpperCase()) != -1 || this.filter.length == 0){
                listDiv.appendChild(div)
            }
           
        })
    }

}

customElements.define('globular-searchable-list', SearchableList)