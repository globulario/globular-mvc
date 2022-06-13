/**
 * Move a div. The div position will be absolute.
 * The handle can be any child of the div to be move.
 * @param {*} handle The handle to grab the div
 * @param {*} draggable The div (or any other html-element) to be move.
 */
export function setMoveable(handle, draggable, onmove, element, offsetTop = 0) {
  draggable.style.position = "fixed"
  element.classList.add("draggable")
  var isMouseDown, initX, initY, height = draggable.offsetHeight, width = draggable.offsetWidth;

  handle.addEventListener('click', (e) => {
    let draggables = document.getElementsByClassName("draggable")
    for (var i = 0; i < draggables.length; i++) {
      draggables[i].style.zIndex = 1;
    }

    element.style.zIndex = 10;
  })

  handle.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    document.body.classList.add('no-select');
    initX = e.offsetX;
    initY = e.offsetY;
    let draggables = document.getElementsByClassName("draggable")
    for (var i = 0; i < draggables.length; i++) {
      draggables[i].style.zIndex = 1;
    }

    element.style.zIndex = 10;
  })

  document.addEventListener('mousemove', (e) => {
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
      if (cy > offsetTop && cy < window.innerHeight - handle.offsetHeight){
        draggable.style.top = cy + 'px';
      }

      if (onmove) {
        onmove(cx, cy)
      }
    }
  })

  document.addEventListener('mouseup', (e) => {

    isMouseDown = false;

    document.body.classList.remove('no-select');
  })
}