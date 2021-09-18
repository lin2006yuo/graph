window.utils = {}

window.utils.mouse = function(el) {
  let mouse = { x: 0, y: 0 }
  let onMove = event => {
    let x, y
    x = event.pageX
    y = event.pageY
    x -= el.offsetLeft
    y -= el.offsetTop
    mouse.x = x
    mouse.y = y
  }
  el.addEventListener("mousemove", onMove)
  mouse.destory = () => {
    el.removeEventListener("mousemove", onMove)
  }
  return mouse
}

window.utils.keyboard = function() {
  let keyboard = {}
  let onkeydown = event => {
    switch (event.keyCode) {
      case 37:
        console.log("right")
        break
      case 38:
        console.log("up")
        break
      case 39:
        console.log("right")
        break
      case 40:
        console.log("down")
        break
    }
  }
  keyboard.destory = () => {
    window.removeEventListener('keydown', onkeydown)
  }
  window.addEventListener('keydown', onkeydown)
  return keyboard
}
