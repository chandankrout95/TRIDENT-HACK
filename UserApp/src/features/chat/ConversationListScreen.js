import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, RefreshControl, Image
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getSocket } from '../../services/socket';
import apiClient from '../../services/apiClient';

const ConversationListScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(s => s.auth);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const { data } = await apiClient.get('/chat/conversations');
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
    }, [])
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onReceiveMessage = (message) => {
      // Only update for messages involving this user
      if (message.sender !== user?._id && message.receiver !== user?._id) return;
      
      setConversations(prev => {
        const partnerId =
          message.sender === user?._id ? message.receiver : message.sender;

        const exists = prev.find(c => c.partnerId === partnerId);

        if (exists) {
          return prev.map(c => {
            if (c.partnerId === partnerId) {
              return {
                ...c,
                lastMessage: {
                  _id: message._id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                // Only increment unread for messages FROM others
                unreadCount:
                  message.sender !== user?._id
                    ? c.unreadCount + 1
                    : c.unreadCount,
              };
            }
            return c;
          }).sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || 0;
            const bTime = b.lastMessage?.createdAt || 0;
            return new Date(bTime) - new Date(aTime);
          });
        } else {
          const newConvo = {
            partnerId,
            partnerName: message.senderName || message.sender,
            partnerRole: 'therapist',
            lastMessage: {
              _id: message._id,
              content: message.content,
              sender: message.sender,
              createdAt: message.createdAt,
            },
            // Only count as unread if from someone else
            unreadCount: message.sender !== user?._id ? 1 : 0,
          };
          return [newConvo, ...prev];
        }
      });
    };

    // For sent messages, just update the last message but never increment unread
    const onMessageSent = (message) => {
      setConversations(prev => {
        const partnerId = message.receiver;
        const exists = prev.find(c => c.partnerId === partnerId);

        if (exists) {
          return prev.map(c => {
            if (c.partnerId === partnerId) {
              return {
                ...c,
                lastMessage: {
                  _id: message._id,
                  content: message.content,
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                // Don't change unread for own sent messages
              };
            }
            return c;
          }).sort((a, b) => {
            const aTime = a.lastMessage?.createdAt || 0;
            const bTime = b.lastMessage?.createdAt || 0;
            return new Date(bTime) - new Date(aTime);
          });
        }
        return prev;
      });
    };

    socket.on('receive_message', onReceiveMessage);
    socket.on('message_sent', onMessageSent);
    return () => {
      socket.off('receive_message', onReceiveMessage);
      socket.off('message_sent', onMessageSent);
    };
  }, [user?._id]);

  const getTimeLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const openChat = (convo) => {
    setConversations(prev =>
      prev.map(c =>
        c.partnerId === convo.partnerId ? { ...c, unreadCount: 0 } : c
      )
    );
    navigation.navigate('ChatScreen', {
      therapistId: convo.partnerId,
      persona: convo.partnerName,
      personaColor: '#2563EB',
    });
  };

  const renderConversation = ({ item, index }) => {
    const isUnread = item.unreadCount > 0;
    const isFromMe = item.lastMessage?.sender === user?._id;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
        <TouchableOpacity
          style={styles.convoRow}
          activeOpacity={0.7}
          onPress={() => openChat(item)}
        >
          <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isUnread ? '#FFF' : '#6B7280' }}>
              {item.partnerName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>

          <View style={styles.convoContent}>
            <View style={styles.convoTopRow}>
              <Text style={[styles.convoName, isUnread && styles.convoNameUnread]} numberOfLines={1}>
                {item.partnerName}
              </Text>
              <Text style={[styles.convoTime, isUnread && { color: '#2563EB', fontWeight: '800' }]}>
                {getTimeLabel(item.lastMessage?.createdAt)}
              </Text>
            </View>
            <View style={styles.convoBottomRow}>
              <Text style={[styles.convoPreview, isUnread && styles.convoPreviewUnread]} numberOfLines={1}>
                {isFromMe ? 'You: ' : ''}{item.lastMessage?.content || 'No messages yet'}
              </Text>
              {isUnread && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.list}>
      {[1, 2, 3, 4, 5].map((_, i) => (
        <View key={i} style={styles.convoRow}>
          <View style={[styles.avatar, { backgroundColor: '#F3F4F6' }]} />
          <View style={styles.convoContent}>
            <View style={[styles.convoTopRow, { marginBottom: 8 }]}>
              <View style={{ width: 120, height: 16, backgroundColor: '#F3F4F6', borderRadius: 8 }} />
              <View style={{ width: 40, height: 12, backgroundColor: '#F3F4F6', borderRadius: 6 }} />
            </View>
            <View style={{ width: 200, height: 14, backgroundColor: '#F3F4F6', borderRadius: 7 }} />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => fetchConversations(true)} style={styles.refreshBtn}>
          <Icon name="refresh" size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {isLoading ? renderSkeleton() : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            Book a session with a therapist to start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.partnerId}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchConversations(true); }}
              colors={['#2563EB']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#111827' },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  convoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
    marginBottom: 12, backgroundColor: '#FFF', borderRadius: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarUnread: { backgroundColor: '#2563EB' },
  convoContent: { flex: 1 },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  convoName: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  convoNameUnread: { fontWeight: '800' },
  convoTime: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  convoBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoPreview: { fontSize: 14, color: '#6B7280', flex: 1, fontWeight: '500' },
  convoPreviewUnread: { color: '#111827', fontWeight: '700' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginLeft: 8, paddingHorizontal: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' }
});

export default ConversationListScreen;
