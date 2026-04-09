import re

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace preview block with simplified HTML
preview_search = re.search(r'(<div class="preview" id="preview">.*?<div class="actions">)', text, re.DOTALL)
if preview_search:
    text = text.replace(preview_search.group(1), '''<div class="preview" id="preview">
        <img id="previewImage" alt="Ảnh hiệu đề" />
      </div>

      <div class="actions">''')

# Remove variable declarations
vars_to_remove = [
    'const previewContainer = document.getElementById("previewContainer");',
    'const zoomLayer = document.getElementById("zoomLayer");',
    'const cropCanvas = document.getElementById("cropCanvas");',
    'const zoomOutButton = document.getElementById("zoomOut");',
    'const zoomInButton = document.getElementById("zoomIn");',
    'const zoomResetButton = document.getElementById("zoomReset");',
    'const cropCtx = cropCanvas.getContext("2d");',
]
for v in vars_to_remove: 
    text = text.replace(v, '')

# Find and eliminate cropRect down to layerOffsetY
js_state = re.search(r'(let cropRect = null;.*?let layerOffsetY = 0;)', text, re.DOTALL)
if js_state: 
    text = text.replace(js_state.group(1), '')

# Fix showPreview
show_preview = re.search(r'(const showPreview.*?reader\.readAsDataURL\(file\);\s*\};)', text, re.DOTALL)
if show_preview:
    sp_clean = re.sub(r'cropRect = null;\s*resetZoom\(\);\s*requestAnimationFrame\(\(\) => resizeCropCanvas\(\)\);', '', show_preview.group(1))
    text = text.replace(show_preview.group(1), sp_clean)

# Remove bulk methods: resizeCropCanvas -> window.addEventListener
bulk = re.search(r'(const resizeCropCanvas = \(\) => \{.*?window\.addEventListener\("resize", \(\) => resizeCropCanvas\(\)\);)', text, re.DOTALL)
if bulk: 
    text = text.replace(bulk.group(1), '')

# Remove appendCropToForm logic
append_method = re.search(r'(const appendCropToForm = \(formData\) => \{.*?\n\s*\};\s*)', text, re.DOTALL)
if append_method: 
    text = text.replace(append_method.group(1), '')

append_call = re.search(r'(appendCropToForm\(formData\);\s*)', text)
if append_call: 
    text = text.replace(append_call.group(1), '')

with open('d:/HieuDe_AI/chinese-ocr-app/index.html', 'w', encoding='utf-8') as f:
    f.write(text)