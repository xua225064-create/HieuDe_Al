import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiGetLibrary } from '../api';
import { AppFooter } from '../components/NavHeader';

const ERAS = [
  { key: 'all', label: 'TẤT CẢ' },
  { key: 'minh', label: 'NHÀ MINH' },
  { key: 'thanh', label: 'NHÀ THANH' },
  { key: 'nguyen', label: 'NHÀ NGUYỄN' },
];

function getEra(dyn) {
  const d = (dyn || '').toLowerCase();
  if (d.includes('nguyễn')) return 'nguyen';
  if (d.includes('thanh')) return 'thanh';
  if (d.includes('minh')) return 'minh';
  return 'khac';
}

export default function LibraryScreen({ user, credits, setScreen }) {
  const [items, setItems] = useState([]);
  const [era, setEra] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetLibrary().then((data) => {
      setItems(data.map((item, idx) => ({
        id: idx,
        name: item.hien_thi_chinh || item.ten_viet || item.chu_han,
        dyn: item.trieu_dai || 'Chưa rõ',
        nienhieu: item.nien_hieu || 'Chưa rõ',
        p: (item.nam_bat_dau && item.nam_ket_thuc) ? `${item.nam_bat_dau} - ${item.nam_ket_thuc}` : item.nien_dai || 'Chưa rõ',
        desc: item.mo_ta || item.ghi_chu || 'Không có mô tả chi tiết.',
        era: getEra(item.trieu_dai || ''),
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((x) => {
    if (era !== 'all' && x.era !== era) return false;
    if (search) {
      const q = search.toLowerCase();
      return (x.name || '').toLowerCase().includes(q) || (x.dyn || '').toLowerCase().includes(q);
    }
    return true;
  });

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <Text style={s.cardTitle}>{item.name}</Text>
      <View style={s.dynPill}><Text style={s.dynPillText}>{item.dyn}</Text></View>
      
      <Text style={s.metaText}><Text style={s.bold}>Triều đại/Niên hiệu: </Text>{item.nienhieu}</Text>
      <Text style={s.metaText}><Text style={s.bold}>Thời kỳ: </Text>{item.p}</Text>
      <Text style={s.metaText} numberOfLines={3}><Text style={s.bold}>Đặc điểm: </Text>{item.desc}</Text>
      
      <View style={s.tagRow}>
        <View style={s.tag}><Text style={s.tagText}>Hiệu đề</Text></View>
        <View style={s.tag}><Text style={s.tagText}>Gốm sứ</Text></View>
        {item.p !== 'Chưa rõ' && <View style={s.tag}><Text style={s.tagText}>{item.p}</Text></View>}
      </View>
    </View>
  );


  return (
    <View style={s.container}>
      <FlatList 
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={() => (
          <View style={{ paddingTop: 55 }}>
            <Text style={s.pageTitle}>Thư viện Hiệu đề <Text style={s.countText}>({filtered.length} mẫu)</Text></Text>
            
            <View style={s.searchWrap}>
              <Feather name="search" size={20} color="#78716c" style={s.searchIcon} />
              <TextInput style={s.searchInput} placeholder="Tìm kiếm niên hiệu, triều đại..." placeholderTextColor="#a8a29e" value={search} onChangeText={setSearch} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterWrap}>
              {ERAS.map((e) => (
                <TouchableOpacity key={e.key} style={[s.filterPill, era === e.key && s.filterPillOn]} onPress={() => setEra(e.key)}>
                  <Text style={[s.filterText, era === e.key && s.filterTextOn]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        ListEmptyComponent={loading ? <ActivityIndicator size="large" color="#065f46" style={{marginTop: 40}}/> : null}
      />

      <AppFooter current="Library" setScreen={setScreen} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  listContent: { paddingHorizontal: 20, paddingBottom: 130 },
  
  pageTitle: { fontSize: 32, fontFamily: 'serif', color: '#064e3b', marginBottom: 24, flexWrap: 'wrap', fontWeight: 'bold' },
  countText: { fontSize: 16, color: '#78716c', fontWeight: '500', fontFamily: 'System' },
  
  searchWrap: { backgroundColor: '#f5f5f4', borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1c1917' },
  
  filterScroll: { marginHorizontal: -20, marginBottom: 24 },
  filterWrap: { paddingHorizontal: 20, gap: 10 },
  filterPill: { backgroundColor: '#e7e5e4', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterPillOn: { backgroundColor: '#064e3b' },
  filterText: { fontSize: 11, fontWeight: '800', color: '#44403c', letterSpacing: 0.5 },
  filterTextOn: { color: '#ffffff' },

  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: {width:0, height:4}, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1c1917', fontFamily: 'serif', marginBottom: 8 },
  dynPill: { backgroundColor: '#e0f2fe', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 14 },
  dynPillText: { color: '#0369a1', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  metaText: { fontSize: 13, color: '#44403c', lineHeight: 22, marginBottom: 6 },
  bold: { fontWeight: '800', color: '#1c1917' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { backgroundColor: '#f5f5f4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tagText: { color: '#57534e', fontSize: 10, fontWeight: '700' },
});
