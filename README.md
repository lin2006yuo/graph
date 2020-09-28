## canvas流程图

[preview](https://graph.lin2006yuo.vercel.app/)  
发育中...  
**bg**   
zoom - done  
drag - done

---
## mark

GraphCanvas(canvas, graph)
- graph.attachCanvas将graph和graphcanvas关联
- setCanvas导入canvas对象
- bindEvent
- startRending
- draw *requestAnimation持续绘制
- ds.computeVisibleArea 计算可视区域
- drawBackCanvas *网格
- drawFrontCanvase    
⚠  
1. beginPath 清除 path

### Zoom 缩放 [demo](https://graph-three.vercel.app/test/scale/index.html)

使用ctx.dragImage(canvas, 0, 0), 具体流程：  
1. 根据滚轮事件调整scale大小
2. 设置canvas的scale `ctx.scale(scale, scale)`, 设置canvas`translate(offsetX, offsetY)`
3. 绘制`ctx.dragImage(canvas, 0, 0)`  
#### **ctx.save**  
注意在绘制前需要`ctx.save()`存储当前状态，绘制后再重置`ctx.restore()`。因为`scale`的变化都是基于初始状态，也就是`scale = 1`，如果不重置，那么下一次`scale`变化就是基于上一次的`scale`变化，会导致`scale`过快的情况。  
举例： `scale`变化情况为1 -> 1.1. -> 1.2 -> 1.3 -> 1.4，第一次`scale`后的大小为`1 * 1.1`，第二次`scale`的大小正确应该为`1 * 1.2`，如果不重置当前状态，那么第二次`scale`大小为`1.1 * 1.2`❌
#### **scale-origin**  
canvas缩放原点scale-origin默认为左上角(0,0)，在缩放的时候需要转换原点，canvas没有提供api，可通过translate实现。  
eg: 设起始点为a1(x, y), 缩放比为n, 则缩放后的点为a2(nx, ny)  
可知: x轴偏移值为`x - nx`，y轴偏移的位置值为`y- ny`，（先缩放再偏移，原因比较复杂）由于做了缩放，实际上求出来的偏移值是经过缩放的，所以需要再除以n  
最终解: x -> (x - nx)/n = `x/n - x`  
        y -> (y - ny)/n = `y/n -y`
  
