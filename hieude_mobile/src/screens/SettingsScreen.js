import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView, StatusBar, Share, Linking, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function SettingsScreen({ setScreen, language }) {
  const goBack = () => setScreen('Profile');

  const handleLanguage = () => {
    setScreen('Language');
  };

  const handleShare = async () => {
    try {
      const msg = 'Discover ancient ceramic marks with MarkSense AI! The Evergreen Intelligence for art collectors. Check it out at https://marksense.ai';
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: 'MarkSense AI', text: msg, url: 'https://marksense.ai' });
      } else {
        await Share.share({ message: msg });
      }
    } catch (error) {
      alert('Đường dẫn tải ứng dụng: https://marksense.ai'); // Fallback an toàn cho web
    }
  };

  const handleOpenLink = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch((err) => Alert.alert('Error', 'Cannot open this link right now.'));
    }
  };

  const BlockHeader = ({ title }) => (
    <Text style={s.blockHeader}>{title}</Text>
  );

  const SettItem = ({ iconLib, iconName, bgType, title, subtitle, rightText, rightIcon, noBorder, onPress }) => {
    const isGreen = bgType === 'green';
    return (
      <TouchableOpacity style={[s.itemRow, noBorder && { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={onPress}>
        <View style={[s.iconBadge, isGreen ? s.iconBadgeGreen : s.iconBadgeGray]}>
          {iconLib === 'Feather' && <Feather name={iconName} size={20} color={isGreen ? "#059669" : "#374151"} />}
          {iconLib === 'MaterialCommunityIcons' && <MaterialCommunityIcons name={iconName} size={22} color={isGreen ? "#059669" : "#374151"} />}
          {iconLib === 'FontAwesome5' && <FontAwesome5 name={iconName} size={18} color={isGreen ? "#059669" : "#374151"} />}
        </View>
        
        <View style={s.itemContent}>
          <Text style={s.itemTitle}>{title}</Text>
          {subtitle && <Text style={s.itemSubtitle}>{subtitle}</Text>}
        </View>
        
        <View style={s.rightWrap}>
          {rightText && <Text style={s.rightText}>{rightText}</Text>}
          {rightIcon === 'chevron' ? (
             <Feather name="chevron-right" size={18} color="#9ca3af" />
          ) : rightIcon === 'external' ? (
             <Feather name="external-link" size={18} color="#9ca3af" />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f9f9" />
      
      {/* Header / Back */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack} hitSlop={{top: 15, bottom:15, left:15, right:15}}>
          <Feather name="arrow-left" size={24} color="#064e3b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        {/* App Info Badge */}
        <View style={s.appInfoCard}>
          <View style={s.appLogoWrap}>
             <MaterialCommunityIcons name="magnify-scan" size={32} color="#059669" />
             <View style={s.appLogoBadge}>
               <MaterialCommunityIcons name="star-four-points" size={12} color="#fff" />
             </View>
          </View>
          <View>
            <Text style={s.appName}>MarkSense AI</Text>
          </View>
        </View>

        <BlockHeader title="PREFERENCES" />
        <View style={s.card}>
          <SettItem 
            iconLib="MaterialCommunityIcons" iconName="translate" bgType="green"
            title="Language selection" subtitle="Choose your preferred language"
            rightText={language} rightIcon="chevron" noBorder
            onPress={handleLanguage}
          />
        </View>

        <BlockHeader title="SOCIAL HUB" />
        <View style={s.card}>
          <SettItem 
            iconLib="Feather" iconName="share-2" bgType="green"
            title="Share MarkSense" subtitle="Spread the intelligence"
            rightIcon="chevron" noBorder
            onPress={handleShare}
          />
        </View>

        <BlockHeader title="CONNECT & INFORMATION" />
        <View style={s.card}>
          <SettItem 
            iconLib="Feather" iconName="camera" bgType="gray"
            title="Follow on Instagram" rightIcon="external"
            onPress={() => handleOpenLink('https://instagram.com/marksense.ai')}
          />
          <SettItem 
            iconLib="Feather" iconName="globe" bgType="gray"
            title="Follow on Facebook" rightIcon="external"
            onPress={() => handleOpenLink('https://facebook.com/marksense.ai')}
          />
          <SettItem 
            iconLib="MaterialCommunityIcons" iconName="play-box-multiple-outline" bgType="gray"
            title="Follow on TikTok" rightIcon="external"
            onPress={() => handleOpenLink('https://tiktok.com/@marksense.ai')}
          />
          <SettItem 
            iconLib="Feather" iconName="info" bgType="gray"
            title="About MarkSense" subtitle="Terms, Privacy & Team"
            rightIcon="chevron" onPress={() => setScreen('About')} noBorder
          />
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f9f9', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  
  appInfoCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, paddingVertical: 28,
    flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  appLogoWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fdfbf7',
    borderWidth: 1, borderColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
    position: 'relative'
  },
  appLogoBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#059669', width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff'
  },
  appName: { fontSize: 22, fontWeight: '800', color: '#064e3b', marginBottom: 4 },
  appVersion: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  
  blockHeader: { fontSize: 12, color: '#4b5563', fontWeight: '800', marginBottom: 12, marginLeft: 8, letterSpacing: 1.2 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  iconBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconBadgeGreen: { backgroundColor: '#d1fae5' },
  iconBadgeGray: { backgroundColor: '#f3f4f6' },
  
  itemContent: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 16, color: '#111827', fontWeight: '700', marginBottom: 2 },
  itemSubtitle: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightText: { fontSize: 14, color: '#059669', fontWeight: '700' },
});
