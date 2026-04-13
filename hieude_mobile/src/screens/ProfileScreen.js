import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { clearUser } from '../api';
import { AppFooter } from '../components/NavHeader';

export default function ProfileScreen({ user, credits, setScreen, handleLogout }) {
  if (!user) { setScreen('Login'); return null; }

  const initial = (user.name || user.email || 'U')[0].toUpperCase();
  const displayName = user.name || user.email?.split('@')[0] || 'Người dùng';
  const displayEmail = user.email || 'Chưa cập nhật';

  const doLogout = async () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
      if (ok) {
        await clearUser();
        if (handleLogout) handleLogout();
      }
    } else {
      Alert.alert(
        'Xác nhận đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: async () => {
              await clearUser();
              if (handleLogout) handleLogout();
            }
          },
        ]
      );
    }
  };

  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.pgHd}>
          <Text style={s.pgTitle}>Tài khoản</Text>
        </View>

        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.profileInfo}>
            <View style={s.avatarRing}>
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>{initial}</Text>
              </View>
            </View>
            <Text style={s.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={s.profileEmail} numberOfLines={1}>{displayEmail}</Text>
            <View style={s.roleBadge}>
              <Text style={s.roleIcon}>👑</Text>
              <Text style={s.roleText}>Thành viên</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          <TouchableOpacity style={s.statCard} onPress={() => setScreen('Pricing')}>
            <Text style={s.statIcon}>🔑</Text>
            <Text style={s.statNum}>{credits ?? '--'}</Text>
            <Text style={s.statLabel}>Lượt phân tích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => setScreen('History')}>
            <Text style={s.statIcon}>📋</Text>
            <Text style={s.statNum}>Xem</Text>
            <Text style={s.statLabel}>Lịch sử</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statCard} onPress={() => setScreen('Library')}>
            <Text style={s.statIcon}>📚</Text>
            <Text style={s.statNum}>21+</Text>
            <Text style={s.statLabel}>Thư viện</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={s.section}>
          <Text style={s.sTitle}>Thông tin tài khoản</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><Text style={s.infoEmoji}>👤</Text></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Họ và tên</Text>
                <Text style={s.infoVal} numberOfLines={1}>{displayName}</Text>
              </View>
            </View>
            <View style={s.infoSep} />
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><Text style={s.infoEmoji}>✉️</Text></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoVal} numberOfLines={1}>{displayEmail}</Text>
              </View>
            </View>
            <View style={s.infoSep} />
            <View style={s.infoRow}>
              <View style={s.infoIconWrap}><Text style={s.infoEmoji}>🔗</Text></View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Đăng nhập qua</Text>
                <Text style={s.infoVal}>{user.picture ? 'Google' : 'Email & Mật khẩu'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sTitle}>Thao tác nhanh</Text>
          <View style={s.actionsGrid}>
            <TouchableOpacity style={s.actionCard} onPress={() => setScreen('Pricing')}>
              <Text style={s.actionIcon}>💎</Text>
              <Text style={s.actionText}>Nâng cấp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionCard} onPress={() => setScreen('About')}>
              <Text style={s.actionIcon}>ℹ️</Text>
              <Text style={s.actionText}>Giới thiệu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={s.logoutBtn} onPress={doLogout} activeOpacity={0.7}>
          <Text style={s.logoutIcon}>🚪</Text>
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={s.version}>MarkSense AI v1.0 — © 2026</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
      <AppFooter current="Profile" setScreen={setScreen} />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fdfbf7' },
  scroll: { paddingHorizontal: 20, paddingTop: 55 },
  
  pgHd: { marginBottom: 24 },
  pgTitle: { fontSize: 32, fontFamily: 'serif', color: '#064e3b', fontWeight: 'bold' },

  // Profile Header
  profileHeader: { marginBottom: 24, borderRadius: 24, padding: 24, backgroundColor: '#064e3b', elevation: 6, shadowColor: '#064e3b', shadowOpacity: 0.3, shadowRadius: 15 },
  profileInfo: { alignItems: 'center' },
  avatarRing: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#fdfbf7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#065f46', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 24, fontFamily: 'serif', fontWeight: '800' },
  profileName: { fontSize: 20, fontFamily: 'serif', color: '#fff', maxWidth: 280, textAlign: 'center', marginBottom: 4 },
  profileEmail: { fontSize: 13, color: '#ecfdf5', maxWidth: 280, textAlign: 'center', opacity: 0.8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#a7f3d0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleIcon: { fontSize: 12 },
  roleText: { color: '#064e3b', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  statIcon: { fontSize: 20, marginBottom: 8 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#065f46', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#78716c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  section: { marginBottom: 30 },
  sTitle: { fontSize: 12, fontWeight: '800', color: '#a8a29e', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },

  // Info Card
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  infoSep: { height: 1, backgroundColor: '#f5f5f4', marginHorizontal: 14 },
  infoIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  infoEmoji: { fontSize: 18 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#78716c', fontWeight: '600', marginBottom: 2 },
  infoVal: { fontSize: 15, color: '#1c1917', fontWeight: '700' },

  // Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', gap: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 13, color: '#44403c', fontWeight: '700' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, backgroundColor: '#fef2f2', borderRadius: 20, marginBottom: 20 },
  logoutIcon: { fontSize: 18 },
  logoutText: { color: '#dc2626', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Footer
  version: { textAlign: 'center', color: '#d6d3d1', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
