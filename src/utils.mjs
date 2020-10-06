export function overlapBounding(a, b) {
  var A_end_x = a[0] + a[2]
  var A_end_y = a[1] + a[3]
  var B_end_x = b[0] + b[2]
  var B_end_y = b[1] + b[3]

  if (a[0] > B_end_x || a[1] > B_end_y || A_end_x < b[0] || A_end_y < b[1]) {
    return false
  }
  return true
}

// 是否点击到node放大区域
export function isInsideRectangle(x, y, left, top, width, height) {
  if (left < x && left + width > x && top < y && top + height > y) {
      return true;
  }
  return false;
}
