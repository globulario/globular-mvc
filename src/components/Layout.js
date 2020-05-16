
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

    // The workspace div.
    getWorkspace() {
        this.shadowRoot.getElementById("workspace")
    }

    // The connection callback.
    connectedCallback() {
        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
          <style>
            app-header {
              background-color: #00897B;
              color: #fff;
            }
            paper-icon-button {
              --paper-icon-button-ink-color: white;
            }
            app-drawer-layout:not([narrow]) [drawer-toggle] {
              display: none;
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
      
          <app-drawer-layout id="layout" fullbleed force-narrow >
            <app-drawer slot="drawer">
              <app-toolbar>
                  <div id="side-menu" name="side-menu"></div>
              </app-toolbar>
            </app-drawer>
            <app-header-layout>
              <app-header slot="header" reveals fixed effects="waterfall">
                <app-toolbar>
                  <paper-icon-button icon="menu" drawer-toggle>
                    <paper-ripple class="circle" recenters></paper-ripple>
                  </paper-icon-button>
                  <div id="main-title">
                    <div id="title">Globular</div>
                    <div id="toolbar" name="toolbar"></div>
                  </div>
                </app-toolbar>
              </app-header>
              <slot name="workspace"></slot>
            </app-header-layout>
          </app-drawer-layout>
      `
    }

    // Get layout zone.

    toolbar(){
      return this.shadowRoot.getElementById("toolbar")
    }

    sideMenu(){
      return this.shadowRoot.getElementById("side-menu")
    }


    workspace(){
      return this.shadowRoot.getElementById("workspace")
    }
}

customElements.define('globular-application', Layout)

