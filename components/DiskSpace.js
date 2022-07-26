import { GetSubjectAllocatedSpaceRqst, SubjectType } from "globular-web-client/rbac/rbac_pb";
import { ApplicationView } from "../ApplicationView";
import { Model } from "../Model";
import { getTheme } from "./Theme.js";


/**
 * Manage account dist space.
 */
export class DiskSpaceManager extends HTMLElement {
  // attributes.

  // Create the applicaiton view.
  constructor() {
    super()
    // Set the shadow dom.
    this.attachShadow({ mode: 'open' });
    // Innitialisation of the layout.
    this.shadowRoot.innerHTML = `
    <style>
        ${getTheme()}
        #container{

        }
    </style>
    <div id="container">
    </div>
    `
    // give the focus to the input.
    let container = this.shadowRoot.querySelector("#container")
  }

  // The connection callback.
  connectedCallback() {

    if (this.hasAttribute("account")) {
      this.getAllocatedSpace(this.getAttribute("account"), SubjectType.ACCOUNT, allocated_space=>{console.log(allocated_space)}, err=>ApplicationView.displayMessage(err, 3000))
    }else if (this.hasAttribute("application")) {
      this.getAllocatedSpace(this.getAttribute("application"), SubjectType.APPLICATION, allocated_space=>{console.log(allocated_space)}, err=>ApplicationView.displayMessage(err, 3000))
    }

  }

  getAllocatedSpace(id, type, callback, errorCallback){
    let rqst = new GetSubjectAllocatedSpaceRqst
    rqst.setSubject(id)
    rqst.setType(type)
    
    let token = localStorage.getItem("user_token")

    // call persist data
    Model.globular.rbacService
        .getSubjectAllocatedSpace(rqst, {
            token: token,
            application: Model.application,
            domain: Model.domain
        })
        .then((rsp) => {
            // Here I will return the value with it
            callback(rsp.getAllocatedSpace());
        })
        .catch((err) => {
            errorCallback(err);
        });
  }

}

customElements.define('globular-disk-space-manager', DiskSpaceManager)