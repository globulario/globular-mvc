
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { GetProcessInfosRequest } from "globular-web-client/admin/admin_pb";
import { ApplicationView } from "../ApplicationView";
import { v4 as uuidv4 } from "uuid";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

/*
This generates colors using the following algorithm:
Each time you create a color:
    Create a random, but attractive, color{
        Red, Green, and Blue are set to random luminosity.
        One random value is reduced significantly to prevent grayscale.
        Another is increased by a random amount up to 100%.
        They are mapped to a random total luminosity in a medium-high range (bright but not white).
    }
    Check for similarity to other colors{
        Check if the colors are very close together in value.
        Check if the colors are of similar hue and saturation.
        Check if the colors are of similar luminosity.
        If the random color is too similar to another,
        and there is still a good opportunity to change it:
            Change the hue of the random color and try again.
    }
    Output array of all colors generated
*/
function generateRandomColors(number) {

    //if we've passed preloaded colors and they're in hex format
    if (typeof (arguments[1]) != 'undefined' && arguments[1].constructor == Array && arguments[1][0] && arguments[1][0].constructor != Array) {
        for (var i = 0; i < arguments[1].length; i++) { //for all the passed colors
            var vals = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(arguments[1][i]); //get RGB values
            arguments[1][i] = [parseInt(vals[1], 16), parseInt(vals[2], 16), parseInt(vals[3], 16)]; //and convert them to base 10
        }
    }
    var loadedColors = typeof (arguments[1]) == 'undefined' ? [] : arguments[1],//predefine colors in the set
        number = number + loadedColors.length,//reset number to include the colors already passed
        lastLoadedReduction = Math.floor(Math.random() * 3),//set a random value to be the first to decrease
        rgbToHSL = function (rgb) {//converts [r,g,b] into [h,s,l]
            var r = rgb[0], g = rgb[1], b = rgb[2], cMax = Math.max(r, g, b), cMin = Math.min(r, g, b), delta = cMax - cMin, l = (cMax + cMin) / 2, h = 0, s = 0; if (delta == 0) h = 0; else if (cMax == r) h = 60 * ((g - b) / delta % 6); else if (cMax == g) h = 60 * ((b - r) / delta + 2); else h = 60 * ((r - g) / delta + 4); if (delta == 0) s = 0; else s = delta / (1 - Math.abs(2 * l - 1)); return [h, s, l]
        }, hslToRGB = function (hsl) {//converts [h,s,l] into [r,g,b]
            var h = hsl[0], s = hsl[1], l = hsl[2], c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = l - c / 2, r, g, b; if (h < 60) { r = c; g = x; b = 0 } else if (h < 120) { r = x; g = c; b = 0 } else if (h < 180) { r = 0; g = c; b = x } else if (h < 240) { r = 0; g = x; b = c } else if (h < 300) { r = x; g = 0; b = c } else { r = c; g = 0; b = x } return [r, g, b]
        }, shiftHue = function (rgb, degree) {//shifts [r,g,b] by a number of degrees
            var hsl = rgbToHSL(rgb); //convert to hue/saturation/luminosity to modify hue
            hsl[0] += degree; //increment the hue
            if (hsl[0] > 360) { //if it's too high
                hsl[0] -= 360 //decrease it mod 360
            } else if (hsl[0] < 0) { //if it's too low
                hsl[0] += 360 //increase it mod 360
            }
            return hslToRGB(hsl); //convert back to rgb
        }, differenceRecursions = {//stores recursion data, so if all else fails we can use one of the hues already generated
            differences: [],//used to calculate the most distant hue
            values: []//used to store the actual colors
        }, fixDifference = function (color) {//recursively asserts that the current color is distinctive
            if (differenceRecursions.values.length > 23) {//first, check if this is the 25th recursion or higher. (can we try any more unique hues?)
                //if so, get the biggest value in differences that we have and its corresponding value
                var ret = differenceRecursions.values[differenceRecursions.differences.indexOf(Math.max.apply(null, differenceRecursions.differences))];
                differenceRecursions = { differences: [], values: [] }; //then reset the recursions array, because we're done now
                return ret; //and then return up the recursion chain
            } //okay, so we still have some hues to try.
            var differences = []; //an array of the "difference" numbers we're going to generate.
            for (var i = 0; i < loadedColors.length; i++) { //for all the colors we've generated so far
                var difference = loadedColors[i].map(function (value, index) { //for each value (red,green,blue)
                    return Math.abs(value - color[index]) //replace it with the difference in that value between the two colors
                }), sumFunction = function (sum, value) { //function for adding up arrays
                    return sum + value
                }, sumDifference = difference.reduce(sumFunction), //add up the difference array
                    loadedColorLuminosity = loadedColors[i].reduce(sumFunction), //get the total luminosity of the already generated color
                    currentColorLuminosity = color.reduce(sumFunction), //get the total luminosity of the current color
                    lumDifference = Math.abs(loadedColorLuminosity - currentColorLuminosity), //get the difference in luminosity between the two
                    //how close are these two colors to being the same luminosity and saturation?
                    differenceRange = Math.max.apply(null, difference) - Math.min.apply(null, difference),
                    luminosityFactor = 50, //how much difference in luminosity the human eye should be able to detect easily
                    rangeFactor = 75; //how much difference in luminosity and saturation the human eye should be able to dect easily
                if (luminosityFactor / (lumDifference + 1) * rangeFactor / (differenceRange + 1) > 1) { //if there's a problem with range or luminosity
                    //set the biggest difference for these colors to be whatever is most significant
                    differences.push(Math.min(differenceRange + lumDifference, sumDifference));
                }
                differences.push(sumDifference); //otherwise output the raw difference in RGB values
            }
            var breakdownAt = 64, //if you're generating this many colors or more, don't try so hard to make unique hues, because you might fail.
                breakdownFactor = 25, //how much should additional colors decrease the acceptable difference
                shiftByDegrees = 15, //how many degrees of hue should we iterate through if this fails
                acceptableDifference = 250, //how much difference is unacceptable between colors
                breakVal = loadedColors.length / number * (number - breakdownAt), //break down progressively (if it's the second color, you can still make it a unique hue)
                totalDifference = Math.min.apply(null, differences); //get the color closest to the current color
            if (totalDifference > acceptableDifference - (breakVal < 0 ? 0 : breakVal) * breakdownFactor) { //if the current color is acceptable
                differenceRecursions = { differences: [], values: [] } //reset the recursions object, because we're done
                return color; //and return that color
            } //otherwise the current color is too much like another
            //start by adding this recursion's data into the recursions object
            differenceRecursions.differences.push(totalDifference);
            differenceRecursions.values.push(color);
            color = shiftHue(color, shiftByDegrees); //then increment the color's hue
            return fixDifference(color); //and try again
        }, color = function () { //generate a random color
            var scale = function (x) { //maps [0,1] to [300,510]
                return x * 210 + 300 //(no brighter than #ff0 or #0ff or #f0f, but still pretty bright)
            }, randVal = function () { //random value between 300 and 510
                return Math.floor(scale(Math.random()))
            }, luminosity = randVal(), //random luminosity
                red = randVal(), //random color values
                green = randVal(), //these could be any random integer but we'll use the same function as for luminosity
                blue = randVal(),
                rescale, //we'll define this later
                thisColor = [red, green, blue], //an array of the random values
                /*
                #ff0 and #9e0 are not the same colors, but they are on the same range of the spectrum, namely without blue.
                Try to choose colors such that consecutive colors are on different ranges of the spectrum.
                This shouldn't always happen, but it should happen more often then not.
                Using a factor of 2.3, we'll only get the same range of spectrum 15% of the time.
                */
                valueToReduce = Math.floor(lastLoadedReduction + 1 + Math.random() * 2.3) % 3, //which value to reduce
                /*
                Because 300 and 510 are fairly close in reference to zero,
                increase one of the remaining values by some arbitrary percent betweeen 0% and 100%,
                so that our remaining two values can be somewhat different.
                */
                valueToIncrease = Math.floor(valueToIncrease + 1 + Math.random() * 2) % 3, //which value to increase (not the one we reduced)
                increaseBy = Math.random() + 1; //how much to increase it by
            lastLoadedReduction = valueToReduce; //next time we make a color, try not to reduce the same one
            thisColor[valueToReduce] = Math.floor(thisColor[valueToReduce] / 16); //reduce one of the values
            thisColor[valueToIncrease] = Math.ceil(thisColor[valueToIncrease] * increaseBy) //increase one of the values
            rescale = function (x) { //now, rescale the random numbers so that our output color has the luminosity we want
                return x * luminosity / thisColor.reduce(function (a, b) { return a + b }) //sum red, green, and blue to get the total luminosity
            };
            thisColor = fixDifference(thisColor.map(function (a) { return rescale(a) })); //fix the hue so that our color is recognizable
            if (Math.max.apply(null, thisColor) > 255) { //if any values are too large
                rescale = function (x) { //rescale the numbers to legitimate hex values
                    return x * 255 / Math.max.apply(null, thisColor)
                }
                thisColor = thisColor.map(function (a) { return rescale(a) });
            }
            return thisColor;
        };
    for (var i = loadedColors.length; i < number; i++) { //Start with our predefined colors or 0, and generate the correct number of colors.
        loadedColors.push(color().map(function (value) { //for each new color
            return Math.round(value) //round RGB values to integers
        }));
    }
    //then, after you've made all your colors, convert them to hex codes and return them.
    return loadedColors.map(function (color) {
        var hx = function (c) { //for each value
            var h = c.toString(16);//then convert it to a hex code
            return h.length < 2 ? '0' + h : h//and assert that it's two digits
        }
        return "#" + hx(color[0]) + hx(color[1]) + hx(color[2]); //then return the hex code
    });
}

