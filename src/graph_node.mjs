import Graph from "./graph.mjs"

class GraphNode {
  constructor(title) {
    this._ctor(title)
  }

  _ctor(title) {
    this.title = title | "Unnamed"
    this.size = [Graph.NODE_WIDTH, 60]
    this.graph = null

    this._pos = new Float32Array(10, 10)

    Object.defineProperty(this, "pos", {
      set: function (v) {
        if (!v || v.length < 2) {
          return
        }
        this._pos[0] = v[0]
        this._pos[1] = v[1]
      },
      get: function () {
        return this._pos
      },
      enumerable: true,
    })

    this.id = -1 //not know till not added
    this.type = null

    //inputs available: array of inputs
    this.inputs = []
    this.outputs = []
    this.connections = []

    //local data
    this.properties = {} //for the values
    this.properties_info = [] //for the info

    this.flags = {}
  }

  addInput(name, type) {
    console.log("graph addInput")
  }
  addOutput(name, type) {
    let o = { name: name, type: type, links: null }

    if (!this.outputs) {
      this.outputs = []
    }

    this.outputs.push(o)
    this.setSize(this.computedSize(140, 46))
    this.setDirtyCanvas(true, true)
    return o
  }

  getConnectionPos(is_input, slot_number, out) {
    out = out || new Float32Array(2)
    let num_slot = 0

    if (is_input && this.inputs) {
    }
    if (!is_input && this.outputs) {
      num_slot = this.outputs.length
    }

    let offset = Graph.NODE_SLOT_HEIGHT * 0.5

    if (this.flags.collapsed) {
    }

    if (!is_input && num_slot > slot_number && this.outputs[slot_number].pos) {
      out[0] = this.pos[0] + this.outputs[slot_number].pos[0]
      out[1] = this.pos[1] + this.outputs[slot_number].pos[1]
      return out
    }

    if (is_input) {
    } else {
      out[0] = this.pos[0] + this.size[0] + 1 - offset
    }
    out[1] =
      this.pos[1] +
      (slot_number + 0.7) * Graph.NODE_SLOT_HEIGHT +
      (this.constructor.slot_start_y || 0)

    return out
  }

  getBounding(out) {
    out = out || new Float32Array(4)
    out[0] = this.pos[0] - 4
    out[1] = this.pos[1] - Graph.NODE_TITLE_HEIGHT
    out[2] = this.size[0] + 4
    out[3] = this.size[1] + Graph.NODE_TITLE_HEIGHT

    return out
  }

  isPointInside(x, y, margin, skip_title) {
    margin = margin || 0
    let margin_top = Graph.NODE_TITLE_HEIGHT
    if (
      this.pos[0] - margin < x &&
      this.pos[0] + this.size[0] + margin > x &&
      this.pos[1] - margin_top - margin < y &&
      this.pos[1] + this.size[1] + margin > y
    ) {
      return true
    }
    return false
  }

  computedSize() {
    return new Float32Array([140, 46])
  }

  setSize(size) {
    this.size = size
  }

  setDirtyCanvas(dirty_foreground, dirty_background) {
    if (!this.graph) {
      return
    }
    this.graph.sendActionToCanvas("setDirty", [
      dirty_foreground,
      dirty_background,
    ])
  }
}

export default GraphNode
