import ContextMenu from "./context_menu.mjs"
import Graph from "./graph.mjs"
import DragAndScale from "./drag_and_scale.mjs"
import { overlapBounding, isInsideRectangle, distance } from "./utils.mjs"

let temp_vec2 = new Float32Array(2)
let tmp_area = new Float32Array(4)
let margin_area = new Float32Array(4)
let link_bounding = new Float32Array(4)
let tempA = new Float32Array(2)
let tempB = new Float32Array(2)

export class GraphCanvas {
  static DEFAULT_BACKGROUND_IMAGE = ""
  // "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII="
  static active_canvas = null

  static link_type_colors = {
    "-1": Graph.EVENT_LINK_COLOR,
    number: "#AAA",
    node: "#DCA",
  }

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
    this.graph_mouse = [0, 0]
    this.canvas_mouse = this.graph_mouse
    this.render_shadows = true
    this.inner_text_font = "normal " + Graph.NODE_SUBTEXT_SIZE + "px Arial"
    this.selected_nodes = {}
    this.current_node = null
    this.resizing_node = null
    this.connecting_node = null
    this.connecting_pos = null
    this.connections_width = 3
    this.default_connection_color = {
      input_off: "#778",
      input_on: "#7F7",
      output_off: "#778",
      output_on: "#7F7",
    }
    this.default_link_color = Graph.LINK_COLOR
    this.links_render_mode = Graph.STRAIGHT_LINK // LINEAR_LINK SPLINE_LINK STRAIGHT_LINK

    this.visible_nodes = []
    this.visible_links = []

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

