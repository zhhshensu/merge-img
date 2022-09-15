<template>
  <div class="building-ad-media">
    <el-card class="media-wrap" shadow="never" v-if="!verifyInfo.verifyStatus">
      <div class="media-wrap-header">
        <h3 class="clearfix">
          <i class="el-icon-warning"></i>
          <span>{{ verifyInfo.verifyResult }}</span>
        </h3>
      </div>
    </el-card>
    <div class="media-wrap" v-else>
      <div class="media-wrap-header">
        <h3 class="clearfix">
          <i class="el-icon-warning"></i>
          请上传您的个人形象照片用于电梯广告报买
        </h3>
        <!-- <el-form :inline="true" :model="filters">
          <el-form-item label="广告类型">
            <el-select v-model="filters.advertType" placeholder="请选择" multiple>
              <el-option v-for="item in advertTypeList" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getUserPics()">查询</el-button>
          </el-form-item>
        </el-form> -->
      </div>
      <div class="media-wrap-body" v-loading="initLoading">
        <section>
          <el-form label-position="top">
            <el-form-item v-for="(p, index) in mediaList" :key="p.templateId">
              <div>
                <h3 class="title">{{ p.templateName }}</h3>
                <h5>
                  上传图片格式为
                  <span>特定背景的肖像照</span>，大小{{ p.picMemorySize && p.picMemorySize.minSize }}M以上，{{
                  p.picMemorySize && p.picMemorySize.maxSize }}M以，点击图片可查看大图
                </h5>
                <span class="pic-uploader">
                  <el-button style="margin-left: 10px;" type="primary" @click="emitUpload(p, index)">选取文件</el-button>
                  <input type="file" class="img-uploader" ref="imginput" style="display: none" :disabled="p.uploading"
                    @change="changeUpload(p, index)" />
                </span>
                <div class="template-wrap" v-loading="p.mergeLoading || p.uploading"
                  :element-loading-text="transLoadingText(p)" element-loading-spinner="el-icon-loading"
                  element-loading-background="rgba(245, 245, 245, 1)">
                  <div class="left clearfix">
                    <div class="image-item user-image">
                      <span class="subtitle">您的肖像<span></span></span>
                      <div :style="calUploadStyle(p.userPicW, p.userPicH)" class="media">
                        <el-image v-if="p.userPicUrl" :ref="'uploadPreview' + index" class="image" :src="p.userPicUrl"
                          :preview-src-list="[p.userPicUrl]" lazy></el-image>
                        <div v-else class="error">暂无图片</div>
                      </div>
                    </div>
                    <div class="image-item merge-image">
                      <span class="subtitle">您的预览图<span></span></span>
                      <div class="media" v-loading="p.mergeLoading || p.uploading"
                        :element-loading-text="transLoadingText(p)" element-loading-spinner="el-icon-loading"
                        element-loading-background="rgba(245, 245, 245, 1)" :style="
                          calMergeLoadingStyle(
                            p.templateWidth,
                            p.templateHeight
                          )
                        ">
                        <transition name="el-zoom-in-top">
                          <el-image v-if="p.halfPicUrl" :src="p.halfPicUrl" :preview-src-list="[p.halfPicUrl]" lazy>
                          </el-image>
                        </transition>
                        <div v-if="!(p.userPicUrl && p.halfPicUrl)" class="error" :style="
                          calErrorStyle(
                            p.templateWidth,
                            p.templateHeight
                          )
                        ">暂无图片</div>
                        <div class="error" :style="
                          calErrorStyle(
                            p.templateWidth,
                            p.templateHeight
                          )
                        " v-if="p.linkFace && !p.halfPicUrl && p.mergeSuccess">
                          合成图失败，请
                          <el-button type="text" @click="refreshMerge(index)">刷新</el-button>重试
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="right clearfix">
                    <!-- <div class="image-item template-image">
                      <span class="subtitle">示例图</span>
                      <div class="media" :style="
                        calUploadStyle(
                          p.templateWidth,
                          p.templateHeight
                        )
                      ">
                        <el-image v-if="p.exampleUrl" class="image" :src="p.exampleUrl" :preview-src-list="[p.exampleUrl]"
                          lazy></el-image>
                        <div v-else class="error">暂无图片</div>
                      </div>
                    </div> -->
                    <!-- <div class="image-item real-image">
                      <span class="subtitle">实际效果图</span>
                      <div class="media" :style="
                          calUploadStyle(
                            p.templateWidth,
                            p.templateHeight
                          )
                        ">
                        <el-image
                          v-if="p.realResultUrl"
                          class="image"
                          :src="p.realResultUrl"
                          :preview-src-list="[p.exampleUrl]"
                        ></el-image>
                        <div
                          v-else
                          class="error"
                          >暂无图片</div>
                      </div>
                    </div> -->
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>
        </section>
      </div>
    </div>
    <!-- 裁剪 -->
    <Cropper v-if="cropperVisible" :show="cropperVisible" :option="option" :cropperViewInfo="cropperViewInfo"
      @finish="finish" @clear="clearCropper" @close="closeCropper" />
    <!-- 图片预览 -->
    <el-dialog title="图片预览" :visible.sync="previewVisible">
      <img width="100%" :src="previewImageUrl" alt />
    </el-dialog>
  </div>