function getStats(callback, errorcallback) {

    let url = window.location.protocol + "//" + window.location.host + "/stats"

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
            var obj = JSON.parse(this.responseText);
            callback(obj);
        } else if (this.readyState == 4) {
            errorcallback("fail to get the configuration file at url " + url + " status " + this.status)
        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("domain", Model.domain);

    xmlhttp.send();
}

/**
 * The Globular process manager.
 */
export class SystemMonitor extends HTMLElement {
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
 
             
             .title{
                 text-align: center;
                 height: 20px;
                 padding-top: 10px;
                 padding-bottom: 10px;
                 color: var(--palette-action-disabled);
                 
                 flex-grow: 1;
             }
 
             .error_message{
                 color: var(--palette-secondary-main);
             }
 
             .info_message{
                 color: var(--palette-secondary-light);
             }

             #container {
                flex-grow: 1; 
                height: 30vh; 
                overflow-y: auto;
                display: flex;
                flex-direction: column;
             }

             #tab-content {
                flex-grow: 1;
                overflow: auto;
             }

             paper-tabs{
                 min-height: 48px;
             }

          </style>
          <paper-card>
             <div style="display: flex; width: 100%; border-bottom: 1px solid var(--palette-action-disabled);">
                 <span class="title"></span>
                 <paper-icon-button icon="icons:fullscreen" id="enter-full-screen-btn"></paper-icon-button>
                 <paper-icon-button icon="icons:fullscreen-exit" id="exit-full-screen-btn" style="display: none;"></paper-icon-button>
             </div>
             <div id="container" style="">
                <paper-tabs selected="0">
                    <paper-tab id="host-infos-tab">
                        <span>Host Infos</span>
                    </paper-tab>
                    <paper-tab id="resources-display-tab">
                        <span>Resources</span>
                    </paper-tab>
                    <paper-tab id="processes-manager-tab">
                        <span>Processes</span>
                    </paper-tab>
                </paper-tabs>
                <div id="tab-content">
                    <slot>
                    </slot>
                </div>
             </div>
          </paper-card>
          `

        this.enterFullScreenBtn = this.shadowRoot.querySelector("#enter-full-screen-btn")
        this.exitFullScreenBtn = this.shadowRoot.querySelector("#exit-full-screen-btn")

        let hostInfosTab = this.shadowRoot.querySelector("#host-infos-tab")
        this.hostInfos = new HostInfos()
        this.appendChild(this.hostInfos)

        let resourcesDisplayTab = this.shadowRoot.querySelector("#resources-display-tab")
        this.resourcesDisplay = new ResourcesDisplay()
        this.appendChild(this.resourcesDisplay)

        let processesManagerTab = this.shadowRoot.querySelector("#processes-manager-tab")
        this.processesManager = new ProcessesManager()
        this.appendChild(this.processesManager)


        // Here I will connect the tab and the panel...
        hostInfosTab.onclick = () => {
            this.hostInfos.style.display = "block"
            this.resourcesDisplay.style.display = "none"
            this.processesManager.style.display = "none"
        }

        resourcesDisplayTab.onclick = () => {
            this.hostInfos.style.display = "none"
            this.resourcesDisplay.style.display = "block"
            this.processesManager.style.display = "none"
        }

        processesManagerTab.onclick = () => {
            this.hostInfos.style.display = "none"
            this.resourcesDisplay.style.display = "none"
            this.processesManager.style.display = "block"
        }

        // Set the first tab...
        hostInfosTab.click()


        // I will use the resize event to set the size of the file explorer.
        this.exitFullScreenBtn.onclick = () => {
            this.enterFullScreenBtn.style.display = "block"
            this.exitFullScreenBtn.style.display = "none"
            this.style.position = ""
            this.style.top = ""
            this.style.bottom = ""
            this.style.right = ""
            this.style.left = ""
            this.shadowRoot.querySelector("#container").style.height = "30vh "
            document.querySelector("globular-console").style.display = ""
            if (this.onexitfullscreen) {
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

            if (this.onenterfullscreen) {
                this.onenterfullscreen()
            }
        }


    }

    /**
     * Go to the bottom of the div...
     */
    gotoBottom() {
        var element = this.shadowRoot.querySelector("#container");
        element.scrollTop = element.scrollHeight - element.clientHeight;
    }

    displayStats(stats) {
        this.hostInfos.setUptime(stats.uptime)
        this.resourcesDisplay.setInfos(stats)
    }

    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.shadowRoot.querySelector(`.title`).innerHTML = `System Monitor @${Application.globular.config.Domain} Globular ${Application.globular.config.Version}`

        getStats((stats) => {
            this.hostInfos.setInfos(stats)
            this.resourcesDisplay.setInfos(stats)
        }, err => ApplicationView.displayMessage(err, 3000))

        this.interval = setInterval(() => {
            // Display stats...
            getStats((stats) => {
                this.displayStats(stats)
            }, err => ApplicationView.displayMessage(err, 3000))
        }, 1000)

    }

    disconnectedCallback() {
        clearInterval(this.interval)
    }
}

customElements.define('globular-system-monitor', SystemMonitor)


/**
 * Get process usage, kill process... etc.
 */
export class ProcessesManager extends HTMLElement {
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
        </style>
        `
    }

    /**
     * 
     * @param {*} callback 
     */
    getProcessesInfo(callback) {
        let rqst = new GetProcessInfosRequest
        rqst.setName("")
        rqst.setPid(0)
        Application.globular.adminService.getProcessInfos(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getInfosList())
            })
            .catch(err => ApplicationView.displayMessage(err, 3000))
    }

    /**
     * display process infos...
     * @param {*} infos 
     */
    displayProcess(infos) {
        // console.log(infos)
    }

    /**
     * The this is call at login time.
     */
    connectedCallback() {
        this.interval = setInterval(() => {
            this.getProcessesInfo((infos) => this.displayProcess(infos))
        }, 1000)

    }

    /**
     * 
     */
    disconnectedCallback() {
        clearInterval(this.interval);
    }


}