      // link
      if (this.connecting_pos !== null) {
        ctx.lineWidth = this.connections_width
        let link_color = Graph.CONNECTING_LINK_COLOR

        this.renderLink(
          ctx,
          this.connecting_pos,
          [this.graph_mouse[0], this.graph_mouse[1]],
          null,
          false,
          null,
          link_color,
          this.connecting_output.dir || this.connecting_output.horizontal
            ? Graph.DOWN
            : Graph.RIGHT,
          Graph.CENTER
        )

        ctx.beginPath()
        if (
          this.connecting_output.type === Graph.EVENT ||
          this.connecting_output.shape === Graph.BOX_SHAPE
        ) {
          // TODO
        } else {
          ctx.arc(
            this.connecting_pos[0],
            this.connecting_pos[1],
            4,
            0,
            Math.PI * 2
          )
        }
        ctx.fill()

        ctx.fillStyle = "#ffcc00"
        if (this._highlight_input) {
          ctx.beginPath()
          ctx.arc(
            this._highlight_input[0],
            this._highlight_input[1],
            6,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
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

      ctx.shadowColor = "rgba(0,0,0,0)"

      this.drawConnections(ctx)

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

    ctx.textAlign = horizontal ? "center" : "right"
    ctx.strokeStyle = "black"
    ctx.font = this.inner_text_font

    let render_text = true

    let max_y = 0
    let slot_pos = new Float32Array(2)

    if (!node.flags.collapsed) {
      if (node.inputs) {
        for (let i = 0; i < node.inputs.length; i++) {
          const slot = node.inputs[i] // {name: "obj", type: 0, link: null}

          ctx.globalAlpha = edit_alpha

          // if (this.connecting_node) {
          //   ctx.globalAlpha = 0.4 * edit_alpha
          // }
          ctx.fillStyle =
            slot.link !== null
              ? slot.color_on || this.default_connection_color.input_on
              : slot.color_off || this.default_connection_color.input_off

          let pos = node.getConnectionPos(true, i, slot_pos)
          pos[0] -= node.pos[0]
          pos[1] -= node.pos[1]
          if (max_y < pos[1] + Graph.NODE_SLOT_HEIGHT * 0.5) {
            max_y = pos[1] + Graph.NODE_SLOT_HEIGHT * 0.5
          }

          ctx.beginPath()

          if (slot.type === Graph.EVENT || slot.shape === Graph.BOX_SHAPE) {
            // TODO
          } else if (slot.shape == Graph.ARROW_SHAPE) {
            // TODO
          } else {
            ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }
      if (node.outputs) {
        for (let i = 0; i < node.outputs.length; i++) {
          const slot = node.outputs[i]

          ctx.globalAlpha = edit_alpha
          // console.log(this.connecting_node)
          if (this.connecting_node) {
            ctx.globalAlpha = 0.4 * edit_alpha
          }

          let pos = node.getConnectionPos(false, i, slot_pos)
          pos[0] -= node.pos[0]
          pos[1] -= node.pos[1]
          if (max_y < pos[1] + Graph.NODE_SLOT_HEIGHT * 0.5) {
            max_y = pos[1] + Graph.NODE_SLOT_HEIGHT * 0.5
          }

          ctx.fillStyle =
            slot.links && slot.links.length
              ? slot.color_on || this.default_connection_color.output_on
              : slot.color_off || this.default_connection_color.output_off

          ctx.beginPath()

          if (slot.shape === Graph.BOX_SHAPE) {
          } else if (slot.shape === Graph.ARROW_SHAPE) {
          } else {
            ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2)
          }

          ctx.fill()
          ctx.stroke()

          if (render_text) {
            let text = slot.label ? slot.label : slot.name
            if (text) {
              ctx.fillStyle = Graph.NODE_TEXT_COLOR
              if (horizontal || slot.dir === Graph.UP) {
              } else {
                ctx.fillText(text, pos[0] - 10, pos[1] + 5)
              }
            }
          }
        }
      }
    }

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

  drawConnections(ctx) {
    let now = Graph.getTime()
    let visible_area = this.visible_area
    margin_area[0] = visible_area[0] - 20
    margin_area[1] = visible_area[1] - 20
    margin_area[2] = visible_area[2] + 40
    margin_area[3] = visible_area[3] + 40

    ctx.lineWidth = this.connections_width

    ctx.fillStyle = "#AAA"
    ctx.strokeStyle = "#AAA"
    ctx.globalAlpha = this.editor_alpha

    let nodes = this.graph._nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]

      if (!node.inputs || !node.inputs.length) {
        continue
      }

      for (let i = 0; i < node.inputs.length; i++) {
        const input = node.inputs[i]
        if (!input || input.link === null) continue

        let link_id = input.link
        let link = this.graph.links[link_id]
        if (!link) continue

        // link
        // id: 1
        // origin_id: 1
        // origin_slot: 0
        // target_id: 2
        // target_slot: 0
        // type: 0
        let start_node = this.graph.getNodeById(link.origin_id)
        if (start_node == null) continue

        let start_node_slot = link.origin_slot
        let start_node_slotpos = null
        if (start_node_slot == -1) {
          start_node_slotpos = [start_node.pos[0] + 10, start_node.pos[1] + 10]
        } else {
          start_node_slotpos = start_node.getConnectionPos(
            false,
            start_node_slot,
            tempA
          )
        }

        let end_node_slotpos = node.getConnectionPos(true, i, tempB)

        link_bounding[0] = start_node_slotpos[0]
        link_bounding[1] = start_node_slotpos[1]
        link_bounding[2] = end_node_slotpos[0] - start_node_slotpos[0]
        link_bounding[3] = end_node_slotpos[1] - start_node_slotpos[1]

        if (link_bounding[2] < 0) {
          link_bounding[0] += link_bounding[2]
          link_bounding[2] = Math.abs(link_bounding[2])
        }
        if (link_bounding[3] < 0) {
          link_bounding[1] += link_bounding[3]
          link_bounding[3] = Math.abs(link_bounding[3])
        }

        //skip links outside of the visible area of the canvas
        if (!overlapBounding(link_bounding, margin_area)) {
          continue
        }

        let start_slot = start_node.outputs[start_node_slot]
        let end_slot = node.inputs[i]

        let start_dir =
          start_slot.dir || (start_node.horizontal ? Graph.DOWN : Graph.RIGHT)
        let end_dir = end_slot.dir || (node.horizontal ? Graph.UP : Graph.LEFT)

        this.renderLink(
          ctx,
          start_node_slotpos,
          end_node_slotpos,
          link,
          false,
          0,
          null,
          start_dir,
          end_dir
        )
      }
    }

    ctx.globalAlpha = 1
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
    this.mouse[0] = e.localX
    this.mouse[1] = e.localY
    this.graph_mouse[0] = e.canvasX
    this.graph_mouse[1] = e.canvasY
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
        } else {
          if (node.outputs) {
            for (let i = 0; i < node.outputs.length; i++) {
              const output = node.outputs[i]
              let link_pos = node.getConnectionPos(false, i)

              if (
                isInsideRectangle(
                  e.canvasX,
                  e.canvasY,
                  link_pos[0] - 15,
                  link_pos[1] - 10,
                  30,
                  20
                )
              ) {
                this.connecting_node = node
                this.connecting_output = output
                this.connecting_pos = node.getConnectionPos(false, i)
                this.connecting_slot = i

                skip_action = true
                break
              }
            }
          }
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
      this.processContextMenu(null, e)
    }

    this.graph.change()
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
    this.graph_mouse[0] = e.canvasX
    this.graph_mouse[1] = e.canvasY

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
        if (this.connecting_node) {
          let pos = this._highlight_input || [0, 0]
          // 这个方法会修改pos
          let slot = this.isOverNodeInput(node, e.canvasX, e.canvasY, pos)

          if (slot !== -1 && node.inputs[slot]) {
            this._highlight_input = pos
          } else {
            this._highlight_input = null
          }
        }

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
          e.canvasY - this.resizing_node.pos[1],
        ]
        let mini_size = this.resizing_node.computedSize()
        desired_size[0] = Math.max(mini_size[0], desired_size[0])
        desired_size[1] = Math.max(mini_size[1], desired_size[1])
        this.resizing_node.setSize(desired_size)

        this.canvas.style.cursor = "se-resize"
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
      } else if (this.connecting_node) {
        let node = this.graph.getNodeOnPos(
          e.canvasX,
          e.canvasY,
          this.visible_nodes
        )

        if (node) {
          let slot = this.isOverNodeInput(node, e.canvasX, e.canvasY)

          if (slot !== -1) {
            this.connecting_node.connect(this.connecting_slot, node, slot)
          }
        }

        this.connecting_node = null
        this.connecting_pos = null
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

    this.graph.change()
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

  renderLink(
    ctx, //ctx
    a, // this.connecting_pos,
    b, // [this.graph_mouse[0], this.graph_mouse[1]],
    link, // null,
    skip_border, //  false,
    flow, // null,
    color, // link_color,
    start_dir, // Graph.RIGHT
    end_dir, // Graph.CENTERs
    num_sublines
  ) {
    if (link) {
      this.visible_links.push(link)
    }

    if (!color && link) {
      color = link.color || GraphCanvas.link_type_colors[link.type]
    }

    if (!color) {
      color = this.default_link_color
    }

    if (link != null && this.highlighted_links[link.id]) {
      color = "#FFF"
    }

    start_dir = start_dir || Graph.RIGHT
    end_dir = end_dir || Graph.LEFT

    let dist = distance(a, b)

    ctx.lineWidth = this.connections_width + 4
    ctx.lineJoin = "round"
    num_sublines = num_sublines || 1
    if (num_sublines > 1) {
      ctx.lineWidth = 0.5
    }

    ctx.beginPath()
    for (let i = 0; i < num_sublines; i++) {
      let offsety = (i - (num_sublines - 1) * 0.5) * 0.5
      if (this.links_render_mode == Graph.SPLINE_LINK) {
        ctx.moveTo(a[0], a[1] + offsety)
        var start_offset_x = 0
        var start_offset_y = 0
        var end_offset_x = 0
        var end_offset_y = 0
        switch (start_dir) {
          case Graph.LEFT:
            start_offset_x = dist * -0.25
            break
          case Graph.RIGHT:
            start_offset_x = dist * 0.25
            break
          case Graph.UP:
            start_offset_y = dist * -0.25
            break
          case Graph.DOWN:
            start_offset_y = dist * 0.25
            break
        }
        switch (end_dir) {
          case Graph.LEFT:
            end_offset_x = dist * -0.25
            break
          case Graph.RIGHT:
            end_offset_x = dist * 0.25
            break
          case Graph.UP:
            end_offset_y = dist * -0.25
            break
          case Graph.DOWN:
            end_offset_y = dist * 0.25
            break
        }
        ctx.bezierCurveTo(
          a[0] + start_offset_x,
          a[1] + start_offset_y + offsety,
          b[0] + end_offset_x,
          b[1] + end_offset_y + offsety,
          b[0],
          b[1] + offsety
        )
      } else if (this.links_render_mode === Graph.LINEAR_LINK) {
        ctx.moveTo(a[0], a[1] + offsety)
        var start_offset_x = 0
        var start_offset_y = 0
        var end_offset_x = 0
        var end_offset_y = 0
        switch (start_dir) {
          case Graph.LEFT:
            start_offset_x = -1
            break
          case Graph.RIGHT:
            start_offset_x = 1
            break
          case Graph.UP:
            start_offset_y = -1
            break
          case Graph.DOWN:
            start_offset_y = 1
            break
        }
        switch (end_dir) {
          case Graph.LEFT:
            end_offset_x = -1
            break
          case Graph.RIGHT:
            end_offset_x = 1
            break
          case Graph.UP:
            end_offset_y = -1
            break
          case Graph.DOWN:
            end_offset_y = 1
            break
        }
        var l = 15
        ctx.lineTo(
          a[0] + start_offset_x * l,
          a[1] + start_offset_y * l + offsety
        )
        ctx.lineTo(b[0] + end_offset_x * l, b[1] + end_offset_y * l + offsety)
        ctx.lineTo(b[0], b[1] + offsety)
      } else if (this.links_render_mode === Graph.STRAIGHT_LINK) {
        ctx.moveTo(a[0], a[1])
        var start_x = a[0]
        var start_y = a[1]
        var end_x = b[0]
        var end_y = b[1]
        if (start_dir == Graph.RIGHT) {
          start_x += 10
        } else {
          start_y += 10
        }
        if (end_dir == Graph.LEFT) {
          end_x -= 10
        } else {
          end_y -= 10
        }
        ctx.lineTo(start_x, start_y)
        ctx.lineTo((start_x + end_x) * 0.5, start_y)
        ctx.lineTo((start_x + end_x) * 0.5, end_y)
        ctx.lineTo(end_x, end_y)
        ctx.lineTo(b[0], b[1])
      } else {
        return
      }
    }

    ctx.strokeStyle = "rgba(0,0,0,0.5)"
    ctx.stroke()

    ctx.lineWidth = this.connections_width
    ctx.fillStyle = ctx.strokeStyle = color
    ctx.stroke()
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
    console.log(node)
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

      if (node.inputs) {
        for (let i = 0; i < node.inputs.length; i++) {
          const input = node.inputs[i]
          this.highlighted_links[input.link] = true
        }
      }

      for (let i = 0; i < node.outputs.length; i++) {
        const output = node.outputs[i]
        if (output.links) {
          for (let i = 0; i < output.links.length; i++) {
            const link = output.links[i]
            this.highlighted_links[link] = true
          }
        }
      }
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
    this.highlighted_links = {}
    this.current_node = null
    this.setDirty(true)
  }

  deselectNode(node) {
    if (!node.is_selected) return

    node.is_selected = false

    if (node.inputs) {
      for (let i = 0; i < node.inputs.length; i++) {
        const input = node.inputs[i]
        delete this.highlighted_links[input.link]
      }
    }

    for (let i = 0; i < node.outputs.length; i++) {
      const output = node.outputs[i]
      if (output.links) {
        for (let i = 0; i < output.links.length; i++) {
          const link = output.links[i]
          delete this.highlighted_links[link]
        }
      }
    }
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

  isOverNodeInput(node, canvasx, canvasy, slot_pos) {
    if (node.inputs) {
      for (let i = 0; i < node.inputs.length; i++) {
        const input = node.inputs[i]
        let link_pos = node.getConnectionPos(true, i)
        let is_inside = false

        if (node.horizontal) {
          // TODO
        } else {
          is_inside = isInsideRectangle(
            canvasx,
            canvasy,
            link_pos[0] - 10,
            link_pos[1] - 5,
            40,
            10
          )
        }

        if (is_inside) {
          if (slot_pos) {
            slot_pos[0] = link_pos[0]
            slot_pos[1] = link_pos[1]
          }
          return i
        }
      }
    }
    return -1
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
    this.highlighted_links = {}
    this.connecting_node = null
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
