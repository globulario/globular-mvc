
import { Globular } from "globular-web-client";
import { GetFileInfoRequest, RunCmdRequest } from "globular-web-client/admin/admin_pb";
import { DisconnectResponse } from "globular-web-client/conversation/conversation_pb";
import { ReadDirRequest } from "globular-web-client/file/file_pb";
import { TargetsRequest } from "globular-web-client/monitoring/monitoring_pb";
import { Application } from "../Application";
import { File } from "../File";
import { theme } from "./Theme";


/**
 * Command prompt to execute command on the server.
 */
export class Terminal extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        this.onenterfullscreen = null
        this.onexitfullscreen = null

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            paper-card{
                position: relative;
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                font: 1rem Inconsolata, monospace;
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
                font: 1rem Inconsolata, monospace;
            }

            textarea:focus, input:focus{
                outline: none;
            }

            .error-message {
                word-break: break-all;
                color: var(--palette-secondary-main);
            }

            .title{
                text-align: center;
                height: 20px;
                padding-top: 10px;
                padding-bottom: 10px;
                color: var(--palette-action-disabled);
                
                flex-grow: 1;
            }

            .cmd-input{
                displex: flex;
                align-items: center;
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

            #current-user{
                color:var(--palette-success-main);
            }

            #current-dir{
                color:var(--palette-warning-main);
            }

        </style>
        <paper-card>
            <div style="display: flex; width: 100%; border-bottom: 1px solid var(--palette-action-disabled);">
                <span class="title">Terminal @${Application.globular.config.Domain} Globular ${Application.globular.config.Version}</span>
                <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
            </div>
            <div id="container" style="flex-grow: 1; height: 50vh; overflow-y: auto;">
                <div class="oupout" style=""> 

                </div>
                <div  style="display: flex; margin-top: 10px; padding-top: 5px; padding-bottom: 5px; align-items: center;">
                    <span id="current-user">${Application.account.id}@${Application.globular.config.Domain}</span>:
                    <span id="current-dir"></span>
                    <iron-icon icon="icons:chevron-right"></iron-icon>
                    <input type="text" class="rq-form-element" />
                </div>
            </div>
        </paper-card>
        `
        // The command input...
        this.input = this.shadowRoot.querySelector("input")
        this.output = this.shadowRoot.querySelector(".oupout")
        this.path = Application.globular.config.WebRoot
        this.dirObj = null
        this.currentPathSpan = this.shadowRoot.querySelector("#current-dir")
        this.currentPathSpan.innerHTML = this.path
        // enter full screen and exit full screen btn
        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")


        this.shadowRoot.querySelector("#container").onclick = () => {
            this.gotoBottom()
            this.input.focus()
        }

        // Now the action....
        this.input.onkeydown = (evt) => {
            evt.stopPropagation()
            if (this.input.value.length == 0) {
                return
            }

            if (evt.key === "Enter") {
                this.runCommand(this.input.value)
                this.input.value = ""
                this.input.focus()
            } else if (evt.key === "Tab") {
                this.autocomplete(this.input.value)
            }
        }

        this.input.onkeyup = (evt) => {
            evt.stopPropagation()
            this.gotoBottom()
            this.input.focus()
        }

        // I will use the resize event to set the size of the file explorer.
        this.exitFullScreenBtn.onclick = () => {
            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.position = ""
            this.style.top = ""
            this.style.bottom = ""
            this.style.right = ""
            this.style.left = ""
            this.shadowRoot.querySelector("#container").style.height = "50vh "
            document.querySelector("globular-console").style.display = ""
            if(this.onexitfullscreen){
                this.onexitfullscreen()
            }
        }

        this.enterFullScreenBtn.onclick = () => {
            this.style.position = "absolute"
            this.style.top = "60px"
            this.style.bottom = "00px"
            this.style.right = "0px"
            this.style.left = "0px"
            this.enterFullScreenBtn.style.display = "none"
            this.exitFullScreenBtn.style.display = "block"
            
            if(this.onenterfullscreen){
                this.onenterfullscreen()
            }
        }
    }

    /**
     * Read the dir object.
     */
    connectedCallback() {
        // Focus the input
        this.input.focus();

        // get the list of files on the directory, use to validate actions and 
        // autocomplete input.
        this.getFiles(this.path,
            dir => {
                this.dirObj = dir
            },
            err => {
                console.log(err)
            })
    }

    /**
     * Go to the bottom of the div...
     */
    gotoBottom() {
        var element = this.shadowRoot.querySelector("#container");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }

    /**
     * Retreive list of files at a given path.
     * @param {*} path 
     * @param {*} onSuccessCallback 
     * @param {*} onErrorCallback 
     */
    getFiles(path, callback, errorCallback) {
        const rqst = new GetFileInfoRequest();
        rqst.setPath(path);
        Application.globular.adminService.getFileInfo(rqst, { application: Application.application, domain: Application.domain, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getInfo())
            })
            .catch(errorCallback)
    }

    /**
     * Run a command on the server and print the outpout in the terminal.
     * @param {*} cmd 
     * @returns 
     */
    runCommand(cmd) {

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

        let cmd_ = values.splice(0, 1)[0]
        // Keep no empty values...
        let args = []
        values.forEach(val => {
            if (val.length > 0) {
                args.push(val)
            }
        })

        let path = this.path
        if (path.startsWith("~")) {
            path = path.replace("~", Application.globular.config.DataPath + "/files/users/" + Application.account.id)
        }

        if (cmd_.length == 0) {
            return
        } else if (cmd_ == "clear") {
            this.output.innerHTML = ""
            return
        } else if (cmd_ == "cd" && args.length > 0) {
            // keep the actual path in memory...
            if (args[0] == ("..")) {
                // Here I will split the path and remove the last value...
                let dirs = path.split("/")
                dirs.pop() // remove the last
                if (dirs.length == 0) {
                    path = "/"
                } else {
                    path = ""
                    for (var i = 0; i < dirs.length; i++) {
                        if (dirs[i].length > 0) { // remove empty values (happend the path begin by / )
                            if (dirs[i].indexOf(":") == -1) {
                                path += "/" + dirs[i]
                            } else {
                                // not begin by a slash...
                                path += dirs[i]
                            }
                        }
                    }
                    if(path.length == 0){
                        path = "/"
                    }
                }
            } else if (args[0].startsWith("~")) {
                path = args[0]
            } else {
                let path_ = args[0]
                // make it absolute...
                if (path_[0] != "/" && path_[1] != ":") {
                    if (path == "/") {
                        path_ = path + path_
                    } else {
                        path_ = path + "/" + path_
                    }

                } else if (path_.endsWith(":")) {
                    // TODO make it work with c:...
                }

                // Test if the directory exist...
                path = path_
            }

            this.getFiles(path,
                dir => {
                    // Set the path and the dir object.
                    this.path = path
                    this.dirObj = dir

                    // display the path.
                    this.currentPathSpan.innerHTML = this.path
                },
                err => {
                    this.displayErrorMessage(JSON.parse(err.message).ErrorMsg, cmd)
                })
            return
        }

        // Set the request...
        let rqst = new RunCmdRequest

        // Set the command...
        rqst.setCmd(cmd_) // get the first element and set it as a command...
        rqst.setArgsList(args)
        rqst.setPath(path)
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
                this.displayErrorMessage(JSON.parse(status.details).ErrorMsg, cmd)
            }
        });
    }

    // Try to autocomplete the commande line...
    autocomplete(cmd_line) {
        console.log("try to autocomplete the command: ", cmd_line)
        if (cmd_line.startsWith("cd ") || cmd_line.startsWith("rm ")) {
            // Here I will try to autocomple from the actual list of file contain in dir..
            // remove the command...
            let cmd = cmd_line.split(" ")[0]
            let val = cmd_line.substring(3).trim()
            let candidates = []
            this.dirObj.getFilesList().forEach(f => {
                // Here I will get the list of possible values...
                if (f.getName().startsWith(val)) {
                    candidates.push(f.getName())
                }
            })

            // set the value...
            if (candidates.length == 1) {
                this.input.value = cmd + " " + candidates[0]
            } else if (candidates.length > 1) {
                // Here I will display the list of possible values...
            }
        }
    }

    // Display error message
    displayErrorMessage(err, cmd_line) {
        let html = `
        <div class="cmd-input" style="margin-top: 10px;"> 
            <span style="color:var(--palette-success-main);">${Application.account.id}@${Application.globular.config.Domain}</span>:
            <span style="color:var(--palette-warning-main);">${this.path}</span>
            <iron-icon icon="icons:chevron-right"></iron-icon>
            ${cmd_line}
        </div>
        <div class="error-message">
            ${err}
        </div>
        `
        let range = document.createRange()
        this.output.appendChild(range.createContextualFragment(html))
        this.input.value = ""
        this.input.focus()
    }

    // Here I will display the command results...
    appendResult(cmd_line, pid, result) {
        let id = "_" + pid + "_cmd_output"
        let cmdOutput = this.output.querySelector(`#${id}`)
        let range = document.createRange()
        if (cmdOutput == undefined) {
            let html = `
            <div id=${id} style="margin-top: 10px;">
                <div class="cmd-input"> 
                    <span style="color:var(--palette-success-main);">${Application.account.id}@${Application.globular.config.Domain}</span>:
                    <span style="color:var(--palette-warning-main);">${this.path}</span>
                    <iron-icon icon="icons:chevron-right"></iron-icon>
                    ${cmd_line}
                </div>
                <div class="cmd-output"></div>
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