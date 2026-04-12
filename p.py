import re; print(re.search(r'var PACKAGES_INFO = \{[\s\S]*?\}', open('d:/HieuDe_AI/chinese-ocr-app/index.html', encoding='utf-8').read()).group(0))  
