import { ApplicationView } from "../ApplicationView";

/**
 * Move a div. The div position will be absolute.
 * The handle can be any child of the div to be move.
 * @param {*} handle The handle to grab the div
 * @param {*} draggable The div (or any other html-element) to be move.
 */
export function setMoveable(handle, draggable, onmove, element, offsetTop = 0) {
  //
  handle.style.userSelect = "none"

  // set the position from existing infos
  let id = "__" + draggable.name + "__position__"
  if (localStorage.getItem(id)) {
    let position = JSON.parse(localStorage.getItem(id))
    if (position.top < offsetTop) {
      position.top = offsetTop
    }

    // be sure the window open at visible position
    if (position.left > document.body.offsetWidth) {
      position.left = document.body.offsetWidth - 80;
    }

    if (position.top > document.body.offsetHeight) {
      position.top = document.body.offsetHeight - 80;
    }

    draggable.style.top = position.top + "px"
    draggable.style.left = position.left + "px"

  } else {
    draggable.style.left = ((document.body.offsetWidth - 720) / 2) + "px"
    draggable.style.top = "80px"
  }

  // be sure the window stay visible.
  window.addEventListener('resize', () => {

    // set the postion to 0, 0
    let w = ApplicationView.layout.width();
    if (w < 500) {
      draggable.style.top = offsetTop + "px"
      draggable.style.left = "0px"
      return
    }


    if (draggable.offsetTop < offsetTop) {
      draggable.top = offsetTop + "px"
    }

    // be sure the window open at visible position
    if (draggable.offsetLeft > document.body.offsetWidth) {
      draggable.style.left = (document.body.offsetWidth - 80) + "px";
    }

    if (draggable.offsetTop > document.body.offsetHeight) {
      draggable.style.top = (document.body.offsetHeight - 80) + "px";
    }
  });

  draggable.style.position = "fixed"

  element.classList.add("draggable")
  var isMouseDown, initX, initY, height = draggable.offsetHeight, width = draggable.offsetWidth;

  handle.addEventListener('click', (e) => {
    e.stopPropagation()
    let draggables = document.getElementsByClassName("draggable")
    for (var i = 0; i < draggables.length; i++) {
      draggables[i].style.zIndex = 100;
    }

    element.style.zIndex = 1000;
  })

  handle.addEventListener('pointerdown', (e) => {

    e.stopPropagation()
    isMouseDown = true;
    document.body.classList.add('no-select');
    initX = e.offsetX;
    initY = e.offsetY;
    let draggables = document.getElementsByClassName("draggable")
    for (var i = 0; i < draggables.length; i++) {
      draggables[i].style.zIndex = 100;
    }

    element.style.zIndex = 1000;
  })

  let onMoveHandler = (e) => {
    e.stopPropagation()

    // set the postion to 0, 0
    let w = ApplicationView.layout.width();
    if (w < 500) {
      draggable.style.top = offsetTop + "px"
      draggable.style.left = "0px"
      return
    }

    if (e.touches) {
      e.clientX = e.touches[0].clientX
      e.clientY = e.touches[0].clientY
    }

    if (isMouseDown) {

      var cx = e.clientX - initX,
        cy = e.clientY - initY;
      if (cx < 0) {
        cx = 0;
      }
      if (cy < 0) {
        cy = 0;
      }
      if (window.innerWidth - e.clientX + initX < width) {
        cx = window.innerWidth - width;
      }
      if (e.clientY > window.innerHeight - height + initY) {
        cy = window.innerHeight - height;
      }
      draggable.style.left = cx + 'px';

      // limit the moveable range to be sure the handle stay reachable.
      if (cy > offsetTop && cy < window.innerHeight - handle.offsetHeight) {
        draggable.style.top = cy + 'px';
      }

      if (onmove) {
        onmove(cx, cy)
      }

      let id = "__" + draggable.name + "__position__"

      let position = { top: cy, left: cx }
      if (position.top < offsetTop) {
        position.top = offsetTop
      }

      localStorage.setItem(id, JSON.stringify(position))
    }
  }

  document.addEventListener('touchmove', onMoveHandler)
  document.addEventListener('mousemove', onMoveHandler)

  document.addEventListener('pointerup', (e) => {
    e.stopPropagation()

    isMouseDown = false;
    document.body.classList.remove('no-select');

  })
}
