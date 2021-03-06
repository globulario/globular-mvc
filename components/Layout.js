// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import "@polymer/iron-icons/iron-icons.js";
import "@polymer/paper-icon-button/paper-icon-button.js";
import "@polymer/app-layout/app-drawer-layout/app-drawer-layout.js";
import "@polymer/app-layout/app-drawer/app-drawer.js";
import "@polymer/app-layout/app-scroll-effects/app-scroll-effects.js";
import "@polymer/app-layout/app-header/app-header.js";
import "@polymer/app-layout/app-header-layout/app-header-layout.js";
import "@polymer/app-layout/app-toolbar/app-toolbar.js";
import "@polymer/app-layout/demo/sample-content.js";
import "@polymer/paper-button/paper-button.js";
import "@polymer/paper-spinner/paper-spinner.js";
import "@polymer/iron-selector/iron-selector.js";

import { Model } from "../Model";
import { theme } from "./Theme";

/**
 * This is a web-component.
 */
export class Layout extends HTMLElement {
  // attributes.
  // Create the applicaiton view.
  constructor() {
    super();
    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
  }
  // The connection callback.
  connectedCallback() {
    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
          <style>
            ${theme}

            app-header {
              background-color: var(--palette-primary-accent);
              color: var(--palette-text-accent);
            }

            #content{
              background-color: var(--palette-background-default);
              color: var(--palette-text-primary);
              heigth: 100%;
              min-height: calc(100vh - var(--toolbar-height));
            }
            
            app-drawer app-toolbar{ 
                background-color: var(--palette-background-default);
                color: var(--palette-text-primary);
                height: 100vh;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            }

            app-drawer-layout:not([narrow]) [drawer-toggle] {
              display: none;
            }

            ::slotted(#header-toolbar){
              height: var(--toolbar-height);
            }
            
