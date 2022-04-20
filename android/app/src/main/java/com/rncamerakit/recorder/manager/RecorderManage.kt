package com.rncamerakit.recorder.manager

import android.content.Context
import android.text.TextUtils
import android.util.Log
import com.aliyun.common.utils.CommonUtil
import com.aliyun.svideo.common.utils.FileUtils
import com.aliyun.svideo.recorder.mixrecorder.AlivcRecorder
import com.aliyun.svideo.recorder.util.FixedToastUtils
import com.aliyun.svideo.recorder.util.RecordCommon
import com.aliyun.svideo.recorder.util.SharedPreferenceUtils
import com.aliyun.svideosdk.common.struct.common.AliyunSnapVideoParam
import com.aliyun.svideosdk.common.struct.common.VideoQuality
import com.aliyun.svideosdk.common.struct.effect.EffectFilter
import com.aliyun.svideosdk.common.struct.effect.EffectPaster
import com.aliyun.svideosdk.common.struct.encoder.VideoCodecs
import com.aliyun.svideosdk.common.struct.form.PreviewPasterForm
import com.aliyun.svideosdk.common.struct.project.Source
import com.aliyun.svideosdk.common.struct.recorder.CameraParam
import com.aliyun.svideosdk.common.struct.recorder.CameraType
import com.aliyun.svideosdk.common.struct.recorder.FlashType
import com.aliyun.svideosdk.common.struct.recorder.MediaInfo
import com.aliyun.svideosdk.recorder.AliyunIClipManager
import com.duanqu.transcode.NativeParser
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.liulishuo.filedownloader.BaseDownloadTask
import com.rncamerakit.R
import com.rncamerakit.RNEventEmitter
import com.rncamerakit.VideoConst
import com.rncamerakit.crop.CropManager
import com.rncamerakit.db.MusicFileBean
import com.rncamerakit.recorder.ImplRecordCallback
import com.rncamerakit.recorder.OnRecorderCallbacks
import com.rncamerakit.utils.DownloadUtils
import com.rncamerakit.utils.MyFileDownloadCallback
import org.jetbrains.anko.doAsync
import org.jetbrains.anko.uiThread
import java.io.File
import java.util.*

