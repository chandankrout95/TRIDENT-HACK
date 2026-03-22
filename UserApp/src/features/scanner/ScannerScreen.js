import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, ActivityIndicator, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const { width } = Dimensions.get('window');

const ScannerScreen = () => {
  const navigation = useNavigation();
  const [imageAsset, setImageAsset] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCamera = () => {
    launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        setImageAsset(response.assets[0]);
      }
    });
  };

  const handleGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        setImageAsset(response.assets[0]);
      }
    });
  };

  const handleAnalyze = async () => {
    if (!imageAsset) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? imageAsset.uri : imageAsset.uri.replace('file://', ''),
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'prescription.jpg',
      });

      const response = await axios.post('https://mental-health-medicine-anlyzer.onrender.com/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Important, AI APIs can take a while
      });

      if (response.data.status === 'success') {
        navigation.replace('ScanResultScreen', { success: true, analysis: response.data });
      } else {
        navigation.replace('ScanResultScreen', { success: false });
      }
    } catch (error) {
      console.error(error);
      navigation.replace('ScanResultScreen', { success: false });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analyze Medicine</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.cameraView}>
        {imageAsset ? (
          <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="document-text-outline" size={80} color="#374151" />
            <Text style={styles.placeholderText}>Please upload a prescription or medicine label for AI identification.</Text>
          </View>
        )}
      </View>

      <View style={styles.controlsArea}>
        {!isAnalyzing && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCamera}>
              <Icon name="camera" size={24} color="#FFF" />
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleGallery}>
              <Icon name="images" size={24} color="#FFF" />
              <Text style={styles.actionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {imageAsset && (
          <TouchableOpacity 
            style={[styles.analyzeBtn, isAnalyzing && styles.analyzingBtn]} 
            onPress={handleAnalyze} 
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.analyzeBtnText}>Analyzing with AI...</Text>
              </>
            ) : (
              <>
                <Icon name="sparkles" size={24} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.analyzeBtnText}>Send to Analyzer</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, zIndex: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  
  cameraView: { flex: 1, backgroundColor: '#111827', marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', paddingHorizontal: 40 },
  placeholderText: { color: '#9CA3AF', marginTop: 20, textAlign: 'center', fontSize: 16, lineHeight: 24 },
  
  controlsArea: { padding: 30, paddingBottom: 50 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: '#374151', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  actionText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  analyzeBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, elevation: 5, shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 10 },
  analyzingBtn: { backgroundColor: '#1E40AF', opacity: 0.8 },
  analyzeBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default ScannerScreen;
