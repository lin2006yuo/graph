import { GraphCanvas } from './graph_canvas.mjs'

class Graph {
  constructor() {}

  static getTime = function () {
    return Date.now.bind(Date)
  }

  static getNodeTypesCategories = function() {
    return ['子项1','子项2']
  }

  static createNode(value) {
    console.log('create Node', value)
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
}

export default Graph