customElements.define('globular-processes-manager', ProcessesManager)

/**
 * Display resources usage
 */
export class ResourcesDisplay extends HTMLElement {
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
            #container, #cpu-div {
                display: flex;
                flex-direction: column;

            }

            #cpu-info{
                display: table;
            }

            .row {
                display: table-row;
            }

            .cell {
                display: table-cell;
                padding: 5px;
                border-bottom: 1px solid var(--palette-primary-accent);
            }

            .label {
                width: 30%;
            }

            .value {
                width: 70%;
            }

            .section-title{
                font-weight: 900;
                margin-top: 5px;
                margin-botton: 5px;
            }

            #cpu-utilizations-div{
                display: table;
            }
            
        </style>
        <div id="container">
            <div id="cpu-div">
                <div class="section-title">CPU</div>
                <div id="cpu-info">
                    <div class="row">
                        <div class="cell label">Model</div>
                        <div class="cell value" id="cpu-model-name-div"></div>
                    </div>
                    <div class="row">
                        <div class="cell label">Vendor</div>
                        <div class="cell value" id="cpu-vendor-div"></div>
                    </div>
                    <div class="row">
                        <div class="cell label">Speed</div>
                        <div class="cell value" id="cpu-speed-div"></div>
                    </div>
                    <div class="row">
                        <div class="cell label">Number of threads</div>
                        <div class="cell value" id="cpu-threads-div"></div>
                    </div>
                </div>
                <div id="cpu-utilizations-chart-div">
                   <slot></slot>
                </div>
                <div id="cpu-utilizations-div">

                </div>
            </div>
        </div>
        `
        // Create the context for the chart.
        this.canvas = document.createElement("canvas")
        this.canvas.id = "myChart"
        this.canvas.style.width = "100%"
        this.canvas.style.maxHeight = "500px"
        this.appendChild(this.canvas)
    }

    setChartData(infos){
        let index = 0;
        infos.cpu.utilizations.forEach(val => {
            let dataset = this.threadsChart.data.datasets[index]
            dataset.data.push(parseFloat(val.utilization))
            dataset.data.shift()
            index++
        })

        console.log( this.threadsChart.data.datasets)
        this.threadsChart.update()
    }

    drawChart(infos, colors) {
        const ctx = document.getElementById('myChart').getContext('2d');
        var xValues = []
        for(let i=60; i >0; i--){
            if(i%10==0){
                xValues.push(i + "s")
            }else if(i==1){
                xValues.push("0s")
            }else{
                xValues.push("")
            }
        }

        this.threadsChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: xValues,
                datasets: [
                ]
            },
            options: {
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    },
                },
                tooltips: {
                    enabled: false
                },
                scales: {
                    yAxes: [{
                        display: true,
                        ticks: {
                            beginAtZero: true,
                            steps: 10,
                            stepValue: 5,
                            max: 100
                        }
                    }]
                },
                elements: {
                    point: {
                        radius: 0 // remove point...
                    },
                    line: {
                        tension: 0.8 // set line tension
                    }
                }
            }
        });

        // Set up the first value...
        let index = 0;
        infos.cpu.utilizations.forEach(val => {
            let data = []
            for(let i=0; i < 60; i++){
                data.push("")
            }
            data[59] = parseFloat(val.utilization)
            let dataset = {data:data, borderColor:colors[index], fill:false}
            this.threadsChart.data.datasets.push(dataset)
            index++
        })

        console.log(this.threadsChart.data.datasets)
    }

    setInfos(infos) {
        // Display the model name.
        this.shadowRoot.querySelector("#cpu-model-name-div").innerHTML = infos.cpu.model_name
        this.shadowRoot.querySelector("#cpu-vendor-div").innerHTML = infos.cpu.vendor_id
        this.shadowRoot.querySelector("#cpu-speed-div").innerHTML = infos.cpu.speed + "Mhz"
        this.shadowRoot.querySelector("#cpu-threads-div").innerHTML = infos.cpu.utilizations.length.toString()

        // Here I will reset the cpu utilization div and recreate it.
        let cpuUtilizationsDiv = this.shadowRoot.querySelector("#cpu-utilizations-div")
        if (cpuUtilizationsDiv.children.length == 0) {

            let colors = generateRandomColors(infos.cpu.utilizations.length)
            let range = document.createRange()
            let index = 0;
            infos.cpu.utilizations.forEach(val => {
                let html = `
            <div class="cell" style="width: 25%; border-bottom: none; padding-top:2px; padding-bottom:2px;">
                <div style="display: flex; align-items: center;">
                    <div style="height: 20px; width: 32px; background-color: ${colors[index]}; 1px solid var(--palette-text-accent);">
                    </div>
                    <div style="display: flex; margin-left: 5px;">
                        <div>
                            CPU${index + 1}
                        </div>
                        <div style="padding-left: 15px;" id="cpu-utilization-div-${index}">
                        </div>
                    </div>
                </div>
            </div>
            `
                let row = null
                if (index % 4 == 0) {
                    row = document.createElement("div")
                    row.className = "row"
                    row.style.padding = "0px"
                    cpuUtilizationsDiv.appendChild(row)
                } else {
                    row = cpuUtilizationsDiv.children[cpuUtilizationsDiv.children.length - 1]
                }

                row.appendChild(range.createContextualFragment(html))
                index++
            })

            // Draw the chart...
            this.drawChart(infos, colors)
        }else{
            // refresh chart data
            this.setChartData(infos)
        }

        let index = 0;
        infos.cpu.utilizations.forEach(val => {
            let cpuUtilizationDiv = cpuUtilizationsDiv.querySelector(`#cpu-utilization-div-${index}`)
            cpuUtilizationDiv.innerHTML = val.utilization + "%"
            index++
        })

    }

}
customElements.define('globular-resources-display', ResourcesDisplay)