</template>

<script>
import Cropper from './cropper.vue'
import { userPics } from '../../mock/index';
import { loadImage } from '../../utils/index';
import mergeImages from '../../utils/mergeImages';
const initFileInfo = {}
const MEDIA_MAX_W = 200 // 用户肖像基准宽度
const MEDIA_MAX_H = 1.5 * MEDIA_MAX_W // 用户肖像最大高度

export default {
  name: 'building-media',
  components: {
    Cropper
  },
  data() {
    return {
      filters: {
        advertType: []
      },
      advertTypeList: [], // 广告类型列表
      verifyInfo: {
        verifyStatus: true, // 验证用户信息
        verifyResult: ''
      },
      mediaList: [], // 素材库列表
      supportCropper: true, // 是否支持裁剪
      showFile: false,
      cropperVisible: false,
      cropperViewInfo: {},
      option: {},
      previewVisible: false,
      previewImageUrl: '',
      initLoading: false,
      fileInfo: Object.assign({}, initFileInfo),
    }
  },
  created() {
    this.getUserPics()
  },
  methods: {
    getUserPics(single, inx) {
      const res = userPics.data
      this.initLoading = true
      setTimeout(() => {
        this.initLoading = false
        let data = res || []
        let mediaList = data.map(item => {
          const { mergeRules, userPicSize } = item
          const [w, h] = (userPicSize && userPicSize.split('*')) || []
          if (mergeRules && mergeRules.length > 0) {
            let template = mergeRules.filter(l => l.code == 'template')
            let bodypp = mergeRules.filter(l => l.code == 'bodypp')
            Object.assign(item, {
              templateWidth: (template[0] && template[0].width) || 0,
              templateHeight: (template[0] && template[0].height) || 0,
              templateUrl: (template[0] && template[0].url) || '',
              template: Object.assign({}, template[0] || {}),
              bodypp: Object.assign({}, bodypp[0] || {})
            })
          }
          item.userPicW = w
          item.userPicH = h
          return item
        })
        if (single) {
          this.mediaList.splice(inx, 1, mediaList[inx])
        } else {
          this.mediaList = mediaList
        }
      }, 1000);
    },
    calUploadStyle(w, h) {
      const ratio = w / h
      let MAX_RATIO = MEDIA_MAX_W / MEDIA_MAX_H
      if (ratio > 1) {
        MAX_RATIO = MEDIA_MAX_H / MEDIA_MAX_W
        if (MAX_RATIO >= ratio) {
          return {
            width: MEDIA_MAX_W * ratio + 'px',
            height: MEDIA_MAX_W + 'px',
            lineHeight: MEDIA_MAX_W + 'px'
          }
        }
        return {
          width: MEDIA_MAX_H + 'px',
          height: MEDIA_MAX_H / ratio + 'px',
          lineHeight: MEDIA_MAX_H / ratio + 'px'
        }
      } else {
        if (MAX_RATIO >= ratio) {
          return {
            width: MEDIA_MAX_W + 'px',
            height: MEDIA_MAX_W / ratio + 'px',
            lineHeight: MEDIA_MAX_W / ratio + 'px'
          }
        }
        return {
          width: MEDIA_MAX_H * ratio + 'px',
          height: MEDIA_MAX_H + 'px',
          lineHeight: MEDIA_MAX_H + 'px'
        }
      }
    },
    calMergeLoadingStyle(w, h) {
      const ratio = w / h
      let MAX_RATIO = MEDIA_MAX_W / MEDIA_MAX_H
      if (ratio > 1) {
        MAX_RATIO = MEDIA_MAX_H / MEDIA_MAX_W
        if (MAX_RATIO >= ratio) {
          return {
            width: MEDIA_MAX_W * ratio + 'px',
            height: MEDIA_MAX_W + 'px',
          }
        }
        return {
          width: MEDIA_MAX_H + 'px',
          height: MEDIA_MAX_H / ratio + 'px',
        }
      } else {
        if (MAX_RATIO >= ratio) {
          return {
            width: MEDIA_MAX_W + 'px',
            height: MEDIA_MAX_W / ratio + 'px',
          }
        }
        return {
          width: MEDIA_MAX_H * ratio + 'px',
          height: MEDIA_MAX_H + 'px',
        }
      }
    },
    calErrorStyle(w, h) {
      const { height } = this.calMergeLoadingStyle(w, h)
      return {
        lineHeight: height
      }
    },
    transLoadingText(p) {
      if (p.mergeLoading) {
        return '图片拼命合成中'
      }
      if (p.uploading) {
        return '图片上传中'
      }
      return ''
    },
    // 根据高度计算放大比率, 裁剪框高度为500，以高度的80%为准
    calRatio(w, h) {
      const percent = 0.75
      const cropMaxW = 700 * percent
      const cropMaxH = 500 * percent
      const ratio = w / h
      let maxRatio = cropMaxW / cropMaxH
      if (ratio > 1 && maxRatio < ratio) {
        return w / cropMaxW
      }
      return h / cropMaxH
    },
    changeUpload(p, index) {
      this.fileInfo = Object.assign({}, initFileInfo)
      const $file = this.$refs.imginput[index]
      console.log('$file', $file)
      const fileList = $file.files
      const picReg = /\.jpg$|\.jpeg$|\.png$/gi
      if (!fileList[0].name.match(picReg)) {
        this.$message.error('上传失败，仅支持.jpg、.jpeg、.png的图片格式')
        return false
      }
      const Lt = (p.picMemorySize && p.picMemorySize.minSize) || 0
      const Gt = (p.picMemorySize && p.picMemorySize.maxSize) || 2
      const isLt = fileList[0].size / 1024 / 1024 < Lt
      const isGt = fileList[0].size / 1024 / 1024 < Gt
      if (isLt) {
        this.$message.error(`上传文件大小需大于 ${Lt}MB!`)
        return false
      }
      if (!isGt) {
        this.$message.error(`上传文件大小不能超过 ${Gt}MB!`)
        return false
      }

      let picSizeW = Number(p.userPicSize && p.userPicSize.split('*')[0]) || 0
      let picSizeH = Number(p.userPicSize && p.userPicSize.split('*')[1]) || 0
      let imageUrl = window.URL.createObjectURL(fileList[0])
      console.log('imageUlr', imageUrl)
      let img = new Image()
      img.onload = () => {
        console.log('img', img)
        // loadImage(imageUrl).then(img => {
        // 校验上传图片是否满足最小的宽和高
        const minWidth = (p.picMinSize && p.picMinSize.width) || 0
        const minHeight = (p.picMinSize && p.picMinSize.height) || 0
        if (minWidth && minHeight) {
          if (!(img.width >= minWidth && img.height >= minHeight)) {
            this.$message.error(`上传图片宽和高最小为${minWidth}x${minHeight}!`)
            return false
          }
        }
        // this.originFileCheck(fileList[0], index).then(() => {
        console.log('上传图片大小', fileList[0].size / 1024 / 1024 + 'MB')
        Object.assign(this.fileInfo, {
          inx: index,
          originFile: fileList[0],
          picItem: p,
          picSizeW,
          picSizeH
        })
        // 缓存原始图片文件
        this.updateTemplate({ originFile: fileList[0] }, index)
        // 开始裁剪
        let ratio = this.calRatio(picSizeW, picSizeH) || 1
        let fixedNumber = [picSizeW, picSizeH]
        this.showCropper({
          img: imageUrl,
          autoCropWidth: fixedNumber[0] / ratio,
          autoCropHeight: fixedNumber[1] / ratio,
          enlarge: ratio
        })
        // 裁剪预览模板图
        this.cropperViewInfo = {
          template: p.template,
          bodypp: p.bodypp,
          picMemorySize: p.picMemorySize
        }
        // }).catch(() => {
        // this.$message.error('上传图片加载失败')
        // })
      }
      img.src = imageUrl
    },
    emitUpload(p, index) {
      this.$refs.imginput[index].value = ''
      this.$refs.imginput[index].click()
    },
    submitFile(inx) {
      console.log('first', this.mediaList)
      // test-start
      let picItem = this.mediaList[inx]
      const { file, originalData } = picItem
      let item = Object.assign({}, picItem, {
        userPicUrl: originalData
      })
      this.updateTemplate(item, inx)
      this.makeMergeImage(inx)
      this.$notify({
        title: '提示',
        message: '图片合成成功',
        type: 'success',
        duration: 5000
      })
    },
    makeMergeImage(inx) {
      const picItem = this.mediaList[inx]
      const { templateWidth, templateHeight, mergeRules, userPicUrl } = picItem
      let imgs = [{
        src: userPicUrl,
        width: 480,
        height: 200,
        x: 0,
        y: 0
      }, {
        src: new URL('../../assets/4.jpg', import.meta.url).href,
        width: 480,
        height: 200,
        x: 200,
        y: 200
      }, {
        src: new URL('../../assets/5.jpg', import.meta.url).href,
        width: 480,
        height: 200,
        x: 400,
        y: 400
      }]
      console.log('图片构成元素', imgs)
      if (Array.isArray(imgs) && imgs.length > 0) {
        mergeImages(imgs, {
          width: templateWidth,
          height: templateHeight,
          format: 'image/jpeg',
          crossOrigin: 'Anonymous'
        })
          .then(b64 => {
            // const file = this.convertBase64UrlToBlob(b64)
            setTimeout(() => {
              const cdnUrl = b64
              const id = +new Date()
              this.updateTemplate(
                {
                  halfPicUrl: cdnUrl,
                  halfPicId: id,
                  mergeLoading: false,
                  mergeLoaded: true,
                  mergeSuccess: true
                },
                inx
              )
            }, 300);
          })
          .catch(err => {
            console.log('err', err)
            this.updateTemplate(
              {
                mergeLoading: false,
                mergeLoaded: true,
                mergeSuccess: false
              },
              inx
            )
            console.log('合成失败', err)
            this.$notify({
              title: '提示',
              message: '图片合成失败',
              type: 'error',
              duration: 5000
            })
          })
      } else {
        this.updateTemplate(
          {
            mergeLoading: false,
            mergeLoaded: true,
            mergeSuccess: false
          },
          inx
        )
      }
    },
    updateTemplate(updateItem, inx) {
      let item = this.mediaList[inx]
      item = Object.assign({}, item, updateItem)
      this.mediaList.splice(inx, 1, item)
    },
    showCropper(params) {
      this.cropperVisible = true
      Object.assign(this.option, params)
    },
    closeCropper() {
      this.cropperVisible = false
      console.log(this.fileInfo)
      this.$refs.imginput[this.fileInfo.inx].value = ''
      Object.assign(this.option, {
        img: '',
        autoCropWidth: 128,
        autoCropHeight: 128
      })
      this.cropperViewInfo = {}
    },
    clearCropper() {
      this.closeCropper()
      Object.assign(this.fileInfo, initFileInfo)
    },
    finish({
      blobImg: file, originalData
    }) {
      console.log('file', file)
      this.updateTemplate({ file, originalData }, this.fileInfo.inx)
      Object.assign(this.fileInfo, { file })
      this.closeCropper()
      this.submitFile(this.fileInfo.inx)
    }
  },
}
</script>

<style lang="scss">
.building-ad-media {
  padding: 4px;

  .media-wrap {
    padding: 0 20px;
  }

  .media-wrap-header {
    h3 {
      font-size: 14px;

      span {
        padding-left: 8px;
      }
    }

    .desc {
      margin-top: 10px;
      font-size: 12px;
      line-height: 1.3;
      color: red;
      max-width: 600px;
    }
  }

  .media-wrap-body {
    min-height: 400px;

    .el-card {
      margin-top: 16px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .template-wrap {
    display: flex;

    .left,
    .right {
      display: inline-block;
    }

    .image-item {
      margin-right: 36px;
      display: inline-block;
      vertical-align: top;
    }

    .el-image {
      width: 100%;
    }

    .user-image,
    .merge-image,
    .template-image,
    .real-image {
      .media {
        position: relative;
        border-radius: 3px;
        width: 198px;
        height: 198px;
        border: 1px solid transparent;
        overflow: hidden;
        font-size: 14px;
        background: #F5F7FA;
        color: #C0C4CC;
        text-align: center;
      }
    }
  }
}
</style>
