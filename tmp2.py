import re  
with open('d:/HieuDe_AI/chinese-ocr-app/index.html', encoding='utf-8') as f:  
    lines = f.readlines()  
    for i, l in enumerate(lines):  
        if 'PACKAGES_INFO' in l:  
            print(''.join(lines[i:i+6]))  
