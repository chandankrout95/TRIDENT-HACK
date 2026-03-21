/**
 * Skeleton.js — Reusable shimmer skeleton loader
 *
 * Usage:
 *   import { SkeletonBox, SkeletonCircle, ChatSkeleton, ProfileSkeleton } from '.../Skeleton';
 *
 *   // Basic building blocks
 *   <SkeletonBox width={200} height={16} radius={8} />
 *   <SkeletonCircle size={40} />
 *
 *   // Pre-built skeletons for specific screens
 *   <ChatSkeleton />
 *   <ProfileSkeleton />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Shimmer animation hook ────────────────────────────────────────────────────
const useShimmer = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return opacity;
};

// ─── Base skeleton primitives ─────────────────────────────────────────────────
export const SkeletonBox = ({ width = '100%', height = 14, radius = 8, style }) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        skStyles.base,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

export const SkeletonCircle = ({ size = 40, style }) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        skStyles.base,
        { width: size, height: size, borderRadius: size / 2, opacity },
        style,
      ]}
    />
  );
};

// ─── Chat screen skeleton ──────────────────────────────────────────────────────
// Mimics the inverted message list — alternating right/left bubbles
const ChatBubble = ({ side = 'right', wide = false }) => (
  <View
    style={{
      width: '100%',
      alignItems: side === 'right' ? 'flex-end' : 'flex-start',
      marginBottom: 10,
      paddingHorizontal: 12,
    }}
  >
    <SkeletonBox
      width={wide ? '72%' : '48%'}
      height={40}
      radius={12}
    />
    <SkeletonBox width={50} height={9} radius={4} style={{ marginTop: 4 }} />
  </View>
);

export const ChatSkeleton = ({ dark = true }) => (
  <View style={{ flex: 1, paddingTop: 16 }}>
    <ChatBubble side="left"  wide={false} />
    <ChatBubble side="right" wide={true}  />
    <ChatBubble side="left"  wide={true}  />
    <ChatBubble side="right" wide={false} />
    <ChatBubble side="left"  wide={false} />
    <ChatBubble side="right" wide={true}  />
    <ChatBubble side="left"  wide={true}  />
    <ChatBubble side="right" wide={false} />
  </View>
);

// ─── Profile screen skeleton ───────────────────────────────────────────────────
const MenuItemSkel = () => (
  <View style={skStyles.menuRow}>
    <SkeletonCircle size={40} style={{ borderRadius: 12 }} />
    <View style={{ flex: 1, marginLeft: 14 }}>
      <SkeletonBox width="55%" height={13} radius={6} />
    </View>
    <SkeletonBox width={18} height={18} radius={9} />
  </View>
);

export const ProfileSkeleton = () => (
  <View style={{ paddingHorizontal: 20 }}>
    {/* Profile card */}
    <View style={skStyles.card}>
      <SkeletonCircle size={88} style={{ marginBottom: 14 }} />
      <SkeletonBox width={140} height={16} radius={8} style={{ marginBottom: 8 }} />
      <SkeletonBox width={100} height={11} radius={6} style={{ marginBottom: 20 }} />
      {/* Stats row */}
      <View style={skStyles.statsRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={skStyles.statCell}>
            <SkeletonBox width={36} height={18} radius={6} style={{ marginBottom: 6 }} />
            <SkeletonBox width={52} height={10} radius={4} />
          </View>
        ))}
      </View>
    </View>

    {/* Menu section 1 */}
    <SkeletonBox width={80} height={10} radius={4} style={{ marginTop: 24, marginBottom: 10 }} />
    <View style={skStyles.menuCard}>
      <MenuItemSkel />
      <View style={skStyles.divider} />
      <MenuItemSkel />
      <View style={skStyles.divider} />
      <MenuItemSkel />
    </View>

    {/* Menu section 2 */}
    <SkeletonBox width={60} height={10} radius={4} style={{ marginTop: 22, marginBottom: 10 }} />
    <View style={skStyles.menuCard}>
      <MenuItemSkel />
      <View style={skStyles.divider} />
      <MenuItemSkel />
      <View style={skStyles.divider} />
      <MenuItemSkel />
    </View>
  </View>
);

// ─── Sessions screen skeleton ─────────────────────────────────────────────────
const SessionCard = () => (
  <View style={skStyles.sessionCard}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <SkeletonCircle size={48} style={{ marginRight: 12, borderRadius: 24 }} />
      <View style={{ flex: 1 }}>
        <SkeletonBox width="55%" height={13} radius={6} style={{ marginBottom: 7 }} />
        <SkeletonBox width="38%" height={10} radius={5} />
      </View>
      <SkeletonBox width={72} height={26} radius={13} />
    </View>
    <View style={skStyles.sessionDivider} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <SkeletonBox width="38%" height={11} radius={5} />
      <SkeletonBox width="28%" height={11} radius={5} />
    </View>
  </View>
);

