package com.rncamerakit

import android.graphics.Color
import android.util.Log
import androidx.annotation.ColorInt
import androidx.camera.view.CameraView
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.MapBuilder
import com.facebook.react.common.ReactConstants.TAG
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp


class CKCameraManager : SimpleViewManager<CKCamera>() {

    override fun getName() : String {
        return "CKCameraManager"
    }

    override fun createViewInstance(context: ThemedReactContext): CKCamera {
        return CKCamera(context)
    }

    override fun receiveCommand(view: CKCamera, commandId: String?, args: ReadableArray?) {
        var logCommand = "CameraManager received command $commandId("
        for (i in 0..(args?.size() ?: 0)) {
            if (i > 0) {
                logCommand += ", "
            }
            logCommand += when (args?.getType(0)) {
                ReadableType.Null -> "Null"
                ReadableType.Array -> "Array"
                ReadableType.Boolean -> "Boolean"
                ReadableType.Map -> "Map"
                ReadableType.Number -> "Number"
                ReadableType.String -> "String"
                else ->  ""
            }
        }
        logCommand += ")"
        Log.d(TAG, logCommand)
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
        return MapBuilder.of(
                "onOrientationChange", MapBuilder.of("registrationName", "onOrientationChange"),
                "onReadCode", MapBuilder.of("registrationName", "onReadCode"),
                "onPictureTaken", MapBuilder.of("registrationName", "onPictureTaken")
        )
    }


    @ReactProp(name = "normalBeautyLevel")
    fun setBeautyLevel(view: CKCamera, normalBeautyLevel: Int) {
        var beautyLevel = when (normalBeautyLevel) {
            0 -> 0
            10 -> 1
            20 -> 2
            30 -> 3
            40 -> 4
            50 -> 5
            else -> {
                3
            }
        }
        view.recorderManage.setBeautyLevel(beautyLevel)
    }

    //摄像头方向  back 后置摄像头，front 前置摄像头
    @ReactProp(name = "cameraType")
    fun setCameraType(view: CKCamera, type: String) {
        view.recorderManage.setCameraType(type)
    }

    //是否开启闪光灯
    @ReactProp(name = "flashMode")
    fun setFlashMode(view: CKCamera, mode: String?) {
        view.recorderManage.setLight(mode)
    }

    //手电筒
    @ReactProp(name = "torchMode")
    fun setTorchMode(view: CKCamera, mode: String?) {
        view.recorderManage.setTorchMode(mode)
    }

    @ReactProp(name = "focusMode")
    fun setFocusMode(view: CKCamera, mode: String) {
//        view.setAutoFocus(mode)
    }

    @ReactProp(name = "zoomMode")
    fun setZoomMode(view: CKCamera, mode: String) {
//        view.setZoomMode(mode)
    }

    @ReactProp(name = "scanBarcode")
    fun setScanBarcode(view: CKCamera, enabled: Boolean) {
//        view.setScanBarcode(enabled)
    }

    @ReactProp(name = "showFrame")
    fun setShowFrame(view: CKCamera, enabled: Boolean) {
//        view.setShowFrame(enabled)
    }

    @ReactProp(name = "laserColor", defaultInt = Color.RED)
    fun setLaserColor(view: CKCamera, @ColorInt color: Int) {
//        view.setLaserColor(color)
    }

    @ReactProp(name = "frameColor", defaultInt = Color.GREEN)
    fun setFrameColor(view: CKCamera, @ColorInt color: Int) {
//        view.setFrameColor(color)
    }

    @ReactProp(name = "outputPath")
    fun setOutputPath(view: CKCamera, path: String) {
//        view.setOutputPath(path)
    }

    @ReactProp(name = "shutterAnimationDuration")
    fun setShutterAnimationDuration(view: CKCamera, duration: Int) {
//        view.setShutterAnimationDuration(duration)
    }
}