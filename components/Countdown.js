
import { theme } from "./Theme";

export class Countdown extends HTMLElement {
  constructor(delay, diameter, stroke) {
    super();

    this.oncountdone = null;
    this.container = null;

    // Set the shadow dom.
    this.attachShadow({ mode: "open" });
    // Set default values...
    this.countdown = 10;
    if (this.hasAttribute("countdown")) {
      this.countdown = parseInt(this.getAttribute("countdown"))
    }
    if(delay !=undefined){
      this.countdown = delay;
    }

    this.diameter = 40;
    if (this.hasAttribute("diameter")) {
      this.diameter = parseInt(this.getAttribute("diameter"))
    }
    if(diameter !=undefined){
      this.diameter = diameter
    }

    this.stroke = 3;
    if (this.hasAttribute("stroke")) {
      this.stroke = parseInt(this.getAttribute("stroke"))
    }
    
    if(stroke != undefined){
      this.stroke = stroke
    }

    this.color = "var(--palette-text-accent)"
    if (this.hasAttribute("color")) {
      this.stroke = parseInt(this.getAttribute("color"))
    }

    // Connect to event.
    this.shadowRoot.innerHTML = `
      <style>
         ${theme}
         #countdown {
            position: relative;
            margin: auto;
            height:  ${this.diameter}px;
            width: ${this.diameter}px;
            text-align: center;
          }
          
          #countdown-number {
            color: ${this.color};
            display: inline-block;
            line-height: ${this.diameter}px;
          }

          svg {
            position: absolute;
            top: 0;
            right: 0;
            width: ${this.diameter}px;
            height: ${this.diameter}px;
            transform: rotateY(-180deg) rotateZ(-90deg);
          }
          
          svg circle {
            stroke-dasharray: 113px;
            stroke-dashoffset: 0px;
            stroke-linecap: round;
            stroke-width: ${this.stroke}px;
            stroke: ${this.color};
            fill: none;
            animation: countdown ${this.countdown}s linear infinite forwards;
          }
          
          @keyframes countdown {
            from {
              stroke-dashoffset: 0px;
            }
            to {
              stroke-dashoffset: 113px;
            }
          }
      </style>

      <div id="countdown">
        <div id="countdown-number"></div>
        <svg>
            <circle id="circle" r="${(this.diameter - this.stroke) / 2}" cx="${this.diameter / 2}" cy="${this.diameter / 2}"></circle>
        </svg>
      </div>
      `;

    this.div = this.shadowRoot.getElementById("countdown")
    this.interval = null;
  }

  connectedCallback() {

  }

  start() {
    this.div.style.display = ""
    var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
    let countdown = this.countdown;
    countdownNumberEl.textContent = countdown;
    if (this.interval != null) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      countdown--
      if (countdown == 0) {
        countdownNumberEl.textContent = "";
        this.stop();
        if (this.oncountdone != undefined) {
          this.oncountdone();
        }
      } else {
        countdownNumberEl.textContent = countdown
      }
    }, 1000);
  }

  // setColor =  var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
  setColor(color) {
    var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
    countdownNumberEl.style.color = color;
    var circle = this.shadowRoot.getElementById('circle');
    circle.style.stroke = color;
  }

  stop() {
    clearInterval(this.interval);
    this.div.style.display = "none"
  }

  setCountdown(countdown) {
    this.countdown = countdown;
  }

}

customElements.define("globular-count-down", Countdown);