class ContextMenu {
  static closeAllContextMenus(ref_window) {
    ref_window = ref_window || window
    
    let elements = ref_window.document.querySelectorAll('.contextmenu')
    
    if(!elements.length) return

    let result = []
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      result.push(element)
    }
    
    for (let i = 0; i < result.length; i++) {
      const element = result[i];
      element.parentNode.removeChild(element)
    }
  }

  constructor(menu_info, options) {
    // [
    //   {
    //     content: "添加节点",
    //     has_submenu: true,
    //     callback: GraphCanvas.onMenuAdd,
    //   },
    // ]
    this.menu_info = menu_info
    // event: event,
    // callback: inner_option_clicked,
    // extra: node 
    this.options = options

    let that = this
    if(options.parentMenu) {
      this.parentMenu = options.parentMenu
      this.parentMenu.lock = true
      this.parentMenu.current_submenu = this
    }
    
    let eventClass = null
    if(options.event) {
      eventClass = options.event.constructor.name
    }

    let root = document.createElement('div')
    root.className = 'graph contextmenu menubar-panel'
    if(options.className)
      root.className += " " + options.className
    root.style.minWidth = 100
    root.style.minHeight = 100
    root.style.pointerEvents = 'none'
    setTimeout(() => {
      root.style.pointerEvents = 'auto'
    }, 300);

    this.root = root

    for(let i = 0; i< menu_info.length; i++) {
      let value = menu_info[i]
      let name = value.content
      this.addItem(name, value, options)
    }

    let root_document = document
    if(options.event) {
      root_document = options.event.target.ownerDocument
    }
    root_document.body.appendChild(root)

    let left = 0
    let top = 0
    if(options.event) {
      left = options.event.clientX - 10
      top = options.event.clientY - 10

      if(options.parentMenu) {
        let rect = options.parentMenu.root.getBoundingClientRect()
        left = rect.width + rect.left
      }

      let body_rect = document.body.getBoundingClientRect()
      let root_rect = root.getBoundingClientRect()
    }
    
    root.style.left = left + 'px'
    root.style.top = top + 'px'
  }

  addItem(name, value, options) {
    // {"name":"添加节点","value":{"content":"添加节点","has_submenu":true}}
    let that = this
    options = options || {}

    let element = document.createElement('div') 
    element.className = 'menu-entry submenu'

    let disabled = false
  
    element.innerHTML = name
    element.value = value
    
    if(value) {
      if(value.has_submenu) {
        element.classList.add('has_submenu')
      }
    }

    if(!disabled) {
      element.addEventListener('click', inner_onclick)
    }

    // 插入子元素
    this.root.appendChild(element)

    function inner_onclick(e) {
      value = this.value
      if(that.current_submenu) {
        that.current_submenu.close(e)
      }

      if(options.callback) {
        // 目前没做什么
        let r = options.callback.call(this, value, options,e, that, options.node)  // inner_option_clicked 
      }

      // 选项二
      if(value) {
        if(value.callback) {
          let r = value.callback.call(this, value, options, e, that, options.extra) // onAdd
        }
      }
    }

    return element
  }

  close(e) {
    if(this.root.parentNode) {
      this.root.parentNode.removeChild(this.root)
    }
  }

  getFirstEvent() {
    if(this.options.parentMenu) {
      return this.options.parentMenu.getFirstEvent()
    }
    return this.options.event
  }
}


export default ContextMenu