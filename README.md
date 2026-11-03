# Graph

基于原生 Canvas 2D 与 ES Module 的节点图编辑器，以及一组围绕画布缩放、拖拽、坐标系和矩阵变换的交互实验。

项目没有构建步骤：`index.html` 直接加载 `index.mjs`，由 `Editor` 创建 `Graph` 与 `GraphCanvas`，在 Canvas 上绘制网格、节点和连线。`test/`、`example/` 下的页面是彼此独立的实验，可以单独打开。

> 项目状态：个人实验项目。画布渲染和基础交互已完成；节点执行与数据流尚未接入，API 可能继续调整。

## Demo

| 页面 | 说明 | 链接 |
| --- | --- | --- |
| 流程图编辑器 | 节点创建、拖拽、缩放、连线和右键菜单 | [源码](index.html) / [demo](https://graph-three.vercel.app/) |
| 郁金香 | 用向量与动画绘制郁金香 | [源码](test/tulipa/index.html) / [demo](https://graph-three.vercel.app/test/tulipa/index.html) |
| 时间轴 | 可拖拽刻度的 Canvas 时间轴 | [源码](test/timeline/index2.html) / [demo](https://graph-three.vercel.app/test/timeline/index2.html) |
| 选择框 | 矩形选择与矩阵变换，含手势版本 | [源码](test/matrix/index.html) / [demo](https://graph-three.vercel.app/test/matrix/index.html) |
| Jelly Effect | 弹性小球动画 | [源码](example/balls/index.html) / [demo](https://graph-three.vercel.app/example/balls/index.html) |
| 粘体（Slime） | 小球之间的粘连效果 | [源码](example/balls/slime/index.html) / [demo](https://graph-three.vercel.app/example/balls/slime/index.html) |
| 画布缩放 | 以鼠标位置为锚点缩放 | [源码](test/scale/index.html) / [demo](https://graph-three.vercel.app/test/scale/index.html) |
| 画布拖拽 | 拖拽画布的两种实现与错误示例 | [源码](test/drag/index.html) / [demo](https://graph-three.vercel.app/test/drag/index.html) |
| 坐标系 | 屏幕坐标与画布坐标的转换 | [源码](test/coord/index.html) / [demo](https://graph-three.vercel.app/test/coord/index.html) |
| 图片拖拽缩放 | 图片的拖拽、缩放与矩阵组合 | [源码](test/image-drag-scale/index.html) / [demo](https://graph-three.vercel.app/test/image-drag-scale/index.html) |
| 矩阵变换 | 用 3×3 矩阵操作 Canvas | [源码](example/canvas/mat.html) / [demo](https://graph-three.vercel.app/example/canvas/mat.html) |

`test/matrix` 与 `test/image-drag-scale` 下还有多个变体页面（`index-basic`、`index-gesture*`、`index_02`～`index_08` 等），路径规则与在线地址一致。

## 快速开始

### 环境要求

- 静态文件服务器：Python 3，或 Node.js（`npx serve`）
- 支持 ES Module 的现代浏览器

### 安装

仓库内没有 `package.json`，也没有 npm 依赖，不需要执行 `npm install`。使用 `npx serve` 时，首次运行会临时下载 `serve`。

### 启动

在仓库根目录执行任一命令：

```bash
# 方式一：Python 3
python3 -m http.server 5502
```

```bash
# 方式二：Node.js
npx serve -l 5502 .
```

然后访问 <http://localhost:5502/>：根目录 `index.html` 是画布编辑器入口。各 demo 页面的地址与仓库路径一致，例如：

- <http://localhost:5502/test/tulipa/index.html>
- <http://localhost:5502/test/timeline/index2.html>

> 不要直接双击 HTML 文件用 `file://` 打开，浏览器会拦截 ES Module 加载。VS Code Live Server 插件同样可用，仓库已在 `.vscode/settings.json` 中配置端口 `5502`。

### 构建

没有构建步骤，也不需要生成产物：源码即部署文件，把仓库根目录作为静态站点根目录部署即可。现有 demo 部署在 Vercel 上（见上文 demo 链接）。

## 目录结构

| 路径 | 职责 |
| --- | --- |
| `index.html` | 页面入口：加载样式和 `index.mjs`，提供 `#main` 容器 |
| `index.mjs` | 启动脚本：创建 `Editor`，窗口尺寸变化时调用 `graphcanvas.resize()` |
| `editor.mjs` | 编辑器组件：生成 canvas DOM，创建 `Graph` 与 `GraphCanvas`，设置网格背景 |
| `src/graph.mjs` | 图数据模型：维护节点集合与 id、注册节点类型（`registerNodeType` / `wrapFunctionAsNode`）、关联画布并广播重绘 |
| `src/graph_node.mjs` | 节点基类：标题、尺寸与坐标，输入/输出槽位，连接与断开，命中检测 |
| `src/link.mjs` | 连线数据：记录起点/终点节点及槽位，支持序列化与还原 |
| `src/graph_canvas.mjs` | 画布与交互核心：渲染循环，网格/节点/连线绘制，鼠标事件，节点拖拽与缩放、连线、选择（Shift 多选）和右键菜单 |
| `src/context_menu.mjs` | 右键菜单组件：菜单 DOM、子菜单展开与关闭 |
| `src/drag_and_scale.mjs` | 视口变换：维护缩放和偏移、计算可视区域、按缩放中心换算坐标 |
| `src/utils.mjs` | 几何工具：包围盒相交、点与矩形判定、两点距离 |
| `src/base.mjs` | 基础扩展：为 Canvas 2D 上下文补 `roundRect`，并注册示例节点类型（`base_output`、`base_input`、`basic/length`） |
| `style/style.css` | 全局页面样式：全屏布局与暗色主题 |
| `style/editor.css` | 编辑器容器样式：让画布铺满可用高度 |
| `style/graph.css` | 右键菜单与菜单项状态样式 |
| `test/` | 独立 demo：`tulipa` 郁金香动画、`timeline` 时间轴、`matrix` 选择框/矩阵变换、`drag` 拖拽、`scale` 缩放、`coord` 坐标系、`image-drag-scale` 图片拖拽缩放；`test/*.js` 是演示用辅助库（mini Vue、glMatrix、尺寸/Mouse 工具等） |
| `example/` | 独立效果示例：`balls` 弹性小球/粘体动画，`canvas` 矩阵变换；`Mouse.js`、`hidpi-canvas.js` 为辅助脚本 |
| `img/` | 示例图片与画布网格背景 `grid.png` |
| `.vscode/settings.json` | 本地开发配置：VS Code Live Server 使用端口 `5502` |

渲染链路：`index.mjs` → `editor.mjs` 创建 `Graph` 与 `GraphCanvas`；`Graph`/`GraphNode`/`Link` 负责数据，`GraphCanvas` 负责绘制、事件和视口变换。

## 实现笔记

### 渲染循环

`GraphCanvas(canvas, graph)` 的初始化流程：

- `graph.attachCanvas(this)`：把 graph 和 GraphCanvas 关联起来。
- `setCanvas(canvas)`：保存 canvas、创建离屏的 `bgcanvas`、获取 2D 上下文。
- `bindEvents()`：绑定滚轮、鼠标和 `contextmenu` 事件。
- `startRendering()`：用 `requestAnimationFrame` 持续调用 `draw()`。
- `draw()`：`ds.computeVisibleArea()` 计算可视区域 → `drawBackCanvas()` 绘制网格/背景 → `drawFrontCanvas()` 绘制节点、连线和选中框。

`drawFrontCanvas` 会先用 `ctx.drawImage(this.bgcanvas, 0, 0)` 画上离屏背景。绘制路径前要调用 `ctx.beginPath()`——它清空的是当前路径，不是画布内容。

### 缩放

滚轮事件调整 scale 后，以鼠标位置为缩放中心重绘：

1. 根据滚轮事件计算新的 scale。
2. `ctx.save()` 后设置 `ctx.scale(scale, scale)` 和 `ctx.translate(offsetX, offsetY)`。
3. 绘制离屏画布：`ctx.drawImage(this.bgcanvas, 0, 0)`。
4. `ctx.restore()` 恢复状态。

#### 为什么要 `save` / `restore`

`ctx.scale()` 会修改当前变换矩阵，而且会一直累积。每帧绘制前 `save()`、绘制后 `restore()`，下一次绘制才能重新从 `scale = 1` 开始；否则 scale 会按帧连乘：1 → 1.1 → 1.2 会变成 `1 * 1.1 * 1.2`，缩放速度越来越快。

#### 缩放原点

Canvas 的缩放原点默认为左上角 `(0, 0)`，没有直接修改原点的 API，需要配合 `translate` 实现。

若希望点 `(x, y)` 在缩放后保持不动，缩放比为 `n` 时，需要平移：

```text
(x / n - x, y / n - y)
```

推导：缩放后该点到达 `(nx, ny)`，要移回 `(x, y)`，需要平移 `(x - nx, y - ny)`；由于 `translate` 作用在缩放后的坐标系中，实际值还要再除以 `n`，即 `(x - nx) / n = x / n - x`。

在编辑器里，这段计算由 `DragAndScale.changeScale(value, [x, y])` 完成：分别算出缩放前后同一点对应的画布坐标，把差值累加到 `offset`。

### 拖拽

拖拽有两种常见实现：

1. 记录按下时的坐标 `a1(x1, y1)` 和当前坐标 `a2(x2, y2)`，每次把偏移设置为 `(x2 - x1, y2 - y1)`。
2. 记录上一次移动的坐标，每次把位移增量累加到偏移上。

```javascript
let offset = [0, 0]
let last_mouse = [x1, y1]

function onMove(x2, y2) {
  const delta = [x2 - last_mouse[0], y2 - last_mouse[1]]
  last_mouse = [x2, y2]
  // 方法 2：累加，因为 delta 是相对上一次移动的增量
  offset[0] += delta[0]
  offset[1] += delta[1]
}
```

拖拽元素时两种方法都可以：方法 1 适合从按下位置直接计算总位移，方法 2 适合增量更新。拖拽画布时通常用方法 2（或记录拖动起点时的偏移再计算总位移），因为画布每帧都从单位矩阵开始绘制，`translate` 是绝对值而不是增量：如果每次只把 `translate` 设为当前 delta，之前累积的位移会丢失，画布就会跳回原点。[错误示例](https://graph-three.vercel.app/test/drag/error.html) 展示了这个问题，[正确示例](https://graph-three.vercel.app/test/drag/index.html) 使用累加。

### 坐标系

屏幕坐标和画布坐标的换算关系为：

```text
worldX = screenX / scale - offsetX
worldY = screenY / scale - offsetY
```

拖拽画布时，位移差要先除以 `scale` 再累加：

```javascript
offset[0] += delta[0] / scale
offset[1] += delta[1] / scale
```

缩放时，要让鼠标下的画布坐标保持不变，可以先算缩放前后的画布坐标，再把差值累加到 `offset`：

```javascript
function toWorld([x, y], scale, offset) {
  return [x / scale - offset[0], y / scale - offset[1]]
}

const before = toWorld(pointer, oldScale, offset)
const after = toWorld(pointer, newScale, offset)
offset[0] += after[0] - before[0]
offset[1] += after[1] - before[1]
scale = newScale
```

绘制时统一先 `scale` 再 `translate`：

```javascript
ctx.save()
ctx.scale(scale, scale)
ctx.translate(offset[0], offset[1])
// 绘制内容
ctx.restore()
```

### 阻止右键默认菜单

`contextmenu` 事件中调用 `preventDefault()` 可以阻止浏览器自带的右键菜单；再配合 `mousedown` 关闭已经打开的菜单：

```javascript
root.addEventListener(
  "contextmenu",
  function (e) {
    if (e.button !== 2) {
      return false
    }
    e.preventDefault()
    return false
  },
  true
)

root.addEventListener("mousedown", function (e) {
  if (e.button === 2) {
    e.preventDefault()
    that.close()
  }
})
```

这里的 `root` 是菜单 DOM，`that` 指向菜单实例。完整实现见 `src/context_menu.mjs`，全局关闭菜单使用 `ContextMenu.closeAllContextMenus()`。

## 说明与限制

- 节点执行与数据流尚未接入，当前版本主要演示画布交互与渲染。
- `test/timeline` 等部分页面通过 CDN 加载 Vue、lodash 等脚本，需要联网。
- 仓库暂未声明开源许可证；如需复用代码，请先联系作者确认授权。
