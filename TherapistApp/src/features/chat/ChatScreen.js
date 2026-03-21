import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
  AppState,
  Image,
  Alert,
  Modal,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChatHistory, addOptimisticMessage, receiveMessage } from '../../store/chatSlice';
import { getSocket } from '../../services/socket';
import apiClient from '../../services/apiClient';
import { launchImageLibrary } from 'react-native-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Swipeable } from 'react-native-gesture-handler';

const ChatScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [inputText, setInputText] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Full screen preview
  const [selectedImagePreview, setSelectedImagePreview] = useState(null); // Selected to send
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  
  const { messages, isLoading } = useSelector(state => state.chat);
  const { therapist } = useSelector(state => state.auth);
  const flatListRef = useRef();
  const socketListenerRef = useRef(false);
  const swipeableRefs = useRef(new Map());
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const kbAnim = useRef(new Animated.Value(0)).current;

  const clientName = route?.params?.clientName || 'Client';
  const targetUserId = route?.params?.clientId || '000000000000000000000000';

  // Invert messages for FlatList inverted prop
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Fetch chat history
  useEffect(() => {
    dispatch(fetchChatHistory(targetUserId));
  }, [dispatch, targetUserId]);

  // Handle Foreground / AppState refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        dispatch(fetchChatHistory(targetUserId));
        const socket = getSocket();
        if (socket) socket.emit('check_online_status', targetUserId);
      }
    });
    return () => subscription.remove();
  }, [dispatch, targetUserId]);

  // Mark messages as read
  useFocusEffect(
    useCallback(() => {
      apiClient.patch('/chat/read', { senderId: targetUserId }).catch(() => { });
    }, [targetUserId])
  );

  // Keyboard animation for proper keyboard avoidance
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

  // Socket listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket || socketListenerRef.current) return;
    socketListenerRef.current = true;

    const onUserStatus = (data) => {
      if (data.userId === targetUserId) {
        setIsOnline(data.isOnline);
      }
    };

    socket.on('user_status', onUserStatus);
    socket.emit('check_online_status', targetUserId);

    return () => {
      socket.off('user_status', onUserStatus);
      socketListenerRef.current = false;
    };
  }, [targetUserId, therapist?._id, dispatch]);

  // Flash animation for scroll-to-reply
  const flashMessage = (messageId) => {
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
  };

  const scrollToMessage = (messageId) => {
    const index = invertedMessages.findIndex(m => m._id === messageId);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setTimeout(() => flashMessage(messageId), 300);
    }
  };

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
        sender: therapist._id,
        receiver: targetUserId,
        content: inputText.trim() || (imageUrl ? '📸 Image' : ''),
        messageType,
        imageUrl,
        replyTo: replyingTo ? replyingTo : null,
        createdAt: new Date().toISOString(),
      };

      dispatch(addOptimisticMessage(newMessage));

      // Emit with populated replyTo if possible (or handle locally)
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
      Alert.alert('Error', 'Failed to send message');
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

  const renderReplyPreview = (message) => {
      if (!message) return null;
      const isMe = message.sender === therapist?._id;
      return (
          <View style={styles.replyPreviewContainer}>
              <View style={[styles.replyLine, { backgroundColor: isMe ? '#4338CA' : '#10B981' }]} />
              <View style={styles.replyContent}>
                  <Text style={[styles.replyName, { color: isMe ? '#4338CA' : '#10B981' }]}>
                      {isMe ? 'You' : clientName}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={1}>
                      {message.messageType === 'image' ? '📸 Image' : message.content}
                  </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.closeReply}>
                  <Icon name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
          </View>
      );
  };

  const renderMessageContent = (item) => {
      const isMe = item.sender === therapist?._id;

      return (
          <View>
              {item.replyTo && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => scrollToMessage(item.replyTo._id)}
                  >
                    <View style={[styles.replyInBubble, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Text style={[styles.replyInBubbleName, { color: item.replyTo.sender === therapist?._id ? '#C7D2FE' : '#4338CA' }]}>
                            {item.replyTo.sender === therapist?._id ? 'You' : clientName}
                        </Text>
                        <Text style={[styles.replyInBubbleText, isMe && { color: '#E0E7FF' }]} numberOfLines={1}>
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
              
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                  {item.content}
              </Text>
          </View>
      );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === therapist?._id;
    const isHighlighted = highlightedMessageId === item._id;

    const renderRightActions = () => (
        <View style={styles.swipeAction}>
            <Icon name="arrow-undo" size={24} color="#4338CA" />
        </View>
    );

    const highlightBg = isHighlighted
      ? highlightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(67, 56, 202, 0)', 'rgba(67, 56, 202, 0.15)'],
        })
      : 'transparent';

    return (
      <Swipeable
        ref={ref => {
          if (ref) swipeableRefs.current.set(item._id, ref);
          else swipeableRefs.current.delete(item._id);
        }}
        renderRightActions={isMe ? renderRightActions : null}
        renderLeftActions={!isMe ? renderRightActions : null}
        onSwipeableOpen={(direction) => {
          // Immediately close to snap back
          const ref = swipeableRefs.current.get(item._id);
          if (ref) ref.close();
          // Instantly set reply
          setReplyingTo(item);
        }}
        friction={2}
        overshootFriction={8}
      >
        <Animated.View style={[
          { backgroundColor: highlightBg, borderRadius: 20, marginHorizontal: -4, paddingHorizontal: 4 }
        ]}>
          <View style={[styles.messageRow, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
              {/* Call Logs */}
              {item.messageType && ['audio_call', 'video_call', 'missed_call'].includes(item.messageType) ? (
                  <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, styles.callBubble]}>
                    <View style={styles.callContent}>
                      <View style={styles.callIconContainer}>
                          <Icon name={item.messageType === 'video_call' ? 'videocam' : 'call'} size={20} color={isMe ? '#FFF' : '#4338CA'} />
                      </View>
                      <View style={styles.callInfo}>
                          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText, { fontWeight: '600' }]}>
                              {item.messageType === 'missed_call' ? 'Missed call' : (item.messageType === 'video_call' ? 'Video call' : 'Voice call')}
                          </Text>
                          <Text style={[styles.callLogDuration, isMe ? { color: '#C7D2FE' } : { color: '#6B7280' }]}>
                              {item.messageType === 'missed_call' ? 'No answer' : `${Math.floor((item.duration || 0)/60)}m ${item.duration%60}s`}
                          </Text>
                      </View>
                    </View>
                    <Text style={[styles.timestamp, !isMe && { color: 'rgba(0,0,0,0.4)' }]}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
              ) : (
                  <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                      {renderMessageContent(item)}
                      <View style={styles.bubbleFooter}>
                          <Text style={[styles.timestamp, !isMe && { color: 'rgba(0,0,0,0.35)' }]}>
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          {isMe && <Icon name="checkmark-done" size={15} color={item.isRead ? '#53BDEB' : '#8696A0'} style={{ marginLeft: 3 }} />}
                      </View>
                  </View>
              )}
          </View>
        </Animated.View>
      </Swipeable>
    );
  };

  return (
    <Animated.View style={[styles.container, { paddingBottom: kbAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarSmall}>
            <Icon name="person" size={18} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle} numberOfLines={1}>{clientName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <View style={[styles.onlineDot, !isOnline && { backgroundColor: '#8696A0' }]} />
              <Text style={styles.headerSub}>{isOnline ? 'online' : 'offline'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.hBtn} onPress={() => navigation.navigate('CallingScreen', { personaName: clientName, isVideo: true, receiverId: targetUserId })}>
            <Icon name="videocam" size={22} color="#4338CA" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hBtn} onPress={() => navigation.navigate('CallingScreen', { personaName: clientName, isVideo: false, receiverId: targetUserId })}>
            <Icon name="call" size={20} color="#4338CA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      <View style={{ flex: 1 }}>
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4338CA" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              inverted
              data={invertedMessages}
              keyExtractor={item => item._id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
              }}
            />
          )}

          {/* Attachments Preview Area */}
          {(replyingTo || selectedImagePreview) && (
              <View style={styles.previewContainer}>
                  {replyingTo && renderReplyPreview(replyingTo)}
                  {selectedImagePreview && (
                      <View style={styles.imagePreviewBox}>
                         <Image source={{ uri: selectedImagePreview.uri }} style={styles.thumbImage} />
                         <TouchableOpacity onPress={() => setSelectedImagePreview(null)} style={styles.closeThumb}>
                             <Icon name="close-circle" size={24} color="#EF4444" />
                         </TouchableOpacity>
                      </View>
                  )}
              </View>
          )}

          {/* Input */}
          <View style={[styles.inputContainer, (replyingTo || selectedImagePreview) && styles.inputContainerWithPreview]}>
            <TouchableOpacity onPress={handleSelectImage} style={styles.attachBtn} disabled={isUploading || isSending}>
              {isUploading ? <ActivityIndicator size="small" color="#9CA3AF" /> : <Icon name="image-outline" size={24} color="#9CA3AF" />}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={selectedImagePreview ? "Add a caption…" : "Type a message…"}
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              disabled={isSending}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() && !selectedImagePreview) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={(!inputText.trim() && !selectedImagePreview) || isSending}
            >
              {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Icon name="send" size={20} color="#FFF" />}
            </TouchableOpacity>
          </View>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <ImageViewer
          imageUrls={[{ url: selectedImage }]}
          enableSwipeDown={true}
          onSwipeDown={() => setSelectedImage(null)}
          renderHeader={() => (
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.closeModal}>
              <Icon name="close" size={25} color="#FFF" />
            </TouchableOpacity>
          )}
        />
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  backBtn: { paddingRight: 12 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4338CA', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#9CA3AF' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 5 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  hBtn: { marginLeft: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatList: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 12, maxWidth: '85%' },
  messageBubble: { padding: 12, borderRadius: 20 },
  myMessage: { backgroundColor: '#4338CA', borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#FFF' },
  theirMessageText: { color: '#111827' },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  callBubble: { minWidth: 200 },
  callContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  callIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  callInfo: { flex: 1 },
  callLogDuration: { fontSize: 12 },
  chatImage: { width: 240, height: 240, borderRadius: 16, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#F3F4F6' },
  inputContainerWithPreview: { borderTopWidth: 0 },
  attachBtn: { padding: 10 },
  input: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, marginRight: 8, maxHeight: 120, color: '#111827' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4338CA', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#C7D2FE' },
  previewContainer: { backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#F3F4F6' },
  replyPreviewContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#F9FAFB', borderLeftWidth: 0 },
  replyLine: { width: 4, borderRadius: 2 },
  replyContent: { flex: 1, marginLeft: 12 },
  replyName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  replyText: { fontSize: 13, color: '#6B7280' },
  closeReply: { padding: 4 },
  imagePreviewBox: { padding: 12, flexDirection: 'row' },
  thumbImage: { width: 100, height: 100, borderRadius: 12 },
  closeThumb: { position: 'absolute', top: 4, right: 4 },
  replyInBubble: { padding: 8, borderRadius: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#4338CA' },
  replyInBubbleName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  replyInBubbleText: { fontSize: 12, color: '#6B7280' },
  swipeAction: { width: 60, justifyContent: 'center', alignItems: 'center' },
  closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 99, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25 },
});

export default ChatScreen;