class RecorderManage(
    val mContext: ThemedReactContext
) {

    /**
     * 是否正在录制中
     */
    var isRecording = false

    var isPauseCamera = false

    var cameraType: CameraType? = null
    var mRecorder: AlivcRecorder? = null

    private var mClipManager: AliyunIClipManager? = null
    private var mRecordCallback: ImplRecordCallback? = null
    private var mRecorderQueenManage: RecorderQueenManage? = null

    private val mColorFilterList: MutableList<String> = ArrayList()

    /**
     * 贴纸
     */
    private var mEffectPaster: EffectPaster? = null

    fun initColorFilterAssets() {
        doAsync {
            val colorFilterList = RecordCommon.getColorFilterList()
            uiThread {
                mColorFilterList.clear()
                mColorFilterList.addAll(colorFilterList)
            }
        }
    }

//    private fun downloadMusic(mode: String?){
//        var url = if (mode == "back") {
//            "https://static.paiyaapp.com/music/Berlin%20-%20Take%20My%20Breath%20Away.mp3"
//        } else {
//            "https://static.paiyaapp.com/music/%E6%9D%8E%E5%AE%97%E7%9B%9B%2C%E5%91%A8%E5%8D%8E%E5%81%A5-%E6%BC%82%E6%B4%8B%E8%BF%87%E6%B5%B7%E6%9D%A5%E7%9C%8B%E4%BD%A0%20(Live).mp3"
//        }
//        val path = StorageUtils.getFilesDirectory(mContext.applicationContext)
//            .toString() + "/music/download"
//        DownloadUtils.downloadFile(
//            url,
//            path,
//            object : MyFileDownloadCallback() {
//                override fun completed(task: BaseDownloadTask) {
//                    super.completed(task)
//                    mRecorder?.setMute(false)
//                    val filePath = task.targetFilePath
//                    MediaPlayerManage.instance.start(filePath)
//                    mRecorder?.setMusic(filePath, 0, 30 * 1000)
//                }
//            })
//    }


    /**
     * 切换摄像头
     */
    fun setCameraType(mode: String?) {
        if (cameraType != null) {
            val cameraId = mRecorder?.switchCamera()
            for (type in CameraType.values()) {
                if (type.type == cameraId) {
                    cameraType = type
                }
            }
            //切换摄像头后重新设置一次闪光灯模式，否则闪光灯无效.使用系统的拍照接口且后置摄像头
            mRecorder?.setLight(mFlashType)
            return
        }
        cameraType = CameraType.FRONT
    }

    private var mFlashType = FlashType.AUTO

    /**
     * 设置闪光灯模式
     */
    fun setLight(mode: String?) {
        mFlashType = when (mode) {
            "on" -> {
                FlashType.ON
            }
            "off" -> {
                FlashType.OFF
            }
            else -> {
                FlashType.AUTO
            }
        }
        mRecorder?.setLight(mFlashType)
    }

    /**
     * 手电筒，仅后置摄像头有效
     */
    fun setTorchMode(mode: String?) {
        mRecorder?.setLight(if ("on" == mode) FlashType.TORCH else mFlashType)
    }


    /**
     * 设置背景音乐
     */
    fun setBackgroundMusic(bgm: String?) {
        if (TextUtils.isEmpty(bgm)) {
            mRecorder?.setMusic(null, 0, 0)
        } else {
            mRecorder?.setMusic(bgm, 0, 30*1000)
        }
    }

    fun setMusicInfo(bean: MusicFileBean?) {
        if (bean?.isDbContain == 1 && FileUtils.fileIsExists((bean.localPath))) {
            setBackgroundMusic(bean.localPath)
        } else {
            if (bean != null) {
                DownloadUtils.downloadMusic(
                    mContext,
                    bean.songID,
                    bean.url,
                    null,
                    object : MyFileDownloadCallback() {
                        override fun completed(task: BaseDownloadTask) {
                            super.completed(task)
                            val filePath = task.targetFilePath
                            setBackgroundMusic(filePath)
                        }
                    })
            }
        }
    }


    companion object {
        var photoPath: String? = null
    }

    /**
     * 带特效拍照
     */
    fun takePhoto(context: ReactApplicationContext, promise: Promise) {
        mRecordCallback?.setOnRecorderCallbacks(object : OnRecorderCallbacks() {
            override fun onTakePhoto(photoPath: String?) {
                Companion.photoPath = photoPath
                promise.resolve(photoPath)
            }

            override fun onError(errorCode: Int) {
                promise.reject("takePhoto", "errorCode:$errorCode")
            }
        })
        mRecorder?.takePhoto(true)
    }

    /**
     * 开始录制
     */
    fun startRecording(reactContext: ReactApplicationContext, promise: Promise) {
        if (CommonUtil.SDFreeSize() < 50*1000*1000) {
            promise.reject(
                "startRecording",
                "error:" + reactContext.resources.getString(R.string.alivc_music_no_free_memory)
            )
            FixedToastUtils.show(
                reactContext,
                reactContext.resources.getString(R.string.alivc_music_no_free_memory)
            )
            isRecording = false
            return
        }

        if (mRecorder != null) {
            mClipManager?.deleteAllPart()
            mRecordCallback?.setOnRecorderCallbacks(object : OnRecorderCallbacks() {
                override fun onProgress(duration: Long) {
                    RNEventEmitter.startVideoRecord(reactContext, duration)
                }
            })
            isRecording = true
//            val videoPath = File(
//                CropManager.getCameraDirs(mContext.applicationContext),
//                "" + System.currentTimeMillis() + "-record.mp4"
//            ).absolutePath
//            mRecorder?.setOutputPath(videoPath)
            mRecorder?.startRecording()
            promise.resolve(true)
        } else {
            isRecording = true
            promise.reject("startRecording", "recorder is null")
        }
    }

    /**
     * 停止录制
     */
    fun stopRecording(context: Context, promise: Promise) {
        mRecordCallback?.setOnRecorderCallbacks(object : OnRecorderCallbacks() {
            override fun onComplete(validClip: Boolean, clipDuration: Long) {
//                if (clipDuration < 2000) {
//                    mRecorder?.cancelRecording()
//                    promise.reject("The recording time is too short", "recording duration：" + clipDuration + "ms")
//                    return
//                }
                mRecorder?.finishRecording()
                mClipManager?.deleteAllPart()
            }

            override fun onFinish(outputPath: String?) {
                promise.resolve(outputPath)
                isRecording = false
//                onRelease()
            }

            override fun onError(errorCode: Int) {
                promise.reject("startRecording", "errorCode:$errorCode")
                isRecording = false
            }
        })
        mRecorder?.stopRecording()
    }

    //开始多段录制
    fun startMultiRecording(reactContext: ReactApplicationContext, promise: Promise) {
        if (CommonUtil.SDFreeSize() < 50*1000*1000) {
            promise.reject(
                "startRecording",
                "error:" + reactContext.resources.getString(R.string.alivc_music_no_free_memory)
            )
            FixedToastUtils.show(
                reactContext,
                reactContext.resources.getString(R.string.alivc_music_no_free_memory)
            )
            isRecording = false
            return
        }
        if (mRecorder != null) {
            if (isRecording) {
                return
            }
            mRecordCallback?.setOnRecorderCallbacks(object : OnRecorderCallbacks() {
                override fun onProgress(duration: Long) {
                    RNEventEmitter.startMultiRecording(reactContext, duration)
                }
            })
            mRecorder?.startRecording()
            promise.resolve(true)
        } else {
            isRecording = false
            promise.reject("startRecording", "recorder is null")
        }
    }

    //停止多段录制
    fun stopMultiRecording(context: Context, promise: Promise) {
        mRecorder?.stopRecording()
        mClipManager?.let {
            if (it.videoPathList != null && it.videoPathList.size > 0) {
                promise.resolve(it.videoPathList[it.videoPathList.size - 1])
            }
        }
    }

    //完成多段录制
    fun finishMultiRecording(context: Context, promise: Promise) {
        mRecordCallback?.setOnRecorderCallbacks(object : OnRecorderCallbacks() {
            override fun onFinish(outputPath: String?) {

                val nativeParser = NativeParser()
                nativeParser.init(outputPath)
                val rotation = nativeParser.getValue(NativeParser.VIDEO_ROTATION)
                val bitRate = nativeParser.getValue(NativeParser.VIDEO_BIT_RATE)
                val duration = nativeParser.getValue(NativeParser.VIDEO_DURATION)
                val fps = nativeParser.getValue(NativeParser.VIDEO_FPS)
                val frameWidth = nativeParser.getValue(NativeParser.VIDEO_WIDTH)
                val frameHeight = nativeParser.getValue(NativeParser.VIDEO_HEIGHT)

                promise.resolve(outputPath)
                isRecording = false
            }

            override fun onError(errorCode: Int) {
                promise.reject("startRecording", "errorCode:$errorCode")
                isRecording = false
            }
        })
        doAsync {
            //结束录制合成视频
            mRecorder?.finishRecording()
            uiThread {
            }
        }
    }


    //删除最后一段片段
    fun deleteLastMultiRecording(context: Context, promise: Promise) {
        mRecorder?.stopRecording()
        mClipManager?.deletePart()
        promise.resolve(true)
    }


    //删除所有录制片段
    fun deleteAllMultiRecording(context: Context, promise: Promise) {
        mRecorder?.stopRecording()
        mClipManager?.deleteAllPart()
        promise.resolve(true)
    }

    private var colorFilterPosition = 0

    /**
     * 设置颜色滤镜
     */
    fun setColorFilter() {
        if (mColorFilterList.isEmpty() || colorFilterPosition >= mColorFilterList.size) {
            colorFilterPosition = 0
            return
        }
        val source = Source(mColorFilterList[colorFilterPosition])
        val filterEffect = EffectFilter(source)
        mRecorder?.applyFilter(filterEffect)
        colorFilterPosition++
        if (colorFilterPosition > mColorFilterList.size) {
            colorFilterPosition = 0
        }
    }

    fun getBeautyLevel(context: Context?): Int {
        return SharedPreferenceUtils.getBeautyFaceLevel(context)
    }

    /**
     * 设置美颜等级
     */
    fun setBeautyLevel(level: Int) {
        mRecorderQueenManage?.setBeautyLevel(level)
    }

    /**
     * 设置滤镜
     */
    fun setColorFilter(filterPath: String?) {
        //设置滤镜 ,参数路径设置为null表示移除滤镜效果
        if (TextUtils.isEmpty(filterPath)) {
            val effect = EffectFilter("")
            mRecorder?.applyFilter(effect)
        } else {
            val effect = EffectFilter(Source(filterPath))
            mRecorder?.applyFilter(effect)
        }
    }

    /**
     * 设置人脸贴纸
     */
    fun setFaceEffectPaster(paster: PreviewPasterForm, mReactContext: ReactContext?) {
        if (mEffectPaster != null) {
            mRecorder?.removePaster(mEffectPaster)
        }
        EffectPasterManage.instance.setEffectPaster(paster, mReactContext,
            object : EffectPasterManage.OnGifEffectPasterCallback() {
                override fun onPath(path: String) {
                    super.onPath(path)
//                    if (mEffectPaster != null) {
//                        mRecorder?.removePaster(mEffectPaster)
//                    }
                    Log.e("AAA", "set effectPaster path：$path")
                    val source = Source(path)
                    mEffectPaster = EffectPaster(source)
                    val addPaster = mRecorder?.addPaster(mEffectPaster)
                }
            })
    }


    /**
     *
     */
    fun onRelease() {
        mRecorder?.release()
        mRecorder = null
        mRecorderQueenManage?.onRelease()
        mRecorderQueenManage = null
    }

    init {
        isRecording = false
        onRelease()
        Log.e("AAA", "init recorder ")
        mRecorder = AlivcRecorder(mContext)
//        val mWidth = ScreenUtils.getWidth(mContext)
//        val mHeight = mWidth*16/9
        val outputInfo = MediaInfo()
        outputInfo.fps = VideoConst.mVideoFps
        outputInfo.videoWidth = VideoConst.mVideoWidth
        outputInfo.videoHeight = VideoConst.mVideoHeight
        outputInfo.videoCodec = VideoCodecs.H264_HARDWARE
        mRecorder?.setMediaInfo(outputInfo)

        val videoPath = File(
            CropManager.getCameraDirs(mContext.applicationContext),
            "paiya-record.mp4"
        ).absolutePath
        mRecorder?.setOutputPath(videoPath)
//        mRecorder?.setVideoQuality(VideoQuality.SSD)
        //10Mbps
        mRecorder?.setVideoBitrate(VideoConst.mVideoBitrate)
        mRecorder?.setRatioMode(AliyunSnapVideoParam.RATIO_MODE_9_16)
        mRecorder?.setGop(30)
//        mRecorder?.setResolutionMode(AliyunSnapVideoParam.RESOLUTION_720P)
        mRecorder?.setCamera(CameraType.FRONT)
        mRecorder?.setFocusMode(CameraParam.FOCUS_MODE_CONTINUE)
        mClipManager = mRecorder?.clipManager
        //最大时间必须设置，否则设置录制背景音乐无效
        mClipManager?.maxDuration = 180*1000
        mRecordCallback = ImplRecordCallback(mContext)
        mRecorder?.setRecordCallback(mRecordCallback)
        mRecorderQueenManage = RecorderQueenManage(mContext, mRecorder as AlivcRecorder, this)
    }


    fun resumeCamera() {
        isPauseCamera = false
        mRecorder?.startPreview()
        mRecorder?.setLight(mFlashType)
        mRecorderQueenManage?.resumeCamera()
    }


    fun pauseCamera() {
        mRecorder?.setLight(FlashType.OFF)
        if (isRecording) {
            mRecorder?.stopRecording()
        }
        mRecorder?.stopPreview()
        mRecorderQueenManage?.pauseCamera()
        isPauseCamera = true
    }
}
