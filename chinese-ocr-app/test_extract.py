import re

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', encoding='utf-8') as f:
    content = f.read()

for b in re.findall(r'<h3.*?/button>', content, re.IGNORECASE|re.DOTALL):
    title = re.search(r'<h3[^>]*>([^<]+)</h3>', b)
    price = re.search(r'([0-9]+\$|\$0)', b)
    onclick = re.search(r'onclick="([^\"]+)"', b)
    if title:
        print('Title:', title.group(1).strip() if title else '')
        print('Price:', price.group(1).strip() if price else '')
        print('OnClick:', onclick.group(1).strip() if onclick else '')
        print('---')
