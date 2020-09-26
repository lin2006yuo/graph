class Graph {
  constructor() {}
  attachCanvas(graphcanvas) {
    if(graphcanvas.constructor !== GraphCanvas) {
      throw 'attachCanvas expects a GraphCanvas instance'
    }
    if(graphcanvas.graph && graphcanvas.graph !== this) {
      graphcanvas.graph.detachCanvas(graphcanvas)
    }
    graphcanvas.graph = this
    if(!this.list_of_graphcanvas) {
      this.list_of_graphcanvas = []
    }
    this.list_of_graphcanvas.push(graphcanvas)
  }
  detachCanvas(graphcanvas) {}
}
class DragAndScale {
  constructor() {
    this.visible_area = new Float32Array(4)
    this.element = null
  }
  computeVisibleArea() {
    if (!this.element) {
      this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0
      return
    }
    var width = this.element.width
    var height = this.element.height
    // var startx = -this.offset[0]
    // var starty = -this.offset[1]
    // var endx = startx + width / this.scale
    // var endy = starty + height / this.scale
    var startx = -0
    var starty = -0
    var endx = width
    var endy = height
    this.visible_area[0] = startx
    this.visible_area[1] = starty
    this.visible_area[2] = endx - startx
    this.visible_area[3] = endy - starty
  }
}
class GraphCanvas {
  static DEFAULT_BACKGROUND_IMAGE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII="
  constructor(canvas, graph) {
    this.bgctx = null
    this.bgcanvas = null
    this._bg_img = null
    this.ds = new DragAndScale()
    this.canvas = null
    this._mousemove_callback = null
    this._mouseup_callback = null
    this.background_image = GraphCanvas.DEFAULT_BACKGROUND_IMAGE
    this.visible_area = this.ds.visible_area
    if(graph) {
      graph.attachCanvas(this)
    }
    this.setCanvas(canvas)
    this.startRendering()
  }
  setCanvas(canvas, skip_events) {
    this.canvas = canvas
    this.ds.element = canvas
    canvas.className += " kgraphcanvas"
    canvas.data = this
    this.bgcanvas = null
    if (!this.bgcanvas) {
      this.bgcanvas = document.createElement("canvas")
      this.bgcanvas.width = this.canvas.width
      this.bgcanvas.height = this.canvas.height
    }
    this.ctx = canvas.getContext("2d")
    this._mousemove_callback = this.processMouseMove.bind(this)
    this._mouseup_callback = this.processMouseUp.bind(this)
    if (!skip_events) {
      this.bindEvents()
    }
  }
  startRendering() {
    if (this.is_rendering) {
      return
    }
    this.is_rendering = true
    renderFrame.call(this)
    function renderFrame() {
      this.draw()
      let window = this.getCanvasWindow()
      if (this.is_rendering) {
        window.requestAnimationFrame(renderFrame.bind(this))
      }
    }
  }
  draw() {
    if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) {
      return
    }
    if (this.graph) {
      this.ds.computeVisibleArea()
    }
    this.drawBackCanvas()
    this.drawFrontCanvas()
  }
  drawFrontCanvas() {
    if (!this.ctx) {
      this.ctx = this.bgcanvas.getContext("2d")
    }
    let ctx = this.ctx
    let canvas = this.canvas
    if (this.bgcanvas == this.canvas) {
      this.drawBackCanvas()
    } else {
      ctx.drawImage(this.bgcanvas, 0, 0)
    }
  }
  drawBackCanvas() {
    if (!this.bgctx) {
      this.bgctx = this.bgcanvas.getContext("2d")
    }
    let ctx = this.bgctx
    let bg_already_painted = false
    if (this.background_image && !bg_already_painted) {
      ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = false
      if (!this._bg_img) {
        this._bg_img = new Image()
        this._bg_img.src = this.background_image
        // this._bg_img.onload = function () {
        //   console.log("loaded")
        // }
      }
      let pattern = null
      if (this._pattern == null && this._bg_img.width > 0) {
        pattern = ctx.createPattern(this._bg_img, "repeat")
        this._pattern_img = this._bg_img
        this._pattern = pattern
      } else {
        this._pattern = pattern
      }

      if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(
          this.visible_area[0],
          this.visible_area[1],
          this.visible_area[2],
          this.visible_area[3]
        )
        ctx.fillStyle = "transparent"
      }
      ctx.globalAlpha = 1.0
      ctx.imageSmoothingEnabled = true
    }
  }
  processMouseMove() {}
  processMouseUp() {}
  bindEvents() {}
  /** 根据父元素的宽高 */
  resize(width, height) {
    if (!width & !height) {
      let parent = this.canvas.parentNode
      width = parent.offsetWidth
      height = parent.offsetHeight
    }
    if (this.canvas.width == width && this.canvas.height == height) {
      return
    }
    this.canvas.width = width
    this.canvas.height = height
    this.bgcanvas.width = this.canvas.width
    this.bgcanvas.height = this.canvas.height
  }
  getCanvasWindow() {
    return window
  }
}
