import pymysql
import json
from contextlib import contextmanager

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'hieude_ai_db',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    try:
        return pymysql.connect(**DB_CONFIG)
    except Exception as e:
        print(f"[DB] Cannot connect to MySQL: {e}")
        return None

def fetch_all_marks():
    conn = get_db_connection()
    if not conn:
        return None
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM marks")
            marks = cursor.fetchall()
            # Restore JSON fields
            for mark in marks:
                if mark.get('bien_the'):
                    if isinstance(mark['bien_the'], str):
                        try:
                            mark['bien_the'] = json.loads(mark['bien_the'])
                        except:
                            mark['bien_the'] = []
            return marks
    except Exception as e:
        print(f"[DB] Error fetching marks: {e}")
        return None
    finally:
        conn.close()

def create_user(username, password_hash):
    conn = get_db_connection()
    if not conn: return False
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, password_hash))
        conn.commit()
        return True
    except Exception as e:
        print(e)
        return False
    finally:
        conn.close()

def get_user_by_username(username):
    conn = get_db_connection()
    if not conn: return None
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            return cursor.fetchone()
    finally:
        conn.close()

def add_scan_history(user_id, image_path, ocr_text, match_result):
    conn = get_db_connection()
    if not conn: return False
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            user_row = cursor.fetchone()
            username = user_row['username'] if user_row else 'unknown'
            
            cursor.execute(
                "INSERT INTO scan_history (user_id, username, image_path, ocr_text, match_result) VALUES (%s, %s, %s, %s, %s)",
                (user_id, username, image_path, ocr_text, json.dumps(match_result, ensure_ascii=False))
            )
        conn.commit()
        return True
    finally:
        conn.close()

def get_scan_history(user_id):
    conn = get_db_connection()
    if not conn: return []
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM scan_history WHERE user_id = %s ORDER BY created_at DESC", 
                (user_id,)
            )
            rows = cursor.fetchall()
            for r in rows:
                if r.get('match_result'):
                    try:
                        r['match_result'] = json.loads(r['match_result'])
                    except:
                        pass
                # Format datetime for JSON safely
                if r.get('created_at'):
                    r['created_at'] = r['created_at'].strftime("%Y-%m-%d %H:%M:%S")
            return rows
    except Exception as e:
        print(e)
        return []
    finally:
        conn.close()

def get_or_create_social_user(email, name, provider):
    """Tìm hoặc tạo user từ đăng nhập mạng xã hội (Google/Facebook)."""
    conn = get_db_connection()
    if not conn: return None
    try:
        with conn.cursor() as cursor:
            # Kiểm tra user đã tồn tại chưa
            cursor.execute("SELECT * FROM users WHERE username = %s", (email,))
            user = cursor.fetchone()
            if user:
                return user
            # Tạo user mới (không cần password cho social login)
            cursor.execute(
                "INSERT INTO users (username, password_hash, display_name, provider, scan_credits) VALUES (%s, %s, %s, %s, %s)",
                (email, '', name, provider, 10)
            )
        conn.commit()
        # Lấy lại user vừa tạo
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE username = %s", (email,))
            return cursor.fetchone()
    except Exception as e:
        print(f"[DB] Social login error: {e}")
        # Nếu bảng chưa có cột display_name/provider, fallback tạo đơn giản
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
                    (email, '')
                )
            conn.commit()
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE username = %s", (email,))
                return cursor.fetchone()
        except Exception as e2:
            print(f"[DB] Fallback social login error: {e2}")
            return None
    finally:
        conn.close()

# ========== SCAN CREDITS SYSTEM ==========

DEFAULT_FREE_CREDITS = 10

def ensure_credits_column():
    """Đảm bảo cột scan_credits tồn tại trong bảng users."""
    conn = get_db_connection()
    if not conn: return
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) as cnt FROM information_schema.columns 
                WHERE table_schema = %s AND table_name = 'users' AND column_name = 'scan_credits'
            """, (DB_CONFIG['database'],))
            result = cursor.fetchone()
            if result['cnt'] == 0:
                cursor.execute(f"ALTER TABLE users ADD COLUMN scan_credits INT DEFAULT {DEFAULT_FREE_CREDITS}")
                cursor.execute(f"UPDATE users SET scan_credits = {DEFAULT_FREE_CREDITS} WHERE scan_credits IS NULL")
                conn.commit()
                print("[DB] Added scan_credits column to users table.")
            else:
                print("[DB] scan_credits column already exists.")
    except Exception as e:
        print(f"[DB] Error ensuring credits column: {e}")
    finally:
        conn.close()

def get_user_credits(user_id):
    """Lấy số lượt phân tích còn lại của user."""
    conn = get_db_connection()
    if not conn: return 0
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT scan_credits FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if row and row.get('scan_credits') is not None:
                return row['scan_credits']
            return DEFAULT_FREE_CREDITS
    except Exception as e:
        print(f"[DB] Error getting credits: {e}")
        return 0
    finally:
        conn.close()

def deduct_credit(user_id):
    """Trừ 1 lượt phân tích. Trả về số lượt còn lại hoặc -1 nếu hết lượt."""
    conn = get_db_connection()
    if not conn: return -1
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT scan_credits FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            current = row['scan_credits'] if row and row.get('scan_credits') is not None else 0
            if current <= 0:
                return -1
            new_credits = current - 1
            cursor.execute("UPDATE users SET scan_credits = %s WHERE id = %s", (new_credits, user_id))
        conn.commit()
        return new_credits
    except Exception as e:
        print(f"[DB] Error deducting credit: {e}")
        return -1
    finally:
        conn.close()

def add_credits(user_id, amount):
    """Thêm lượt phân tích cho user (sau khi mua gói)."""
    conn = get_db_connection()
    if not conn: return False
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET scan_credits = scan_credits + %s WHERE id = %s", (amount, user_id))
        conn.commit()
        return True
    except Exception as e:
        print(f"[DB] Error adding credits: {e}")
        return False
    finally:
        conn.close()
