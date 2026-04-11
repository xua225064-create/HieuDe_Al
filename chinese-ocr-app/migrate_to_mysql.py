import json
import pymysql
import os
import sys

# Windows console fix for utf-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# Cấu hình kết nối MySQL (Mặc định XAMPP: user 'root', không pass)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'hieude_ai_db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "hieu_de_database.json")

def migrate():
    print("Đang đọc dữ liệu từ JSON...")
    if not os.path.exists(DATA_PATH):
        print(f"Không tìm thấy file {DATA_PATH}")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as file:
        database = json.load(file)

    print(f"Đã tải {len(database)} hiệu đề. Đang kết nối MySQL...")
    try:
        connection = pymysql.connect(**DB_CONFIG)
        with connection.cursor() as cursor:
            # Xóa sạch bảng marks cũ nếu muốn import lại từ đầu (tùy chọn)
            cursor.execute("TRUNCATE TABLE marks")
            
            insert_query = """
            INSERT INTO marks (
                id, chu_han, chu_han_4, chu_han_6, bien_the, phien_am, ten_viet, 
                hoang_de, trieu_dai, nam_bat_dau, nam_ket_thuc, ghi_chu, 
                hien_thi_chinh, nien_hieu, nien_dai, hieu_de_en, mo_ta, 
                hieu_de_vi, thu_phap, nghe_thuat
            ) VALUES (
                %(id)s, %(chu_han)s, %(chu_han_4)s, %(chu_han_6)s, %(bien_the)s, %(phien_am)s, %(ten_viet)s, 
                %(hoang_de)s, %(trieu_dai)s, %(nam_bat_dau)s, %(nam_ket_thuc)s, %(ghi_chu)s, 
                %(hien_thi_chinh)s, %(nien_hieu)s, %(nien_dai)s, %(hieu_de_en)s, %(mo_ta)s, 
                %(hieu_de_vi)s, %(thu_phap)s, %(nghe_thuat)s
            )
            """

            for item in database:
                if 'bien_the' in item and isinstance(item['bien_the'], list):
                    item['bien_the'] = json.dumps(item['bien_the'], ensure_ascii=False)
                else:
                    item['bien_the'] = "[]"
                
                fields = ['chu_han_6', 'phien_am', 'ten_viet', 'hoang_de', 'trieu_dai', 
                          'nam_bat_dau', 'nam_ket_thuc', 'ghi_chu', 'hien_thi_chinh', 
                          'nien_hieu', 'nien_dai', 'hieu_de_en', 'mo_ta', 'hieu_de_vi', 
                          'thu_phap', 'nghe_thuat']
                for field in fields:
                    if field not in item:
                        item[field] = None
                        
                cursor.execute(insert_query, item)
                
            connection.commit()
            print("Import dữ liệu thành công!")
    except pymysql.MySQLError as e:
        print(f"Lỗi MySQL: {e}")
        print("Có thể chưa tạo database 'hieude_ai_db'. Hãy import file database.sql qua phpMyAdmin trước.")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    migrate()
