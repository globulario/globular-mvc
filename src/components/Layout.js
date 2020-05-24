
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-layout/demo/sample-content.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-spinner/paper-spinner.js';

import { Model } from '../Model';

/**
 * This is a web-component.
 */
export class Layout extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });
  }

  // The connection callback.
  connectedCallback() {
    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
          <style>

            app-header {
              background-color: var(--md-toolbar-color);
              color: #fff;
            }

            paper-icon-button {
              --paper-icon-button-ink-color: white;
            }
   
            app-drawer-layout:not([narrow]) [drawer-toggle] {
              display: none;
            }

            #header-toolbar{
              height: var(--md-toolbar-height);
            }  

            #main-title{
              display:flex;
              width: 100%;
              align-items: center;
            }

            #toolbar{
              display:flex;
            }

            #title{
              flex-grow: 1;
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
                    <slot name="title"></slot>
                    <slot name="toolbar"></slot>
                  </div>
                </app-toolbar>
              </app-header>
              <slot name="workspace"></slot>
            </app-header-layout>
          </app-drawer-layout>
      `
    // keep reference of left 
    this.appDrawer = this.shadowRoot.getElementById("app-drawer")
    this.menuBtn = this.shadowRoot.getElementById("menu-btn")

    this.hideSideBar()
  }

  showSideBar() {
    // Set the side menu.
    let layout = this.shadowRoot.getElementById("layout")
    layout.insertBefore(this.appDrawer, layout.firstChild)

    // Set the menu button
    let toolbar = this.shadowRoot.getElementById("header-toolbar")
    toolbar.insertBefore(this.menuBtn, toolbar.firstChild)
  }

  hideSideBar() {
    this.menuBtn.parentNode.removeChild(this.menuBtn)
    this.appDrawer.parentNode.removeChild(this.appDrawer)
  }

  // Get layout zone.
  init() {
    // Connect the event listener's

    // Here I will connect the event listener's
    Model.eventHub.subscribe("login_event",
      (uuid) => {
        /** nothing to do here. */
      },
      (data) => {
        // Here the user is log in...
        this.showSideBar()

      }, true)

    Model.eventHub.subscribe("logout_event",
      (uuid) => {
        /** nothing to do here. */
      },
      (data) => {
        // Here the user is log out...
        this.hideSideBar()

      }, true)

  }

  width(){
    return this.shadowRoot.getElementById("layout").offsetWidth
  }

  /**
   * That contain the application title.
   */
  title(){
    return document.getElementById("title")
  }

  /**
   * The toolbar contain the application menu.
   */
  toolbar() {
    return document.getElementById("toolbar")
  }

  sideMenu() {
    return document.getElementById("side-menu")
  }

  workspace() {
    return document.getElementById("workspace")
  }

  /**
   * Block user input and wait until resume.
   * @param {*} msg 
   */
  wait(msg) {
    if (msg == undefined) {
      msg = "wait..."
    }

    if (this.shadowRoot.getElementById("waiting_div") != undefined) {
      this.shadowRoot.getElementById("waiting_div_text").innerHTML = msg;
    } else {
      let html = `
        <style>
          #waiting_div_text div{
            text-align: center;
          }
        </style>
        <div id="waiting_div" style="position: fixed; background-color: rgba(0, 0, 0, 0.2); top:0px; left: 0px; right: 0px; bottom:0px; display: flex; flex-direction: column; align-items: center; justify-content: center;  ">
          <paper-spinner style="width: 4.5rem; height: 4.5rem;" active></paper-spinner>
          <span id="waiting_div_text" style="margin-top: 4.5rem; font-size: 1.2rem; display: flex; flex-direction: column; justify-content: center;">${msg}</span>
        </div>
      `
      this.shadowRoot.appendChild(document.createRange().createContextualFragment(html))
    }
  }


  /**
   * Remove the waiting div.
   */
  resume() {
    let waitingDiv = this.shadowRoot.getElementById("waiting_div")
    waitingDiv.parentNode.removeChild(waitingDiv)
  }
  
}

customElements.define('globular-application', Layout)

