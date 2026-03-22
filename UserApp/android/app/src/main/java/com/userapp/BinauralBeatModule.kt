package com.userapp

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.facebook.react.bridge.*
import kotlin.math.PI
import kotlin.math.sin
import kotlin.math.cos
import kotlin.math.sqrt
import kotlin.math.exp
import kotlin.random.Random

class BinauralBeatModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var audioTrack: AudioTrack? = null
    private var isPlaying = false
    private var playThread: Thread? = null

    private var baseFrequency = 200.0
    private var binauralOffset = 3.0
    private var beatVolume = 0.35f
    private var noiseVolume = 0.12f
    private var noiseType = "rain"

    companion object {
        const val NAME = "BinauralBeatPlayer"
        const val SAMPLE_RATE = 44100
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun start(baseFreq: Double, offset: Double, volume: Double, noiseTypeParam: String, noiseVol: Double, promise: Promise) {
        try {
            stop(null)

            baseFrequency = baseFreq.coerceIn(100.0, 400.0)
            binauralOffset = offset.coerceIn(0.5, 10.0)
            beatVolume = volume.toFloat().coerceIn(0.1f, 0.6f)
            noiseType = noiseTypeParam
            noiseVolume = (noiseVol.toFloat() * 0.4f).coerceIn(0.02f, 0.18f) // Keep noise very subtle
            isPlaying = true

            playThread = Thread {
                generateAudio()
            }.apply {
                priority = Thread.MAX_PRIORITY
                start()
            }

            promise.resolve("playing")
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun setVolume(beatVol: Double, noiseVol: Double, promise: Promise) {
        beatVolume = beatVol.toFloat().coerceIn(0.1f, 0.6f)
        noiseVolume = (noiseVol.toFloat() * 0.4f).coerceIn(0.02f, 0.18f)
        promise.resolve("volume_set")
    }

    @ReactMethod
    fun stop(promise: Promise?) {
        isPlaying = false
        try {
            audioTrack?.stop()
            audioTrack?.release()
            audioTrack = null
        } catch (_: Exception) {}
        playThread?.interrupt()
        playThread = null
        promise?.resolve("stopped")
    }

    private fun generateAudio() {
        val bufferSize = AudioTrack.getMinBufferSize(
            SAMPLE_RATE,
            AudioFormat.CHANNEL_OUT_STEREO,
            AudioFormat.ENCODING_PCM_16BIT
        ).coerceAtLeast(SAMPLE_RATE) // At least 0.5 sec buffer per channel

        audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                    .build()
            )
            .setBufferSizeInBytes(bufferSize * 2)
            .setTransferMode(AudioTrack.MODE_STREAM)
            .build()

        audioTrack?.play()

        val buffer = ShortArray(bufferSize)
        var sampleIndex = 0L

        // Noise state variables
        var brownL = 0.0
        var brownR = 0.0
        var pinkB0 = 0.0; var pinkB1 = 0.0; var pinkB2 = 0.0
        var pinkB3 = 0.0; var pinkB4 = 0.0; var pinkB5 = 0.0; var pinkB6 = 0.0
        var lpStateL = 0.0
        var lpStateR = 0.0

        val random = java.util.Random()
        val fadeInSamples = SAMPLE_RATE * 3 // 3 second fade in

        val leftFreq = baseFrequency
        val rightFreq = baseFrequency + binauralOffset

        while (isPlaying) {
            for (i in buffer.indices step 2) {
                val t = sampleIndex.toDouble() / SAMPLE_RATE

                // ─── Smooth fade-in envelope ────────────────────────────────
                val fadeEnvelope = if (sampleIndex < fadeInSamples) {
                    (sampleIndex.toDouble() / fadeInSamples).let { it * it } // Quadratic ease-in
                } else 1.0

                // ─── Binaural Beat: Pure smooth sine waves ──────────────────
                // Left ear: base frequency
                val leftTone = sin(2.0 * PI * leftFreq * t)
                // Right ear: base + offset (creates binaural beat perception)
                val rightTone = sin(2.0 * PI * rightFreq * t)

                // Add a subtle harmonic for warmth (octave below, very quiet)
                val leftWarm = sin(2.0 * PI * (leftFreq / 2.0) * t) * 0.15
                val rightWarm = sin(2.0 * PI * (rightFreq / 2.0) * t) * 0.15

                // Combine tones with warmth
                val leftBeat = (leftTone + leftWarm) * beatVolume * fadeEnvelope
                val rightBeat = (rightTone + rightWarm) * beatVolume * fadeEnvelope

                // ─── Ambient noise layer (very subtle) ──────────────────────
                val whiteL = random.nextGaussian() * 0.3
                val whiteR = random.nextGaussian() * 0.3
                var noiseL: Double
                var noiseR: Double

                when (noiseType) {
                    "brown_noise", "brown" -> {
                        // Brown noise: heavily smoothed random walk
                        brownL += whiteL * 0.008
                        brownR += whiteR * 0.008
                        brownL *= 0.998
                        brownR *= 0.998
                        brownL = brownL.coerceIn(-0.5, 0.5)
                        brownR = brownR.coerceIn(-0.5, 0.5)
                        noiseL = brownL
                        noiseR = brownR
                    }
                    "pink_noise", "pink" -> {
                        // Pink noise: Voss-McCartney with heavier filtering
                        pinkB0 = 0.99886 * pinkB0 + whiteL * 0.0555179
                        pinkB1 = 0.99332 * pinkB1 + whiteL * 0.0750759
                        pinkB2 = 0.96900 * pinkB2 + whiteL * 0.1538520
                        pinkB3 = 0.86650 * pinkB3 + whiteL * 0.3104856
                        pinkB4 = 0.55000 * pinkB4 + whiteL * 0.5329522
                        pinkB5 = -0.7616 * pinkB5 - whiteL * 0.0168980
                        noiseL = (pinkB0 + pinkB1 + pinkB2 + pinkB3 + pinkB4 + pinkB5 + pinkB6 + whiteL * 0.5362) * 0.06
                        pinkB6 = whiteL * 0.115926
                        noiseR = noiseL + whiteR * 0.01 // Slight stereo variation
                    }
                    "rain" -> {
                        // Rain: deep low-pass filtered noise, very smooth
                        lpStateL = lpStateL * 0.985 + whiteL * 0.015
                        lpStateR = lpStateR * 0.985 + whiteR * 0.015
                        // Occasional very faint raindrop
                        val drop = if (random.nextInt(4000) < 1) random.nextDouble() * 0.08 else 0.0
                        noiseL = lpStateL + drop
                        noiseR = lpStateR + drop * 0.7
                    }
                    "ocean" -> {
                        // Ocean: slow modulated deep noise — wave-like
                        brownL += whiteL * 0.006
                        brownR += whiteR * 0.006
                        brownL *= 0.997
                        brownR *= 0.997
                        brownL = brownL.coerceIn(-0.4, 0.4)
                        brownR = brownR.coerceIn(-0.4, 0.4)
                        // Slow wave modulation (0.08 Hz, like real waves)
                        val waveMod = 0.4 + 0.6 * (0.5 + 0.5 * sin(2.0 * PI * 0.08 * t))
                        noiseL = brownL * waveMod
                        noiseR = brownR * waveMod
                    }
                    "forest" -> {
                        // Forest: very gentle pink-ish noise, occasional soft crackle
                        lpStateL = lpStateL * 0.992 + whiteL * 0.008
                        lpStateR = lpStateR * 0.992 + whiteR * 0.008
                        val crackle = if (random.nextInt(8000) < 1) random.nextDouble() * 0.05 else 0.0
                        noiseL = lpStateL * 0.8 + crackle
                        noiseR = lpStateR * 0.8 + crackle * 0.5
                    }
                    "wind" -> {
                        // Wind: very heavily filtered, slow sweeping
                        lpStateL = lpStateL * 0.996 + whiteL * 0.004
                        lpStateR = lpStateR * 0.996 + whiteR * 0.004
                        // Slow intensity sweep
                        val sweep = 0.5 + 0.5 * sin(2.0 * PI * 0.04 * t)
                        noiseL = lpStateL * 2.0 * sweep
                        noiseR = lpStateR * 2.0 * sweep
                    }
                    else -> {
                        lpStateL = lpStateL * 0.985 + whiteL * 0.015
                        lpStateR = lpStateR * 0.985 + whiteR * 0.015
                        noiseL = lpStateL
                        noiseR = lpStateR
                    }
                }

                // Scale noise very quietly
                noiseL *= noiseVolume * fadeEnvelope
                noiseR *= noiseVolume * fadeEnvelope

                // ─── Mix: binaural beats dominant, noise as subtle bed ──────
                val leftMix = (leftBeat + noiseL).coerceIn(-0.95, 0.95)
                val rightMix = (rightBeat + noiseR).coerceIn(-0.95, 0.95)

                if (i < buffer.size) buffer[i] = (leftMix * 32767).toInt().toShort()
                if (i + 1 < buffer.size) buffer[i + 1] = (rightMix * 32767).toInt().toShort()

                sampleIndex++
            }

            try {
                audioTrack?.write(buffer, 0, buffer.size)
            } catch (_: Exception) {
                break
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
