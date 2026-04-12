import re

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', encoding='utf-8') as f:
    c = f.read()

new_pkg = '''var PACKAGES_INFO = {
      basic: { name: 'Gói Cơ bản', credits: 50, price: 490000 },
      pro: { name: 'Gói Archivist Pro ($17)', credits: 200, price: 447712 },
      enterprise: { name: 'Gói Chuyên nghiệp ($100)', credits: 99999, price: 2490000 }
    };'''

c = re.sub(r'var\s+PACKAGES_INFO\s*=\s*\{.*?\};', new_pkg, c, flags=re.DOTALL)
with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done!')
