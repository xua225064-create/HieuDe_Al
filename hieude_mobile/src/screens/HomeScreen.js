import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiOcr, apiGetHistory } from '../api';
import { BASE_URL } from '../config';
import { AppHeader, AppFooter } from '../components/NavHeader';

const { width } = Dimensions.get('window');
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=1000';

export default function HomeScreen({ user, credits, setScreen, refreshCredits }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    if (!user?.token) return;
    apiGetHistory(user.token).then(d => {
      if (d.success && d.history) setRecentHistory(d.history.slice(0, 3));
    }).catch(() => {});
  }, [user]);

  const pickImage = async () => {
    if (!user) { Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để phân tích ảnh'); setScreen('Login'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
    if (!r.canceled) { setImage(r.assets[0]); setResult(null); }
  };

  const takePhoto = async () => {
    if (!user) { Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để phân tích ảnh'); setScreen('Login'); return; }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Lỗi', 'Cần quyền truy cập camera'); return; }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 1 });
    if (!r.canceled) { setImage(r.assets[0]); setResult(null); }
  };

  const doAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const { status, data } = await apiOcr(image.uri, user?.token);
      if (status === 403 && data.no_credits) {
        Alert.alert('Hết lượt', 'Bạn đã hết lượt phân tích. Vui lòng nâng cấp gói.', [
          { text: 'Mua thêm', onPress: () => setScreen('Pricing') },
          { text: 'Để sau' },
        ]);
        return;
      }
      if (data.error || !data.success) { throw new Error(data.message || data.error || 'Lỗi phân tích'); }
      const d = data.report || data;
      setResult({
        hieude: (data.chu_han?.length === 6 ? d.hien_thi_chinh : d.ten_viet) || d.ten_viet || d.hien_thi_chinh || 'Không rõ',
        hanzi: data.chu_han || d.chu_han || '?',
        trieudai: d.trieu_dai || 'Không rõ',
        nienhieu: d.nien_hieu || 'Không rõ',
        niendai: d.nien_dai || '?',
        hieude_en: d.hieu_de_en || 'Unknown',
        boicanh: d.mo_ta || d.ghi_chu || 'Đang cập nhật...',
        thuphapdacbiet: d.thu_phap || 'Đang cập nhật...',
      });
      refreshCredits();
      
      // Refresh history silently
      apiGetHistory(user.token).then(d => {
        if (d.success && d.history) setRecentHistory(d.history.slice(0, 3));
      }).catch(()=>{});

    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể phân tích');
    } finally {
      setLoading(false);
    }
  };

  const clearScan = () => { setImage(null); setResult(null); };

  const firstHistory = recentHistory[0];
  const secondHistory = recentHistory[1];
  const thirdHistory = recentHistory[2];

  return (
    <View style={s.container}>
      <ScrollView bounces={false} contentContainerStyle={s.scroll}>
        
        {/* ─── SCENE 1: DASHBOARD (NO SCAN YET) ─── */}
        {!image && !result && !loading && (
          <View style={s.dashboardWrap}>
            <AppHeader setScreen={setScreen} />

            {/* HERO BANNER */}
            <View style={s.heroCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=1000' }} style={s.heroImg} />
              <View style={s.heroOverlay}>
                <View style={s.heroPill}><Text style={s.heroPillText}>TRANG CHỦ</Text></View>
                <Text style={s.heroTitle}>Giải mã lịch sử{"\n"}qua từng dấu ấn.</Text>
                <TouchableOpacity style={s.heroBtn} onPress={pickImage}>
                  <Text style={s.heroBtnText}>BẮT ĐẦU GIÁM ĐỊNH</Text>
                  <Ionicons name="scan" size={18} color="#fff" style={{marginLeft: 8}} />
                </TouchableOpacity>
              </View>
            </View>

            {/* RECENT IDENTIFICATION */}
            <View style={s.section}>
              <Text style={s.secSuper}>DỮ LIỆU LƯU TRỮ</Text>
              <View style={s.rowSpace}>
                <Text style={s.secTitle}>Nhận dạng gần đây</Text>
                <TouchableOpacity onPress={() => setScreen('History')}><Text style={s.linkText}>XEM TẤT CẢ</Text></TouchableOpacity>
              </View>
              
              {firstHistory ? (
                <TouchableOpacity style={s.recentCard} onPress={() => setScreen('History')}>
                  <Image source={{uri: `${BASE_URL}/${firstHistory.image_path}`}} style={s.rcImg} />
                  <View style={s.rcContent}>
                    <Text style={s.rcTitle} numberOfLines={1}>{firstHistory.match_result?.trieu_dai || firstHistory.match_result?.top_mark || 'Chưa cập nhật'}</Text>
                    <Text style={s.rcSub} numberOfLines={1}>{firstHistory.match_result?.nien_hieu || firstHistory.match_result?.hieu_de_vi || 'Mảnh vỡ'}</Text>
                    <View style={s.rcProgressRow}>
                      <View style={s.progressBar}><View style={[s.progressFill, { width: '90%' }]} /></View>
                      <Text style={s.progressText}>90% tin cậy</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[s.recentCard, {opacity: 0.5}]}><Text style={{padding: 20}}>Chưa có dữ liệu</Text></View>
              )}

              <View style={s.gridRow}>
                {secondHistory && (
                  <TouchableOpacity style={s.gridCard} onPress={() => setScreen('History')}>
                    <Image source={{uri: `${BASE_URL}/${secondHistory.image_path}`}} style={s.gcImg} />
                    <View style={s.gcContent}>
                      <Text style={s.gcSuper} numberOfLines={1}>{secondHistory.match_result?.trieu_dai || 'Unknown'}</Text>
                      <Text style={s.gcTitle} numberOfLines={1}>{secondHistory.match_result?.hieu_de_vi || 'Vật phẩm'}</Text>
                      <View style={s.gcBadge}><Text style={s.gcBadgeText}>AI Detected</Text></View>
                    </View>
                  </TouchableOpacity>
                )}
                {thirdHistory && (
                  <TouchableOpacity style={s.gridCard} onPress={() => setScreen('History')}>
                    <Image source={{uri: `${BASE_URL}/${thirdHistory.image_path}`}} style={s.gcImg} />
                    <View style={s.gcContent}>
                      <Text style={s.gcSuper} numberOfLines={1}>{thirdHistory.match_result?.trieu_dai || 'Unknown'}</Text>
                      <Text style={s.gcTitle} numberOfLines={1}>{thirdHistory.match_result?.hieu_de_vi || 'Vật phẩm'}</Text>
                      <View style={s.gcBadge}><Text style={s.gcBadgeText}>Phân tích</Text></View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ─── SCENE 2: SCANNING / RESULT VIEW ─── */}
        {(image || result || loading) && (
          <View style={s.resultWrap}>
            {/* FLOATING HEADER */}
            <View style={s.resHeader}>
              <View style={s.logoRow}>
                <Text style={s.logoIcon}>🏺</Text>
                <Text style={s.logoText}>MarkSense <Text style={{fontWeight:'300'}}>AI</Text></Text>
              </View>
              <TouchableOpacity style={s.proBtn} onPress={() => setScreen('Pricing')}>
                <Text style={s.proText}>PRO</Text>
              </TouchableOpacity>
            </View>

            <View style={s.imgWrapper}>
              <Image source={{ uri: image ? image.uri : DEFAULT_IMG }} style={s.img} />
              {result && (
                <View style={s.badgeConfirmed}>
                  <Text style={{fontSize: 12}}>✓</Text>
                  <Text style={s.badgeText}>ĐÃ NHẬN DẠNG</Text>
                </View>
              )}
            </View>

            <View style={s.sheet}>
              {loading && (
                <View style={{alignItems: 'center', marginVertical: 40}}>
                  <ActivityIndicator size="large" color="#059669" />
                  <Text style={{color: '#475569', marginTop: 16}}>Hệ thống đang phân tích chi tiết...</Text>
                </View>
              )}

              {!loading && !result && image && (
                <View>
                  <Text style={s.sheetTitle}>Xác nhận hình ảnh</Text>
                  <Text style={s.descText}>Bức ảnh này sẽ được gửi đến hệ thống MarkSense AI để trích xuất niên đại và xuất xứ.</Text>
                  <View style={s.btnCol}>
                    <TouchableOpacity style={s.mainBtn} onPress={doAnalyze}>
                      <Text style={s.mainBtnText}>🔍 Bắt Đầu Phân Tích</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.secBtn} onPress={clearScan}>
                      <Text style={s.secBtnText}>Xóa ảnh này</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!loading && result && (
                <View>
                  <View style={s.titleRow}>
                    <View style={s.titleWrap}>
                      <Text style={s.sheetTitle}>{result.hieude}</Text>
                      <Text style={s.subtitle}>{result.hieude_en || result.hanzi}</Text>
                    </View>
                    <View style={s.matchBox}>
                      <Text style={s.matchVal}>98%</Text>
                      <Text style={s.matchLbl}>CHÍNH XÁC</Text>
                    </View>
                  </View>

                  <View style={s.pillsRow}>
                    <View style={s.pill}>
                      <Text style={s.pillIcon}>👑</Text>
                      <Text style={s.pillLabel}>TRIỀU ĐẠI</Text>
                      <Text style={s.pillVal}>{result.trieudai}</Text>
                    </View>
                    <View style={s.pill}>
                      <Text style={s.pillIcon}>📜</Text>
                      <Text style={s.pillLabel}>NIÊN HIỆU</Text>
                      <Text style={s.pillVal}>{result.nienhieu}</Text>
                    </View>
                    <View style={s.pill}>
                      <Text style={s.pillIcon}>⏳</Text>
                      <Text style={s.pillLabel}>NIÊN ĐẠI</Text>
                      <Text style={s.pillVal}>{result.niendai}</Text>
                    </View>
                  </View>

                  <Text style={s.secCardTitle}>Bối cảnh lịch sử</Text>
                  <View style={s.careTipsBox}>
                    <Text style={s.careIcon}>🏺</Text>
                    <Text style={s.careText}>{result.boicanh}</Text>
                  </View>

                  <Text style={s.secCardTitle}>Đặc điểm nghệ thuật & Thư pháp</Text>
                  <Text style={s.descText}>{result.thuphapdacbiet}</Text>

                  <TouchableOpacity style={s.mainBtn} onPress={clearScan}>
                    <Text style={{color: '#fff', fontSize: 18, fontWeight: '700', marginRight: 8}}>+</Text>
                    <Text style={s.mainBtnText}>Phân tích mẫu khác</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <AppFooter current="Home" setScreen={setScreen} onCenterPress={pickImage} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  scroll: { flexGrow: 1, paddingBottom: 120 },

  // 1. DASHBOARD STYLES
  dashboardWrap: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  heroCard: { width: '100%', height: 420, borderRadius: 28, overflow: 'hidden', position: 'relative', marginBottom: 32 },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)', padding: 24,
    justifyContent: 'flex-end',
  },
  heroPill: { backgroundColor: '#fdfbf7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  heroPillText: { fontSize: 9, fontWeight: '800', color: '#78716c', letterSpacing: 0.5 },
  heroTitle: { fontSize: 32, fontFamily: 'serif', color: '#fff', lineHeight: 38, marginBottom: 22, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 6 },
  heroBtn: { backgroundColor: '#065f46', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  heroBtnText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  section: { marginBottom: 36 },
  secSuper: { fontSize: 9, color: '#78716c', fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  rowSpace: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  secTitle: { fontSize: 22, color: '#1c1917', fontFamily: 'serif' },
  linkText: { fontSize: 10, fontWeight: '800', color: '#1c1917', borderBottomWidth: 1, borderBottomColor: '#1c1917', marginBottom: 4 },

  recentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  rcImg: { width: 90, height: 90, borderRadius: 14, backgroundColor: '#e7e5e4' },
  rcContent: { flex: 1, marginLeft: 16 },
  rcTitle: { fontSize: 16, color: '#1c1917', fontFamily: 'serif', marginBottom: 4 },
  rcSub: { fontSize: 12, color: '#57534e', lineHeight: 18, marginBottom: 12 },
  rcProgressRow: { flexDirection: 'row', alignItems: 'center' },
  progressBar: { flex: 1, height: 4, backgroundColor: '#e7e5e4', borderRadius: 2, marginRight: 10 },
  progressFill: { width: '98%', height: '100%', backgroundColor: '#1c1917', borderRadius: 2 },
  progressText: { fontSize: 10, fontWeight: '700', color: '#1c1917' },

  gridRow: { flexDirection: 'row', gap: 16 },
  gridCard: { flex: 1, backgroundColor: '#fff', borderRadius: 24, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  gcImg: { width: '100%', height: 130, borderRadius: 16, backgroundColor: '#e7e5e4', marginBottom: 12 },
  gcContent: { alignItems: 'flex-start', paddingHorizontal: 4 },
  gcSuper: { fontSize: 8, color: '#78716c', fontWeight: '800', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  gcTitle: { fontSize: 15, color: '#1c1917', fontFamily: 'serif', marginBottom: 8 },
  gcBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  gcBadgeText: { fontSize: 9, fontWeight: '800', color: '#065f46' },

  // 2. RESULT STYLES
  resultWrap: { width: '100%' },
  resHeader: { 
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 18, fontWeight: '800', fontFamily: 'serif', color: '#1c1917' },
  proBtn: { backgroundColor: '#065f46', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  proText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  imgWrapper: { width: '100%', height: 420, position: 'relative' },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  badgeConfirmed: {
    position: 'absolute', top: 110, left: 24,
    backgroundColor: 'rgba(253,251,247,0.95)', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#065f46', letterSpacing: 0.5 },

  sheet: {
    backgroundColor: '#fdfbf7',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    marginTop: -40,
    paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40,
    minHeight: 500,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titleWrap: { flex: 1, paddingRight: 16 },
  sheetTitle: { fontSize: 28, fontWeight: '800', color: '#1c1917', fontFamily: 'serif', marginBottom: 2, lineHeight: 34 },
  subtitle: { fontSize: 15, fontStyle: 'italic', color: '#78716c' },
  
  matchBox: { backgroundColor: '#d1fae5', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  matchVal: { fontSize: 20, fontWeight: '800', color: '#065f46' },
  matchLbl: { fontSize: 9, fontWeight: '800', color: '#065f46', letterSpacing: 0.5 },

  pillsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  pill: { backgroundColor: '#f5f5f4', width: '31%', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 4, alignItems: 'center' },
  pillIcon: { fontSize: 22, marginBottom: 8 },
  pillLabel: { fontSize: 9, fontWeight: '800', color: '#78716c', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  pillVal: { fontSize: 12, fontWeight: '700', color: '#1c1917', textAlign: 'center' },

  secCardTitle: { fontSize: 17, fontWeight: '800', color: '#1c1917', fontFamily: 'serif', marginBottom: 14 },
  careTipsBox: { backgroundColor: '#f5f5f4', borderRadius: 16, padding: 18, flexDirection: 'row', marginBottom: 28 },
  careIcon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  careText: { fontSize: 13, color: '#57534e', lineHeight: 22, flex: 1 },
  descText: { fontSize: 14, color: '#57534e', lineHeight: 24, paddingBottom: 32 },

  btnCol: { gap: 12, marginTop: 10 },
  mainBtn: { backgroundColor: '#065f46', borderRadius: 24, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#065f46', shadowOpacity: 0.3, shadowRadius: 8 },
  mainBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  secBtn: { backgroundColor: '#f5f5f4', borderRadius: 24, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  secBtnText: { color: '#44403c', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
