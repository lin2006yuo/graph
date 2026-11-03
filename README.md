## 本地运行

本项目是原生 HTML + CSS + ES Module 的静态站点：浏览器直接加载源码，没有打包、编译步骤。

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

没有构建步骤，也不需要生成产物：源码即部署文件，把仓库根目录作为静态站点根目录部署即可。现有 demo 部署在 Vercel 上（见下文 demo 链接）。

## 目录说明

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

---

### 郁金香 [demo](https://graph-three.vercel.app/test/tulipa/index.html)
---

### 时间轴 [Timeline](https://graph-three.vercel.app/test/timeline/index2.html)
---
### 选择框 [demo](https://graph-three.vercel.app/test/matrix/index.html)  
基本版本 [demo](https://graph-three.vercel.app/test/matrix/index-basic.html)   
拖拽版本 [demo](https://graph-three.vercel.app/test/matrix/index-gesture.html) 
> 矩阵变换


---
### Jelly Effect
ball [demo](https://graph-three.vercel.app/example/balls/index.html)    
粘体 [demo](https://graph-three.vercel.app/example/balls/slime/index.html)  

---
  

## 流程图

[preview](https://graph.lin2006yuo.vercel.app/)  
~~发育中...~~(2021.1.10 太监了)  
**bg**  
zoom - done  
drag - done  
menu - done  
node  
1. 创建 - done
2. 拖拽 - done
3. 缩放 - done

---

## mark

GraphCanvas(canvas, graph)

- graph.attachCanvas 将 graph 和 graphcanvas 关联
- setCanvas 导入 canvas 对象
- bindEvent
- startRending
- draw \*requestAnimation 持续绘制
- ds.computeVisibleArea 计算可视区域
- drawBackCanvas \*网格
- drawFrontCanvase  
  ⚠

1. beginPath 清除 path

### 缩放 [demo](https://graph-three.vercel.app/test/scale/index.html)

使用 ctx.dragImage(canvas, 0, 0), 具体流程：

1. 根据滚轮事件调整 scale 大小
2. 设置 canvas 的 scale `ctx.scale(scale, scale)`, 设置 canvas`translate(offsetX, offsetY)`
3. 绘制`ctx.dragImage(canvas, 0, 0)`

#### **ctx.save**

注意在绘制前需要`ctx.save()`存储当前状态，绘制后再重置`ctx.restore()`。因为`scale`的变化都是基于初始状态，也就是`scale = 1`，如果不重置，那么下一次`scale`变化就是基于上一次的`scale`变化，会导致`scale`过快的情况。  
举例： `scale`变化情况为 1 -> 1.1. -> 1.2 -> 1.3 -> 1.4，第一次`scale`后的大小为`1 * 1.1`，第二次`scale`的大小正确应该为`1 * 1.2`，如果不重置当前状态，那么第二次`scale`大小为`1.1 * 1.2`❌

#### **scale-origin**

canvas 缩放原点 scale-origin 默认为左上角(0,0)，在缩放的时候需要转换原点，canvas 没有提供 api，可通过 translate 实现。  
eg: 设起始点为 a1(x, y), 缩放比为 n, 则缩放后的点为 a2(nx, ny)  
可知: x 轴偏移值为`x - nx`，y 轴偏移的位置值为`y- ny`，（先缩放再偏移，原因比较复杂）由于做了缩放，实际上求出来的偏移值是经过缩放的，所以需要再除以 n  
最终解: x -> (x - nx)/n = `x/n - x`  
 y -> (y - ny)/n = `y/n -y`

### 拖拽 [demo](https://graph-three.vercel.app/test/drag/index.html)

**拖拽两种实现方式**

1. 记录点击时坐标 a1(x1, y1)，移动后的坐标 a2(x2, y2), 得出偏移值(x2 - x1, y2 - y1), 将元素坐标设置为偏移值

```javascript
let offset = [0, 0]
let down_mouse = [x1, y1]
let cur_mouse = [x2, y2]

let delta = [x2 - x1, y2 - y1]

offset[0] = delta[0]
offset[1] = delta[1]
```

2. 上一次移动时的坐标 a1(x1, y1), 移动后的坐标 a2(x2, y2), 得出偏移值(x2 - x1, y2 - y1), 将元素坐标**累加**偏移值

```javascript
let offset = [0, 0]
let last_mouse = [x1, y1]
let cur_mouse = [x2, y2]

let delta = [x2 - x1, y2 - y1]
// 刷新上次移动时的坐标
last_mouse[0] = cur_mouse[0]
last_mouse[1] = cur_mouse[1]
// 累加， 因为偏移值是根据上一次状态
offset[0] += delta[0]
offset[1] += delta[1]
```
**拖拽对象**  
1. 元素  
方法1、方法2
2. 画布  
拖拽画布通过`translate`方法实现，由于`translate`的转换原点`translate-origin`固定为canvas左上角(0,0)，如果用方法1实现拖拽，第二次拖拽会出现不符合预期的结果❌[demo](https://graph-three.vercel.app/test/drag/error.html)，原因是第二次拖拽转换原点应该为上一次`translate`的值， 但在这里转换原点始终为(0,0)，第二次拖拽转换原点应该为上一次`translate`的值。  
∴画布拖拽使用方法2，[demo](https://graph-three.vercel.app/test/drag/index.html)  

### 坐标系 [demo](https://graph-three.vercel.app/test/coord/index.html)

1. 拖拽  
拖拽`方法二`的位移差除以`scale`再累加
```javascript
let offset = [0, 0]
let last_mouse = [x1, y1]
let cur_mouse = [x2, y2]

let delta = [x2 - x1, y2 - y1]
// 刷新上次移动时的坐标
last_mouse[0] = cur_mouse[0]
last_mouse[1] = cur_mouse[1]
// 累加， 因为偏移值是根据上一次状态
// delta除以scale再做累加
offset[0] += delta[0] / scale
offset[1] += delta[1] / scale

// draw
ctx.scale(scale, scale)
ctx.translate(offset[0], offset[1])
```
2. 缩放  
前后两次缩放的值除以`scale`再减`translate`，然后做差累加
```javascript
let _scale = 1
function pos(pos) {
    let out = [0,0]
    out[0] = pos[0] / _scale - translate[0]
    out[1] = pos[1] / _scale - translate[1]
    return out
}

old_local = pos([x, y])
_scale = new_scale
new_local = pos([x, y])
let delta = [
    new_local[0] - old_local[0], 
    new_local[1] - old_local[1]
]
offset[0] += delta[0]
offset[1] += delta[1]

// draw
ctx.scale(scale, scale)
ctx.translate(offset[0], offset[1])
```

### 阻止右键默认菜单
`mouseup` `contextmenu` `mousedown` 配合使用
``` javascript
root.addEventListener(
    "mouseup",
    function (e) {
        e.preventDefault();
        return true;
    },
    true
);
root.addEventListener(
    "contextmenu",
    function (e) {
        // e.button === 2右键
        if (e.button !== 2) {
            return false;
        }
        e.preventDefault();
        return false;
    },
    true
);

root.addEventListener(
    "mousedown",
    function (e) {
        if (e.button === 2) {
            that.close();
            e.preventDefault();
            return true;
        }
    },
    true
);
```