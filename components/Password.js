
/**
 * Display the password strength base on a regualar expression.
 */
export class PasswordInput extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
  
          #container{
            display: flex;
            flex-direction: column;
          }
  
          #strength-text{
            color: var(--palette-action-disabled);
            font-size: .85rem;
            margin-left: 5px;
          }
  
          input:focus{
            outline: none;
          }
  
          #password-input {
            width: 100%;
            border: none;
            margin-right: 11px;   
            background: transparent;
            color: var(--palette-text-accent);
            box-sizing: border-box;
            font-size: 1.1rem;
          }
  
          div .strength {
            transition: height 0.3s;

            display: flex;
            align-items: center;
            background: var(--palette-action-disabled);
          }
  
          div .strength span {
            width: 0px;
            height: 2px;
            display: block;
            transition: width 0.3s;
          }
  
          label {
            display: flex;
            width: 100%;
            position:absolute;
            top:0;
            left:0;
            font-size: 1.1rem;
            color: var(--palette-action-disabled);
            -webkit-transition: all .2s ease-in-out;
            transition: all .2s ease-in-out;
          }
  
          .text-box {
            position:relative;
            margin-top: 28px;
          }
  
          label.active {
            top: -20px;
            font-size: .85rem;
          }
          
          @media only screen and (max-width: 600px) {
            label.active {font-size:12px;top:-25px;}
          }
  
          #show-password-btn:hover {
            cursor: pointer;
          }
  
        </style>
        <div id="container">
          <div class="text-box">
            <label for="password-input"><span style="flex-grow: 1;">${this.getAttribute("label")} </span><span id="strength-text"></span></label>
            <div style="display: flex;">
              <input id="password-input" type="password" data-strength class="form-control input-lg" name="password"></input>
              <iron-icon style="z-index: 100; display: none;" id="show-password-btn" icon="icons:visibility-off"></iron-icon>
            </div>
          </div>
          <div id="password-strength" class="strength">
            <span></span>
          </div>
        </div>
        `

        let showPasswordBtn = this.shadowRoot.querySelector("#show-password-btn")
        let input = this.shadowRoot.querySelector("#password-input")
        let label = this.shadowRoot.querySelector("label")

        let text = this.shadowRoot.querySelector("#strength-text")
        let div = this.shadowRoot.querySelector("#password-strength")
        let span = div.querySelector("span")

        let hasFocus = false;

        showPasswordBtn.onmouseover = () => {
            hasFocus = true
        }

        showPasswordBtn.onmouseout = () => {
            hasFocus = false
        }

        showPasswordBtn.onclick = (evt) => {
            evt.stopPropagation()

            let icon = evt.target.getAttribute("icon")
            if (icon == "icons:visibility-off") {
                evt.target.setAttribute("icon", "icons:visibility")
                input.setAttribute("type", "text")
            } else {
                evt.target.setAttribute("icon", "icons:visibility-off")
                input.setAttribute("type", "password")
            }

            input.focus()

        }

        input.onfocus = (evt) => {
            evt.stopPropagation()

            div.style.height = "2px"
            span.style.display = "block"
            text.style.display = "block"
            label.style.color = "#1e88e5"
            showPasswordBtn.style.display = "block"

            if (input.value.length > 0 && !label.classList.contains("active")) {
                label.classList.add("active")
            } else if (input.value.length == 0) {
                label.style.color = "var(--palette-action-disabled)"
                span.innerText = ""
                span.style.display = "none"
                label.classList.remove("active")
                showPasswordBtn.style.display = "none"
            }
        }

        input.onblur = (evt) => {
            if (hasFocus) {
                return
            }

            evt.stopPropagation()

            showPasswordBtn.style.display = "none"
            showPasswordBtn.setAttribute("icon", "icons:visibility-off")
            input.setAttribute("type", "password")

            div.style.height = "1px"
            span.style.display = "none"
            text.style.display = "none"
            label.style.color = "var(--palette-action-disabled)"

            if (input.value.length == 0) {
                label.classList.remove("active")
            }

        }

        input.onkeyup = (evt) => {
            evt.stopPropagation()
            var password = input.value;
            this.passwordCheck(password);
            label.style.color = "#1e88e5"
            showPasswordBtn.style.display = "block"
            span.style.display = "block"

            if (input.value.length > 0 && !label.classList.contains("active")) {
                label.classList.add("active")
            } else if (input.value.length == 0) {
                label.style.color = "var(--palette-action-disabled)"
                span.innerText = ""
                span.style.display = "none"
                label.classList.remove("active")
                showPasswordBtn.style.display = "none"
            }

            // if component user need keyup event.
            if(this.onkeyup){
                this.onkeyup(evt)
            }
        };
    }

    // Return the password values.
    getPassword() {
        let input = this.shadowRoot.querySelector("#password-input")
        return input.value;
    }

    // Call search event.
    passwordCheck(password) {
        let strength = 0;
        let text = this.shadowRoot.querySelector("#strength-text")

        if (password.length == 0) {
            text.style.display = "none"
        } else {
            text.style.display = "block"
        }

        if (password.length >= 8)
            strength += 1;

        if (password.match(/(?=.*[0-9])/))
            strength += 1;

        if (password.match(/(?=.*[!,%,&,@,#,$,^,*,?,_,~,<,>,])/))
            strength += 1;

        if (password.match(/(?=.*[a-z])/))
            strength += 1;

        if (password.match(/(?=.*[A-Z])/))
            strength += 1;

        this.displayBar(strength);
    }

    // Display the password bar...
    displayBar(strength) {

        // retreive the element...
        let span = this.shadowRoot.querySelector("#password-strength span")
        let text = this.shadowRoot.querySelector("#strength-text")

        switch (strength) {
            case 1:
                Object.assign(span.style, {
                    "width": "20%",
                    "background": "#de1616"
                });
                text.innerText = "weak"
                text.style.color = "#de1616"
                break;

            case 2:
                Object.assign(span.style, {
                    "width": "40%",
                    "background": "#de1616"
                });

                text.innerText = "weak"
                text.style.color = "#de1616"
                break;

            case 3:
                Object.assign(span.style, {
                    "width": "60%",
                    "background": "#de1616"
                });
                text.innerText = "weak"
                text.style.color = "#de1616"
                break;

            case 4:
                Object.assign(span.style, {
                    "width": "80%",
                    "background": "#FFA200"
                });
                text.innerText = "fair"
                text.style.color = "#FFA200"
                break;

            case 5:
                Object.assign(span.style, {
                    "width": "100%",
                    "background": "#06bf06"
                });
                text.innerText = "strong"
                text.style.color = "#06bf06"

                break;

            default:
                Object.assign(span.style, {
                    "width": "0",
                    "background": "#de1616"
                });
                text.style.innerText = "weak"
        }
    }
}

customElements.define('globular-password-input', PasswordInput)
