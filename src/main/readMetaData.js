const jmt = require('jsmediatags')
import MetaData from './metaData.js'

function md(filePath) {
  return new Promise((resolve, reject) => {
    jmt.read(filePath, {
      onSuccess: function (tag) {
        let coverSrc
        if (tag.tags.picture) {
          const { data, format } = tag.tags.picture
          coverSrc = getCoverSrcBase64(data, format)
        } else {
          coverSrc = undefined
        }

        const mdata = new MetaData(tag.tags.title, tag.tags.artist, tag.tags.album, coverSrc)
        resolve(mdata)
      },
      onError: function (err) {
        reject()
      }
    })
  })
}

async function getMetaDataAsync(filePath) {
  return await md(filePath)
}

//图片转base64
function getCoverSrcBase64(data, format) {
  let base64String = ''
  for (let i = 0; i < data.length; i++) {
    base64String += String.fromCharCode(data[i])
  }
  return `data:${format};base64,${btoa(base64String)}`
}

export { getMetaDataAsync }
