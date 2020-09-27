## canvas流程图

[preview](https://graph.lin2006yuo.vercel.app/)  
发育中...   

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

### Zoom 缩放

使用ctx.dragImage(canvas, 0, 0), 具体流程：  
1. 根据滚轮事件调整scale大小
2. 设置canvas的scale `ctx.scale(scale, scale)`
3. 绘制`ctx.dragImage(canvas, 0, 0)`  
注意在绘制前需要`ctx.save()`存储当前状态，绘制后再重置`ctx.restore()`。因为`scale`的变化都是基于初始状态，也就是`scale = 1`，如果不重置，那么下一次`scale`变化就是基于上一次的`scale`变化，会导致`scale`过快的情况。  
举例： `scale`变化情况为1 -> 1.1. -> 1.2 -> 1.3 -> 1.4，第一次`scale`后的大小为`1 * 1.1`，第二次`scale`的大小正确应该为`1 * 1.2`，如果不重置当前状态，那么第二次`scale`大小为`1.1 * 1.2`❌