export const SessionsSkeleton = () => (
  <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
    <SessionCard />
    <SessionCard />
    <SessionCard />
    <SessionCard />
  </View>
);

// ─── Search results skeleton ──────────────────────────────────────────────────
const SearchResultCard = () => (
  <View style={skStyles.searchCard}>
    <SkeletonCircle size={50} style={{ marginRight: 14, borderRadius: 25 }} />
    <View style={{ flex: 1 }}>
      <SkeletonBox width="50%" height={13} radius={6} style={{ marginBottom: 7 }} />
      <SkeletonBox width="35%" height={10} radius={5} style={{ marginBottom: 7 }} />
      <SkeletonBox width="65%" height={10} radius={5} />
    </View>
    <SkeletonBox width={20} height={20} radius={10} />
  </View>
);

export const SearchSkeleton = () => (
  <View style={{ padding: 15 }}>
    <SearchResultCard />
    <SearchResultCard />
    <SearchResultCard />
    <SearchResultCard />
    <SearchResultCard />
  </View>
);

// ─── Home screen skeleton ─────────────────────────────────────────────────────
const HomeCardSkel = ({ rows = 1, height = 90 }) => (
  <View style={[skStyles.homeCard, { minHeight: height }]}>
    <SkeletonBox width="45%" height={14} radius={7} style={{ marginBottom: 14 }} />
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBox key={i} width={i % 2 === 0 ? '80%' : '60%'} height={11} radius={5} style={{ marginBottom: 8 }} />
    ))}
  </View>
);

export const HomeSkeleton = () => (
  <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
    {/* Mood row */}
    <View style={skStyles.homeCard}>
      <SkeletonBox width="45%" height={14} radius={7} style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <SkeletonCircle size={36} />
            <SkeletonBox width={28} height={9} radius={4} />
          </View>
        ))}
      </View>
    </View>

    {/* Health stats grid */}
    <SkeletonBox width="40%" height={11} radius={5} style={{ marginBottom: 10 }} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[skStyles.homeStatCard]}>
          <SkeletonCircle size={34} style={{ borderRadius: 10, marginBottom: 20 }} />
          <SkeletonBox width="60%" height={18} radius={6} style={{ marginBottom: 6 }} />
          <SkeletonBox width="75%" height={10} radius={4} />
        </View>
      ))}
    </View>

    {/* Graph card */}
    <HomeCardSkel rows={1} height={120} />

    {/* Wellness tracker */}
    <HomeCardSkel rows={3} height={100} />
  </View>
);

// ─── Notifications screen skeleton ───────────────────────────────────────────
const NotifCard = ({ wide = false }) => (
  <View style={skStyles.notifCard}>
    <SkeletonCircle size={44} style={{ borderRadius: 12, marginRight: 14 }} />
    <View style={{ flex: 1 }}>
      <SkeletonBox width={wide ? '65%' : '50%'} height={13} radius={6} style={{ marginBottom: 8 }} />
      <SkeletonBox width="88%" height={10} radius={5} style={{ marginBottom: 5 }} />
      <SkeletonBox width="70%" height={10} radius={5} style={{ marginBottom: 8 }} />
      <SkeletonBox width={52} height={9} radius={4} />
    </View>
  </View>
);

export const NotificationsSkeleton = () => (
  <View style={{ padding: 15 }}>
    <NotifCard wide={true} />
    <NotifCard wide={false} />
    <NotifCard wide={true} />
    <NotifCard wide={false} />
    <NotifCard wide={true} />
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────
const skStyles = StyleSheet.create({
  base:     { backgroundColor: '#CBD5E1' },
  card:     { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 24, alignItems: 'center', marginTop: 16 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 18 },
  statCell: { alignItems: 'center' },
  menuCard: { backgroundColor: '#FFF', borderRadius: 16 },
  menuRow:  { flexDirection: 'row', alignItems: 'center', padding: 16 },
  divider:  { height: 1, backgroundColor: '#F3F4F6', marginLeft: 70 },

  // Sessions
  sessionCard:    { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14 },
  sessionDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },

  // Search
  searchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 12 },

  // Notifications
  notifCard:  { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 10 },
  homeCard:     { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15 },
  homeStatCard: { width: (SCREEN_W - 40 - 10) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 16, height: 130 },
});
