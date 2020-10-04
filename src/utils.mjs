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
