import sys
sys.path.append('.')
from main import rank_by_multi_candidates

def fetch_all():
    import pymysql
    import json
    conn = pymysql.connect(host='localhost', user='root', password='', database='hieude_ai_db', charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor)
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM marks")
        marks = cursor.fetchall()
        for mark in marks:
            if mark.get('bien_the'):
                if isinstance(mark['bien_the'], str):
                    try:
                        mark['bien_the'] = json.loads(mark['bien_the'])
                    except:
                        mark['bien_the'] = []
    conn.close()
    return marks

db = fetch_all()

def test_rank(candidates):
    matches = rank_by_multi_candidates(candidates, db, top_n=5)
    for m in matches:
        print(f"Ranked: {m.get('chu_han')}: {m.get('raw_score', 0):.4f}")

test_rank(["年", "熙大年清"])
