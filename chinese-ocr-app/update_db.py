import json
import os

db_path = 'd:/HieuDe_AI/chinese-ocr-app/data/hieu_de_database.json'
with open(db_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    trieu_dai = item.get('trieu_dai', '')
    
    if 'Minh' in trieu_dai:
        thu_phap = "Đa phần dùng thể Khải thư (Kaishu). Nét bút dứt khoát, thường có độ đậm nhạt do kỹ thuật chấm bút lông đặc trưng. Đầu bút có xu hướng nhấn mạnh."
        nghe_thuat = "Bố cục thường dàn trải đều, ký tự lam trên nền trắng (Thanh hoa) có hiện tượng tích tụ màu sậm (hắc tỳ). Men mượt và thấm sâu vào cốt gốm."
    elif 'Thanh' in trieu_dai:
        thu_phap = "Thư pháp đạt đến độ chuẩn mực cao, các nét chữ ngay ngắn, sắc nét và cực kỳ tinh chuẩn. Thường dùng Khải thư cho dòng Quan diêu; đôi lúc dùng Triện tư (Seal script)."
        nghe_thuat = "Đường nét vô cùng trau chuốt, kỹ thuật nung và tráng men đạt đến đỉnh cao. Màu sắc đồng đều, không bị lem sậm như đời Minh, thể hiện sự kiểm soát kỹ thuật hoàn hảo."
    elif 'Nguyên' in trieu_dai or 'Yuan' in trieu_dai:
        thu_phap = "Chữ ký đôi khi thô ráp, không quá gò bó theo chuẩn mực, nét chữ phóng khoáng, thường viết dưới dạng Hán tự hoặc chữ Phạn mạn chữ bát."
        nghe_thuat = "Màu lam (Cobalt) nhập từ Ba Tư nên cho sắc đậm sáng tươi cọ vẽ, có nhiều vết rỗ trên bề mặt. Phong cách trang trí có thiên hướng tự do, hình thảo mãnh liệt."
    elif 'Tống' in trieu_dai or 'Song' in trieu_dai:
        thu_phap = "Hiếm khi có hiệu đề viết dưới đáy; nếu có thường là khắc chìm nhạt, chữ nhỏ và sắc nét."
        nghe_thuat = "Tôn sùng sự đơn giản, vẻ đẹp tinh tế của men màu đơn sắc (monochrome) như ngọc bích, trắng ngà. Kỹ thuật khắc nặn là chủ yếu thay vì vẽ men lam."
    else:
        thu_phap = "Nét chữ mang phong cách triện thư, lệ thư hoặc khải thư phụ thuộc lớn vào kỹ thuật của xưởng gốm địa phương."
        nghe_thuat = "Phong cách trang trí mang dấu ấn văn hóa vùng miền đậm nét, kỹ thuật nung có chênh lệch giữa dòng Dân diêu và Quan diêu."
    
    if item.get('nien_hieu') == 'Vĩnh Lạc' or item.get('nien_hieu') == 'Tuyên Đức':
         thu_phap = "Chữ thường viết tự do hơn, nét gập (triết) rõ ràng. Thường không có khung viền hoặc có viền đôi mờ."
         
    if item.get('nien_hieu') == 'Khang Hy':
         thu_phap = "Thường viết thành ba dòng, mỗi dòng hai chữ. Nét chữ đầy đặn và mạnh mẽ."
         nghe_thuat = "Lam trên nền lam (blue on blue) rất đặc trưng. Lối quy hoạch hiệu đề rất quy củ."
         
    if item.get('nien_hieu') == 'Càn Long':
         thu_phap = "Áp đảo bởi Triện thư (Seal script) sáu chữ tạo thành hình vuông cân đối như con dấu."
         nghe_thuat = "Kỹ thuật đùn men sậm đỏ, vàng chanh, hoặc 粉彩 (Phấn thái) cực kỳ diễm lệ, xa hoa."

    item['thu_phap'] = item.get('thu_phap', thu_phap)
    item['nghe_thuat'] = item.get('nghe_thuat', nghe_thuat)

with open(db_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('Updated DB successfully!')
