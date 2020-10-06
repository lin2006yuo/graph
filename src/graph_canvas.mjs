import ContextMenu from "./context_menu.mjs"
import Graph from "./graph.mjs"
import DragAndScale from "./drag_and_scale.mjs"
import { overlapBounding, isInsideRectangle } from "./utils.mjs"

let temp_vec2 = new Float32Array(2)
let tmp_area = new Float32Array(4)

export class GraphCanvas {
  static DEFAULT_BACKGROUND_IMAGE = ""
  // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII="
  static active_canvas = null

  static onMenuAdd(node, options, e, pre_menu, callback) {
    let canvas = GraphCanvas.active_canvas
    let window = canvas.getCanvasWindow()
    let graph = canvas.graph

    if (!graph) return

    let values = Graph.getNodeTypesCategories()
    let entries = []
    for (let i = 0; i < values.length; i++) {
      const item = values[i]
      if (item) {
        let name = item
        entries.push({
          value: name,
          content: name,
          has_submenu: true,
        })
      }
    }

    let menu = new ContextMenu(entries, {
      event: e,
      callback: inner_create,
      parentMenu: pre_menu,
    })

    function inner_create(v) {
      let first_event = pre_menu.getFirstEvent()
      let node = Graph.createNode(v.value)

      if (node) {
        const pos = canvas.convertEventToCanvasOffset(first_event)
        node.pos = pos
        canvas.graph.add(node)
      }
    }

    return false
  }

  constructor(canvas, graph) {
    this.bgctx = null
    this.bgcanvas = null
    this._bg_img = null
    this.ds = new DragAndScale()
    this.canvas = null
    this._mousemove_callback = null
    this._mouseup_callback = null
    this.dirty_bgcanvas = true
    this.clear_background = true
    this.background_image = GraphCanvas.DEFAULT_BACKGROUND_IMAGE
    this.visible_area = this.ds.visible_area
    this.last_mouse_position = [0, 0]
    this.editor_alpha = 1
    this.round_radius = 8
    this.mouse = [0, 0]
    this.render_shadows = true
    this.inner_text_font = "normal " + Graph.NODE_SUBTEXT_SIZE + "px Arial"
    this.selected_nodes = {}
    this.current_node = null
    this.resizing_node = null

    this.visible_nodes = []

    this.render_canvas_border = true
    this.set_canvas_dirty_on_mouse_event = true
    this.zoom_modify_alpha = true

    if (graph) {
      graph.attachCanvas(this)
    }
    this.setCanvas(canvas)
    this.clear()
    this.startRendering()
  }

