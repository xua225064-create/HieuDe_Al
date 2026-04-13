import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, BASE_URL } from '../config';
import { apiLogin, apiSocialLogin } from '../api';

function loadGoogleScript() {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (document.getElementById('google-gsi-script')) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

function loadFacebookScript() {
  if (Platform.OS !== 'web') return Promise.resolve();
  if (document.getElementById('facebook-jssdk')) return Promise.resolve();
  return new Promise((resolve) => {
    window.fbAsyncInit = function() {
      if (window.FB) {
        window.FB.init({
          appId: '1661000791513498', // App ID bạn vừa tạo
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        resolve();
      }
    };
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

const GOOGLE_CLIENT_ID = '166557696887-000bmp74q6m90gr0sv84ct7e6s21mdq0.apps.googleusercontent.com';

export default function LoginScreen({ handleLogin, setScreen }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const googleClientRef = useRef(null);

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') { window.alert(`${title}\n${msg}`); }
    else { Alert.alert(title, msg); }
  };

  // Load Google và Facebook SDK khi component mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      loadGoogleScript().then(() => {
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.accounts) {
            clearInterval(checkGoogle);
            googleClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
              callback: handleGoogleCallback,
            });
          }
        }, 200);
        return () => clearInterval(checkGoogle);
      });
      loadFacebookScript();
    }
  }, []);

  // Xử lý khi Google trả về token (giống hệt web)
  const handleGoogleCallback = async (tokenResponse) => {
    if (!tokenResponse || !tokenResponse.access_token) return;
    setSocialLoading('Google');
    try {
      // Lấy thông tin user từ Google
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const payload = await res.json();

      // Gửi lên backend /social-login (giống web)
      const data = await apiSocialLogin(payload.email, payload.name, 'Google');
      if (data.success) {
        handleLogin({ name: payload.name, email: payload.email, picture: payload.picture, token: data.token });
        showAlert('Thành công', `Đăng nhập thành công! Xin chào ${payload.name}`);
      } else {
        handleLogin({ name: payload.name, email: payload.email, picture: payload.picture });
      }
    } catch (e) {
      showAlert('Lỗi', 'Không thể kết nối. Vui lòng thử lại.');
    }
    finally { setSocialLoading(''); }
  };

  // Bấm nút Google → hiện popup chọn tài khoản
  const doGoogleLogin = () => {
    if (Platform.OS === 'web') {
      if (googleClientRef.current) {
        googleClientRef.current.requestAccessToken();
      } else {
        showAlert('Lỗi', 'Google SDK chưa sẵn sàng. Vui lòng tải lại trang.');
      }
    } else {
      // Trên native app, fallback gọi backend trực tiếp
      doSocialFallback('Google');
    }
  };

  // Facebook login thật (hiện popup)
  const doFacebookLogin = () => {
    if (Platform.OS === 'web') {
      if (!window.FB) {
        showAlert('Lỗi', 'Facebook SDK chưa sẵn sàng.');
        return;
      }
      window.FB.login(function(response) {
        if (response.authResponse) {
          window.FB.api('/me', {fields: 'name,email,picture'}, async function(profile) {
            setSocialLoading('Facebook');
            try {
              const email = profile.email || `fb_${profile.id}@facebook.com`;
              const name = profile.name || 'Facebook User';
              const data = await apiSocialLogin(email, name, 'Facebook');
              if (data.success) {
                handleLogin({ name: data.username || name, email, token: data.token });
                showAlert('Thành công', `Xin chào ${name}`);
              } else {
                showAlert('Thông báo', data.message || 'Đăng nhập thất bại');
              }
            } catch(e) {
              showAlert('Lỗi', 'Không thể kết nối.');
            } finally {
              setSocialLoading('');
            }
          });
        }
      }, {scope: 'public_profile,email'});
    } else {
      doSocialFallback('Facebook');
    }
  };

  // Fallback cho native (không có Google GIS)
  const doSocialFallback = async (provider) => {
    setSocialLoading(provider);
    try {
      const fakeEmail = `${provider.toLowerCase()}_user_${Date.now()}@${provider.toLowerCase()}.com`;
      const data = await apiSocialLogin(fakeEmail, `${provider} User`, provider);
      if (data.success) {
        handleLogin({ name: data.username || `${provider} User`, email: fakeEmail, token: data.token });
      }
    } catch (e) { showAlert('Lỗi', 'Không thể kết nối.'); }
    finally { setSocialLoading(''); }
  };

  // ─── Normal Login ───
  const doLogin = async () => {
    if (!email || !password) { showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.success) {
        handleLogin({ name: data.username, email, token: data.token });
      } else {
        showAlert('Lỗi', data.message || 'Đăng nhập thất bại');
      }
    } catch (e) { showAlert('Lỗi', 'Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={s.backBtn} onPress={() => setScreen('Home')}>
          <Text style={s.backText}>← Trang chủ</Text>
        </TouchableOpacity>

        <View style={s.authCard}>
          <View style={s.iconWrap}><Text style={s.iconText}>◇</Text></View>
          <Text style={s.brand}>MarkSense AI</Text>
          <Text style={s.tagline}>Hệ thống giám định hiệu đề gốm sứ thông minh</Text>

          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <View style={s.inputWrap}>
              <TextInput style={s.input} placeholder="name@company.com" placeholderTextColor="rgba(255,255,255,0.25)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <Text style={s.inputIcon}>✉</Text>
            </View>
          </View>

          <View style={s.field}>
            <View style={s.fieldHeader}>
              <Text style={s.label}>MẬT KHẨU</Text>
              <TouchableOpacity><Text style={s.forgotText}>Quên mật khẩu?</Text></TouchableOpacity>
            </View>
            <View style={s.inputWrap}>
              <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.25)" value={password} onChangeText={setPassword} secureTextEntry />
              <Text style={s.inputIcon}>🔒</Text>
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={doLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Đăng nhập</Text>}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>Hoặc tiếp tục với</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.socialRow}>
            <TouchableOpacity style={s.socialBtn} onPress={doGoogleLogin} disabled={!!socialLoading}>
              {socialLoading === 'Google' ? <ActivityIndicator size="small" color="#60a5fa" /> : (
                <><Text style={s.googleIcon}>G</Text><Text style={s.socialBtnText}>Google</Text></>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[s.socialBtn, s.fbBtn]} onPress={doFacebookLogin} disabled={!!socialLoading}>
              {socialLoading === 'Facebook' ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Text style={s.fbIcon}>f</Text><Text style={[s.socialBtnText, { color: '#fff' }]}>Facebook</Text></>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => setScreen('Register')}>
              <Text style={s.switchLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>© 2026 MarkSense AI</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  inner: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  backBtn: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
  backText: { color: COLORS.ink30, fontSize: 14, fontWeight: '500' },
  authCard: { width: '100%', maxWidth: 420, backgroundColor: COLORS.cardBg, borderColor: COLORS.cardBorder, borderWidth: 1, borderRadius: 16, padding: 32, alignItems: 'center' },
  iconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(96,165,250,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' },
  iconText: { color: '#60a5fa', fontSize: 22, fontWeight: 'bold' },
  brand: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28, textAlign: 'center' },
  field: { width: '100%', marginBottom: 16 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.ink30, marginBottom: 8, letterSpacing: 1 },
  forgotText: { fontSize: 12, color: '#60a5fa', fontWeight: '600' },
  inputWrap: { position: 'relative', width: '100%' },
  input: { width: '100%', padding: 14, paddingRight: 44, backgroundColor: 'rgba(15,23,42,0.8)', borderColor: COLORS.cardBorder, borderWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)', borderBottomWidth: 2, borderRadius: 8, color: '#e2e8f0', fontSize: 15 },
  inputIcon: { position: 'absolute', right: 14, top: 14, fontSize: 16, opacity: 0.3 },
  btn: { width: '100%', padding: 16, backgroundColor: COLORS.cobalt, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginHorizontal: 12, fontWeight: '500' },
  socialRow: { flexDirection: 'row', width: '100%', gap: 10 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 13, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fbBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  fbIcon: { fontSize: 18, fontWeight: '800', color: '#fff' },
  socialBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', marginTop: 20 },
  switchText: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  switchLink: { color: '#60a5fa', fontWeight: '700', fontSize: 13 },
  footer: { color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 30 },
});
