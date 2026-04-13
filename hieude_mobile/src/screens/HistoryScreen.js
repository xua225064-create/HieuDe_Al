import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { BASE_URL } from '../config';
import { apiGetHistory } from '../api';
import { AppFooter } from '../components/NavHeader';

export default function HistoryScreen({ user, credits, setScreen }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    apiGetHistory(user.token).then((d) => {
      if (d.success && d.history) setHistory(d.history);
    }).catch(() => { }).finally(() => setLoading(false));
  }, [user]);

  const renderItem = ({ item }) => {
    const r = item.match_result || {};
    const title = r.top_mark || item.ocr_text || 'Không rõ';
    const viName = r.hieu_de_vi || r.ten_viet || item.ocr_text || '';

    return (
      <View style={s.card}>
        <View style={s.thumb}>
          <Image source={{ uri: `${BASE_URL}/${item.image_path}` }} style={s.img} resizeMode="cover" />
        </View>
        <View style={s.body}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Text style={s.sub} numberOfLines={1}>{viName}</Text>
          <Text style={s.date}>{item.created_at}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.pgHd}>
          <Text style={s.pgTitle}>Lịch sử phân tích</Text>
          <Text style={s.pgSub}>Hoạt động giám định gần đây của bạn</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#065f46" style={{ marginTop: 60 }} />
        ) : !user ? (
          <View style={s.emptyBox}><Text style={s.emptyIcon}>鑑</Text><Text style={s.emptyText}>Vui lòng đăng nhập để xem lịch sử.</Text></View>
        ) : history.length === 0 ? (
          <View style={s.emptyBox}><Text style={s.emptyIcon}>鑑</Text><Text style={s.emptyText}>Chưa có phiên phân tích nào.</Text></View>
        ) : (
          <FlatList data={history} keyExtractor={(_, i) => i.toString()} renderItem={renderItem} numColumns={2} columnWrapperStyle={s.row} contentContainerStyle={s.listContent} />
        )}
      </View>
      <AppFooter current="History" setScreen={setScreen} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  content: { flex: 1 },
  pgHd: { paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, marginBottom: 8 },
  pgTitle: { fontSize: 32, fontFamily: 'serif', color: '#064e3b', fontWeight: 'bold' },
  pgSub: { fontSize: 13, color: '#78716c', marginTop: 4 },

  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  row: { justifyContent: 'space-between', marginBottom: 16 },

  card: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  thumb: { height: 130, backgroundColor: '#e7e5e4' },
  img: { width: '100%', height: '100%' },
  body: { padding: 12 },
  title: { fontSize: 13, fontWeight: '700', color: '#1c1917', marginBottom: 2, fontFamily: 'serif' },
  sub: { fontSize: 11, color: '#57534e', fontWeight: '500', marginBottom: 6 },
  date: { fontSize: 9, color: '#a8a29e', fontWeight: '800' },

  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, color: '#d6d3d1', fontWeight: 'bold', marginBottom: 16 },
  emptyText: { fontSize: 13, color: '#78716c', textAlign: 'center' },
});
