import { GraphCanvas } from "./graph_canvas.mjs"
import GraphNode from "./graph_node.mjs"

class Graph {
  static BOX_SHAPE = 1
  static ROUND_SHAPE = 2
  static CIRCLE_SHAPE = 3
  static CARD_SHAPE = 4
  static ARROW_SHAPE = 5
  static NODE_WIDTH = 140
  static NODE_TITLE_HEIGHT = 30
  static NODE_SUBTEXT_SIZE = 12
  static NODE_SLOT_HEIGHT = 20
  static NODE_TEXT_COLOR = "#AAA"
  static NODE_DEFAULT_COLOR = "#333"
  static NODE_DEFAULT_BGCOLOR = "#353535"
  static DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0.5)"
  static CONNECTING_LINK_COLOR = "#AFA"
  static LINK_COLOR = "#9A9"

  static STRAIGHT_LINK = 0
  static LINEAR_LINK = 1
  static SPLINE_LINK = 2

  static UP = 1
  static DOWN = 2
  static LEFT = 3
  static RIGHT = 4
  static CENTER = 5

  static TRANSPARENT_TITLE = 2
  static AUTOHIDE_TITLE = 3

  static DEFAULT_POSITION = [100, 100]

  static registered_node_types = {}
  static Nodes = {}

  static getTime = function () {
    return new Date().getTime()
  }

  static getNodeTypesCategories = function () {
    return ["basic/time", "basic/object_keys"]
  }

  static createNode(type, title, options) {
    let base_class = this.registered_node_types[type]
    title = title || base_class.title
    let node = null
    base_class.prototype
    node = new base_class(title)

    if (!node.size) {
      node.size = node.computedSize()
    }

    if (!node.pos) {
      node.pos = Graph.DEFAULT_POSITION.concat()
    }

    if (!node.flags) {
      node.flags = {}
    }

    return node
  }

  static getParameterNames(func) {
    return (func + "")
      .replace(/[/][/].*$/gm, "") // strip single-line comments
      .replace(/\s+/g, "") // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments  /**/
      .split("){", 1)[0]
      .replace(/^[^(]*[(]/, "") // extract the parameters
      .replace(/=[^,]+/g, "") // strip any ES6 defaults
      .split(",")
      .filter(Boolean) // split & filter [""]
  }

  static wrapFunctionAsNode(name, func, param_types, return_type, properties) {
    var params = Array(func.length)
    var code = ""
    var names = Graph.getParameterNames(func)
    for (var i = 0; i < names.length; ++i) {
      code +=
        "this.addInput('" +
        names[i] +
        "'," +
        (param_types && param_types[i] ? "'" + param_types[i] + "'" : "0") +
        ");\n"
    }
    code +=
      "this.addOutput('out'," +
      (return_type ? "'" + return_type + "'" : 0) +
      ");\n"
    if (properties) {
      code += "this.properties = " + JSON.stringify(properties) + ";\n"
    }
    var classobj = Function(code)
    classobj.title = name.split("/").pop()
    classobj.desc = "Generated from " + func.name
    classobj.prototype.onExecute = function onExecute() {
      for (var i = 0; i < params.length; ++i) {
        params[i] = this.getInputData(i)
      }
      var r = func.apply(this, params)
      this.setOutputData(0, r)
    }
    this.registerNodeType(name, classobj)
  }

  static registerNodeType(type, base_class) {
    // type = "basic/length"
    base_class.type = type

    let classname = base_class.name

    let pos = type.lastIndexOf("/")
    base_class.category = type.substr(0, pos)

    if (base_class.prototype) {
      for (var i of Object.getOwnPropertyNames(GraphNode.prototype)) {
        if (!base_class.prototype[i]) {
          base_class.prototype[i] = GraphNode.prototype[i]
        }
      }
    }

    let pre = this.registered_node_types[type]
    if (pre) console.log("replace node type:" + type)
    else {
      if (!Object.hasOwnProperty(base_class.prototype, "shape")) {
        Object.defineProperty(base_class.prototype, "shape", {
          set: function () {
            switch (v) {
              case "default":
                delete this._shape
                break
              case "box":
                this._shape = Graph.BOX_SHAPE
                break
              case "round":
                this._shape = LiteGraph.ROUND_SHAPE
                break
              case "circle":
                this._shape = LiteGraph.CIRCLE_SHAPE
                break
              case "card":
                this._shape = LiteGraph.CARD_SHAPE
                break
              default:
                this._shape = v
            }
          },
          get: function (v) {
            return this._shape
          },
          enumerable: true,
          configurable: true,
        })
      }
    }

    // 注册
    this.registered_node_types[type] = base_class
    if (base_class.constructor.name) {
      this.Nodes[classname] = base_class
    }
  }

  constructor() {
    this.clear()
  }

  add(node, skip_computed_order) {
    if (!node) return
    if (!node.id || node.id === -1) {
      node.id = ++this.last_node_id
    } else if (this.last_node_id < node.id) {
      this.last_node_id = node.id
    }

    node.graph = this
    this._version++

    this._nodes.push(node)
    this._nodes_by_id[node.id] = node

    this.setDirtyCanvas(true)

    return node
  }

  attachCanvas(graphcanvas) {
    if (graphcanvas.constructor !== GraphCanvas) {
      throw "attachCanvas expects a GraphCanvas instance"
    }
    if (graphcanvas.graph && graphcanvas.graph !== this) {
      graphcanvas.graph.detachCanvas(graphcanvas)
    }
    graphcanvas.graph = this
    if (!this.list_of_graphcanvas) {
      this.list_of_graphcanvas = []
    }
    this.list_of_graphcanvas.push(graphcanvas)
  }

  getNodeOnPos(x, y, nodes_list, margin) {
    nodes_list = nodes_list || this._nodes
    for (let i = nodes_list.length - 1; i >= 0; i--) {
      const n = nodes_list[i]
      if (n.isPointInside(x, y, margin)) {
        return n
      }
    }
    return null
  }

  getNodeById(id) {
    if (id == null) {
      return null
    }
    return this._nodes_by_id[id]
  }

  detachCanvas(graphcanvas) {}
  change() {
    this.sendActionToCanvas("setDirty", [true, true])
  }
  sendActionToCanvas(action, params) {
    if (!this.list_of_graphcanvas) return
    for (var i = 0; i < this.list_of_graphcanvas.length; ++i) {
      let c = this.list_of_graphcanvas[i]
      if (c[action]) {
        c[action].apply(c, params)
      }
    }
  }
  getTime() {}

  clear() {
    this.last_node_id = 0
    this._version = -1
    this._nodes = []
    this._nodes_by_id = {}
    this.last_link_id = 0
    this.links = {}
  }

  setDirtyCanvas(fg, bg) {
    this.sendActionToCanvas("setDirty", [fg, bg])
  }
}

export default Graph
