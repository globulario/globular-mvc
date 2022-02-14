import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";

/**
 * Display information about given object ex. titles, files...
 */
export class InformationsManager extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                flex-direction: column;
                padding: 8px;
                overflow: auto;
            }

            #header {
                display: flex;
            }

            #header h1, h2, h3 {
                margin: 0px;
            }

            .title-div{
                display: flex;
                flex-direction: column;
                flex-grow: 1;
                color: var(--palette-text-primery);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 66.66%;
                margin-bottom: 10px;
            }

            .title-sub-title-div{
                display: flex;
            }

            #title-year {
                padding-left: 10px;
                padding-right: 10px;
            }

            .permissions{
                padding: 10px;
            }

        </style>
        <div id="container">
            <div id="header">
                <div class="title-div">
                    <h1 id="title-name" class="title"> </h1>
                    <h3 class="title-sub-title-div">             
                        <span id="title-type"></span>
                        <span id="title-year"></span>
                        <span id="title-duration"></span>
                    </h3>
                </div>
                <paper-icon-button icon="close"></paper-icon-button>
            </div>
            <slot></slot>
        </div>
        `
        // give the focus to the input.
        this.container = this.shadowRoot.querySelector("#container")

        // The close button...
        let closeButton = this.shadowRoot.querySelector("paper-icon-button")
        closeButton.onclick = () => {
            // remove it from it parent.
            this.parentNode.removeChild(this)
            
        }

    }

    /**
     * Display title informations.
     * @param {*} titles 
     */
    setTitlesInformation(titles) {

        let title = titles[0]

        this.shadowRoot.querySelector("#title-name").innerHTML = title.getName();
        this.shadowRoot.querySelector("#title-type").innerHTML = title.getType();
        this.shadowRoot.querySelector("#title-year").innerHTML = title.getYear();
        this.shadowRoot.querySelector("#title-duration").innerHTML = title.getDuration();

        let posterUrl = ""
        if(title.getPoster()!=undefined){
            posterUrl = title.getPoster().getContenturl()
        }

        this.innerHTML = "" // remove previous content.

        // So here I will create the display for the title.
        let html = `
        <style>
            .title-div {
                display: flex;
            }

            .title-poster-div {
                
            }

            .title-informations-div {
                padding-left: 20px;
                font-size: 1.17em;
                max-width: 450px;
            }

            .title-poster-div img{
                max-width: 256px;
            }

            .title-genre-span {
                border: 1px solid var(--palette-divider);
                padding: 5px;
                margin-right: 5px;
            }

            .rating-star{
                --iron-icon-fill-color: rgb(245 197 24);
                padding-right: 10px;
                height: 30px;
                width: 30px;
            }

            .title-rating-div{
                display: flex;
                align-items: center;
                color: var(--palette-text-secondery);
                font-size: 1rem;
            }

            #rating-span{
                font-weight: 600;
                font-size: 1.3rem;
                color: var(--palette-text-primery);
            }

            .title-credit {
                flex-grow: 1;
                color: var(--palette-text-primery);
                border-bottom: 2px solid;
                border-color: var(--palette-divider);
                width: 100%;
                margin-bottom: 10px;
            }

            .title-top-credit, title-credit{
                margin-top: 15px;
                display: flex;
                flex-direction: column;
            }

            .title-credit-title{
                font-weight: 400;
                font-size: 1.1rem;
                color: var(--palette-text-primery);
            }

            .title-credit-lst{
                display: flex;
            }

            .title-credit-lst a {
                color: var(--palette-warning-main);
                font-size: 1.1rem;
                margin-right: 12px;
            }

            .title-credit-lst a:link { text-decoration: none; }
            .title-credit-lst a:visited { text-decoration: none; }
            .title-credit-lst a:hover { text-decoration: none; cursor:pointer; }
            .title-credit-lst a:active { text-decoration: none; }

            /** Small **/
            @media only screen and (max-width: 600px) {
                .title-div {
                    flex-direction: column;
                }

                .title-poster-div {
                    display: flex;
                    align-items: center;
                }
            }

        </style>
        <div id="${title.getId()}-div" class="title-div">
            <div class="title-poster-div" >
                <img src="${posterUrl}"></img>
            </div>
            <div class="title-informations-div">
                <div class="title-genres-div"></div>
                <p class="title-synopsis-div">${title.getDescription()}</p>
                <div class="title-rating-div">
                    <iron-icon class="rating-star" icon="icons:star"></iron-icon>
                    <div style="display: flex; flex-direction: column;">
                        <div><span id="rating-span">${title.getRating().toFixed(1)}</span>/10</div>
                        <div>${title.getRatingcount()}</div>
                    </div>
                </div>
                <div class="title-top-credit">
                    <div class="title-credit">
                        <div id="title-directors-title" class="title-credit-title">Director</div>
                        <div  id="title-directors-lst" class="title-credit-lst"></div>
                    </div>
                    <div class="title-credit">
                        <div id="title-writers-title" class="title-credit-title">Writer</div>
                        <div id="title-writers-lst" class="title-credit-lst"></div>
                    </div>
                    <div class="title-credit">
                        <div id="title-actors-title" class="title-credit-title">Star</div>
                        <div id="title-actors-lst" class="title-credit-lst"></div>
                    </div>
                </div>
            </div>
        </div>
        `
        let range = document.createRange()

        this.appendChild(range.createContextualFragment(html))

        let genresDiv = this.querySelector(".title-genres-div")
        title.getGenresList().forEach(g=>{
            let genreSpan = document.createElement("span")
            genreSpan.classList.add("title-genre-span")
            genreSpan.innerHTML = g
            genresDiv.appendChild(genreSpan)
        })

        // Display list of persons...
        let displayPersons = (div, persons) =>{
            persons.forEach(p=>{
                let lnk = document.createElement("a")
                lnk.href = p.getUrl()
                lnk.innerHTML = p.getFullname()
                lnk.target="_blank"
                div.appendChild(lnk)
            })
        }

        // display directors
        displayPersons(this.querySelector("#title-directors-lst"), title.getDirectorsList())
        if(title.getDirectorsList().length > 0){
            this.querySelector("#title-directors-title").innerHTML = "Directors"
        }

        // display writers
        displayPersons(this.querySelector("#title-writers-lst"), title.getWritersList())
        if(title.getWritersList().length > 0){
            this.querySelector("#title-writers-title").innerHTML = "Writers"
        }

        // display actors
        displayPersons(this.querySelector("#title-actors-lst"), title.getActorsList())
        if(title.getActorsList().length > 0){
            this.querySelector("#title-actors-title").innerHTML = "Actors"
        }
    }
}

customElements.define('globular-informations-manager', InformationsManager)