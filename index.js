let editor = new Editor("main")
window.addEventListener("resize", () => {
  editor.graphcanvas.resize()
})
