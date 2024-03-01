export default class MetaData {
  constructor(title, artist, album, picture) {
    this.title = title
    this.artist = artist
    this.album = album
    this.picture = picture
  }
  getTitle() {
    return this.title
  }
  getArtist() {
    return this.artist
  }
  getAlbum() {
    return this.album
  }
  getPicture() {
    return this.picture
  }
}
