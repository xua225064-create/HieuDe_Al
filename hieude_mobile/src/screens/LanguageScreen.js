import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';

const LANGUAGES = [
  { flag: '🇩🇪', code: 'Deutsch' },
  { flag: '🇪🇸', code: 'Español' },
  { flag: '🇫🇷', code: 'Français' },
  { flag: '🇮🇹', code: 'Italian' },
  { flag: '🇹🇷', code: 'Türkçe' },
  { flag: '🇯🇵', code: '日本語' },
  { flag: '🇵🇹', code: 'Português' },
  { flag: '🇨🇳', code: '中文' },
  { flag: '🇷🇺', code: 'Русский' },
  { flag: '🇦🇪', code: 'العربية' },
  { flag: '🇺🇸', code: 'English' },
  { flag: '🇻🇳', code: 'Tiếng Việt' },
];

export default function LanguageScreen({ setScreen, language, setLanguage }) {
  const goBack = () => setScreen('Settings');

  const onSelect = (lang) => {
    if (setLanguage) {
      setLanguage(lang);
    }
    goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack} hitSlop={{top: 15, bottom:15, left:15, right:15}}>
          <Feather name="chevron-left" size={28} color="#064e3b" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((item, index) => {
          const isSelected = language === item.code;
          return (
            <TouchableOpacity 
              key={index} 
              style={[s.langCard, isSelected && s.langCardActive]} 
              activeOpacity={0.7} 
              onPress={() => onSelect(item.code)}
            >
              <Text style={s.flagIcon}>{item.flag}</Text>
              <Text style={[s.langName, isSelected && s.langNameActive]}>{item.code}</Text>
              {isSelected && <Feather name="check" size={20} color="#059669" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, color: '#064e3b', fontWeight: '700' },
  
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  
  langCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 18, paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1
  },
  langCardActive: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    paddingVertical: 17, paddingHorizontal: 19,
  },
  flagIcon: {
    fontSize: 22, marginRight: 16
  },
  langName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600'
  },
  langNameActive: {
    color: '#064e3b',
  }
});
