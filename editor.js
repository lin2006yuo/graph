class Editor {
  constructor(container_id, options) {
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

    let canvas = root.querySelector('.graphcanvas')
    let graph = (this.graph = new Graph())
    let graphcanvas = (this.graphcanvas = new GraphCanvas(canvas, graph))
    graphcanvas.background_image = "img/grid.png"
    graph.onAfterExecute = function() {
      // graphcanvas.draw(true)
    }
    let parent = document.getElementById(container_id)
    if(parent) {
      parent.appendChild(root)
    }
    graphcanvas.resize()
  }
}