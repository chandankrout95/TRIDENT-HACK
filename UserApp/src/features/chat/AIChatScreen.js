import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  Platform, ActivityIndicator, StatusBar, Keyboard, Animated, Alert,
  NativeModules,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import apiClient from '../../services/apiClient';
import Tts from 'react-native-tts';

const { SpeechRecognizer } = NativeModules;

// ─── Constants ────────────────────────────────────────────────────────────────
const PERSONA_EMOJI = {
  Girlfriend: '💕', Bestfriend: '🤝', Mother: '🌹',
  Father: '🛡️', Brother: '🎮', Sister: '🌸',
  'Personal AI Therapist': '🩺',
};

const LANGUAGES = [
  { code: 'en-IN', label: 'EN', ttsLang: 'en-IN' },
  { code: 'hi-IN', label: 'हि', ttsLang: 'hi-IN' },
];

// ─── TTS Setup ────────────────────────────────────────────────────────────────
try {
  Tts.setDefaultRate(0.5);
  Tts.setDefaultPitch(1.0);
  Tts.setIgnoreSilentSwitch('ignore');
} catch (e) { }

const AIChatScreen = ({ route }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const kbAnim = useRef(new Animated.Value(0)).current;
  const waitingVoiceReply = useRef(false);

  const { user } = useSelector(s => s.auth);

  const persona = route?.params?.persona || 'Personal AI Therapist';
  const themeColor = route?.params?.personaColor || '#2563EB';
  const personaIcon = route?.params?.personaIcon || 'chatbubble-ellipses';
  const emoji = PERSONA_EMOJI[persona] || '🤖';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Voice states
  const [voiceMode, setVoiceMode] = useState(false);
  const [langIndex, setLangIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMessageIds, setVoiceMessageIds] = useState(new Set());

  const currentLang = LANGUAGES[langIndex];

  // ─── Fetch Chat History ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/ai-chat/${encodeURIComponent(persona)}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Failed to fetch AI chat history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [persona]);

  // ─── Socket Listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMsgSaved = (msg) => {
      if (msg.persona === persona) {
        setMessages(prev => {
          const filtered = prev.filter(m => m._id !== msg._id && m._id !== `opt_${msg.content}`);
          return [...filtered, msg];
        });
      }
    };

    const onAiResponse = (msg) => {
      if (msg.persona === persona) {
        setMessages(prev => [...prev, msg]);
        setIsSending(false);

        if (waitingVoiceReply.current) {
          waitingVoiceReply.current = false;
          setVoiceMessageIds(prev => new Set(prev).add(msg._id));
          if (msg.content) speakText(msg.content);
        }
      }
    };

    const onAiTyping = ({ persona: p, isTyping }) => {
      if (p === persona) setIsAiTyping(isTyping);
    };

    socket.on('ai_message_saved', onMsgSaved);
    socket.on('ai_response', onAiResponse);
    socket.on('ai_typing', onAiTyping);

    return () => {
      socket.off('ai_message_saved', onMsgSaved);
      socket.off('ai_response', onAiResponse);
      socket.off('ai_typing', onAiTyping);
    };
  }, [persona]);

  // ─── Keyboard animation ────────────────────────────────────────────────
  useEffect(() => {
    const IS_IOS = Platform.OS === 'ios';
    const SHOW = IS_IOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const HIDE = IS_IOS ? 'keyboardWillHide' : 'keyboardDidHide';
    const DUR = IS_IOS ? 250 : 150;

    const s1 = Keyboard.addListener(SHOW, e =>
      Animated.timing(kbAnim, { toValue: e.endCoordinates.height, duration: DUR, useNativeDriver: false }).start()
    );
    const s2 = Keyboard.addListener(HIDE, () =>
      Animated.timing(kbAnim, { toValue: 0, duration: DUR, useNativeDriver: false }).start()
    );

    return () => { s1.remove(); s2.remove(); };
  }, [kbAnim]);

  // ─── TTS Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    let startSub, finishSub, cancelSub;
    try {
      startSub = Tts.addEventListener('tts-start', () => setIsSpeaking(true));
      finishSub = Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
      cancelSub = Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
    } catch { }

    return () => {
      try { startSub?.remove(); finishSub?.remove(); cancelSub?.remove(); } catch { }
    };
  }, []);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // ─── TTS Speak ──────────────────────────────────────────────────────────
  const speakText = (text) => {
    try {
      Tts.stop();
      Tts.setDefaultLanguage(currentLang.ttsLang).catch(() => { });
      Tts.speak(text);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // ─── Speech Recognition (native Android Intent) ────────────────────────
  const startSpeechRecognition = async () => {
    if (!SpeechRecognizer) {
      Alert.alert('Not Available', 'Speech recognition is not supported on this device.');
      return;
    }

    try {
      try { Tts.stop(); } catch { }

      const spokenText = await SpeechRecognizer.startSpeechToText(currentLang.code);

      if (spokenText && spokenText.trim()) {
        if (voiceMode) {
          // Auto-send in voice mode
          sendMessageWithText(spokenText.trim(), true);
        } else {
          // Fill input in text mode
          setInputText(prev => prev ? prev + ' ' + spokenText.trim() : spokenText.trim());
        }
      }
    } catch (err) {
      if (err.code !== 'CANCELLED') {
        console.warn('Speech recognition error:', err);
        Alert.alert('Voice Error', err.message || 'Could not recognize speech.');
      }
    }
  };

  // ─── Send Message ───────────────────────────────────────────────────────
  const sendMessageWithText = (text, fromVoice = false) => {
    if (!text.trim() || isSending) return;

    if (fromVoice) waitingVoiceReply.current = true;

    const optimistic = {
      _id: `opt_${Date.now()}`,
      sender: user._id,
      persona,
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimistic]);
    setInputText('');
    setIsSending(true);

    const socket = getSocket();
    if (socket) {
      socket.emit('send_ai_message', {
        userId: user._id,
        persona,
        content: text.trim(),
      });
    }
  };

  const sendMessage = () => sendMessageWithText(inputText, false);

  const clearChat = () => {
    Alert.alert('Clear Conversation', `Delete all messages with ${persona}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/ai-chat/${encodeURIComponent(persona)}`);
            setMessages([]);
            setVoiceMessageIds(new Set());
          } catch (err) {
            Alert.alert('Error', 'Failed to clear chat');
          }
        }
      }
    ]);
  };

  const toggleLanguage = () => {
    const next = (langIndex + 1) % LANGUAGES.length;
    setLangIndex(next);
    try { Tts.stop(); } catch { }
  };

  // ─── Render Message ─────────────────────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isMe = item.role === 'user';
    const showSpeaker = !isMe && voiceMessageIds.has(item._id);

    return (
      <View style={isMe ? styles.rowRight : styles.rowLeft}>
        {!isMe && (
          <View style={[styles.aiAvatar, { backgroundColor: themeColor + '30' }]}>
            <Icon name={personaIcon} size={16} color={themeColor} />
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : [styles.theirBubble, { borderLeftColor: themeColor }]]}>
          <Text style={styles.bubbleText}>{item.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={styles.ts}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {showSpeaker && (
              <TouchableOpacity onPress={() => speakText(item.content)} style={{ marginLeft: 8 }}>
                <Icon name="volume-medium" size={16} color={themeColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isAiTyping) return null;
    return (
      <View style={styles.rowLeft}>
        <View style={[styles.aiAvatar, { backgroundColor: themeColor + '30' }]}>
          <Icon name={personaIcon} size={16} color={themeColor} />
        </View>
        <View style={[styles.bubble, styles.theirBubble, { borderLeftColor: themeColor }]}>
          <View style={styles.typingDots}>
            <ActivityIndicator size="small" color={themeColor} />
            <Text style={[styles.typingText, { color: themeColor }]}> thinking...</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent={false} backgroundColor="#1B262E" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => { try { Tts.stop(); } catch { } navigation.goBack(); }} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: themeColor + '30' }]}>
            <Icon name={personaIcon} size={20} color={themeColor} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName} numberOfLines={1}>{emoji} {persona}</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: '#25D366' }]} />
              <Text style={styles.headerStatus}>
                {isSpeaking ? 'Speaking...' : isAiTyping ? 'Typing...' : 'Always online'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Voice Call Button */}
          <TouchableOpacity
            style={[styles.hBtn, { backgroundColor: '#25D366', borderRadius: 20 }]}
            onPress={() => navigation.navigate('AICallingScreen', { persona, personaColor: themeColor, personaIcon })}
          >
            <Icon name="call" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.hBtn} onPress={clearChat}>
            <Icon name="trash-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.contentArea, { paddingBottom: kbAnim }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0B141B' }]} />

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
            ListHeaderComponent={renderTypingIndicator}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 4 }]}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={`Message ${persona}...`}
              placeholderTextColor="#8596A0"
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isSending}
            />
          </View>

          {/* Mic Button — opens system speech recognizer
          <TouchableOpacity
            onPress={startSpeechRecognition}
            disabled={isSending}
            style={[styles.micBtn, isSending && { opacity: 0.5 }]}
          >
            <Icon name="mic" size={22} color="#FFF" />
          </TouchableOpacity> */}

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? themeColor : '#2D373F' }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Icon name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B141B' },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 10, backgroundColor: '#1B262E' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  headerName: { fontSize: 17, fontWeight: 'bold', color: '#E9EDEF' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  headerStatus: { fontSize: 12, color: '#8696A0' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  hBtn: { padding: 8 },
  langBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
  langText: { fontSize: 12, fontWeight: 'bold' },
  contentArea: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 },
  rowRight: { alignSelf: 'flex-end', marginBottom: 6, maxWidth: '85%' },
  rowLeft: { alignSelf: 'flex-start', marginBottom: 6, maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-end' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 2 },
  bubble: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, minWidth: 60 },
  myBubble: { backgroundColor: '#005C4B', borderTopRightRadius: 2 },
  theirBubble: { backgroundColor: '#202C33', borderTopLeftRadius: 2, borderLeftWidth: 3 },
  bubbleText: { fontSize: 16, color: '#E9EDEF', lineHeight: 22 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  ts: { fontSize: 11, color: '#8696A0' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 6, paddingHorizontal: 8, backgroundColor: '#0B141B' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#202C33', borderRadius: 24, paddingHorizontal: 14, marginRight: 6, minHeight: 48 },
  input: { flex: 1, color: '#E9EDEF', fontSize: 16, paddingVertical: 8, maxHeight: 110 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2D373F', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  typingDots: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  typingText: { fontSize: 13, fontStyle: 'italic' },
});

export default AIChatScreen;
