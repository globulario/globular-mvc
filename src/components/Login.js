
// I will made use of polymer instead of materialyze for the main
// layout because materialyse dosen't react to well with the shadow doom.
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/paper-ripple/paper-ripple.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-checkbox/paper-checkbox.js';

import { Model } from '../Model';

/**
 * This is a web-component.
 */
export class Login extends HTMLElement {
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
 
            #login_div span:hover{
                cursor:pointer;
            }

            #login_div {
                display: flex;
            }

            #login_div:hover{
                cursor: pointer;
            }

            #login_div paper-button {
                font-size: 1rem;
            }

        </style>
        <span id="login_div">
            <paper-button id="register_btn">register</paper-button>
            <paper-button id="login_btn">login</paper-button>
        </span>
      `


        // The login panel.
        this.shadowRoot.getElementById("login_btn").onclick = () => {
            // Append the login box in the workspace.
            let workspace = document.getElementById("workspace")
            workspace.innerHTML = ""

            // Create the login box.
            var html = `
            <style>

                paper-input iron-icon{
                    margin-right: 10px;
                }

                #workspace{
                    display: flex;
                    justify-content: center;
                    min-height: calc(100vh - 64px);
                }

                #login_box{
                    height: 256px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    margin-top: 140px;
                    min-width: 340px;
                    position: relative;
                }

                #login_box .card-actions {
                    display: flex;
                    justify-content: flex-end;
                }

                #login_box paper-checkbox {
                    margin: 20px 0px 10px 0px;
                }

                .card-title{
                    position: absolute;
                    top: -40px;
                    font-size: 1rem;
                    text-transform: uppercase;
            
                    color: var(--cr-primary-text-color);
                    font-size: 108%;
                    font-weight: 400;
                    letter-spacing: .25px;
                    margin-bottom: 12px;
                    margin-top: var(--cr-section-vertical-margin);
                    outline: none;
                    padding-bottom: 4px;
                    padding-top: 8px;
                }

            </style>

            <paper-card id="login_box">
                    <h2 class="card-title">LOGIN</h2>
                    <div class="card-content">
                        <paper-input id="user_input" label="user/email">
                            <iron-icon icon="account-circle" slot="prefix"></iron-icon>
                        </paper-input>
                        <paper-input id="pwd_input" type="password" label="password">
                            <iron-icon icon="lock" slot="prefix"></iron-icon>
                        </paper-input>
                        <paper-checkbox id="remember_me">Remember me</paper-checkbox>
                    </div>
                    <div class="card-actions">
                        <paper-button id="login_btn">login</paper-button>
                        <paper-button id="cancel_btn">cancel</paper-button>
                    </div>
                </paper-card>
            `

            let range = document.createRange()


            workspace.appendChild(range.createContextualFragment(html))

            // give the focus to the input.
            let userInput = document.getElementById("user_input")
            userInput.focus()

            let passwordInput = document.getElementById("pwd_input")
            let cancelBtn = document.getElementById("cancel_btn")
            let loginBtn = document.getElementById("login_btn")
            let remeberMeBtn = document.getElementById("remember_me")

            // remove the login box from the layout
            cancelBtn.onclick = () => {
                workspace.innerHTML = ""
            }

            loginBtn.onclick = (evt) => {
                evt.stopPropagation()

                // Get the user id and pwd.
                let userId = userInput.value
                let pwd = passwordInput.value
                workspace.innerHTML = ""

                // so here I will throw a event.
                Model.eventHub.publish("login_event_", { userId: userId, pwd: pwd }, true)
            }

            // And you remember me, with a lot of rum!
            if (localStorage.getItem("remember_me") != undefined) {
                if (localStorage.getItem("remember_me") != undefined) {
                    remeberMeBtn.checked = localStorage.getItem("remember_me") == "true";
                } else {
                    remeberMeBtn.checked = false
                }
            }

            remeberMeBtn.onchange = () => {
                localStorage.setItem("remember_me", remeberMeBtn.checked)
                if (remeberMeBtn.checked == false) {
                    localStorage.removeItem("remember_me")
                }
            }
        }

        this.shadowRoot.getElementById("register_btn").onclick = () => {
            // Append the login box in the workspace.
            let workspace = document.getElementById("workspace")
            workspace.innerHTML = ""

            // Create the login box.
            var html = `
            <style>
                #workspace{
                    display: flex;
                    justify-content: center;
                    min-height: calc(100vh - 64px);
                }

                paper-input iron-icon{
                    margin-right: 10px;
                }

                #register_box{
                    height: 333px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    margin-top: 140px;
                    min-width: 340px;
                    position: relative;
                }

                #register_box .card-actions {
                    display: flex;
                    justify-content: flex-end;
                }

                .card-title{
                    position: absolute;
                    top: -40px;
                    font-size: 1rem;
                    text-transform: uppercase;
            
                    color: var(--cr-primary-text-color);
                    font-size: 108%;
                    font-weight: 400;
                    letter-spacing: .25px;
                    margin-bottom: 12px;
                    margin-top: var(--cr-section-vertical-margin);
                    outline: none;
                    padding-bottom: 4px;
                    padding-top: 8px;
                }

            </style>

            <paper-card id="register_box">
                    <h2 class="card-title">REGISTER</h2>
                    <div class="card-content">
                        <paper-input id="user_input" label="user">
                            <iron-icon icon="account-circle" slot="prefix"></iron-icon>
                        </paper-input>
                        <paper-input id="email_input" label="email">
                            <iron-icon icon="mail" slot="prefix"></iron-icon>
                        </paper-input>
                        <paper-input id="pwd_input" type="password" label="password">
                            <iron-icon icon="lock" slot="prefix"></iron-icon>
                        </paper-input>
                        <paper-input id="retype_pwd_input" type="password" label="retype password">
                            <iron-icon icon="lock" slot="prefix"></iron-icon>
                        </paper-input>
                    </div>
                    <div class="card-actions">
                        <paper-button id="register_btn">register</paper-button>
                        <paper-button id="cancel_btn">cancel</paper-button>
                    </div>
            </paper-card>
        `

            let range = document.createRange()

            // Append the login box in the workspace.
            workspace.appendChild(range.createContextualFragment(html))

            let cancelBtn = document.getElementById("cancel_btn")
            let registerBtn = document.getElementById("register_btn")
            let userInput = document.getElementById("user_input")
            userInput.focus()
            let emailInput = document.getElementById("email_input")

            let passwordInput = document.getElementById("pwd_input")
            let retypePasswordInput = document.getElementById("retype_pwd_input")

            // remove the login box from the layout
            cancelBtn.onclick = () => {
                workspace.innerHTML = ""
            }

            // Register an new user.
            registerBtn.onclick = () => {
                let userId = userInput.value
                let pwd = passwordInput.value
                let repwd = retypePasswordInput.value
                let email = emailInput.value

                workspace.innerHTML = ""
                // so here I will throw a event.
                Model.eventHub.publish("register_event_", { userId: userId, email:email, pwd: pwd, repwd:repwd}, true)
            }

        }

    }
}

customElements.define('globular-login', Login)