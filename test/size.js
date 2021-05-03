function KSize(canvas_id, options) {
  let canvas = document.getElementById(canvas_id)
  this.canvas = canvas
  this.ratio = 2
  this.options = {
    onResize: () => {},
    ...options
  }
  canvas.style.border = `1px solid #000`
  if (canvas) {
    this.resize()
  }
  window.addEventListener("resize", this.resize.bind(this))
}
KSize.prototype.resize = function () {
  let height = document.documentElement.clientHeight
  let width = document.documentElement.clientWidth
  this.canvas.height = this.options.width * this.ratio || height
  this.canvas.width = this.options.height * this.ratio || width
  this.canvas.style.width = `${this.canvas.width / this.ratio}px`
  this.canvas.style.height = `${this.canvas.height / this.ratio}px`

  this.height = this.canvas.height
  this.width = this.canvas.width

  this.options.onResize()
}
