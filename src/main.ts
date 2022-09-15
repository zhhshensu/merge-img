import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
// https://github.com/xyxiao001/vue-cropper // 图片裁剪
import VueCropper from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(VueCropper)

app.mount('#app')
