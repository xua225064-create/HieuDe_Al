import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../config';
import { apiCreatePayment, apiCheckPaymentStatus, apiMockPayment } from '../api';
import NavHeader from '../components/NavHeader';

const PACKAGES = {
  pro: { name: 'Gói Chuyên nghiệp', credits: 200, amount: 447712 },
  enterprise: { name: 'Gói Tối đa', credits: 9999, amount: 2490000 },
};

function formatVND(n) { return n.toLocaleString('vi-VN') + 'đ'; }

export default function CheckoutScreen({ user, credits, setScreen, checkoutPkg, refreshCredits }) {
  const [step, setStep] = useState(2); // Step 2 = choose method, Step 3 = QR
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const intervalRef = useRef(null);

  const pkg = PACKAGES[checkoutPkg] || PACKAGES.pro;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const confirmPayment = async () => {
    if (!user?.token) { Alert.alert('Lỗi', 'Vui lòng đăng nhập'); return; }
    setLoading(true);
    try {
      const data = await apiCreatePayment(checkoutPkg, user.token);
      if (data.success) {
        setPaymentData(data);
        setStep(3);
        // Start polling
        intervalRef.current = setInterval(async () => {
          const status = await apiCheckPaymentStatus(data.payment_id);
          if (status.status === 'completed') {
            clearInterval(intervalRef.current);
            refreshCredits();
            Alert.alert('Thành công! 🎉', 'Tokens đã được cộng vào tài khoản.', [
              { text: 'OK', onPress: () => setScreen('Home') },
            ]);
          }
        }, 5000);
      } else {
        Alert.alert('Lỗi', data.error || data.message || 'Thanh toán thất bại');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally { setLoading(false); }
  };

  const simulatePayment = async () => {
    if (!paymentData) return;
    try {
      await apiMockPayment(paymentData.payment_id, user.token);
      const status = await apiCheckPaymentStatus(paymentData.payment_id);
      if (status.status === 'completed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        refreshCredits();
        Alert.alert('Thành công! 🎉', 'Giả lập thanh toán thành công!', [
          { text: 'OK', onPress: () => setScreen('Home') },
        ]);
      }
    } catch (e) {}
  };

  return (
    <View style={s.flex}>
      <NavHeader user={user} credits={credits} setScreen={setScreen} />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.headerLabel}>HỆ THỐNG XỬ LÝ THANH TOÁN</Text>
        <Text style={s.headerTitle}>Phương thức thanh toán</Text>

        {step === 2 && (
          <View style={s.stepCard}>
            {/* Package summary */}
            <View style={s.pkgSummary}>
              <Text style={s.pkgName}>{pkg.name}</Text>
              <Text style={s.pkgPrice}>{formatVND(pkg.amount)}</Text>
              <Text style={s.pkgDesc}>{pkg.credits >= 9999 ? 'Quét vô hạn' : `${pkg.credits} lượt quét`}</Text>
            </View>

            {/* Payment method */}
            <View style={s.pmCard}>
              <Text style={s.pmTitle}>CHUYỂN KHOẢN NGÂN HÀNG</Text>
              <Text style={s.pmSub}>(Quét QR nhanh)</Text>
              <View style={s.pmRadio}><View style={s.pmRadioDot} /></View>
            </View>

            <View style={[s.pmCard, { opacity: 0.4 }]}>
              <Text style={s.pmTitle}>VÍ ĐIỆN TỬ MOMO</Text>
              <Text style={s.pmSub}>Sắp ra mắt</Text>
            </View>

            <TouchableOpacity style={s.btnContinue} onPress={confirmPayment} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.btnContinueText}>TIẾP TỤC THANH TOÁN →</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && paymentData && (
          <View style={s.stepCard}>
            <Text style={s.waitText}>⏳ ĐANG CHỜ THANH TOÁN...</Text>

            {/* QR */}
            <View style={s.qrWrap}>
              <Image source={{ uri: paymentData.qr_url }} style={s.qrImg} resizeMode="contain" />
            </View>

            {/* Details */}
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>SỐ TIỀN</Text>
              <Text style={s.detailVal}>{formatVND(paymentData.amount)}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>NỘI DUNG CK</Text>
              <Text style={[s.detailVal, { fontFamily: 'monospace', letterSpacing: 2 }]}>{paymentData.content}</Text>
            </View>

            <TouchableOpacity style={s.btnSim} onPress={simulatePayment}>
              <Text style={s.btnSimText}>🛠️ (DEV) GIẢ LẬP NHẬN TIỀN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnBackStep} onPress={() => { setStep(2); if (intervalRef.current) clearInterval(intervalRef.current); }}>
              <Text style={s.btnBackStepText}>← QUAY LẠI CHỌN PHƯƠNG THỨC</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.paper },
  scroll: { padding: 20, paddingTop: 32, paddingBottom: 60 },
  headerLabel: { color: COLORS.cyan, fontSize: 11, letterSpacing: 3, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 30 },
  stepCard: { backgroundColor: 'rgba(15,20,30,0.7)', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderRadius: 4, padding: 28 },
  pkgSummary: { alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  pkgName: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  pkgPrice: { color: COLORS.cyan, fontWeight: '800', fontSize: 28, marginBottom: 4 },
  pkgDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  pmCard: { borderColor: COLORS.cyan, borderWidth: 1, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pmTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pmSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  pmRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.cyan, justifyContent: 'center', alignItems: 'center' },
  pmRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.cyan },
  btnContinue: { marginTop: 24, padding: 16, borderRadius: 4, alignItems: 'center', backgroundColor: COLORS.cyan },
  btnContinueText: { color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  waitText: { color: '#9b51e0', fontWeight: '700', fontSize: 13, letterSpacing: 1, textAlign: 'center', marginBottom: 20 },
  qrWrap: { alignSelf: 'center', backgroundColor: '#fff', padding: 10, marginBottom: 24, borderWidth: 3, borderColor: COLORS.cyan },
  qrImg: { width: 220, height: 220 },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  detailVal: { fontSize: 18, fontWeight: '700', color: COLORS.cyan },
  btnSim: { marginTop: 20, borderColor: 'rgba(103,232,249,0.3)', borderWidth: 1, borderStyle: 'dashed', padding: 10, borderRadius: 4, alignItems: 'center' },
  btnSimText: { color: 'rgba(103,232,249,0.5)', fontSize: 12 },
  btnBackStep: { marginTop: 20, alignItems: 'center' },
  btnBackStepText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600', letterSpacing: 1 },
});
