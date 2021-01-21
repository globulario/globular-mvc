
import { theme } from "./Theme";
export class Countdown extends HTMLElement {
    constructor() {
        super();
        this.container = null;
        // Set the shadow dom.
        this.attachShadow({ mode: "open" });
        // Set default values...
        this.countdown = 10;
        if (this.hasAttribute("countdown")) {
            this.countdown = parseInt(this.getAttribute("countdown"))
        }

        this.diameter = 40;
        if(this.hasAttribute("diameter")){
            this.diameter = parseInt(this.getAttribute("diameter"))
        }

        this.stroke = 3;
        if(this.hasAttribute("stroke")){
            this.stroke = parseInt(this.getAttribute("stroke"))
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
            color: var(--palette-text-primary);
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
            stroke: var(--palette-text-primary);
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
            <circle r="${(this.diameter - this.stroke)/2}" cx="${this.diameter/2}" cy="${this.diameter/2}"></circle>
        </svg>
      </div>
      `;


        this.interval = null;

    }

    start() {
        var countdownNumberEl = this.shadowRoot.getElementById('countdown-number');
        let countdown = this.countdown;
        countdownNumberEl.textContent = countdown;
        if (this.interval != null) {
            clearInterval(this.interval);
        }
        this.interval = setInterval(function () {
            countdown = --countdown <= 0 ? this.countdown : countdown;
            countdownNumberEl.textContent = countdown;
        }, 1000);
    }

    stop() {
        clearInterval(this.interval);
    }

    setCountdown(countdown) {
        this.countdown = countdown;
    }

}

customElements.define("globular-count-down", Countdown);