import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function PrivacyScreen({ setScreen }) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => setScreen('Home')}>
          <Feather name="arrow-left" size={22} color="#1c1917" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chính Sách Bảo Mật</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.contentCard}>
          <Text style={s.title}>Chính sách Bảo mật</Text>
          <Text style={s.lastUpdate}>Cập nhật lần cuối: Tháng 4/2026</Text>

          <Text style={s.h2}>1. Thu thập thông tin</Text>
          <Text style={s.body}>
            Trong quá trình cung cấp dịch vụ phân tích hình ảnh, chúng tôi có thể thu thập các thông tin sau:
            {'\n'}• Bức ảnh hiệu đề do bạn chủ động tải lên/quét vào hệ thống.
            {'\n'}• Thông tin thiết bị và địa chỉ IP nhằm mục đích phát hiện các hành vi bất thường.
            {'\n'}• Tên hiển thị và địa chỉ Email (nếu bạn sử dụng tính năng Đăng nhập/Đăng ký).
          </Text>

          <Text style={s.h2}>2. Mục đích sử dụng</Text>
          <Text style={s.body}>
            Dữ liệu hình ảnh tải lên được sử dụng duy nhất cho quá trình nhận diện bề mặt bằng hệ thống Trí tuệ nhận tạo của chúng tôi và có thể được dùng để tinh chỉnh nâng cao (Fine-tuning) độ chính xác cho AI. Mọi thông tin cá nhân đều phục vụ cho trải nghiệm như lưu lịch sử giám định và khôi phục điểm số (credits).
          </Text>

          <Text style={s.h2}>3. Bảo mật thông tin của bạn</Text>
          <Text style={s.body}>
            MarkSense AI cam kết nỗ lực bảo vệ dữ liệu cá nhân của bạn thông qua các biện pháp bảo mật hiện đại nhằm quản lý quyền truy cập và tránh các hình thức tấn công dữ liệu mạng.
          </Text>

          <Text style={s.h2}>4. Tiết lộ thông tin</Text>
          <Text style={s.body}>
            Chúng tôi tuyệt đối không mua bán, trao đổi hoặc chia sẻ thông tin cá nhân của người dùng cho bên thứ ba vì mục đích thương mại. Việc cung cấp dữ liệu có thể phải thực thi nếu có yêu cầu đột xuất hoặc lệnh từ cơ quan chức năng có thẩm quyền theo quy định pháp luật sở tại.
          </Text>

          <Text style={s.h2}>5. Quyền kiểm soát dữ liệu</Text>
          <Text style={s.body}>
            Bạn có thể tuỳ chọn yêu cầu xoá toàn bộ lịch sử phân tích trong phần Lịch sử giám định, cũng như việc chỉnh sửa bổ sung thay thế các thông tin ở mục Hồ sơ tài khoản bất cứ lúc nào.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f5f4', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  scroll: { padding: 20, paddingBottom: 60 },
  contentCard: { 
    backgroundColor: '#fff', 
    borderColor: '#e7e5e4', 
    borderWidth: 1, 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 20,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2 
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1c1917', marginBottom: 8 },
  lastUpdate: { fontSize: 13, color: '#a8a29e', marginBottom: 24, fontStyle: 'italic' },
  h2: { fontSize: 16, fontWeight: '700', color: '#065f46', marginTop: 24, marginBottom: 12 },
  body: { fontSize: 14, color: '#57534e', lineHeight: 24 },
});
