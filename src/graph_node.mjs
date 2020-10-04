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

  getBounding(out) {
    out = out || new Float32Array(4)
    out[0] = this.pos[0] - 4
    out[1] = this.pos[1] - Graph.NODE_TITLE_HEIGHT
    out[2] = this.size[0] + 4
    out[3] = this.size[1] + Graph.NODE_TITLE_HEIGHT
    
    return out
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
