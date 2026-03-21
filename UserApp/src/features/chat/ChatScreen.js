import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  StatusBar,
  Keyboard,
  Animated,
  AppState,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChatHistory, addOptimisticMessage } from '../../store/chatSlice';
import { getSocket } from '../../services/socket';
import apiClient from '../../services/apiClient';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Swipeable } from 'react-native-gesture-handler';

// ─── Constants ────────────────────────────────────────────────────────────────
const WALLPAPERS = [
  { id: 'default', name: 'Dark Teal', color: '#0B141B' },
  { id: 'navy', name: 'Midnight', color: '#050A18' },
  { id: 'cosmos', name: 'Cosmos', color: '#120824' },
  { id: 'forest', name: 'Forest', color: '#071410' },
  { id: 'carbon', name: 'Carbon', color: '#09090F' },
];

const ChatScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const kbAnim = useRef(new Animated.Value(0)).current;
  const swipeableRefs = useRef(new Map());
  const highlightAnim = useRef(new Animated.Value(0)).current;

  const { messages, isLoading } = useSelector(s => s.chat);
  const { user } = useSelector(s => s.auth);

  const [inputText, setInputText] = useState('');
  const [personaName, setPersonaName] = useState(route?.params?.persona || 'Therapist');
  const [renameText, setRenameText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState('default');
  const [isOnline, setIsOnline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Zoom preview
  const [selectedImagePreview, setSelectedImagePreview] = useState(null); // Selected to send
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const themeColor = route?.params?.personaColor || '#2563EB';
  const targetUserId = route?.params?.therapistId || '000000000000000000000000';
  const isTherapistChat = !!route?.params?.therapistId;

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  useEffect(() => {
    dispatch(fetchChatHistory(targetUserId));
  }, [dispatch, targetUserId]);

  // Mark messages as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isTherapistChat) {
        apiClient.patch('/chat/read', { senderId: targetUserId }).catch(() => {});
      }
    }, [targetUserId, isTherapistChat])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isTherapistChat) {
        dispatch(fetchChatHistory(targetUserId));
        const socket = getSocket();
        if (socket) socket.emit('check_online_status', targetUserId);
      }
    });
    return () => subscription.remove();
  }, [dispatch, targetUserId, isTherapistChat]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUserStatus = (data) => {
      if (data.userId === targetUserId) setIsOnline(data.isOnline);
    };
    socket.on('user_status', onUserStatus);
    socket.emit('check_online_status', targetUserId);
    return () => socket.off('user_status', onUserStatus);
  }, [targetUserId]);

  useEffect(() => {
    const IS_IOS = Platform.OS === 'ios';
    const SHOW = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const HIDE = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';
    const DURATION = IS_IOS ? 250 : 150;

    const onShow = e => Animated.timing(kbAnim, { toValue: e.endCoordinates.height, duration: DURATION, useNativeDriver: false }).start();
    const onHide = () => Animated.timing(kbAnim, { toValue: 0, duration: DURATION, useNativeDriver: false }).start();

    const s1 = Keyboard.addListener(SHOW, onShow);
    const s2 = Keyboard.addListener(HIDE, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, [kbAnim]);

  // Flash animation for scroll-to-reply
  const flashMessage = useCallback((messageId) => {
    setHighlightedMessageId(messageId);
    highlightAnim.setValue(0);
    Animated.sequence([
      Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(highlightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start(() => {
      setHighlightedMessageId(null);
    });
  }, [highlightAnim]);

  const scrollToMessage = useCallback((messageId) => {
    const index = invertedMessages.findIndex(m => m._id === messageId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setTimeout(() => flashMessage(messageId), 300);
    }
  }, [invertedMessages, flashMessage]);

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImagePreview) return;
    
    try {
      setIsSending(true);
      let imageUrl = null;
      let messageType = 'text';

      if (selectedImagePreview) {
          setIsUploading(true);
          const formData = new FormData();
          formData.append('image', {
              uri: selectedImagePreview.uri,
              type: selectedImagePreview.type,
              name: selectedImagePreview.fileName || 'upload.jpg',
          });
          const res = await apiClient.post('/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          imageUrl = res.data.imageUrl;
          messageType = 'image';
          setIsUploading(false);
      }

      const newMessage = {
        _id: Date.now().toString(),
        sender: user._id,
        receiver: targetUserId,
        content: inputText.trim() || (imageUrl ? '📸 Image' : ''),
        messageType,
        imageUrl,
        replyTo: replyingTo ? replyingTo : null,
        createdAt: new Date().toISOString(),
      };

      dispatch(addOptimisticMessage(newMessage));

      const socket = getSocket();
      if (socket) {
        socket.emit('send_message', {
            ...newMessage,
            replyTo: replyingTo?._id || null
        });
      }

      setInputText('');
      setSelectedImagePreview(null);
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send');
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    setSelectedImagePreview(result.assets[0]);
  };

  // Render message - NOT wrapped in useCallback to ensure highlightedMessageId updates propagate
  const renderMessage = ({ item }) => {
    const isMe = item.sender === user?._id;
    const isHighlighted = highlightedMessageId === item._id;

    const renderSwipeActions = () => (
      <View style={styles.swipeAction}>
          <Icon name="arrow-undo" size={24} color="#FFF" />
      </View>
    );

    const highlightBg = isHighlighted
      ? highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(37, 99, 235, 0)', 'rgba(37, 99, 235, 0.25)'],
        })
      : 'transparent';

    // Call log messages
    if (item.messageType && ['audio_call', 'video_call', 'missed_call'].includes(item.messageType)) {
      return (
        <View style={isMe ? styles.rowRight : styles.rowLeft}>
          <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble, { minWidth: 200 }]}>
            <View style={styles.callContent}>
              <View style={styles.callIconContainer}>
                <Icon name={item.messageType === 'video_call' ? 'videocam' : 'call'} size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bubbleText, { fontWeight: '600' }]}>
                  {item.messageType === 'missed_call' ? 'Missed call' : (item.messageType === 'video_call' ? 'Video call' : 'Voice call')}
                </Text>
                <Text style={styles.callDuration}>
                  {item.messageType === 'missed_call' ? 'No answer' : `${Math.floor((item.duration || 0)/60)}m ${(item.duration || 0)%60}s`}
                </Text>
              </View>
            </View>
            <Text style={styles.ts}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <Swipeable
        ref={ref => {
          if (ref) swipeableRefs.current.set(item._id, ref);
          else swipeableRefs.current.delete(item._id);
        }}
        renderRightActions={isMe ? renderSwipeActions : null}
        renderLeftActions={!isMe ? renderSwipeActions : null}
        onSwipeableOpen={(direction) => {
          const ref = swipeableRefs.current.get(item._id);
          if (ref) ref.close();
          setReplyingTo(item);
        }}
        friction={2}
        overshootFriction={8}
      >
        <Animated.View style={[
          { backgroundColor: highlightBg, borderRadius: 12, marginHorizontal: -4, paddingHorizontal: 4 }
        ]}>
          <View style={isMe ? styles.rowRight : styles.rowLeft}>
            <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
              {item.replyTo && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => scrollToMessage(item.replyTo._id)}
                  >
                    <View style={styles.replyInBubble}>
                        <Text style={[styles.replyInBubbleName, { color: item.replyTo.sender === user?._id ? '#4ADE80' : '#38BDF8' }]}>
                            {item.replyTo.sender === user?._id ? 'You' : personaName}
                        </Text>
                        <Text style={styles.replyInBubbleText} numberOfLines={1}>
                            {item.replyTo.content}
                        </Text>
                    </View>
                  </TouchableOpacity>
              )}

              {item.messageType === 'image' && (
                  <TouchableOpacity onPress={() => setSelectedImage(item.imageUrl)} activeOpacity={0.9}>
                      <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
                  </TouchableOpacity>
              )}

              <Text style={styles.bubbleText}>{item.content}</Text>
              <View style={styles.bubbleFooter}>
                <Text style={styles.ts}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {isMe && <Icon name="checkmark-done" size={15} color={item.isRead ? '#53BDEB' : '#8696A0'} style={{ marginLeft: 3 }} />}
              </View>
            </View>
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  const bgColor = WALLPAPERS.find(w => w.id === selectedWallpaper)?.color ?? '#0B141B';

  return (
    <View style={styles.root}>
      <StatusBar translucent={false} backgroundColor="#1B262E" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChatProfileScreen', { personaName, themeColor })} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatar}><Icon name="person" size={20} color="#94A3B8" /></View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerName} numberOfLines={1}>{personaName}</Text>
              <View style={styles.onlineRow}>
                <View style={[styles.onlineDot, !isOnline && { backgroundColor: '#8696A0' }]} />
                <Text style={styles.headerStatus}>{isOnline ? 'online' : 'offline'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          {isTherapistChat && (
              <>
                <TouchableOpacity style={styles.hBtn} onPress={() => navigation.navigate('CallingScreen', { personaName, isVideo: true, receiverId: targetUserId })}><Icon name="videocam" size={21} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity style={styles.hBtn} onPress={() => navigation.navigate('CallingScreen', { personaName, isVideo: false, receiverId: targetUserId })}><Icon name="call" size={20} color="#FFF" /></TouchableOpacity>
              </>
          )}
          <TouchableOpacity style={styles.hBtn} onPress={() => setIsMenuOpen(true)}><Icon name="ellipsis-vertical" size={20} color="#FFF" /></TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.contentArea, { paddingBottom: kbAnim }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        
        {isLoading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color={themeColor} /></View>
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            data={invertedMessages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            extraData={highlightedMessageId}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }}
          />
        )}

        {/* Reply & Image Preview */}
        {(replyingTo || selectedImagePreview) && (
            <View style={styles.previewContainer}>
                {replyingTo && (
                    <View style={styles.replyPreview}>
                        <View style={[styles.replyLine, { backgroundColor: themeColor }]} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.replyName, { color: themeColor }]}>{replyingTo.sender === user?._id ? 'You' : personaName}</Text>
                            <Text style={styles.replyText} numberOfLines={1}>{replyingTo.content}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}><Icon name="close-circle" size={20} color="#8596A0" /></TouchableOpacity>
                    </View>
                )}
                {selectedImagePreview && (
                    <View style={styles.imagePreview}>
                        <Image source={{ uri: selectedImagePreview.uri }} style={styles.thumbImage} />
                        <TouchableOpacity onPress={() => setSelectedImagePreview(null)} style={styles.closeThumb}><Icon name="close-circle" size={24} color="#EF4444" /></TouchableOpacity>
                    </View>
                )}
            </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 4 }]}>
          <View style={styles.inputBox}>
            <TouchableOpacity onPress={handleSelectImage} style={styles.attachBtn} disabled={isUploading || isSending}>
              {isUploading ? <ActivityIndicator size="small" color="#8596A0" /> : <Icon name="image-outline" size={24} color="#8596A0" />}
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder={selectedImagePreview ? "Add a caption…" : "Message"} placeholderTextColor="#8596A0" value={inputText} onChangeText={setInputText} multiline />
          </View>
          <TouchableOpacity 
            style={[styles.sendBtn, { backgroundColor: (inputText.trim() || selectedImagePreview) ? themeColor : '#2D373F' }]} 
            onPress={sendMessage} 
            disabled={(!inputText.trim() && !selectedImagePreview) || isSending}
          >
            {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Icon name="send" size={20} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}>
        <ImageViewer imageUrls={[{ url: selectedImage }]} enableSwipeDown onSwipeDown={() => setSelectedImage(null)} renderHeader={() => (
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.closeModal}><Icon name="close" size={25} color="#FFF" /></TouchableOpacity>
        )} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B141B' },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 10, backgroundColor: '#1B262E' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2D373F', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  headerName: { fontSize: 17, fontWeight: 'bold', color: '#E9EDEF' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#25D366', marginRight: 5 },
  headerStatus: { fontSize: 12, color: '#8696A0' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  hBtn: { padding: 8 },
  contentArea: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 },
  rowRight: { alignSelf: 'flex-end', marginBottom: 4, maxWidth: '85%' },
  rowLeft: { alignSelf: 'flex-start', marginBottom: 4, maxWidth: '85%' },
  bubble: { borderRadius: 12, paddingVertical: 6, paddingHorizontal: 11, minWidth: 80 },
  myBubble: { backgroundColor: '#005C4B', borderTopRightRadius: 2 },
  theirBubble: { backgroundColor: '#202C33', borderTopLeftRadius: 2 },
  bubbleText: { fontSize: 16, color: '#E9EDEF', lineHeight: 21 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  ts: { fontSize: 11, color: '#8696A0' },
  chatImage: { width: 240, height: 240, borderRadius: 10, marginBottom: 8 },
  callContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  callIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  callDuration: { fontSize: 12, color: '#8696A0', marginTop: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 6, paddingHorizontal: 8, backgroundColor: '#0B141B' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#202C33', borderRadius: 24, paddingHorizontal: 14, marginRight: 8, minHeight: 48 },
  input: { flex: 1, color: '#E9EDEF', fontSize: 16, paddingVertical: 8, maxHeight: 110 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  previewContainer: { backgroundColor: '#202C33', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 4 },
  replyPreview: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, margin: 4 },
  replyLine: { width: 3, height: '100%', borderRadius: 2 },
  replyName: { fontSize: 13, fontWeight: '700' },
  replyText: { color: '#8696A0', fontSize: 13 },
  imagePreview: { padding: 10, position: 'relative' },
  thumbImage: { width: 80, height: 80, borderRadius: 8 },
  closeThumb: { position: 'absolute', top: 0, right: 0 },
  replyInBubble: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: '#25D366' },
  replyInBubbleName: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  replyInBubbleText: { fontSize: 12, color: '#8696A0' },
  swipeAction: { width: 50, justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 99, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
  attachBtn: { paddingRight: 10 },
});

export default ChatScreen;