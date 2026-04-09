# Chinese Porcelain Reign Mark OCR

Ung dung web doc ky tu khac danh (款識) tren gom su Trung Hoa.

## Cai dat

1. Tao moi moi truong ao (khuyen nghi):

```bash
python -m venv .venv
.venv\Scripts\activate
```

2. Cai thu vien:

```bash
pip install -r requirements.txt
```

## Chay ung dung

```bash
uvicorn main:app --reload
```

Mo trinh duyet tai:

```
http://localhost:8000
```

## Ghi chu

- OCR dung EasyOCR voi `ch_sim` va `ch_tra`.
- Hinh anh co the bi cong/goc, he thong se tu dong tien xu ly va OCR.
