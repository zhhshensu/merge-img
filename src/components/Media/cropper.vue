<template>
  <!-- 图片裁剪 -->
  <el-dialog title="图片剪裁" width="1000px" v-model="show" :before-close="closeCropper">
    <div class="cropper-content">
      <div class="cropper">
        <h3>裁剪区域</h3>
        <vueCropper v-if="show" ref="cropper" :img="opts.img" :outputSize="opts.outputSize"
          :outputType="opts.outputType" :full="opts.full" :canMove="opts.canMove" :canScale="opts.canScale"
          :canMoveBox="opts.canMoveBox" :original="opts.original" :autoCrop="opts.autoCrop" :centerBox="opts.centerBox"
          :fixedBox="opts.fixedBox" :fixed="opts.fixed" :fixedNumber="opts.fixedNumber"
          :auto-crop-width="opts.autoCropWidth" :auto-crop-height="opts.autoCropHeight" :high="opts.high"
          :infoTrue="opts.infoTrue" :enlarge="opts.enlarge" @realTime="realTime" @cropMoving="cropMoving"></vueCropper>
      </div>
      <div class="real-time-box">
        <h3>裁剪预览</h3>
        <div class="real-time-outer" :style="{
          width: calViewBox.width + 'px',
          height: calViewBox.height + 'px'
        }">
          <el-image v-if="cropperViewInfo.template && cropperViewInfo.template.url" :src="cropperViewInfo.template.url"
            lazy />
          <div class="real-time-inner" :style="{
            width: calDashedBoxStyle.width + 'px',
            height: calDashedBoxStyle.height + 'px',
            top: calDashedBoxStyle.top + 'px',
            left: calDashedBoxStyle.left + 'px',
          }">
            <div class="text">红色框线内为头像放置区</div>
            <div :style="calZoomViewBox" class="avatar-box">
              <img v-if="realPreview.url" :src="realPreview.url" :style="realPreview.img" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button size="small" type="primary" @click="rotateLeft">左转</el-button>
        <el-button size="small" type="primary" @click="rotateRight">右转</el-button>
        <el-button size="small" type="primary" @click="finish" :loading="cropperloading">确认</el-button>
        <el-button size="small" @click="clearCropper">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
const VIEW_MAX_W = 340
const VIEW_MAX_H = 500

export default {
  name: 'media-cropper',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    option: {
      type: Object,
      default: () => { }
    },
    cropperViewInfo: {
      type: Object,
      default: () => { }
    }
  },
  data() {
    return {
      cropperVisible: false,
      previewVisible: false,
      // 裁剪组件的基础配置option
      defaultOpts: {
        img: '', // 裁剪图片的地址
        outputSize: 1, // 裁剪生成图片的质量
        outputType: 'jpeg', // 裁剪生成图片的格式
        canScale: true,
        canMove: true,
        original: false, // 上传图片按照原始比例渲染
        canMoveBox: false,
        autoCrop: true,
        // 只有自动截图开启 宽度高度才生效
        // autoCropWidth: 128,
        // autoCropHeight: 128,
        centerBox: false,
        cropData: {},
        high: true,
        fixedBox: true,
        fixed: false, // 是否开启截图框宽高固定比例
        fixedNumber: [1, 1], // 截图框的宽高比例
        full: false, // 是否输出原图比例的截图
        infoTrue: false, // true 为展示真实输出图片宽高 false 展示看到的截图框宽高
        enlarge: 1
      },
      cropperloading: false,
      realPreview: {
        img: {},
        url: '',
        w: 0,
        h: 0,
      }
    }
  },
  computed: {
    opts() {
      return Object.assign(this.defaultOpts, this.option)
    },
    calZoomViewBox() {
      const { width } = this.calDashedBoxStyle
      const { autoCropWidth } = this.opts
      const zoom = width / autoCropWidth
      return {
        zoom
      }
    },
    calViewBox() {
      const { template } = this.cropperViewInfo
      if (template && template.width && template.height) {
        const ratio = template.width / template.height
        const maxRatio = VIEW_MAX_W / VIEW_MAX_H
        if (ratio < 1) {
          if (maxRatio >= ratio) {
            return {
              width: VIEW_MAX_H * ratio,
              height: VIEW_MAX_H,
            }
          }
          return {
            width: VIEW_MAX_W,
            height: VIEW_MAX_W / ratio,
          }
        }
        return {
          width: VIEW_MAX_W,
          height: VIEW_MAX_W / ratio,
        }
      }
      return {
        width: 0,
        height: 0
      }
    },
    calDashedBoxStyle() {
      const { width } = this.calViewBox
      const { template, bodypp } = this.cropperViewInfo
      if (template && template.width && template.height) {
        if (bodypp && bodypp.width && bodypp.height) {
          return {
            width: bodypp.width / template.width * width,
            height: bodypp.height * width / template.width,
            top: bodypp.y * width / template.width,
            left: bodypp.x / template.width * width
          }
        }
      }
      return {}
    }
  },
  methods: {
    convertBase64UrlToBlob(urlData) {
      let bytes = window.atob(urlData.split(',')[1]) //去掉url的头，并转换为byte
      //处理异常,将ascii码小于0的转换为大于0
      let ab = new ArrayBuffer(bytes.length)
      let ia = new Uint8Array(ab)
      for (var i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i)
      }
      return new Blob([ab], { type: 'image/png' })
    },
    showCropper(params) {
      this.cropperVisible = true
      Object.assign(this.option, params)
    },
    clearCropper() {
      this.$emit('clear')
    },
    closeCropper() {
      this.$emit('close')
    },
    rotateLeft() {
      this.$refs.cropper.rotateLeft()
    },
    rotateRight() {
      this.$refs.cropper.rotateRight()
    },
    realTime(data) {
      Object.assign(this.realPreview, data || {})
    },
    cropMoving(cropData) {
      this.cropData = cropData
    },
    // 点击裁剪，这一步是可以拿到处理后的地址
    finish() {
      this.$refs.cropper.getCropData(data => {
        this.$refs.cropper.clearCrop()
        let blobImg = this.convertBase64UrlToBlob(data)
        const { picMemorySize } = this.cropperViewInfo
        const Gt = (picMemorySize && picMemorySize.maxSize) || 10
        const isGt = blobImg.size / 1024 / 1024 < Gt
        console.log('裁剪后图片大小', blobImg.size / 1024 / 1024 + 'MB')
        if (!isGt) {
          this.$message.error(`上传文件大小不能超过 ${Gt}MB!`)
        } else {
          this.$emit('finish', {
            blobImg,
            originalData: data
          })
        }
      })
    }
  }
}
</script>

<style lang="scss">
.cropper-content {
  display: flex;

  h3 {
    padding: 10px 0;
  }

  .cropper {
    width: 600px;
    height: 500px;
    margin-right: 20px;
  }

  .real-time-box {
    width: 340px;

    .real-time-outer {
      position: relative;

      img {
        display: inline-block;
        width: 100%;
      }

      .text {
        position: absolute;
        top: -20px;
        left: 50%;
        width: 180px;
        height: 20px;
        font-size: 14px;
        color: red;
        text-align: center;
        margin-left: -90px;
      }

      .real-time-inner {
        position: absolute;
        background: rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
        border: 1px dashed red;

        .avatar-box {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
      }
    }
  }
}
</style>