/**
 * Display host informations, info about the computer where globular run.
 */
export class HostInfos extends HTMLElement {
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

            #container{
                display: table;
                width: 98%;
                height: 100%;
            }

            .row {
                display: table-row;
            }

            .cell {
                display: table-cell;
                padding: 5px;
                border-bottom: 1px solid var(--palette-primary-accent);
            }

            .label {
                width: 30%;
            }

            .value {
                width: 70%;
            }
        </style>
        <div id="container">
            <div class="row">
                <div class="cell">Hostname</div>
                <div class="cell value" id="hostname-div"></div>
            </div>
            <div class="row">
                <div class="cell">OS</div>
                <div class="cell value" id="os-div"></div>
            </div>
            <div class="row">
                <div class="cell">Platform</div>
                <div class="cell value" id="platform-div"></div>
            </div>
            <div class="row">
                <div class="cell">Uptime</div>
                <div class="cell value" id="uptime-div"></div>
            </div>
            <div class="row">
                <div class="cell">Number of runing processes</div>
                <div class="cell value" id="number-of-running-processes-div"></div>
            </div>
            <div class="row">
                <div class="cell">Network Interfaces</div>
                <div class="cell value" id="network-interfaces-div"></div>
            </div>
        </div>
        `
        this.container = this.querySelector("#container")
    }

    setUptime(uptime) {
        this.shadowRoot.querySelector("#uptime-div").innerHTML = secondsToDhms(uptime)
    }


    setInfos(infos) {
        if (this.shadowRoot.querySelector("#hostname-div").innerHTML != "") {
            return
        }

        console.log(infos)
        this.shadowRoot.querySelector("#hostname-div").innerHTML = infos.hostname;
        this.shadowRoot.querySelector("#os-div").innerHTML = infos.os;
        this.shadowRoot.querySelector("#platform-div").innerHTML = infos.platform;
        this.shadowRoot.querySelector("#uptime-div").innerHTML = secondsToDhms(infos.uptime)
        this.shadowRoot.querySelector("#number-of-running-processes-div").innerHTML = infos.number_of_running_processes;

        // Now the network interfaces.
        let networkInterfacesDiv = this.shadowRoot.querySelector("#network-interfaces-div")
        networkInterfacesDiv.innerHTML = ""


        let range = document.createRange()
        infos.network_interfaces.forEach(networkInterface => {
            let uuid = "_" + uuidv4()
            let html = `
            <div style="display: table; width: 100%; border-bottom: 1px solid var(--palette-primary-accent);">
                <div style="display: table-row; width: 100%;">
                   <span style="display: table-cell; padding: 5px;">Mac ${networkInterface.mac}</span>
                </div>
                <div id="${uuid}" style="display: table; width: 100%; padding-left: 10px;">
                    <div style="display: table-row; width: 100%; padding: 5px;">
                        <span style="display: table-cell; width: 50%; padding-top: 2px; padding-bottom: 2px;">
                            Addresses
                            <div id="${uuid}-addresses-table" style="display: table; padding: 5px; width: 100%; border-top: 1px solid var(--palette-primary-accent);">

                            </div>
                        </span>
                        <span style="display: table-cell; width: 50%; padding-top: 2px; padding-bottom: 2px;">
                            Flags
                            <div id="${uuid}-flags-table" style="display: table; padding: 5px; width: 100%; border-top: 1px solid var(--palette-primary-accent);">

                            </div>
                        </span>
                    <div>
                </div>
            </div>
            `
            networkInterfacesDiv.appendChild(range.createContextualFragment(html))
            let addressTable = networkInterfacesDiv.querySelector("#" + uuid + "-addresses-table")
            networkInterface.addresses.forEach(address => {
                let obj = JSON.parse(address);
                let html = `
                    <div style="display: table-row;">
                        ${obj.addr}
                    </div>
                `
                addressTable.appendChild(range.createContextualFragment(html))
            })

            let flagsTable = networkInterfacesDiv.querySelector("#" + uuid + "-flags-table")
            networkInterface.flags.forEach(flag => {
                let html = `
                    <div style="display: table-row;">
                        ${flag}
                    </div>
                `
                flagsTable.appendChild(range.createContextualFragment(html))
            })
            // Now I will append values in address and flags div.
        });

        // this.shadowRoot.querySelector("#mac-div").innerHTML = infos.number_of_running_processes;
    }

    connectedCallback() {

    }

}

customElements.define('globular-host-infos', HostInfos)