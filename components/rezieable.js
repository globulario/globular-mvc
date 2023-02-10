import { fireResize } from "./utility";

/**
 * That propertie take a div and append resizeable capabilities.
 */
export function setResizeable(div, onresize, side, zIndex, maxWidth = 0) {

    // be sure the windows can be resize...
    div.style.maxWidth = screen.width - 5 + "px"

    // here I will stop resize...
    let id = div.name
    if (localStorage.getItem(`__${id}_dimension__`)) {
        let dimension = JSON.parse(localStorage.getItem(`__${id}_dimension__`))
        div.style.width = dimension.width + "px"
        div.style.height = dimension.height + "px"
    }

    // resizeable by right side...
    if (side == undefined) {
        side = "right"
    }

    if (zIndex == undefined) {
        zIndex = 100
    }

    // keep movable attribute in the div itself.
    div.isResizeWidth = false;
    div.isResizeHeigth = false;
    div.isOverResizeWidthDiv = false;
    div.isOverResizeHeihtgDiv = false;
    div.isOverResizeDiv = false;

    // first of all I will create the resize divs...
    var resizeWidthDiv = document.createElement("div")
    resizeWidthDiv.id = "resize-with-div"
    resizeWidthDiv.style.position = "absolute"
    resizeWidthDiv.style.top = "0px"
    resizeWidthDiv.style.bottom = "5px"
    resizeWidthDiv.style.width = "5px"

    if (side == "right")
        resizeWidthDiv.style.right = "-1px"
    else
        resizeWidthDiv.style.left = "-1px"

    resizeWidthDiv.style.zIndex = zIndex

    div.appendChild(resizeWidthDiv)
    div.resizeWidthDiv = resizeWidthDiv

    resizeWidthDiv.onmouseover = function () {
        this.style.cursor = "ew-resize"
        this.style.borderRight = "5px solid darkgrey"
    }

    resizeWidthDiv.onmouseout = function () {
        this.style.cursor = "default"
        this.style.borderRight = ""
    }

    var resizeHeightDiv = document.createElement("div")
    resizeHeightDiv.id = "resize-height-div"
    resizeHeightDiv.style.position = "absolute"
    resizeHeightDiv.style.height = "5px"
    resizeHeightDiv.style.left = "0px"
    resizeHeightDiv.style.right = "5px"
    resizeHeightDiv.style.bottom = "-1px"
    resizeHeightDiv.style.zIndex = zIndex

    div.appendChild(resizeHeightDiv)
    div.resizeHeightDiv = resizeHeightDiv

    resizeHeightDiv.onmouseover = function () {
        this.style.cursor = "row-resize"
        this.style.borderBottom = "5px solid darkgrey"
    }

    resizeHeightDiv.onmouseout = function () {
        this.style.cursor = "default"
        this.style.borderBottom = ""
    }

    var resizeDiv = document.createElement("div")
    resizeDiv.id = "resize-div"
    resizeDiv.style.position = "absolute"
    resizeDiv.style.bottom = "-1px"
    if (side == "right") {
        resizeDiv.style.right = "-1px"
    } else {
        resizeDiv.style.left = "-1px"
    }
    resizeDiv.style.height = "10px"
    resizeDiv.style.width = "10px"
    resizeDiv.style.zIndex = 1000
    div.appendChild(resizeDiv)

    resizeDiv.onmouseover = function () {
        this.style.cursor = "nwse-resize"
        this.style.backgroundColor = "lightgrey"
    }

    resizeDiv.onmouseout = function () {
        this.style.cursor = "default"
        this.style.backgroundColor = ""
    }

    resizeDiv.onmouseenter = function (div) {
        return function () {
            div.isOverResizeDiv = true;
        }
    }(div)

    resizeDiv.onmouseleave = function (div) {
        return function () {
            div.isOverResizeDiv = false;
        }
    }(div)

    resizeHeightDiv.onmouseenter = function (div) {
        return function () {
            div.isOverResizeHeihtgDiv = true;
        }
    }(div)

    resizeHeightDiv.onmouseleave = function (div) {
        return function () {
            div.isOverResizeHeihtgDiv = false;
        }
    }(div)

    resizeWidthDiv.onmouseenter = function (div) {
        return function () {
            div.isOverResizeWidthDiv = true;
        }
    }(div)

    resizeWidthDiv.onmouseleave = function (div) {
        return function () {
            div.isOverResizeWidthDiv = false;
        }
    }(div)

    document.body.addEventListener("pointerup", function (div) {
        return function (e) {
            div.isResizeWidth = false;
            div.isResizeHeigth = false;
            document.body.style.cursor = "default"

            // fire resize event at start...
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent('resize', true, false);
            div.dispatchEvent(evt);

        }
    }(div))

    document.body.addEventListener("pointerdown", function (div) {
        return function (e) {
            if (div.isOverResizeWidthDiv) {
                div.isResizeWidth = true;
            }

            if (div.isOverResizeHeihtgDiv) {
                div.isResizeHeigth = true;
            }

            if (div.isOverResizeDiv) {
                div.isResizeWidth = true;
                div.isResizeHeigth = true;
            }
        }
    }(div))

    function getOffsetLeft(elem) {
        var offsetLeft = 0;
        do {
            if (!isNaN(elem.offsetLeft)) {
                offsetLeft += elem.offsetLeft;
            }
        } while (elem = elem.offsetParent);
        return offsetLeft;
    }


    function getOffsetTop(elem) {
        var offsetTop = 0;
        do {
            if (!isNaN(elem.offsetTop)) {
                offsetTop += elem.offsetTop;
            }
        } while (elem = elem.offsetParent);
        return offsetTop;
    }

    let moveHandler = (e) => {

        if (e.touches) {
            e.clientX = e.touches[0].clientX
            e.clientY = e.touches[0].clientY
        }

        var w = e.clientX - getOffsetLeft(div);
        var h = e.clientY - getOffsetTop(div);

        // stop resize
        if (div.maxWidth > 0) {
            if (w >= div.maxWidth) {
                onresize(div.offsetWidth, div.offsetHeight)
                return;
            }
        }

        if (div.isResizeWidth && div.isResizeHeigth) {
            div.style.width = w + "px"
            div.style.height = h + "px"
            if (onresize) {
                onresize(div.offsetWidth, div.offsetHeight)
                fireResize()
            }
        } else if (div.isResizeWidth) {
            if (div.offsetWidth > w) {
                document.body.style.cursor = "w-resize"
            } else if (div.offsetWidth < w) {
                document.body.style.cursor = "e-resize"
            } else {
                document.body.style.cursor = "ew-resize"
            }
            div.style.width = w + "px"
            if (onresize) {
                onresize(div.offsetWidth, div.offsetHeight)
                fireResize()
            }
        } else if (div.isResizeHeigth) {
            if (div.offsetHeight > h) {
                document.body.style.cursor = "n-resize"
            } else if (div.offsetHeight < h) {
                document.body.style.cursor = "s-resize"
            } else {
                document.body.style.cursor = "ns-resize"
            }
            div.style.height = h + "px"
            if (onresize) {
                onresize(div.offsetWidth, div.offsetHeight)
                fireResize()
            }
        }
    }

    // Here I will resize the div as needed.
    document.body.addEventListener("mousemove", moveHandler)

}