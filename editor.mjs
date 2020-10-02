import { GraphCanvas } from './src/graph_canvas.mjs'
import Graph from './src/graph.mjs'

export default class Editor {
  constructor(container_id, options) {
    this.graph = null
    this.graphcanvas = null
    this.root = null

     let html = `
      <div class='content'>
        <div class='editor-area'>
          <canvas class='graphcanvas' width='1000' height='500'></canvas>
        </div>
      </div>
     `
     let root = document.createElement('div')
     this.root = root
     root.className = 'graph graph-editor'
     root.innerHTML = html
    let parent = document.getElementById(container_id)
    if(parent) {
      parent.appendChild(root)
    }
    let canvas = root.querySelector('.graphcanvas')
    let graph = (this.graph = new Graph())
    let graphcanvas = (this.graphcanvas = new GraphCanvas(canvas, graph))
    graphcanvas.background_image = "img/grid.png"
    graph.onAfterExecute = function() {
      // graphcanvas.draw(true)
    }
    graphcanvas.resize()
  }
}