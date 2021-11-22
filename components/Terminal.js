
import { RunCmdRequest } from "globular-web-client/admin/admin_pb";
import { Application } from "../Application";
import { theme } from "./Theme";

/**
 * Command prompt to execute command on the server.
 */
export class Terminal extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            paper-card{
                display: flex;
                flex-direction: column;
                margin-top: 10%;
                marging-bottom: 10%;
                width: 100%;
                height: 100%;
                font: 1.1rem Inconsolata, monospace;
                text-shadow: 0 0 1px #C8C8C8;
                background: repeating-linear-gradient(
                    0deg,
                    rgba(black, 0.15),
                    rgba(black, 0.15) 1px,
                    transparent 1px,
                    transparent 2px
                  );
            }

            textarea, input{
                border: none;
                background: transparent;
                color: var(--palette-text-primary);
                flex-grow: 1;
                font: 1.1rem Inconsolata, monospace;
            }

            textarea:focus, input:focus{
                outline: none;
            }

            .title{
                height: 20px;
                padding: 10px;
                color: var(--palette-action-disabled);
            }

            .cmd-input{
                displex: flex;
                color: var(--palette-action-disabled);
            }

            .oupout{
                justify-content: flex-end;
                flex-direction: column;
            }

            .cmd-input iron-icon {
                --iron-icon-fill-color: var( --palette-action-disabled);
            }

            .cmd-output{
                display: flex;
                flex-direction: column-reverse;
            }

        </style>
        <paper-card>
            <span class="title">
              Terminal
            </span>
            <div id="container" style="flex-grow: 1; height: 55vh; overflow-y: auto;">
                <div class="oupout" style=""> 

                </div>
                <div  style="display: flex; margin-top: 16px; padding-top: 5px; padding-bottom: 5px;">
                    <iron-icon icon="icons:chevron-right"></iron-icon>
                    <input type="text" class="rq-form-element" />
                </div>
            </div>
        </paper-card>
        `
        // The command input...
        this.input = this.shadowRoot.querySelector("input")
        this.output = this.shadowRoot.querySelector(".oupout")


        // Now the action....
        this.input.onkeydown = (evt) => {
            if (evt.key === "Enter") {
                this.runCommand(this.input.value)
                this.input.value = ""
                this.input.focus()
            }
        }
    }

    connectedCallback() {
        // Focus the input
        this.input.focus();
    }

    /**
     * Go to the bottom of the div...
     */
    gotoBottom(){
        var element = this.shadowRoot.querySelector("#container");
        element.scrollTop = element.scrollHeight - element.clientHeight;
     }

    /**
     * Run a command on the server and print the outpout in the terminal.
     * @param {*} cmd 
     * @returns 
     */
    runCommand(cmd) {
        if (cmd.length == 0) {
            return
        } else if (cmd == "clear") {
            this.output.innerHTML = ""
            return
        }

        let rqst = new RunCmdRequest

        // split values and keep value inside quote mark intact...
        let values = cmd.match(/\\?.|^$/g).reduce((p, c) => {
            if (c === '"') {
                p.quote ^= 1;
            } else if (!p.quote && c === ' ') {
                p.a.push('');
            } else {
                p.a[p.a.length - 1] += c.replace(/\\(.)/, "$1");
            }
            return p;
        }, { a: [''] }).a

        // Set the command...
        rqst.setCmd(values.splice(0, 1)[0]) // get the first element and set it as a command...

        // Keep no empty values...
        let args = []
        values.forEach(val => {
            if (val.length > 0) {
                args.push(val)
            }
        })
        rqst.setArgsList(args)
        rqst.setBlocking(true) // wait for the response...

        let stream = Application.globular.adminService.runCmd(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
        let pid = -1;

        // Here I will create a local event to be catch by the file uploader...
        stream.on("data", (rsp) => {
            if (rsp.getPid() != null) {
                pid = rsp.getPid()
            }
            // Publish local event.
            this.appendResult(cmd, pid, rsp.getResult())
            console.log({ pid: pid, infos: rsp.getResult(), done: false });
        });

        stream.on("status", (status) => {
            if (status.code === 0) {
                console.log({ pid: pid, infos: "", done: true });
            } else {
                // error here...
                ApplicationView.displayMessage(status.details, 3000)
            }
        });
    }

    // Here I will display the command results...
    appendResult(cmd_line, pid, result) {
        let id = "_" + pid + "_cmd_output"
        let cmdOutput = this.output.querySelector(`#${id}`)
        let range = document.createRange()
        if (cmdOutput == undefined) {
            let html = `
            <div id=${id} style="margin-top: 16px;">
                <div class="cmd-input">  <iron-icon icon="icons:chevron-right"></iron-icon>${cmd_line}</div>
                <div class="cmd-output">
                </div>
            </div>
            `

            this.output.appendChild(range.createContextualFragment(html))
            cmdOutput = this.output.querySelector(`#${id}`)
        }

        let html = `<div style="word-break: break-all;">${result}</div>`

        // Now i will append the result...
        cmdOutput.querySelector(".cmd-output").appendChild(range.createContextualFragment(html))
        this.gotoBottom()
    }
}

customElements.define('globular-terminal', Terminal)