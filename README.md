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

### 郁金香 [demo](https://graph-three.vercel.app/test/tulipa/index.html)
> ctx.transform 变换矩阵

### 时间轴 [Timeline](https://graph-three.vercel.app/test/timeline/index2.html)
> 这是我的五一劳动节
