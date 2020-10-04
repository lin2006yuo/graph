class DragAndScale {
  constructor() {
    this.visible_area = new Float32Array(4)
    this.element = null
    this.scale = 1
    this.last_mouse = [0, 0]
    this.min_scale = 0.1
    this.max_scale = 10
    this.offset = new Float32Array([0, 0])
  }
  computeVisibleArea() {
    if (!this.element) {
      this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0
      return
    }
    var width = this.element.width
    var height = this.element.height
    var startx = -this.offset[0]
    var starty = -this.offset[1]
    var endx = startx + width / this.scale
    var endy = starty + height / this.scale
    // var startx = -0
    // var starty = -0
    // var endx = width
    // var endy = height
    this.visible_area[0] = startx
    this.visible_area[1] = starty
    this.visible_area[2] = endx - startx
    this.visible_area[3] = endy - starty
  }
  changeScale(value, zooming_center) {
    if (value < this.min_scale) {
      value = this.min_scale
    } else if (value > this.max_scale) {
      value = this.max_scale
    }
    if (value === this.scale) {
      return
    }
    if (!this.element) return
    let rect = this.element.getBoundingClientRect()
    if (!rect) return
    zooming_center = zooming_center || [rect.width * 0.5, rect.height * 0.5]
    let center = this.convertCanvasToOffset(zooming_center)

    this.scale = value

    let new_center = this.convertCanvasToOffset(zooming_center)

    let delta_offset = [new_center[0] - center[0], new_center[1] - center[1]]
    this.offset[0] += delta_offset[0]
    this.offset[1] += delta_offset[1]
  }
  convertCanvasToOffset(pos, out) {
    out = out || [0, 0]
    out[0] = pos[0] / this.scale - this.offset[0]
    out[1] = pos[1] / this.scale - this.offset[1]
    return out
  }
  toCanvasContext(ctx) {
    ctx.scale(this.scale, this.scale)
    ctx.translate(this.offset[0], this.offset[1])
  }
}

export default DragAndScale 