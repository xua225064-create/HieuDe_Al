import json
import glob
import os

db = json.load(open('data/hieu_de_database.json', encoding='utf-8'))
db_map = {item.get('chu_han'): item for item in db if 'chu_han' in item}

for file_path in glob.glob('data/reference_library/*.json'):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        report = data.get('report', {})
        chu_han = report.get('chu_han')
        
        if chu_han in db_map:
            db_entry = db_map[chu_han]
            # Update missing fields in report from database entry
            for k, v in db_entry.items():
                if k not in report or not report[k] or report[k] == 'Đang cập nhật...':
                    report[k] = v
            # If the database entry was updated with thu_phap or nghe_thuat, force update them
            if 'thu_phap' in db_entry: report['thu_phap'] = db_entry['thu_phap']
            if 'nghe_thuat' in db_entry: report['nghe_thuat'] = db_entry['nghe_thuat']
            if 'hieu_de_vi' in db_entry: report['hieu_de_vi'] = db_entry['hieu_de_vi']
            if 'mo_ta' in db_entry: report['mo_ta'] = db_entry['mo_ta']
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Updated {os.path.basename(file_path)}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")
