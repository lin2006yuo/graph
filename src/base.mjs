import Graph from "./graph.mjs"
;(function () {
  window.CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius,
    radius_low
  ) {
    if (radius === undefined) {
      radius = 5
    }
    if (radius_low === undefined) {
      radius_low = radius
    }
    this.moveTo(x + radius, y)
    this.lineTo(x + width - radius, y)
    this.quadraticCurveTo(x + width, y, x + width, y + radius)

    this.lineTo(x + width, y + height - radius_low)
    this.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius_low,
      y + height
    )
    this.lineTo(x + radius_low, y + height)
    this.quadraticCurveTo(x, y + height, x, y + height - radius_low)
    this.lineTo(x, y + radius_low)
    this.quadraticCurveTo(x, y, x + radius_low, y)
  }
})()

function Time() {
  this.addOutput("in ms", "number")
  this.addOutput("in sec", "number")
}
Time.title = "Time"
Time.desc = "Time"
Time.prototype.onExecute = function () {
  console.log("Time onExecute")
}
Graph.registerNodeType("basic/time", Time)

function ObjectKeys() {
  this.addInput("obj", "")
  this.addOutput("keys","array")
  this.size = [140, 30]
}
ObjectKeys.title = "Object Keys"
ObjectKeys.desc = "Output an array with the keys..."
Graph.registerNodeType("basic/object_keys", ObjectKeys)

Graph.wrapFunctionAsNode("basic/length", length, [""], "number")
