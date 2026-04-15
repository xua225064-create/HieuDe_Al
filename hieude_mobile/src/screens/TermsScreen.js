import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TermsScreen({ setScreen }) {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => setScreen('Home')}>
          <Feather name="arrow-left" size={22} color="#1c1917" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Điều Khoản Dịch Vụ</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.contentCard}>
          <Text style={s.title}>Điều khoản Dịch vụ</Text>
          <Text style={s.lastUpdate}>Cập nhật lần cuối: Tháng 4/2026</Text>

          <Text style={s.h2}>1. Chấp nhận các Điều khoản</Text>
          <Text style={s.body}>
            Bằng việc truy cập hoặc sử dụng ứng dụng MarkSense AI, bạn đồng ý tuân thủ và bị ràng buộc bởi các Điều khoản và Điều kiện sử dụng này. Nếu bạn không đồng ý với toàn bộ các điều khoản này, vui lòng ngừng sử dụng dịch vụ của chúng tôi ngay lập tức.
          </Text>

          <Text style={s.h2}>2. Dịch vụ cung cấp</Text>
          <Text style={s.body}>
            MarkSense AI cung cấp nền tảng hỗ trợ nhận dạng, phân tích và giám định hiệu đề gốm sứ cổ thông qua công nghệ Trí tuệ nhân tạo. Kết quả phân tích mang tính chất tham khảo chuyên sâu và không thể thay thế quyết định giám định cuối cùng của các chuyên gia.
          </Text>

          <Text style={s.h2}>3. Quyền sở hữu trí tuệ</Text>
          <Text style={s.body}>
            Mọi nội dung, tính năng và chức năng của hệ thống (bao gồm thiết kế, phần mềm, văn bản, dữ liệu phân tích, và hình ảnh) đều thuộc bản quyền của MarkSense AI Team. Bạn không được phép sao chép hoặc phân phối mà không có sự đồng ý bằng văn bản.
          </Text>

          <Text style={s.h2}>4. Trách nhiệm người dùng</Text>
          <Text style={s.body}>
            Bạn cam kết không sử dụng hệ thống vào các mục đích trái pháp luật, gian lận thương mại hoặc gây tổn hại đến hệ thống điện toán của chúng tôi. Nếu phát hiện vi phạm, hệ thống có quyền từ chối cung cấp dịch vụ và tài khoản của bạn có thể bị khóa vĩnh viễn.
          </Text>
          
          <Text style={s.h2}>5. Điểm tín dụng (Credits)</Text>
          <Text style={s.body}>
            Hệ thống sử dụng các gói Điểm tín dụng (Scan credits) cho mỗi lượt nhận dạng. Điểm tín dụng của gói miễn phí sẽ không được tích luỹ và không quy đổi thành tiền mặt. Điểm tín dụng đã mua không được hoàn lại trong mọi trường hợp.
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
