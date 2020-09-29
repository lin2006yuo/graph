function KSize(canvas_id, options) {
  let canvas = document.getElementById(canvas_id)
  this.canvas = canvas
  this.height = 0
  this.width = 0
  this.options = {
    onResize: () => {},
    ...options
  }
  canvas.style.border = "1px solid #000"
  if (canvas) {
    this.resize()
  }
  window.addEventListener("resize", this.resize.bind(this))
}
KSize.prototype.resize = function () {
  let height = document.documentElement.clientHeight
  let width = document.documentElement.clientWidth
  this.canvas.height = height / 2
  this.canvas.width = width / 2
  this.height = this.canvas.height
  this.width = this.canvas.width

  this.options.onResize()
}
