class Dep {
  static vm = null
  constructor() {
    Dep.vm = this
    this.subs = []
  }
  addSub(wt) {
    this.subs.push(wt)
  }
  notify() {
    this.subs.forEach((sub) => sub.update())
  }
}

class Watcher {
  constructor(vm, expr, text, cb, isArray, index) {
    this.vm = vm
    this.expr = expr
    this.isArray = isArray
    this.cb = cb
    this.index = index
    this.text = text

    Dep.vm.addSub(this)

    this.oldValue = this.getValue()
  }

  getValue() {
    return this.isArray
      ? this.vm.$data[this.expr][this.index]
      : this.vm.$data[this.expr]
  }

  update() {
    let oldValue = this.oldValue
    let newValue = this.getValue()
    if (oldValue != newValue) {
      let reg = /\{\{(.+)\}\}/g
      const newText = this.text.replace(reg, newValue)
      this.cb(newText, oldValue)
    }
  }
}

class MiniVue {
  static vm = null
  static observe = function (value) {
    return new Proxy(value, {
      get: function (target, propKey, receiver) {
        return Reflect.get(target, propKey)
      },
      set: (target, propKey, value) => {
        Reflect.set(target, propKey, value)
        if (this.vm) {
          this.vm.dep.notify()
        }
        return true
      },
    })
  }
  static proxy = function (key, value) {
    this.vm.$data[key] = MiniVue.observe(value)
    this.vm.init()
    return this.vm.$data[key]
  }
  constructor(el) {
    MiniVue.vm = this
    this.$el = document.querySelector(el)
    this.$data = {
      // translate: [1,2],
      test: "测试",
    }
    this.dep = new Dep()

    this.init()
  }

  init() {
    this.$data = MiniVue.observe(this.$data)

    let fragment = this.toFragment()

    this.compile(fragment)

    this.$el.appendChild(fragment)
  }

  toFragment() {
    let fragment = document.createDocumentFragment()
    let childNodes = this.$el.childNodes
    this.toArray(childNodes).forEach((item) => {
      fragment.appendChild(item)
    })
    return fragment
  }

  compile(fragment) {
    let childNodes = fragment.childNodes
    this.toArray(childNodes).forEach((node) => {
      if (this.isElementNode(node)) {
        this.compileElement(node)
      } else if (this.isTextNode(node)) {
        this.compileText(node)
      }
    })
  }

  compileElement(node) {
    this.compile(node)
  }

  compileText(node) {
    let text = node.textContent
    if (text) {
      let reg = /\{\{(.+)\}\}/
      if (reg.test(text)) {
        let expr = RegExp.$1
        let arrReg = /(.+)\[(.+)\]/
        if (arrReg.test(expr)) {
          let $1 = RegExp.$1
          let $2 = RegExp.$2
          if (this.$data[$1]) {
            node.textContent = text.replace(reg, this.$data[$1][$2])
            new Watcher(
              this,
              $1,
              text,
              (newValue, oldValue) => {
                node.textContent = newValue
              },
              true,
              $2
            )
          }
        } else {
          node.textContent = text.replace(reg, this.$data[expr])
          new Watcher(this, expr, (newValue, oldValue) => {
            node.textContent = newValue
          })
        }
      }
    }
  }

  toArray(likeArray) {
    return [].slice.call(likeArray)
  }
  isElementNode(node) {
    return node.nodeType === 1
  }
  isTextNode(node) {
    return node.nodeType === 3
  }
}
