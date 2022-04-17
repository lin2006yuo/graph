/**
 * 自适应
 * @param {*} canvas_id 
 * @param {*} options 
 */
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
  let height = document.documentElement.clientHeight  * 0.5
  let width = document.documentElement.clientWidth * 0.8

  this.canvas.style.width = `${width}px`
  this.canvas.style.height = `${height}px`

  this.canvas.height = this.options.width * this.ratio || height * this.ratio
  this.canvas.width = this.options.height * this.ratio || width * this.ratio

  this.height = this.canvas.height
  this.width = this.canvas.width

  this.options.onResize()
}
