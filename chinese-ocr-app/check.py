import pymysql
conn=pymysql.connect(host='localhost',user='root',password='',database='hieude_ai_db',charset='utf8mb4')
c=conn.cursor(pymysql.cursors.DictCursor)
c.execute('SELECT * FROM marks')
items=c.fetchall()
res = []
for x in items:
    ch = x.get('chu_han', '')
    if '內' in ch or '内' in ch or '侍' in ch or '杜' in ch or '牡' in ch or '府' in ch:
        res.append(ch)
with open('check_out.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(res))
