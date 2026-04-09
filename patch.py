import re
with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace preview section completely
html = re.sub(r'<div class=""preview"" id=""preview"">.*?<div class=""actions"">', '<div class=""preview"" id=""preview"">\n<img id=""previewImage"" alt=""?nh hi?u d?"" />\n</div>\n<div class=""actions"">', html, flags=re.DOTALL)

# Delete JS variables and logic
html = re.sub(r'const previewContainer.*?const cropCtx = cropCanvas\.getContext\(""2d""\);', '', html, flags=re.DOTALL)
html = re.sub(r'let cropRect.*?layerOffsetY = 0;', '', html, flags=re.DOTALL)
html = re.sub(r'cropRect = null;.*?resizeCropCanvas\(\)\);', '', html, flags=re.DOTALL)

# Find the block from resizeCropCanvas down to window.addEventListener and remove
html = re.sub(r'const resizeCropCanvas =.*?window\.addEventListener\(""resize"", \(\) => resizeCropCanvas\(\)\);', '', html, flags=re.DOTALL)

html = re.sub(r'const appendCropToForm.*?\}\s*\}\s*;\s*', '', html, flags=re.DOTALL)
html = re.sub(r'appendCropToForm\(formData\);\s*', '', html, flags=re.DOTALL)

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
