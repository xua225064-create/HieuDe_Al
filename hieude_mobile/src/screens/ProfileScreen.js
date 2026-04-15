import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, StatusBar, TextInput, Image, KeyboardAvoidingView } from 'react-native';
import { clearUser, storeUser } from '../api';
import { AppFooter } from '../components/NavHeader';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen({ user, setScreen, handleLogout, handleLogin }) {
  if (!user) { setScreen('Login'); return null; }

  const [name, setName] = useState(user.name || user.email?.split('@')[0] || 'Người dùng');
  const [email, setEmail] = useState(user.email || '');

  const initial = (name || 'U')[0].toUpperCase();
  const avatarUrl = user.picture || null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên hiển thị không được bỏ trống');
      return;
    }
    const updatedUser = { ...user, name, email };
    await storeUser(updatedUser);
    
    // Gọi hàm set user ở cấp App. Hành vi này có thể đưa về Home.
    if (handleLogin) {
      await handleLogin(updatedUser);
    }
    
    if (Platform.OS === 'web') {
      window.alert('Thông tin tài khoản đã được lưu!');
    } else {
      Alert.alert('Thành công', 'Thông tin tài khoản đã được lưu!');
    }
  };

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
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />
      
      {/* Decorative Top Background */}
      <View style={s.topBg}>
        <View style={s.blob1} />
        <View style={s.blob2} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.headerRow}>
          <View style={{ width: 44 }} />
          <Text style={s.pgTitle}>Hồ Sơ</Text>
          <TouchableOpacity style={s.settingsBtn} activeOpacity={0.8} onPress={() => setScreen('Settings')}>
            <Feather name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Form and Avatar Card */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatarInner}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
              ) : (
                <Text style={s.avatarLetter}>{initial}</Text>
              )}
            </View>
            <TouchableOpacity style={s.cameraBadge} activeOpacity={0.8}>
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={s.formWrap}>
            <Text style={s.label}>Họ và tên</Text>
            <View style={s.inputBox}>
              <Feather name="user" size={18} color="#065f46" style={s.inputIcon} />
              <TextInput 
                style={s.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Nhập tên hiển thị"
                placeholderTextColor="#a8a29e"
              />
            </View>

            <Text style={s.label}>Email liên kết</Text>
            <View style={s.inputBox}>
              <Feather name="mail" size={18} color="#065f46" style={s.inputIcon} />
              <TextInput 
                style={s.input} 
                value={email} 
                onChangeText={setEmail} 
                placeholder="name@example.com"
                placeholderTextColor="#a8a29e"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={s.label}>Phương thức đăng nhập</Text>
            <View style={[s.inputBox, s.inputBoxDisabled]}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#a8a29e" style={s.inputIcon} />
              <TextInput 
                style={[s.input, { color: '#78716c' }]} 
                value={user.picture ? 'Google OAuth' : 'Theo email / mật khẩu'} 
                editable={false} 
              />
            </View>

            <TouchableOpacity style={s.saveBtn} activeOpacity={0.8} onPress={handleSave}>
              <Feather name="save" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Lưu thông tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={doLogout}>
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text style={s.logoutText}>Đăng xuất khỏi thiết bị</Text>
        </TouchableOpacity>

        <Text style={s.version}>MarkSense AI v1.0 — Premium Build</Text>

        <View style={{ height: 120 }} />
      </ScrollView>
      <AppFooter current="Profile" setScreen={setScreen} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fdfbf7' },
  topBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 260, backgroundColor: '#064e3b', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, overflow: 'hidden' },
  blob1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
  blob2: { position: 'absolute', top: 120, left: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },
  scroll: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 },
  pgTitle: { fontSize: 26, fontFamily: 'serif', color: '#fff', fontWeight: 'bold' },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Profile Card
  profileCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 8, shadowColor: '#064e3b', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, marginBottom: 36 },
  avatarWrap: { position: 'relative', marginBottom: 26, marginTop: -60 },
  avatarInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, overflow: 'hidden' },
  avatarLetter: { color: '#065f46', fontSize: 48, fontFamily: 'serif', fontWeight: 'bold' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cameraBadge: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#065f46', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  // Form Setup
  formWrap: { width: '100%' },
  label: { fontSize: 12, color: '#78716c', fontWeight: '700', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfbf7', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 14, marginBottom: 20, height: 50 },
  inputBoxDisabled: { backgroundColor: '#f5f5f4', borderColor: '#d6d3d1' },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, height: '100%', fontSize: 15, color: '#1c1917', fontWeight: '600' },
  
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#065f46', borderRadius: 14, paddingVertical: 18, marginTop: 10, gap: 10, elevation: 6, shadowColor: '#065f46', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#fee2e2', marginBottom: 24, borderStyle: 'dashed' },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },

  version: { textAlign: 'center', color: '#d6d3d1', fontSize: 12, fontWeight: '600' },
});
