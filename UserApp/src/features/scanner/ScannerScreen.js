import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, withDelay } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const ScannerScreen = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState('Position Medicine Label...');

  const scanLineY = useSharedValue(0);
  const scanBoxSize = width * 0.75;

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    const checkPermissionsAndStart = async () => {
      if (!hasPermission) {
        const status = await requestPermission();
        if (!status) {
          Alert.alert("Permission Denied", "Camera access is required for scanning.");
          navigation.goBack();
          return;
        }
      }
      startMockScan();
    };

    const startMockScan = () => {
      // 1. Mock Camera Access
      setTimeout(() => {
        setStatus('Scanning Medicine...');

        // Start scanning animation
        scanLineY.value = withRepeat(
          withSequence(
            withTiming(scanBoxSize - 4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite
          true // reverse
        );

        // 2. Mock Scan Completion (80% success rate)
        setTimeout(() => {
          const isSuccess = Math.random() > 0.2;
          navigation.replace('ScanResultScreen', { success: isSuccess });
        }, 3500);

      }, 1500);
    };

    if (hasPermission !== null) {
      checkPermissionsAndStart();
    }
  }, [navigation, scanBoxSize, scanLineY, hasPermission, requestPermission]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <View style={styles.container}>
      {hasPermission && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />
      ) : (
        <View style={styles.noCamera}>
          <Icon name="camera-reverse-outline" size={50} color="#6B7280" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>Initializing Camera...</Text>
        </View>
      )}

      {/* Header overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medicine Scanner</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Mock Camera Viewfinder */}
      <View style={styles.cameraView}>
        <View style={[styles.scanBox, { width: scanBoxSize, height: scanBoxSize }]}>
          {/* Corner Guides */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Animated Scan Line */}
          {status === 'Scanning Medicine...' && (
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          )}
        </View>

        {/* Status Text overlay */}
        <Animated.View style={styles.statusBox}>
          <Icon name={status.includes('Analyzing') ? "scan-outline" : "camera-outline"} size={24} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.statusText}>{status}</Text>
        </Animated.View>
        <Text style={styles.hintText}>Please position the medicine container or prescription within the frame for AI identification.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  noCamera: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, zIndex: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },

  cameraView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { position: 'relative', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },

  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#2563EB', borderWidth: 0 },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },

  scanLine: { position: 'absolute', top: 0, left: 10, right: 10, height: 3, backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 1, shadowRadius: 10, elevation: 10 },

  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, marginBottom: 20 },
  statusText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  hintText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});

export default ScannerScreen;