            #main-title {
              display: flex;
              width: 100%;
              align-items: center;
            }

            #waiting_div_text div{
              text-align: center;
            }

            #menu-btn{
              --iron-icon-fill-color: var(--palette-text-accent);
            }

            ::slotted(#toolbar) {
              display: flex;
              flex-grow: 1;
              align-self: center;
              justify-self: flex-end;
              justify-content: flex-end;
              color: var(--palette-text-accent);
            }
            
            ::slotted(#title) {
              display: flex;
              font-family: var(--font-familly);
              font-size: 1rem;
              font-weight: 400;
              line-height: 1.5;
              text-transform: uppercase;
              color: var(--palette-text-accent);
            }
            
            ::slotted(#title:hover) {
              cursor: pointer;
            }

            ::slotted(#workspace) {
              width: 65%;
              margin: 0 auto;
              text-align: center;
            }

            @media only screen and (max-width: 1500px) {
              ::slotted(#workspace) {
                width: 85%;
              }
            }

            @media only screen and (max-width: 1024px) {
              ::slotted(#workspace) {
                width: 100%;
              }
            }
    
            ::slotted(paper-card){
              background-color: var(--palette-background-paper);
              color: var(--palette-text-primary);
            }

          </style>
      
          <app-drawer-layout id="layout" fullbleed force-narrow>
            <app-drawer id="app-drawer" slot="drawer">
              <app-toolbar id="app-toolbar-side-menu">
                  <slot id="side-menu" name="side-menu"></slot>
              </app-toolbar>
            </app-drawer>
            <app-header-layout>
              <app-header slot="header" fixed effects="waterfall">
                <app-toolbar id="header-toolbar">
                  <paper-icon-button id="menu-btn" icon="menu" drawer-toggle>
                    <paper-ripple class="circle" recenters></paper-ripple>
                  </paper-icon-button>
                  <div id="main-title">
                    <slot id="title" name="title"></slot>
                    <slot id="toolbar" name="toolbar"></slot>
                  </div>
                </app-toolbar>
              </app-header>
              <div id="content">
                <slot id="workspace" name="workspace"></slot>
              </div>
            </app-header-layout>
          </app-drawer-layout>
      `;
    // keep reference of left
    this.appDrawer = this.shadowRoot.getElementById("app-drawer");
    this.appToolbar = this.shadowRoot.getElementById("app-toolbar-side-menu");
    this.menuBtn = this.shadowRoot.getElementById("menu-btn");
    this.layout = this.shadowRoot.getElementById("layout");
    this.hamburger = this.shadowRoot.getElementById("menu-btn");
    this.content = this.shadowRoot.getElementById("content");
    this.sideMenuSlot = this.shadowRoot.getElementById("side-menu");
    this.header = this.shadowRoot.querySelector("app-header")

    this.hideSideBar();

    window.addEventListener("resize", () => {
      if (this.workspace() == null) {
        return;
      }
       // Set side menu div style.
       let sideMenu_ = document.getElementById("side-menu");
      
       let sticky_side_menu = false
       if(sideMenu_.getAttribute("sticky")!=undefined){
         sticky_side_menu = true
       }
 
       if (this.layout.offsetWidth > 1024 && !sticky_side_menu) {
         // Here I will take the content of the
         this.hamburger.style.display = "none";
         this.content.insertBefore(this.sideMenuSlot, this.content.firstChild);
         sideMenu_.style.top = "70px";
         sideMenu_.style.position = "fixed";
         sideMenu_.style.left = "10px";
         sideMenu_.style.marginTop = "0px";
         sideMenu_.style.width = "auto";
         sideMenu_.style.display = "block";
 
       } else {
         // Set the menu in the toolbar.
         this.appToolbar.appendChild(this.sideMenuSlot);
         this.hamburger.style.display = "";
         sideMenu_.style.top = "0px";
         sideMenu_.style.position = "";
         sideMenu_.style.display = "flex";
         sideMenu_.style.flexDirection = "column";
         sideMenu_.style.width = "100%";
         sideMenu_.style.marginTop = "24px";
       }
    });

    window.dispatchEvent(new Event("resize"));
  }
  showSideBar() {
    // Set the side menu.
    let layout = this.shadowRoot.getElementById("layout");
    layout.insertBefore(this.appDrawer, layout.firstChild);
    // Set the menu button
    let toolbar = this.shadowRoot.getElementById("header-toolbar");
    toolbar.insertBefore(this.menuBtn, toolbar.firstChild);
  }
  hideSideBar() {
    this.menuBtn.parentNode.removeChild(this.menuBtn);
    this.appDrawer.parentNode.removeChild(this.appDrawer);
  }

  hideHeader(){
    this.header.style.display = "none"
  }

  showHeader(){
    this.header.style.display = ""
  }

  // Get layout zone.
  init() {
    // Connect the event listener's
    // Here I will connect the event listener's
    Model.eventHub.subscribe(
      "login_event",
      (uuid) => {
        /** nothing to do here. */
      },
      (data) => {
        // Here the user is log in...
        this.showSideBar();
      },
      true
    );
    Model.eventHub.subscribe(
      "logout_event",
      (uuid) => {
        /** nothing to do here. */
      },
      (data) => {
        // Here the user is log out...
        this.hideSideBar();
      },
      true
    );
  }
  width() {
    return this.shadowRoot.getElementById("layout").offsetWidth;
  }
  /**
   * That contain the application title.
   */
  title() {
    return document.getElementById("title");
  }
  /**
   * The toolbar contain the application menu.
   */
  toolbar() {
    return document.getElementById("toolbar");
  }

  /**
   * Return the side menu
   */
  sideMenu() {
    return document.getElementById("side-menu");
  }

  /**
   * Clear the side menu
   */
  clearSideMenu() {
    document.getElementById("side-menu").innerHTML = "";
  }

  /**
   * Return the workspace
   */
  workspace() {
    return document.getElementById("workspace");
  }

  /**
   * Clear the workspace
   */
  clearWorkspace() {
    this.workspace().innerHTML = "";
  }

  /**
   * Block user input and wait until resume.
   * @param {*} msg
   */
  wait(msg) {
    if (msg == undefined) {
      msg = "wait...";
    }
    if (this.shadowRoot.getElementById("waiting_div") != undefined) {
      this.shadowRoot.getElementById("waiting_div_text").innerHTML = msg;
    } else {
      let html = `
        <style>
          #waiting_div_text div{
            text-align: center;
            color: var(--palette-text-primary);
          }
        </style>
        <div id="waiting_div" style="position: fixed; background-color: rgba(0, 0, 0, 0.2); top:0px; left: 0px; right: 0px; bottom:0px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <paper-spinner style="width: 4.5rem; height: 4.5rem;" active></paper-spinner>
          <span id="waiting_div_text" style="margin-top: 4.5rem; font-size: 1.2rem; display: flex; flex-direction: column; justify-content: center; align-items: center;">${msg}</span>
        </div>
      `;
      this.shadowRoot.appendChild(
        document.createRange().createContextualFragment(html)
      );
    }
  }
  /**
   * Remove the waiting div.
   */
  resume() {
    let waitingDiv = this.shadowRoot.getElementById("waiting_div");
    if (waitingDiv != undefined) {
      waitingDiv.parentNode.removeChild(waitingDiv);
    }
  }
}

customElements.define("globular-application", Layout);