  setCanvas(canvas, skip_events) {
    this.canvas = canvas
    GraphCanvas.active_canvas = this

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
  draw(force_canvas, force_bgcanvas) {
    if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) {
      return
    }
    if (this.graph) {
      this.ds.computeVisibleArea()
    }
    if (this.dirty_bgcanvas || force_bgcanvas) {
      this.drawBackCanvas()
    }
    if (this.dirty_canvas || force_canvas) {
      this.drawFrontCanvas()
    }
  }
  drawFrontCanvas() {
    this.dirty_canvas = false

    if (!this.ctx) {
      this.ctx = this.bgcanvas.getContext("2d")
    }
    var ctx = this.ctx
    if (!ctx) {
      //maybe is using webgl...
      return
    }

    var canvas = this.canvas

    //clear
    //canvas.width = canvas.width;
    if (this.clear_background) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // 绘制背景
    if (this.bgcanvas == this.canvas) {
      this.drawBackCanvas()
    } else {
      ctx.drawImage(this.bgcanvas, 0, 0)
    }

    // 绘制节点
    if (this.graph) {
      ctx.save()
      this.ds.toCanvasContext(ctx)
      let visible_nodes = this.computeVisibleNodes(null, this.visible_nodes)
      for (let i = 0; i < visible_nodes.length; i++) {
        const node = visible_nodes[i]
        ctx.save()
        ctx.translate(node.pos[0], node.pos[1])
        this.drawNode(node, ctx)

        ctx.restore()
      }

      ctx.restore()
    }

    //info widget
    // ctx.translate(1, 1);

    if (this.graph) {
    }
  }
  drawBackCanvas() {
    let canvas = this.bgcanvas
    if (
      canvas.width != this.canvas.width ||
      canvas.height != this.canvas.height
    ) {
      canvas.width = this.canvas.width
      canvas.height = this.canvas.height
    }

    if (!this.bgctx) {
      this.bgctx = this.bgcanvas.getContext("2d")
    }
    let ctx = this.bgctx
    let bg_already_painted = false

    if (this.clear_background) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (this.graph) {
      ctx.save()
      this.ds.toCanvasContext(ctx)

      // 绘制网格
      if (this.background_image && !bg_already_painted && this.ds.scale > 0.5) {
        if (this.zoom_modify_alpha) {
          ctx.globalAlpha = (1.0 - 0.5 / this.ds.scale) * this.editor_alpha
        } else {
          ctx.globalAlpha = this.editor_alpha
        }
        ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = false
        if (!this._bg_img) {
          this._bg_img = new Image()
          this._bg_img.src = this.background_image
          let that = this
          this._bg_img.onload = function () {
            that.draw(true, true)
          }
        }

        let pattern = null

        if (this._pattern == null && this._bg_img.width > 0) {
          pattern = ctx.createPattern(this._bg_img, "repeat")
          this._pattern_img = this._bg_img
          this._pattern = pattern
        } else {
          pattern = this._pattern
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
        ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = true
      }

      // 绘制border
      if (this.render_canvas_border) {
        ctx.strokeStyle = "#235"
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
      }
      ctx.restore()
    }

    this.dirty_bgcanvas = false
    this.dirty_canvas = true
  }

  drawNode(node, ctx) {
    this.current_node = node

    let color = node.color || node.constructor.color || Graph.NODE_DEFAULT_COLOR
    let bgcolor =
      node.bgcolor || node.constructor.color || Graph.NODE_DEFAULT_BGCOLOR

    let low_quality = this.ds.scale < 0.6

    let edit_alpha = this.editor_alpha
    ctx.globalAlpha = edit_alpha

    if (this.render_shadows) {
      ctx.shadowColor = Graph.DEFAULT_SHADOW_COLOR
      ctx.shadowOffsetX = 2 * this.ds.scale
      ctx.shadowOffsetY = 2 * this.ds.scale
      ctx.shadowBlur = 3 * this.ds.scale
    } else {
      ctx.shadowColor = "transparent"
    }

    let shape = node._shape || Graph.BOX_SHAPE
    let size = temp_vec2
    temp_vec2.set(node.size)
    let horizontal = node.horizontal

    this.drawNodeShape(
      node,
      ctx,
      size,
      color,
      bgcolor,
      node.is_selected,
      node.mouseOver
    )

    ctx.shadowColor = "transparent"

    ctx.textAlign = horizontal ? "center" : "left"
    ctx.font = this.inner_text_font

    ctx.globalAlpha = 1.0
  }

  drawNodeShape(node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
    ctx.strokeStyle = fgcolor
    ctx.fillStyle = bgcolor

    let title_height = Graph.NODE_TITLE_HEIGHT
    let low_quality = this.ds.scale < 0.5

    let shape = node._shape || node.constructor.shape || Graph.ROUND_SHAPE
    let title_mode = node.constructor.title_mode

    let render_title = true
    if (title_mode === Graph.TRANSPARENT_TITLE) {
      render_title = false
    } else if (title_mode === Graph.AUTOHIDE_TITLE && mouse_over) {
      render_title = true
    }

    let area = tmp_area
    area[0] = 0
    area[1] = render_title ? -title_height : 0 //y
    area[2] = size[0] + 1
    area[3] = render_title ? size[1] + title_height : size[1]

    let old_alpha = ctx.globalAlpha

    // 绘制节点
    {
      ctx.beginPath()
      if (shape === Graph.BOX_SHAPE || low_quality) {
        ctx.fillRect(area[0], area[1], area[2], area[3])
      } else if (shape === Graph.ROUND_SHAPE || shape === Graph.CARD_SHAPE) {
        ctx.roundRect(
          area[0],
          area[1],
          area[2],
          area[3],
          this.round_radius,
          shape === Graph.CARD_SHAPE ? 0 : this.round_radius
        )
      } else if (shape === Graph.CIRCLE_SHALE) {
        ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2)
      }

      ctx.fill()
    }

    if (selected) {
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      if (shape === Graph.BOX_SHAPE) {
        ctx.rect(-6 + area[0], -6 + area[1], 12 + area[2], 12 + area[3])
      } else if (shape === Graph.ROUND_SHAPE) {
        ctx.roundRect(
          -6 + area[0],
          -6 + area[1],
          12 + area[2],
          12 + area[3],
          this.round_radius * 2
        )
      } else if (shape === Graph.CIRCLE_SHALE) {
        ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5 + 6, 0, Math.PI * 2)
      }
      ctx.strokeStyle = "#FFF"
      ctx.stroke()
      ctx.strokeStyle = fgcolor
      ctx.globalAlpha = 1
    }
  }

  bindEvents() {
    if (this._event_binded) {
      console.warn("GraphCanvas: events already binded")
      return
    }

    let canvas = this.canvas
    let window = this.getCanvasWindow()

    this._mousewheel_callback = this.processMouseWheel.bind(this)
    this._mousedown_callback = this.processMouseDown.bind(this)
    canvas.addEventListener("mousewheel", this._mousewheel_callback)
    canvas.addEventListener("mousemove", this._mousemove_callback)
    canvas.addEventListener("mousedown", this._mousedown_callback, true)
    canvas.addEventListener("contextmenu", this._doNothing)
    this._event_binded = true
  }

  processMouseDown(e) {
    if (!this.graph) return

    this.adjustMouseEvent(e)

    let ref_window = this.getCanvasWindow()
    let skip_action = false
    let node = this.graph.getNodeOnPos(
      e.canvasX,
      e.canvasY,
      this.visible_nodes,
      5
    )

    // 移除canvas的mouse事件，用window监听，当鼠标再canvas外仍能拖拽
    this.canvas.removeEventListener("mousemove", this._mouseup_callback)
    ref_window.document.addEventListener(
      "mousemove",
      this._mousemove_callback,
      true
    )
    ref_window.document.addEventListener(
      "mouseup",
      this._mouseup_callback,
      true
    )

    let now = Graph.getTime()
    let is_double_click = now - this.last_mouseclick < 300

    // 清除菜单栏
    ContextMenu.closeAllContextMenus()

    // 左键
    if (e.which === 1) {
      let clicking_canvas_bg = false
      let block_drag_node = false

      if (node && !skip_action) {
        // 点击到node，将node移到最后
        this.bringToFront(node)

        // part1 node缩放
        if (
          !skip_action &&
          isInsideRectangle(
            e.canvasX,
            e.canvasY,
            node.pos[0] + node.size[0] - 5,
            node.pos[1] + node.size[1] - 5,
            10,
            10
          )
        ) {
          this.resizing_node = node
          this.canvas.style.cursor = "se-resize"
          skip_action = true
        }

        // part2 node 移动
        if (!skip_action) {
          if (!block_drag_node) {
            this.node_dragged = node
            if (!this.selected_nodes[node.id]) {
              this.processNodeSelected(node, e)
            }
          }
        }
      } else {
        // 拖拽bg
        clicking_canvas_bg = true
      }

      // 点击bg则为拖拽
      if (clicking_canvas_bg) {
        this.dragging_canvas = true
      }

      this.last_mouse[0] = e.localX
      this.last_mouse[1] = e.localY
      this.last_mouseclick = Graph.getTime()
      this.last_mouse_dragging = true
    } else if (e.which === 3) {
      // 右键 - 菜单栏
      // TODO: node
      this.processContextMenu(null, e)
    }
  }

  processMouseMove(e) {
    if (this.set_canvas_dirty_on_mouse_event) {
      this.dirty_canvas = true
    }
    if (!this.graph) return
    this.adjustMouseEvent(e)
    let mouse = [e.localX, e.localY]
    this.mouse[0] = mouse[0]
    this.mouse[1] = mouse[1]
    let delta = [mouse[0] - this.last_mouse[0], mouse[1] - this.last_mouse[1]]
    this.last_mouse = mouse

    e.dragging = this.last_mouse_dragging

    if (this.dragging_canvas) {
      this.ds.offset[0] += delta[0] / this.ds.scale
      this.ds.offset[1] += delta[1] / this.ds.scale
      this.dirty_canvas = true
      this.dirty_bgcanvas = true
    } else {
      var node = this.graph.getNodeOnPos(
        e.canvasX,
        e.canvasY,
        this.visible_nodes
      )

      // mouse over
      if (node) {
        if (this.canvas) {
          if (
            isInsideRectangle(
              e.canvasX,
              e.canvasY,
              node.pos[0] + node.size[0] - 5,
              node.pos[1] + node.size[1] - 5,
              10,
              10
            )
          ) {
            this.canvas.style.cursor = "se-resize"
          } else {
            this.canvas.style.cursor = "crosshair"
          }
        }
      } else {
        if (this.canvas) this.canvas.style.cursor = ""
      }

      // node被拖拽
      if (this.node_dragged) {
        for (let key in this.selected_nodes) {
          let n = this.selected_nodes[key]
          n.pos[0] += delta[0] / this.ds.scale
          n.pos[1] += delta[1] / this.ds.scale
        }
        this.setDirty(true, true)
      }

      if (this.resizing_node) {
        let desired_size = [
          e.canvasX - this.resizing_node.pos[0],
          e.canvasY - this.resizing_node.pos[1]
        ]
        let mini_size = this.resizing_node.computedSize()
        desired_size[0] = Math.max(mini_size[0], desired_size[0])
        desired_size[1] = Math.max(mini_size[1], desired_size[1])
        this.resizing_node.setSize(desired_size)

        this.canvas.style.cursor = 'se-resize'
        this.setDirty(true, true)
      }
    }
    e.preventDefault()
  }

  processMouseUp(e) {
    if (!this.graph) return
    let ref_window = this.getCanvasWindow()
    ref_window.removeEventListener("mousemove", this._mousemove_callback, true)
    this.canvas.addEventListener("mousemove", this._mousemove_callback, true)
    ref_window.removeEventListener("mouseup", this._mouseup_callback, true)

    let now = Graph.getTime()
    e.click_time = now - this.last_mouseclick

    this.adjustMouseEvent(e)

    if (e.which === 1) {
      let node = this.graph.getNodeOnPos(
        e.canvasX,
        e.canvasY,
        this.visible_nodes
      )

      if (this.node_dragged) {
        this.node_dragged.pos[0] = Math.round(this.node_dragged.pos[0])
        this.node_dragged.pos[1] = Math.round(this.node_dragged.pos[1])
        this.node_dragged = null
        this.setDirty(true, true)
      } else if (this.resizing_node) {
        this.resizing_node = null
        this.setDirty(true, true)
      } else {
        if (!node && e.click_time < 300) {
          this.deselectAllNodes()
        }
      }
    }

    this.last_mouse_dragging = false
    this.dragging_canvas = false
  }

  processMouseWheel(e) {
    if (!this.graph) return
    let delta = e.wheelDeltaY
    this.adjustMouseEvent(e)
    let scale = this.ds.scale
    if (delta > 0) {
      scale *= 1.1
    } else if (delta < 0) {
      scale *= 1 / 1.1
    }
    this.ds.changeScale(scale, [e.localX, e.localY])
    this.graph.change()
  }

  processContextMenu(node, event) {
    let canvas = this.canvas
    let ref_window = this.getCanvasWindow()
    let menu_info = []
    let options = {
      event: event,
      callback: inner_option_clicked,
      extra: node,
    }

    // 点击节点
    if (node) {
    } else {
      // 点击bg
      // 菜单信息
      menu_info = this.getCanvasMenuOptions()
    }

    let menu = new ContextMenu(menu_info, options, ref_window)

    function inner_option_clicked(v, options, e) {}
  }

  getCanvasMenuOptions() {
    let options = null
    options = [
      {
        content: "添加节点",
        has_submenu: true,
        callback: GraphCanvas.onMenuAdd,
      },
      {
        content: "添加节点2",
        has_submenu: true,
        callback: GraphCanvas.onMenuAdd,
      },
    ]
    return options
  }

  /**
   *
   * @param {*} e
   * @localX 相对canvas容器的位置
   */
  adjustMouseEvent(e) {
    if (this.canvas) {
      var b = this.canvas.getBoundingClientRect()
      e.localX = e.clientX - b.left
      e.localY = e.clientY - b.top
    } else {
      e.localX = e.clientX
      e.localY = e.clientY
    }

    // wheel deltaX只读属性
    if (e.type !== "wheel") {
      this.last_mouse_position[0] = e.localX
      this.last_mouse_position[1] = e.localY
    }

    e.canvasX = e.localX / this.ds.scale - this.ds.offset[0]
    e.canvasY = e.localY / this.ds.scale - this.ds.offset[1]
  }

  computeVisibleNodes(nodes, out) {
    let temp = new Float32Array(4)
    let visible_nodes = out || []
    visible_nodes.length = 0
    nodes = nodes || this.graph._nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]

      if (!overlapBounding(this.visible_area, n.getBounding(temp))) {
        continue
      }

      visible_nodes.push(n)
    }
    return nodes
  }

  processNodeSelected(node, e) {
    this.selectNode(node, e && e.shiftKey)
  }

  selectNode(node, add_to_current_selection) {
    if (node === null) {
      this.deselectAllNodes()
    } else {
      this.selectNodes([node], add_to_current_selection)
    }
  }

  selectNodes(nodes, add_to_current_selection) {
    if (!add_to_current_selection) {
      this.deselectAllNodes()
    }

    nodes = nodes || this.graph._nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (node.is_selected) {
        continue
      }
      if (!node.is_selected && node.onSelected) {
        node.onSelected()
      }
      node.is_selected = true
      this.selected_nodes[node.id] = node
    }
    this.setDirty(true, true)
  }

  deselectAllNodes() {
    if (!this.graph) return
    let nodes = this.graph._nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      if (!node.is_selected) continue
      node.is_selected = false
    }
    this.selected_nodes = {}
    this.current_node = null
    this.setDirty(true)
  }

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
    this.setDirty(true, true)
  }

  getCanvasWindow() {
    return window
  }

  convertEventToCanvasOffset(e) {
    let rect = this.canvas.getBoundingClientRect()
    return this.convertCanvasToOffset([
      e.clientX - rect.left,
      e.clientY - rect.top,
    ])
  }

  bringToFront(node) {
    let i = this.graph._nodes.indexOf(node)
    if (i === -1) {
      return
    }
    this.graph._nodes.splice(i, 1)
    this.graph._nodes.push(node)
  }

  convertCanvasToOffset(pos, out) {
    return this.ds.convertCanvasToOffset(pos, out)
  }

  clear() {
    this.selected_nodes = {}
    this.last_mouse = [0, 0]
  }

  _doNothing(e) {
    e.preventDefault()
    return false
  }

  setDirty(fgcanvas, bgcanvas) {
    if (fgcanvas) {
      this.dirty_canvas = true
    }
    if (bgcanvas) {
      this.dirty_bgcanvas = true
    }
  }
}
