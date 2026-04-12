import re  
with open('d:/HieuDe_AI/chinese-ocr-app/index.html', encoding='utf-8') as f:  
    c = f.read()  
    m = re.search(r'PACKAGES_INFO\s*=\s*\{.*?\};', c, re.DOTALL)  
    print(m.group(0))  
