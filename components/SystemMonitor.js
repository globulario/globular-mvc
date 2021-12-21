
/**
 * This is the globular server console.
 */
import { theme } from "./Theme";
import { Model } from '../Model';
import { Application } from "../Application";
import { GetProcessInfosRequest, KillProcessRequest, ProcessInfo } from "globular-web-client/admin/admin_pb";
import { ApplicationView } from "../ApplicationView";
import { v4 as uuidv4 } from "uuid";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// System information (constant)
let number_of_thread = 1;
let services_memory_used = 0; // %

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes} ${sizes[i]})`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
}

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

    url += "?domain=" + Model.domain
    url += "&application=" + Model.application
    if (localStorage.getItem("user_token") != undefined) {
        url += "&token=" + localStorage.getItem("user_token")
    }

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

        // set the header shadow...
        let tabContent = this.shadowRoot.querySelector("#tab-content")
        tabContent.onscroll = () => {
            if (tabContent.scrollTop == 0) {
                tabContent.style.boxShadow = ""
            } else {
                tabContent.style.boxShadow = "inset 0px 5px 6px -3px rgb(0 0 0 / 40%)"
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
            number_of_thread = stats.cpu.utilizations.length

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

        this.sortDirection = ""
        this.sortIndex = -1

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #processes-table {
                display: table;
            }

            .tr {
                display: table-row;
            }

            .td {
                display: table-cell;
                padding: 5px;
                border-bottom: 1px solid var(--palette-primary-accent);
                min-width: 80px;
            }

            .theader {
                display: table-header-group;
            }

            .tbody{
                display: table-row-group;
            }

            #container{
                display: flex;
                padding: 10px;
            }

            iron-icon:hover{
                cursor: pointer;
            }

            paper-button{
                font-size: 1rem;
            }
        </style>
        <div id="container">
            <div id="processes-table">
                <div class="theader">
                    <div class="tr">
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    Process Name 
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    User
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    %CPU
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    %Memory
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    ID
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>
                        <div class="td">
                            <div style="display: flex; align-items: center;">
                                <span>
                                    Priority
                                </span>
                                <iron-icon icon="icons:arrow-drop-down" style="display: none;"></iron-icon>
                                <iron-icon icon="icons:arrow-drop-up" style="display: none;"></iron-icon>
                            </div>
                        </div>

                        <div>
                        </div>
                    </div>
                </div>
                <div class="tbody">
                </div>
            </div>
        </div>
        `

        // get the list of all icons
        let headers = this.shadowRoot.querySelectorAll(".td")
        for (var i = 0; i < headers.length; i++) {
            let header = headers[i]
            let sortIndex = i
            header.onclick = (evt) => {
                evt.stopPropagation()
                let ironIcons = this.shadowRoot.querySelectorAll("iron-icon")
                let desc = header.children[0].children[1].style.display == "block"
                let asc = header.children[0].children[2].style.display == "block"
                for (var j = 0; j < ironIcons.length; j++) {
                    ironIcons[j].style.display = "none"
                }

                // set the sort info...
                this.sortIndex = -1
                this.sortDirection = ""
                let tableBody = this.shadowRoot.querySelector(".tbody")

                if (!asc && !desc) {
                    header.children[0].children[1].style.display = "block"
                    this.sortDirection = "desc"
                    this.sortIndex = sortIndex
                    tableBody.innerHTML = ""
                    this.displayProcess(this.infos)
                } else if (!asc && desc) {
                    header.children[0].children[1].style.display = "none"
                    header.children[0].children[2].style.display = "block"
                    this.sortDirection = "asc"
                    this.sortIndex = sortIndex
                    tableBody.innerHTML = ""
                    this.displayProcess(this.infos)
                } else {
                    this.sortDirection = "asc"
                    this.sortIndex = 4
                    tableBody.innerHTML = ""
                    this.displayProcess(this.infos)
                    this.sortDirection = ""
                    this.sortIndex = -1
                }
            }
        }
    }

    /**
     * 
     * @param {*} callback 
     */
    getProcessesInfo(callback) {
        let rqst = new GetProcessInfosRequest
        rqst.setName("")
        rqst.setPid(0)
        const stream = Application.globular.adminService.getProcessInfos(rqst, {
            domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token")
        });

        // display process info at each second...
        stream.on("data", (rsp) => {
            callback(rsp.getInfosList())
        });

        stream.on("status", (status) => {
            if (status.code === 0) {

            } else {
                console.log(status.details)
            }
        })
    }

    sort() {
        if (this.sortIndex == -1) {
            return this.infos
        }

        // Now I will sort the infos before display it...
        if (this.sortDirection.length > 0) {
            if (this.sortDirection == "asc") {
                return this.infos.sort((a, b) => {
                    if (this.sortIndex == 0) {
                        if (a.getName().toLowerCase() < b.getName().toLowerCase()) {
                            return -1
                        } else if (a.getName().toLowerCase() > b.getName().toLowerCase()) {
                            return 1
                        }
                        return 0
                    } else if (this.sortIndex == 1) {
                        if (a.getUser().toLowerCase() < b.getUser().toLowerCase()) {
                            return -1
                        } else if (a.getUser().toLowerCase() > b.getUser().toLowerCase()) {
                            return 1
                        }
                        return 0
                    } else if (this.sortIndex == 2) {
                        if (a.getCpuUsagePercent() < b.getCpuUsagePercent()) {
                            return -1
                        } else if (a.getCpuUsagePercent() > b.getCpuUsagePercent()) {
                            return 1
                        }
                        return 0
                    } else if (this.sortIndex == 3) {
                        if (a.getMemoryUsagePercent() < b.getMemoryUsagePercent()) {
                            return -1
                        } else if (a.getMemoryUsagePercent() > b.getMemoryUsagePercent()) {
                            return 1
                        }
                        return 0
                    } else if (this.sortIndex == 4) {
                        if (a.getPid() < b.getPid()) {
                            return -1
                        } else if (a.getPid() > b.getPid()) {
                            return 1
                        }
                        return 0
                    } else if (this.sortIndex == 5) {
                        if (a.getPriority().toLowerCase() < b.getPriority().toLowerCase()) {
                            return -1
                        } else if (a.getPriority().toLowerCase() > b.getPriority().toLowerCase()) {
                            return 1
                        }
                        return 0
                    }
                })
            } else {
                return this.infos.sort((a, b) => {
                    if (this.sortIndex == 0) {
                        if (a.getName().toLowerCase() < b.getName().toLowerCase()) {
                            return 1
                        } else if (a.getName().toLowerCase() > b.getName().toLowerCase()) {
                            return -1
                        }
                        return 0
                    } else if (this.sortIndex == 1) {
                        if (a.getUser().toLowerCase() < b.getUser().toLowerCase()) {
                            return 1
                        } else if (a.getUser().toLowerCase() > b.getUser().toLowerCase()) {
                            return -1
                        }
                        return 0
                    } else if (this.sortIndex == 2) {
                        if (a.getCpuUsagePercent() < b.getCpuUsagePercent()) {
                            return 1
                        } else if (a.getCpuUsagePercent() > b.getCpuUsagePercent()) {
                            return -1
                        }
                        return 0
                    } else if (this.sortIndex == 3) {
                        if (a.getMemoryUsagePercent() < b.getMemoryUsagePercent()) {
                            return 1
                        } else if (a.getMemoryUsagePercent() > b.getMemoryUsagePercent()) {
                            return -1
                        }
                        return 0
                    } else if (this.sortIndex == 4) {
                        if (a.getPid() < b.getPid()) {
                            return 1
                        } else if (a.getPid() > b.getPid()) {
                            return -1
                        }
                        return 0
                    } else if (this.sortIndex == 5) {
                        if (a.getPriority().toLowerCase() < b.getPriority().toLowerCase()) {
                            return 1
                        } else if (a.getPriority().toLowerCase() > b.getPriority().toLowerCase()) {
                            return -1
                        }
                        return 0
                    }
                })
            }
        }

    }

    /**
     * display process infos...
     * @param {*} infos 
     */
    displayProcess(infos) {

        let range = document.createRange()
        this.infos = infos
        services_memory_used = 0;
        // Now I will sort the infos before display it...
        let tableBody = this.shadowRoot.querySelector(".tbody")
        this.sort().forEach(info => {
            let processRow = tableBody.querySelector(`#process-row-${info.getPid()}`)
            if (info.getName().length > 0) {
                if (processRow == undefined) {
                    let html = `
                <div class="tr" id="process-row-${info.getPid()}">
                    <div class="td">${info.getName()}</div>
                    <div class="td">${info.getUser()}</div>
                    <div class="td">${(info.getCpuUsagePercent() / number_of_thread).toFixed(2)}</div>
                    <div class="td">${info.getMemoryUsagePercent().toFixed(2)}</div>
                    <div class="td">${info.getPid()}</div>
                    <div class="td">${info.getPriority()}</div>
                    <paper-button>Kill</paper-button>
                </div>`

                    tableBody.appendChild(range.createContextualFragment(html))
                    // Now I will connect the kill proecess button.
                    processRow = tableBody.querySelector(`#process-row-${info.getPid()}`)
                    processRow.children[6].onclick = () => {
                        console.log("kill process ", info.getPid())
                        let rqst = new KillProcessRequest
                        rqst.setPid(info.getPid())
                        Model.globular.adminService.killProcess(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                            .then(rsp => {
                                // remove the process.
                                processRow.parentNode.removeChild(processRow)
                            })
                            .catch(err => ApplicationView.displayMessage(err, 3000))
                    }
                } else {
                    // Here I will update the value of the cpu usage and memory usage.
                    processRow.children[2].innerHTML = (info.getCpuUsagePercent() / number_of_thread).toFixed(2)
                    processRow.children[3].innerHTML = info.getMemoryUsagePercent().toFixed(2)
                    if (info.getName().indexOf("_server") > 0 || info.getName().indexOf("Globular") > 0 || info.getName().indexOf("grpcwebproxy") > 0) {
                        services_memory_used += info.getMemoryUsagePercent()
                    }
                }
            }
        })

    }

    /**
     * The this is call at login time.
     */
    connectedCallback() {
        /*
        this.interval = setInterval(() => {
            
        }, 1000)
        */
        this.getProcessesInfo((infos) => this.displayProcess(infos))
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

            #free-memory-div, #used-memory-div, #total-memory-div, services-memory-div{
                display: flex;
            }

            #free-memory-color, #used-memory-color, #services-memory-color{
                height: 20px;
                width: 32px;
                border: 1px solid var(--palette-text-accent);
            }

            #free-memory-title, #used-memory-title, #total-memory-title, #services-memory-title{
                font-weight: 550px;
            }

            .memory-table-cell {
                display: table-cell;
                vertical-align:middle;
            }
            
        </style>
        <div id="container">
            <paper-tabs>
                <paper-tab id="cpu-tab">
                    <div class="section-title">CPU</div>
                </paper-tab>
                <paper-tab id="memory-tab">
                    <div class="section-title">Memory</div>
                </paper-tab>
                <paper-tab id="network-tab">
                    <div class="section-title">Network</div>
                </paper-tab>
            </paper-tabs>
            <div id="cpu-div">
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
                <slot name="cpu-utilizations-chart"></slot>
                </div>
                <div id="cpu-utilizations-div">
                </div>
            </div>
            <div id="memory-div">
                <div style="display: table; border-collapse: separate; border-spacing: 12px; padding-left: 33%; padding-bottom: 20px; padding-top: 20px;">
                    <div style="display: table-row;" id="total-memory-div">
                        <div class="memory-table-cell"></div>
                        <div class="memory-table-cell" id="total-memory-title">Total</div>
                        <div class="memory-table-cell" id="total-memory-value"></div>
                    </div>
                    <div style="display: table-row;" id="free-memory-div">
                        <div class="memory-table-cell" id="free-memory-color"></div>
                        <div class="memory-table-cell" id="free-memory-title">Free</div>
                        <div class="memory-table-cell" id="free-memory-value"></div>
                    </div>
                    <div style="display: table-row;" id="used-memory-div">
                        <div class="memory-table-cell" id="used-memory-color"></div>
                        <div class="memory-table-cell" id="used-memory-title">Used</div>
                        <div class="memory-table-cell" id="used-memory-value"></div>
                    </div>
                    <div style="display: table-row;" id="services-memory-div">
                        <div class="memory-table-cell" id="services-memory-color"></div>
                        <div class="memory-table-cell" id="services-memory-title">Services</div>
                        <div class="memory-table-cell" id="services-memory-value"></div>
                    </div>
                </div>
                <slot name="memory-utilizations-chart"></slot>
            </div>
            <div id="network-div">
            </div>
        </div>
        `

        // Tabs...
        let cpu_tab = this.shadowRoot.querySelector("#cpu-tab")
        let memory_tab = this.shadowRoot.querySelector("#memory-tab")
        let network_tab = this.shadowRoot.querySelector("#network-tab")

        // Divs...   
        let cpu_div = this.shadowRoot.querySelector("#cpu-div")
        let memory_div = this.shadowRoot.querySelector("#memory-div")
        let network_div = this.shadowRoot.querySelector("#network-div")

        // Here I will connect the events...
        cpu_tab.onclick = () => {
            cpu_div.style.display = ""
            memory_div.style.display = "none"
            network_div.style.display = "none"
        }

        memory_tab.onclick = () => {
            cpu_div.style.display = "none"
            memory_div.style.display = ""
            network_div.style.display = "none"
        }

        network_tab.onclick = () => {
            cpu_div.style.display = "none"
            memory_div.style.display = "none"
            network_div.style.display = ""
        }

        cpu_div.click()

        // Create the context for the chart.
        let cpu_canvas = document.createElement("canvas")
        cpu_canvas.id = "cpu_chart"
        cpu_canvas.style.width = "100%"
        cpu_canvas.style.maxHeight = "500px"
        cpu_canvas.slot = "cpu-utilizations-chart"
        this.appendChild(cpu_canvas)

        let memory_canvas = document.createElement("canvas")
        memory_canvas.id = "memory_chart"
        memory_canvas.style.width = "50%"
        memory_canvas.style.maxHeight = "500px"
        memory_canvas.slot = "memory-utilizations-chart"
        this.appendChild(memory_canvas)
    }

    // Set cpu chart values
    setCpuChartData(infos) {
        let index = 0;
        infos.cpu.utilizations.forEach(val => {
            let dataset = this.threadsChart.data.datasets[index]
            dataset.data.push(parseFloat(val.utilization))
            dataset.data.shift()
            index++
        })
        this.threadsChart.update()
    }

    // Draw cpu chart
    drawCpuChart(infos, colors) {

        // CPU Chart
        const ctx = document.getElementById('cpu_chart').getContext('2d');
        var xValues = []
        for (let i = 60; i > 0; i--) {
            if (i % 10 == 0) {
                xValues.push(i + "s")
            } else if (i == 1) {
                xValues.push("0s")
            } else {
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
            for (let i = 0; i < 60; i++) {
                data.push("")
            }
            data[59] = parseFloat(val.utilization)
            let dataset = { data: data, borderColor: colors[index], fill: false }
            this.threadsChart.data.datasets.push(dataset)
            index++
        })
    }

    // Draw memory chart.
    drawMemoryChart(infos, colors) {
        const ctx = document.getElementById('memory_chart').getContext('2d');
        this.memoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ["Free", "Used"],
                datasets: [
                    {
                        data: [parseInt((infos.memory.free / infos.memory.total) * 100), parseInt(((infos.memory.used - services_memory_used) / infos.memory.total) * 100), services_memory_used],
                        backgroundColor: [colors[0], colors[1], colors[2]]
                    }
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
                }
            }
        });

        this.shadowRoot.querySelector("#total-memory-value").innerHTML = bytesToSize(infos.memory.total)

        this.shadowRoot.querySelector("#free-memory-color").style.backgroundColor = colors[0]
        this.shadowRoot.querySelector("#free-memory-value").innerHTML = bytesToSize(infos.memory.free)

        this.shadowRoot.querySelector("#used-memory-color").style.backgroundColor = colors[1]
        this.shadowRoot.querySelector("#used-memory-value").innerHTML = bytesToSize(infos.memory.used)

        this.shadowRoot.querySelector("#services-memory-color").style.backgroundColor = colors[2]
        this.shadowRoot.querySelector("#services-memory-value").innerHTML = bytesToSize(services_memory_used/100 * infos.memory.total)

    }

    setMemoryChartData(infos, colors) {

        this.memoryChart.data.datasets = [
            {
                data: [parseInt((infos.memory.free / infos.memory.total) * 100), parseInt((infos.memory.used / infos.memory.total) * 100), services_memory_used],
                backgroundColor: [colors[0], colors[1], colors[2]]
            }
        ]

        this.memoryChart.update()
        this.shadowRoot.querySelector("#free-memory-color").style.backgroundColor = colors[0]
        this.shadowRoot.querySelector("#free-memory-value").innerHTML = bytesToSize(infos.memory.free)

        this.shadowRoot.querySelector("#used-memory-color").style.backgroundColor = colors[1]
        this.shadowRoot.querySelector("#used-memory-value").innerHTML = bytesToSize(infos.memory.used)

        this.shadowRoot.querySelector("#services-memory-color").style.backgroundColor = colors[2]
        this.shadowRoot.querySelector("#services-memory-value").innerHTML = bytesToSize(services_memory_used/100 * infos.memory.total)
    }

    setInfos(infos) {
        // Display the model name.
        this.shadowRoot.querySelector("#cpu-model-name-div").innerHTML = infos.cpu.model_name
        this.shadowRoot.querySelector("#cpu-vendor-div").innerHTML = infos.cpu.vendor_id
        this.shadowRoot.querySelector("#cpu-speed-div").innerHTML = infos.cpu.speed + "Mhz"
        this.shadowRoot.querySelector("#cpu-threads-div").innerHTML = infos.cpu.utilizations.length.toString()

        // Here I will reset the cpu utilization div and recreate it.
        let cpuUtilizationsDiv = this.shadowRoot.querySelector("#cpu-utilizations-div")

        if (this.colors == null) {
            this.colors = generateRandomColors(infos.cpu.utilizations.length)
        }

        if (cpuUtilizationsDiv.children.length == 0) {
            let range = document.createRange()
            let index = 0;
            infos.cpu.utilizations.forEach(val => {
                let html = `
                <div class="cell" style="width: 25%; border-bottom: none; padding-top:2px; padding-bottom:2px;">
                    <div style="display: flex; align-items: center;">
                        <div style="height: 20px; width: 32px; background-color: ${this.colors[index]}; border: 1px solid var(--palette-text-accent);">
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

            // Draw the chart
            this.drawCpuChart(infos, this.colors)

            // Draw the memory chart
            this.drawMemoryChart(infos, this.colors)

        } else {
            // refresh chart data
            this.setCpuChartData(infos)
            this.setMemoryChartData(infos, this.colors)
        }

        // set cpu usage percent...
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