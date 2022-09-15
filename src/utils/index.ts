export const loadImage = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // 判断图片是否是base64
    let s = url.substring(0, 4)
    if (s !== 'data') {
      img.setAttribute('crossOrigin', 'anonymous')
    }
    console.log('img', img)
    img.onerror = () => {
      window.URL.revokeObjectURL(url)
      reject(new Error('图片加载失败,地址：' + url))
    }
    img.onload = () => {
      window.URL.revokeObjectURL(url)
      resolve(img)
    }
    img.src = url
  })
}
