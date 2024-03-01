<template>
  <div id="container" ref="container" @mouseup="mouseup">
    <audio ref="au" :src="meta.path" @durationchange="getDuration" @timeupdate="updateCurTime" @canplay="onplay" @ended="end" :muted="isMute"></audio>
    <div class="menu">
      <i class="bi bi-dash" @click="minimize"></i>
      <i class="bi bi-x" @click="quit"></i>
    </div> 
    <div class="info"> 
      <img ref="cover" :src="meta.cover ? meta.cover : this.defaultCover" id="cover" >
      <div class="text">
        <h1 >{{ meta.title }}</h1>
        <div class="artist" v-if="meta.artist">{{ meta.artist }}</div>
      </div>
      <div class="canvascontainer">
        <canvas ref="canvas"></canvas>
      </div>
    </div>  
    <div class="control">
      <div class="bar">
        <div class="time cur-time">{{ curTime }}</div>  
        <div ref="process" class="process" @mousedown="mousedown" @mouseover="showCircle" @mouseleave="hideCircle">
          <div ref="totalBar" class="total-bar">
            <div ref="curBar" class="cur-bar">
              <span ref="circle" class="circle" ></span>
            </div>
          </div>
        </div>
        <div class="time total-time">{{ time }}</div>
      </div>

      <div class="control-btn">
        <!-- 主题 -->
        <i v-if="theme=='light'" class="bi bi-moon-fill" @click="changeThemeToDark"></i>
        <i v-else class="bi bi-sun-fill" @click="changeThemeToLight"></i>
        <!-- 播放 -->
        <i v-if="isPlaying" class="bi bi-pause-fill" @click="onpause"></i>
        <i v-else class="bi bi-play-fill" @click="onplay"></i>
        <!-- 静音 -->
        <i v-if="!isMute" class="bi bi-volume-off-fill" @click="this.isMute = true"></i>
        <i v-else class="bi bi-volume-mute-fill" @click="this.isMute = false"></i>
      </div>
    </div>
    
    
    
  </div>
</template>

<script>
import {defaultCoverBase64} from '@renderer/assets/js/cover.js'

export default {
  components: {
  },
  created() {
    window.api.getInfo((info) => {
      console.log(info);
      this.meta.path = info.filePath
      this.meta.title = info.title || this.name
      this.meta.artist = info.artist || this.meta.artist
      this.meta.album = info.album  || this.meta.album
      this.meta.cover = info.picture || this.defaultCover
    })
  },

  mounted() {
    this.initWave()
    this.initCanvas()
    this.draw()
  },

  computed: {
    time() {
      return this.secTotime(Math.floor(this.duration))
    },
    name() {
      let arr = this.meta.path.split("\\")
      return arr[arr.length - 1].split(".")[0]
    }
  },
  methods: {
    //获取时长，单位s
    getDuration() {
      this.duration = this.$refs.au.duration
    },

    updateCurTime() {
      let s = Math.floor(this.$refs.au.currentTime)
      this.curTime = this.secTotime(s)

      let rate = (this.$refs.au.currentTime / this.duration).toFixed(8)
      this.$refs.curBar.style.width = rate * 100 + "%"
    },

    quit() {
      console.log("quit");
      window.api.quitApp()
    },

    minimize() {
      window.api.minimizeApp()
    },
    //秒转时:分:秒
    secTotime(s) {
      var t = '';
      if (s > -1) {
        var hour = Math.floor(s / 3600)
        var min = Math.floor(s / 60) % 60
        var sec = s % 60
        if (hour != 0) {
          if (hour < 10) {
            t = '0' + hour + ":"
          } else {
            t = hour + ":"
          }
        }
        if (min < 10) {
          t += "0"
        }
        t += min + ":"
        if (sec < 10) {
          t += "0"
        }
        t += sec
      }
      return t
    },

    onplay() {
      this.isPlaying = true
      this.$refs.au.play()
      this.$refs.cover.style.animationPlayState = "running"
    },

    onpause() {
      this.isPlaying = false
      this.$refs.au.pause()
      this.$refs.cover.style.animationPlayState = "paused"
      
    },

    initWave() {
      const audCtx = new AudioContext();
      const source = audCtx.createMediaElementSource(this.$refs.au);
      this.analyser = audCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.dataArray = new Uint8Array(512 / 2)
      source.connect(this.analyser);
      this.analyser.connect(audCtx.destination);
    },

    initCanvas() {
      this.canvas = this.$refs.canvas;     
      this.ctx = this.canvas.getContext('2d');
    },

    draw() {
      requestAnimationFrame(this.draw);
      const { width, height } = this.canvas
      this.ctx.clearRect(0, 0, width, height)

      this.analyser.getByteFrequencyData(this.dataArray)
      const len = this.dataArray.length / 2
      if (this.theme == "dark") {
        this.ctx.fillStyle = '#ecf0f1' 
      } else {
        this.ctx.fillStyle = '#222222'
      }
      for (let i = 6; i < len; i+=12) {
        const data = this.dataArray[i]
        const barWidth = width / len
        const barHeight = data / 256 * height
        // const x = i * barWidth
        const x1 = i * barWidth + width / 2
        const x2 = width / 2 - (i + 1) * barWidth
        const y = height - barHeight 
        
        if (x1 <= width && x2 >= 0) {
          this.ctx.beginPath()
          this.ctx.roundRect(x1, y, barWidth + 10, barHeight, 10)
          this.ctx.roundRect(x2, y, barWidth + 10, barHeight, 10)
          this.ctx.fill()
        }
      }   
    },

    mousedown(event) {
      this.$refs.container.addEventListener('mousemove', this.mousemove)
      this.changTime(event.clientX)
    },
    mousemove(event) {
      this.changTime(event.clientX)
    },
    mouseup() {
      this.$refs.container.removeEventListener('mousemove', this.mousemove)
    },

    changTime(offsetX) {
      let padding = (this.$refs.container.offsetWidth - this.$refs.totalBar.offsetWidth) / 2
      let rate = (offsetX - padding) / this.$refs.totalBar.offsetWidth;
      rate = rate > 1 ? 1 : rate < 0 ? 0 : rate;

      this.$refs.au.currentTime = rate * this.duration - 0.1;
    },

    showCircle() {
      this.$refs.circle.style.opacity = 1
    },

    hideCircle() {
      this.$refs.circle.style.opacity = 0
    },

    end() {
      this.onpause()
    },

    changeThemeToDark() {
      this.theme = 'dark'
      document.documentElement.setAttribute('theme', this.theme)
    },

    changeThemeToLight() {
      this.theme = 'light'
      document.documentElement.setAttribute('theme', this.theme)
    },

    // fillRoundRect(ctx, x, y, width, height, radius, color) {
    //   ctx.save()
    //   ctx.beginPath()
    //   ctx.moveTo(x + radius, y)
    //   ctx.lineTo(x + width - radius, y)
    //   ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    //   ctx.lineTo(x + width, y + height - radius)
    //   ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      
    // }
  },

  data() {
    return {
      isPlaying: false,
      meta: {
        artist: "",
        title: "",
      },
      duration: 0,
      curTime: "00:00",
      defaultCover: defaultCoverBase64,
      analyser: null,
      dataArray: null,
      canvas: null,
      ctx: null,
      chaning: false,
      isMute: false,
      theme: "dark",
    }
  }
}
</script>

