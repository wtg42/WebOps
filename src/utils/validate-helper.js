/**
 * 檢查 IP 是否正確
 * @param {Stirng} ip
 * @returns {boolean}
 */
export function validateIP(ip) {
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  if (ipPattern.test(ip)) {
    const segments = ip.split('.')

    // 檢查每個段是否介於 0 到 255 之間
    return segments.every(segment => {
      const num = parseInt(segment, 10)
      return num >= 0 && num <= 255
    })
  }
  return false
}