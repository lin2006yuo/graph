function proxy(data) {
  return new Proxy(data, {
    set: function(target, propKey, value) {
      console.log({
        target, propKey, value
      })
      return Reflect.set(target, propKey, value)
    }
  })
}