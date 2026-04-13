import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../config';
import NavHeader, { BottomTabs } from '../components/NavHeader';

const ADVANTAGES = [
  { title: 'Độ Chính Xác Cao', desc: 'Hệ thống OCR được huấn luyện chuyên biệt trên hàng nghìn biến thể ký tự cổ.', color: '#60a5fa' },
  { title: 'Xử Lý Siêu Tốc', desc: 'Phân tách, nhận dạng và đưa ra báo cáo trong thời gian thực.', color: COLORS.green },
  { title: 'Cơ Sở Dữ Liệu Đồ Sộ', desc: 'Kho dữ liệu trải dài từ các đại triều Trung Hoa tới gốm Việt Nam.', color: COLORS.purpleLight },
];

export default function AboutScreen({ user, credits, setScreen }) {
  return (
    <View style={s.flex}>
      <NavHeader user={user} credits={credits} setScreen={setScreen} />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.titleRow}>
            <View style={s.logoBox}><Text style={s.logoLetter}>M</Text></View>
            <Text style={s.title}>Giới thiệu MarkSense AI</Text>
          </View>

          <Text style={s.body}>
            <Text style={s.bold}>MarkSense AI</Text> là một hệ thống tối tân hỗ trợ quy trình giám định, nhận dạng và phân tích hiệu đề trên nền gốm sứ học cổ truyền. Được phát triển kết hợp giữa trí tuệ nhân tạo (AI), thị giác máy tính (Computer Vision) và dữ liệu lịch sử phong phú.
          </Text>
          <Text style={s.body}>
            Sứ mệnh cốt lõi là bảo tồn và phát huy các giá trị văn hóa — lịch sử vô giá, hỗ trợ giới nghiên cứu, các nhà sưu tầm cá nhân và hệ thống bảo tàng trong công tác tra cứu chuyên sâu.
          </Text>

          <Text style={s.sectionTitle}>Lợi thế công nghệ</Text>
          {ADVANTAGES.map((a, i) => (
            <View key={i} style={s.advCard}>
              <View style={[s.advDot, { backgroundColor: a.color + '25' }]}>
                <Text style={[s.advEmoji, { color: a.color }]}>✦</Text>
              </View>
              <View style={s.advContent}>
                <Text style={[s.advTitle, { color: a.color }]}>{a.title}</Text>
                <Text style={s.advDesc}>{a.desc}</Text>
              </View>
            </View>
          ))}

          <View style={s.footer}>
            <Text style={s.footerText}>© 2026 MarkSense AI. Phát triển bởi HieuDe Team.</Text>
            <Text style={s.footerVersion}>Phiên bản 1.0.0 (Premium Release)</Text>
          </View>
        </View>
      </ScrollView>
      <BottomTabs current="About" setScreen={setScreen} />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: COLORS.cardBg, borderColor: COLORS.cardBorder, borderWidth: 1, borderRadius: 16, padding: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.cobalt, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontWeight: '800', fontSize: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#60a5fa', flex: 1 },
  body: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 24, marginBottom: 14 },
  bold: { fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 20, marginBottom: 16 },
  advCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: 12, padding: 18, marginBottom: 12, gap: 14 },
  advDot: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  advEmoji: { fontSize: 16, fontWeight: 'bold' },
  advContent: { flex: 1 },
  advTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  advDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 19 },
  footer: { alignItems: 'center', marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  footerVersion: { color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 },
});