<style lang="scss" scoped>
#container{
  .menu{
    position: absolute;
    top: 10px;
    right: 10px;
  }
  color:var(--text-color);
  position:relative;
  // background: linear-gradient(to right bottom, #f3f3f3f9,#d7d7d7f9);
  background-color: var(--container-bg);
  border-radius: 10px;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  i{
    color:var(--icon-color);
    margin:0 5px;
    transition:0.4s;
    &:hover{
      color: var(--text-color);
    }
  }

  .time{
    font-family:Arial, Helvetica, sans-serif;
  }

  .info{
    margin-top: 10px;
    width:88%;
    height: 70%;
    display: flex;
    flex-direction: row;
    justify-content:flex-start;
    align-items: center;
    img{
      width: 80px;
      height: 80px;
      border-radius: 50%;
      animation: rotate 15s linear infinite;
      box-shadow: 0 0 15px var(--shadow-color);
    }
    @keyframes rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .text{
      padding:15px;
      width:35%;
      height:70%;
      font-size: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      h1{
        font-family: '得意黑';
      }
      .artist{
        font-family: '阿里巴巴普惠体';
        margin-top: 3px;
      }
    }
    .canvascontainer{
      width: 40%;
      height:70px;
      position: relative;
      canvas{
        position:absolute;
        left: 0;
        bottom: 0;
        width:150px;
        height: 60px;
      }
    }
  }

  .control{
    width:90%;
    .bar{
    height:30px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    .time{
      font-size: 14px;
      color: var(--text-color);
    }
    .process {
      width:100%;
      height:15px;
      display: flex;
      justify-content: center;
      align-items: center;
      .total-bar{
        width: 90%;
        height:5px;
        position: relative;
        background-color: var(--process-bar-bg);
        border-radius: 3px; 
        .cur-bar{
          width:50%;
          height:100%;
          background-color: var(--cur-bar-bg);
          position: relative;
          left:0;
          top:0;
          border-radius: 3px;
          .circle{
            width:12px;
            height:12px;
            background-color: var(--cur-bar-bg);
            border-radius: 50%;
            position: absolute;
            right:-6px;
            top:-3px;
            opacity: 0;
            transition: 0.2s;
            &:hover{
              opacity: 1;
            }
          }
        }
      }
    
    }
    }  
    .control-btn{
      height:50%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .bi-play-fill, .bi-pause-fill{
        font-size: 40px;
      }
      .bi-volume-off-fill, .bi-volume-mute-fill{
        font-size: 25px;
      }
    }
  }
}
</style>s