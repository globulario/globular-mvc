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

export let theme = `:host{

  --toolbar-height: 64px;
  --searchbox-height: 44px;

  /** Material design (default theme is light)  */
  /** colors **/
  --palette-primary-accent: #1976d2;

  /** Primary **/
  --palette-primary-light: #4791db;
  --palette-primary-main: #1976d2;
  --palette-primary-dark: #115293;

  /** Secondary **/
  --palette-secondary-light: #e33371;
  --palette-secondary-main: #dc004e;
  --palette-secondary-dark: #9a0036;

  /** Error **/
  --palette-error-light: #ffb74d;
  --palette-error-main: #ff9800;
  --palette-error-dark: #f57c00;

  /** Error **/
  --palette-error-light: #ffb74d;
  --palette-error-main: #ff9800;
  --palette-error-dark: #f57c00;

  /** Info **/
  --palette-warning-light: #64b5f6;
  --palette-warning-main: #2196f3;
  --palette-warning-dark: #1976d2;

  /** Success **/
  --palette-success-light: #81c784;
  --palette-success-main: #4caf50;
  --palette-success-dark: #388e3c;

  /** Typography **/
  --palette-text-primary: rgba(0, 0, 0, 0.87);
  --palette-text-secondary: rgba(0, 0, 0, 0.54);
  --palette-text-disabled: rgba(0, 0, 0, 0.38);
  --palette-text-accent: #fff;
  
  /** Buttons **/
  --palette-action-active: rgba(0, 0, 0, 0.54);
  --palette-action-disabled: rgba(0, 0, 0, 0.26);
  --palette-action-hover: rgba(0, 0, 0, 0.04);
  --palette-action-disabledBackground: rgba(0, 0, 0, 0.12);
  --palette-action-selected: rgba(0, 0, 0, 0.08);

  /** Background **/
  --palette-background-default: #fafafa;
  --palette-background-paper: #fff;

  /** Divider **/
  --palette-divider: rgba(0, 0, 0, 0.12);

  /** webcomponents colors **/
  --paper-icon-button-ink-color: var(--palette-text-primary);
  --iron-icon-fill-color:  var(--palette-text-primary);
  --paper-input-container-focus-color:  var(--palette-primary-light);
  --paper-input-container-input-color: var(--palette-text-primary);

  --paper-checkbox-unchecked-background-color: var(--palette-action-disabled);
  --paper-checkbox-unchecked-color: var(--palette-action-disabled);
  --paper-checkbox-unchecked-ink-color: var(--palette-action-disabled);
  /**/
  --paper-checkbox-checkmark-color: var(--palette-text-accent);

  --paper-checkbox-label-color: rgb(195, 195, 195));
  --paper-checkbox-checked-color: var(--palette-primary-main);
  --paper-checkbox-checked-ink-color: var(--palette-primary-main);
  --paper-checkbox-label-checked-color: var(--palette-text-primary);
  --paper-checkbox-error-color: var(--palette-error-main);

  --dark-mode-shadow: 0 1px 3px 0 rgba(0, 0, 0, .3), 0 4px 8px 3px rgba(0, 0, 0, .15);
}

/** The dark theme. **/
:host-context([theme="dark"]){
  --palette-primary-accent: #424242;

  /** Typography **/
  --palette-text-primary: #fff;
  --palette-text-secondary:rgba(255, 255, 255, 0.7);
  --palette-text-disabled: rgba(255, 255, 255, 0.5);
  --palette-text-accent: #fafafa;

  /** Buttons **/
  --palette-action-active: #fff;
  --palette-action-disabled: rgba(255, 255, 255, 0.3);
  --palette-action-hover: rgba(255, 255, 255, 0.08);
  --palette-action-disabledBackground: rgba(255, 255, 255, 0.12);
  --palette-action-selected: rgba(255, 255, 255, 0.16);

  /** Background **/
  --palette-background-default: #303030;
  --palette-background-paper: #424242;

  /** Divider **/
  --palette-divider: rgba(255, 255, 255, 0.12);

}

div, span, h1, h2, h3{
  font-family: var(--font-family);
}

paper-card div{
  background-color: var(--palette-background-paper);
  color: var(--palette-text-primary);
}

::-webkit-scrollbar
{
  width: 8px;  /* for vertical scrollbars */
  height: 8px; /* for horizontal scrollbars */
}

::-webkit-scrollbar-track
{
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb
{
  background: rgba(0, 0, 0, 0.5);
}
`;

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
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }

            ::slotted(paper-card){
              background-color: var(--palette-background-paper);
              color: var(--palette-text-primary);
            }

          </style>
      
          <app-drawer-layout id="layout" fullbleed force-narrow>
            <app-drawer id="app-drawer" slot="drawer">
              <app-toolbar>
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
                <div id="left-side-menu" style="position: fixed;"></div>
                <slot id="workspace" name="workspace"></slot>
                <div id="right-side-menu"></div>
              </div>
            </app-header-layout>
          </app-drawer-layout>
      `;
    // keep reference of left
    this.appDrawer = this.shadowRoot.getElementById("app-drawer");
    this.menuBtn = this.shadowRoot.getElementById("menu-btn");
    this.layout = this.shadowRoot.getElementById("layout");
    this.hamburger = this.shadowRoot.getElementById("menu-btn");
    this.leftSideMenu = this.shadowRoot.getElementById("left-side-menu");

    this.hideSideBar();

    window.addEventListener("resize", () => {
      if(this.workspace()== null){
        return;
      }
      if (this.layout.offsetWidth > 1024) {
        this.hamburger.style.display = "none";
        if(this.toolbar() != null){
          this.leftSideMenu.style.top = this.toolbar().offsetHeight + 24 +  5 + "px"
        }
        if(this.sideMenu() != null){
        while (this.sideMenu().childNodes.length > 0) {
          this.leftSideMenu.appendChild(this.sideMenu().childNodes[0]);
        }
        }
        if(this.leftSideMenu != null &&  this.workspace() != null){
          this.workspace().style.marginLeft = this.leftSideMenu.offsetWidth + "px"
        }
        // Here I will take the content of the
      } else {
        this.hamburger.style.display = "";
        if(this.sideMenu() != null && this.leftSideMenu != null){
          while (this.leftSideMenu.childNodes.length > 0) {
            this.sideMenu().appendChild(this.leftSideMenu.childNodes[0]);
          }
        }
        this.workspace().style.marginLeft = "0px"
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
   * Return the workspace
   */
  workspace() {
    return document.getElementById("workspace");
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