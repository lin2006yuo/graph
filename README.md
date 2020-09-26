## canvas流程图

[preview](https://graph-8qv16umy2.vercel.app/)  
发育中...   

---
### mark

GraphCanvas(canvas, graph)
- graph.attachCanvas将graph和graphcanvas关联
- setCanvas导入canvas对象
- bindEvent
- startRending
- draw *requestAnimation持续绘制
- ds.computeVisibleArea 计算可视区域
- drawBackCanvas *网格
- drawFrontCanvase