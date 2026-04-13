import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function PricingScreen({ user, credits, setScreen, goCheckout }) {
  const [selected, setSelected] = useState('monthly');

  const handlePurchase = () => {
    if (!user) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để mua gói');
      setScreen('Login');
      return;
    }
    goCheckout(selected === 'monthly' ? 'pro' : 'enterprise');
  };

  return (
    <View style={s.container}>
      {/* Close & Restore */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setScreen('Home')} style={s.closeBtn}>
          <Feather name="x" size={22} color="#78716c" />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={s.heroWrap}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800' }} 
            style={s.heroImg} 
          />

        </View>

        {/* Title */}
        <Text style={s.title}>Mở Khóa Truy Cập{'\n'}Không Giới Hạn</Text>
        <Text style={s.subtitle}>Trợ lý giám định cổ vật AI cá nhân của bạn</Text>

        {/* Features */}
        <View style={s.features}>
          <View style={s.featRow}>
            <View style={s.featIcon}><Ionicons name="scan" size={20} color="#065f46" /></View>
            <Text style={s.featText}>Quét & Nhận dạng không giới hạn</Text>
          </View>
          <View style={s.featRow}>
            <View style={s.featIcon}><MaterialCommunityIcons name="brain" size={20} color="#065f46" /></View>
            <Text style={s.featText}>Hỗ trợ AI chuyên gia 24/7</Text>
          </View>
          <View style={s.featRow}>
            <View style={s.featIcon}><Feather name="bell" size={18} color="#065f46" /></View>
            <Text style={s.featText}>Nhắc nhở & cập nhật nghiên cứu mới</Text>
          </View>
        </View>

        {/* No payment badge */}
        <View style={s.noPay}>
          <View style={s.noPayDot}><Feather name="check" size={12} color="#fff" /></View>
          <Text style={s.noPayText}>Không cần thanh toán ngay</Text>
        </View>

        {/* Plan: Monthly */}
        <TouchableOpacity 
          style={[s.planCard, selected === 'monthly' && s.planSelected]} 
          onPress={() => setSelected('monthly')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, selected === 'monthly' && s.planNameOn]}>Hàng tháng</Text>
          </View>
          <View style={s.bestBadge}><Text style={s.bestText}>BEST OFFER</Text></View>
          <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
            <Text style={s.planPrice}>17$ /</Text>
            <Text style={[s.planSub, selected === 'monthly' && s.planSubOn]}>7 Ngày Dùng Thử</Text>
          </View>
        </TouchableOpacity>

        {/* Plan: Yearly */}
        <TouchableOpacity 
          style={[s.planCard, selected === 'yearly' && s.planSelected]} 
          onPress={() => setSelected('yearly')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, selected === 'yearly' && s.planNameOn]}>Hàng năm</Text>
            <Text style={s.planYearSub}>1200$ / năm</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.planPrice}>100$ /</Text>
            <Text style={s.planBilled}>Thanh toán năm</Text>
          </View>
        </TouchableOpacity>

        {/* CTA Button */}
        <TouchableOpacity style={s.ctaBtn} onPress={handlePurchase} activeOpacity={0.85}>
          <Text style={s.ctaText}>Bắt Đầu Dùng Thử Miễn Phí</Text>
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={s.finePrint}>
          7 ngày đầu miễn phí, sau đó {selected === 'monthly' ? '17$/tháng' : '100$/năm'}.
        </Text>
        <Text style={s.finePrint2}>Hủy bất cứ lúc nào trước khi hết thời gian dùng thử</Text>

        {/* Terms / Privacy */}
        <View style={s.legalRow}>
          <TouchableOpacity><Text style={s.legalText}>Điều khoản</Text></TouchableOpacity>
          <TouchableOpacity><Text style={s.legalText}>Chính sách</Text></TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  scroll: { paddingHorizontal: 24 },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f4', justifyContent: 'center', alignItems: 'center' },
  restoreText: { fontSize: 13, color: '#78716c', fontWeight: '600' },

  // Hero
  heroWrap: { height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 28 },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Title
  title: { fontSize: 28, fontFamily: 'serif', color: '#1c1917', fontWeight: 'bold', textAlign: 'center', lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#78716c', textAlign: 'center', marginBottom: 28 },

  // Features
  features: { marginBottom: 24 },
  featRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 14 },
  featIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  featText: { fontSize: 14, color: '#1c1917', fontWeight: '600', flex: 1 },

  // No payment
  noPay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 },
  noPayDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#065f46', justifyContent: 'center', alignItems: 'center' },
  noPayText: { fontSize: 13, color: '#065f46', fontWeight: '800' },

  // Plan cards
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 2, borderColor: '#e7e5e4' },
  planSelected: { borderColor: '#065f46', backgroundColor: '#f0fdf4' },
  planName: { fontSize: 16, fontWeight: '800', color: '#57534e' },
  planNameOn: { color: '#1c1917' },
  planYearSub: { fontSize: 11, color: '#a8a29e', marginTop: 2, fontWeight: '600' },
  planPrice: { fontSize: 14, fontWeight: '800', color: '#1c1917' },
  planSub: { fontSize: 11, color: '#a8a29e', fontWeight: '700' },
  planSubOn: { color: '#065f46' },
  planBilled: { fontSize: 11, color: '#a8a29e', fontWeight: '600' },
  bestBadge: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bestText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  // CTA
  ctaBtn: { backgroundColor: '#065f46', borderRadius: 18, paddingVertical: 20, alignItems: 'center', marginTop: 10, marginBottom: 16, shadowColor: '#065f46', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Fine print
  finePrint: { fontSize: 11, color: '#57534e', textAlign: 'center', fontWeight: '700', marginBottom: 4 },
  finePrint2: { fontSize: 11, color: '#a8a29e', textAlign: 'center', marginBottom: 20 },

  // Legal
  legalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  legalText: { fontSize: 12, color: '#a8a29e', fontWeight: '600' },
});
