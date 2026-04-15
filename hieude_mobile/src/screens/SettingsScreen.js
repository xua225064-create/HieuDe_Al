import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView, StatusBar, Linking } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen({ setScreen }) {
  const goBack = () => setScreen('Profile');
  
  const BlockHeader = ({ title }) => (
    <Text style={s.blockHeader}>{title}</Text>
  );

  const SettBlock = ({ label, rightText, noBorder, iconLib = 'Feather', name }) => {
    return (
      <TouchableOpacity style={[s.itemRow, noBorder && { borderBottomWidth: 0 }]} activeOpacity={0.7}>
        {iconLib === 'Feather' ? (
          <Feather name={name} size={22} color="#065f46" />
        ) : (
          <MaterialCommunityIcons name={name} size={24} color="#065f46" />
        )}
        <Text style={s.itemLabel}>{label}</Text>
        {rightText && <Text style={s.rightText}>{rightText}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fdfbf7" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={goBack} hitSlop={{top: 15, bottom:15, left:15, right:15}}>
          <Feather name="x" size={26} color="#064e3b" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        <BlockHeader title="Preferences" />
        <View style={s.card}>
          <SettBlock name="globe" label="Language" rightText="English" noBorder />
        </View>

        <BlockHeader title="Share" />
        <View style={s.card}>
          <SettBlock name="share" label="Share MarkSense" noBorder />
        </View>

        <BlockHeader title="About" />
        <View style={s.card}>
          <SettBlock iconLib="Feather" name="instagram" label="Follow on Instagram" />
          <SettBlock iconLib="Feather" name="facebook" label="Follow on Facebook" />
          <SettBlock iconLib="MaterialCommunityIcons" name="music-note-eighth" label="Follow on TikTok" />
          <SettBlock iconLib="Feather" name="info" label="About MarkSense" onPress={() => setScreen('About')} noBorder />
        </View>

        <BlockHeader title="Support" />
        <View style={s.card}>
          <SettBlock iconLib="Feather" name="star" label="Like us, Rate us 💖" />
          <SettBlock iconLib="Feather" name="mail" label="Email Support" noBorder />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  closeBtn: { },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#064e3b' },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  
  blockHeader: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginBottom: 12, marginLeft: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemLabel: { flex: 1, marginLeft: 16, fontSize: 16, color: '#1c1917', fontWeight: '500' },
  rightText: { fontSize: 15, color: '#065f46', fontWeight: '600' },
});
