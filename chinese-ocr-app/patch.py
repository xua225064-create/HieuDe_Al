import re

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace preview HTML
preview_old = re.compile(r'<div class="preview" id="preview">.*?<div class="actions">', re.DOTALL)
preview_new = '''<div class="preview" id="preview">
        <img id="previewImage" alt="Ảnh hiệu đề" />
      </div>

      <div class="actions">'''
html = preview_old.sub(preview_new, html)

# Replace Javascript logic related to canvas
# find from "const previewContainer =" to the end of appendCropToForm

# Since regular expression might be tricky due to variables, let's just do targeted string replacements
# Look for block
js_part_1 = re.compile(r'const previewContainer\s*=\s*document\.getElementById\("previewContainer"\);.*?const cropCtx\s*=\s*cropCanvas\.getContext\("2d"\);', re.DOTALL)
html = js_part_1.sub('', html)

js_part_2 = re.compile(r'let cropRect\s*=\s*null;.*?let layerOffsetY\s*=\s*0;', re.DOTALL)
html = js_part_2.sub('', html)

js_show_preview = re.compile(r'        cropRect = null;\s*resetZoom\(\);\s*requestAnimationFrame\(\(\) => resizeCropCanvas\(\)\);', re.DOTALL)
html = js_show_preview.sub('', html)

js_crop_funcs = re.compile(r'const resizeCropCanvas = \(\) => \{.+?window\.addEventListener\("resize", \(\) => resizeCropCanvas\(\)\);', re.DOTALL)
html = js_crop_funcs.sub('', html)

js_append = re.compile(r'const appendCropToForm = \(formData\) => \{.*?\};\s*', re.DOTALL)
html = js_append.sub('', html)

js_call_append = re.compile(r'appendCropToForm\(formData\);\s*', re.DOTALL)
html = js_call_append.sub('', html)

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
