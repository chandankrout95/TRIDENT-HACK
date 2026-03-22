package com.userapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognizerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false
    private var currentLanguage = "en-IN"

    companion object {
        const val NAME = "SpeechRecognizer"
    }

    override fun getName(): String = NAME

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startListening(languageCode: String, promise: Promise) {
        val context = reactApplicationContext

        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "Microphone permission not granted")
            return
        }

        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            promise.reject("NOT_AVAILABLE", "Speech recognition not available on this device")
            return
        }

        currentLanguage = languageCode

        // Must create SpeechRecognizer on main thread
        UiThreadUtil.runOnUiThread {
            try {
                // Clean up previous instance
                speechRecognizer?.destroy()

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            isListening = true
                            val event = Arguments.createMap().apply { putString("status", "ready") }
                            sendEvent("onSpeechReady", event)
                        }

                        override fun onBeginningOfSpeech() {
                            val event = Arguments.createMap().apply { putString("status", "speaking") }
                            sendEvent("onSpeechStart", event)
                        }

                        override fun onRmsChanged(rmsdB: Float) {
                            val event = Arguments.createMap().apply { putDouble("value", rmsdB.toDouble()) }
                            sendEvent("onSpeechVolume", event)
                        }

                        override fun onEndOfSpeech() {
                            isListening = false
                            val event = Arguments.createMap().apply { putString("status", "ended") }
                            sendEvent("onSpeechEnd", event)
                        }

                        override fun onResults(results: Bundle?) {
                            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            if (!matches.isNullOrEmpty()) {
                                val event = Arguments.createMap().apply {
                                    putString("text", matches[0])
                                }
                                sendEvent("onSpeechResult", event)
                            }
                        }

                        override fun onPartialResults(partialResults: Bundle?) {
                            val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            if (!matches.isNullOrEmpty()) {
                                val event = Arguments.createMap().apply {
                                    putString("text", matches[0])
                                }
                                sendEvent("onSpeechPartial", event)
                            }
                        }

                        override fun onError(error: Int) {
                            isListening = false
                            val errorMsg = when (error) {
                                SpeechRecognizer.ERROR_NO_MATCH -> "NO_MATCH"
                                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "TIMEOUT"
                                SpeechRecognizer.ERROR_NETWORK -> "NETWORK"
                                SpeechRecognizer.ERROR_AUDIO -> "AUDIO"
                                else -> "ERROR_$error"
                            }
                            val event = Arguments.createMap().apply {
                                putString("error", errorMsg)
                                putInt("code", error)
                            }
                            sendEvent("onSpeechError", event)
                        }

                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, languageCode)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                }

                speechRecognizer?.startListening(intent)
                promise.resolve("listening")
            } catch (e: Exception) {
                promise.reject("START_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.stopListening()
                isListening = false
                promise.resolve("stopped")
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun destroy(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = null
                isListening = false
                promise.resolve("destroyed")
            } catch (e: Exception) {
                promise.reject("DESTROY_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN event emitter
    }
}
