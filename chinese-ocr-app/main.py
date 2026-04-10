from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi import Request
import cv2
import numpy as np
from ocr_engine import read_chinese_mark
import json
import os
from typing import Any, Dict, List, Optional, Tuple
import difflib
import sys
from reference_matcher import match_image, match_image_by_prefix, save_reference

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

app = FastAPI(title="Chinese Porcelain Reign Mark OCR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "hieu_de_database.json")


def _load_database() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def _normalize_cjk(value: Optional[str]) -> str:
    if not value:
        return ""
    return "".join(ch for ch in value if "\u4e00" <= ch <= "\u9fff")


def _get_targets(entry: Dict[str, Any]) -> List[str]:
    targets = [entry.get("chu_han"), entry.get("chu_han_4"), entry.get("chu_han_6")]
    variants = entry.get("bien_the") or []
    targets.extend(variants)
    return [item for item in targets if item]


REIGN_DATABASE = _load_database()


def _find_match(ocr_text: str, database: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], str]:
    ocr_clean = _normalize_cjk(ocr_text.strip())
    if not ocr_clean:
        return None, "none"

    if ocr_clean in {"大明年製", "大清年製", "大南年製"}:
        return None, "incomplete"

    # =====================================================
    # FIX 1: Bảng sửa lỗi OCR được làm lại cẩn thận.
    # NGUYÊN TẮC: Chỉ sửa khi lỗi OCR thực sự xảy ra
    # (nhầm nét do mực/ánh sáng), KHÔNG sửa một triều vua
    # thành triều vua khác. Ví dụ: 洪武 ≠ 弘治, KHÔNG được sửa!
    # =====================================================
    ocr_corrections = {
        # Lỗi OCR thường gặp: nhầm nét tương tự
        "宣得": "宣德",   # 得 vs 德 — nét gần nhau
        "宣徳": "宣德",   # biến thể chữ 德
        "成化": "成化",   # OK, giữ nguyên
        "嘉請": "嘉靖",   # 請 vs 靖 — nét gần
        "嘉清": "嘉靖",   # 清 vs 靖 — nét gần
        "萬厤": "萬曆",   # biến thể cổ của 曆
        "萬歴": "萬曆",   # biến thể cổ của 曆
        "乹隆": "乾隆",   # 乹 là biến thể của 乾
        "乹": "乾",
    }
    for bad, good in ocr_corrections.items():
        if bad in ocr_clean:
            print(f"  [correction] '{bad}' → '{good}'")
            ocr_clean = ocr_clean.replace(bad, good)

    # 1. Exact match
    for item in database:
        for target in _get_targets(item):
            if ocr_clean == _normalize_cjk(target):
                return item, "exact"

    # 2. Substring match
    if len(ocr_clean) >= 3:
        for item in database:
            for target in _get_targets(item):
                target_clean = _normalize_cjk(target)
                if ocr_clean in target_clean or target_clean in ocr_clean:
                    return item, "substring"

    # 3. Fuzzy match
    candidates = []
    for item in database:
        for target in _get_targets(item):
            target_clean = _normalize_cjk(target)
            score = difflib.SequenceMatcher(None, ocr_clean, target_clean).ratio()
            if score > 0.4:
                candidates.append((score, item, target_clean))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        best_score = candidates[0][0]
        top_ties = [c for c in candidates if abs(c[0] - best_score) < 0.01]

        if len(top_ties) == 1:
            return top_ties[0][1], "fuzzy"

        # FIX 4: Tie-breaker dựa trên số ký tự chính xác khớp,
        # KHÔNG dùng ID (ID không liên quan độ chính xác OCR).
        def _exact_char_overlap(ocr: str, target: str) -> int:
            """Đếm số vị trí mà ký tự OCR và target trùng nhau."""
            return sum(1 for a, b in zip(ocr, target) if a == b)

        top_ties.sort(
            key=lambda x: _exact_char_overlap(ocr_clean, x[2]),
            reverse=True,
        )
        return top_ties[0][1], "fuzzy_tiedecision"

    return None, "none"


def _extract_nien_hieu(match: Optional[Dict[str, Any]]) -> str:
    if not match:
        return "Chưa xác định"
    base = match.get("chu_han_4") or match.get("chu_han") or ""
    base = base.replace("大明", "").replace("大清", "").replace("大南", "")
    for suffix in ["年製", "年造", "年玩"]:
        if base.endswith(suffix):
            base = base[: -len(suffix)]
    return base or "Chưa xác định"


def _build_translation_list(ocr_text: str) -> List[Dict[str, str]]:
    translation_map = {
        "大": ("Đại", "lớn, vĩ đại"),
        "明": ("Minh", "sáng, triều Minh"),
        "清": ("Thanh", "trong sáng, triều Thanh"),
        "年": ("Niên", "năm"),
        "製": ("Chế", "chế tác, sản xuất"),
        "造": ("Tạo", "tạo ra, chế tạo"),
        "嘉": ("Gia", "tốt lành, đẹp đẽ"),
        "靖": ("Tĩnh", "yên tĩnh, bình ổn"),
        "康": ("Khang", "khỏe mạnh, thịnh vượng"),
        "熙": ("Hy", "hưng thịnh, hoan hỉ"),
        "乾": ("Càn", "trời, dương"),
        "隆": ("Long", "thịnh vượng, hưng long"),
        "萬": ("Vạn", "vạn, mười nghìn"),
        "曆": ("Lịch", "lịch, thời gian"),
        "歷": ("Lịch", "lịch, trải qua"),
        "宣": ("Tuyên", "tuyên bố, công bố"),
        "德": ("Đức", "đức hạnh, đạo đức"),
        "成": ("Thành", "hoàn thành, thành công"),
        "化": ("Hóa", "biến hóa, cảm hóa"),
        "正": ("Chính", "ngay thẳng, đúng đắn"),
        "統": ("Thống", "thống nhất, trị vì"),
        "弘": ("Hoằng", "rộng lớn, phát huy"),
        "治": ("Trị", "trị vì, cai trị"),
        "順": ("Thuận", "thuận lợi, thuận theo"),
        "雍": ("Ung", "hòa hợp, trang nhã"),
        "道": ("Đạo", "đạo lý, con đường"),
        "光": ("Quang", "ánh sáng, rực rỡ"),
        "同": ("Đồng", "cùng nhau, đồng lòng"),
        "緒": ("Tự", "kế thừa, mối"),
        "洪": ("Hồng", "lớn lao, to lớn"),
        "武": ("Vũ", "võ, dũng mãnh"),
        "永": ("Vĩnh", "mãi mãi, vĩnh cửu"),
        "樂": ("Lạc", "vui vẻ, âm nhạc"),
        "宏": ("Hoằng", "rộng lớn"),
        "景": ("Cảnh", "cảnh vật, phong cảnh"),
        "泰": ("Thái", "thái bình, an ổn"),
        "崇": ("Sùng", "tôn sùng, cao quý"),
        "禎": ("Trinh", "điềm lành, tốt đẹp"),
        "天": ("Thiên", "trời, thiên nhiên"),
        "啟": ("Khải", "mở ra, khởi đầu"),
        "內": ("Nội", "bên trong, nội cung"),
        "府": ("Phủ", "phủ quan, kho"),
        "侍": ("Thị", "hầu hạ, phục vụ"),
        "從": ("Tòng", "theo hầu, tùy tùng"),
        "御": ("Ngự", "của vua, hoàng gia"),
        "用": ("Dụng", "sử dụng"),
        "玩": ("Ngoạn", "thưởng ngoạn, vật quý"),
        "珍": ("Trân", "quý báu, trân quý"),
        "賞": ("Thưởng", "thưởng thức, ban thưởng"),
        "壽": ("Thọ", "sống lâu, trường thọ"),
        "福": ("Phúc", "phúc lộc, may mắn"),
        "祥": ("Tường", "điềm lành, may mắn"),
    }
    results: List[Dict[str, str]] = []
    for ch in ocr_text:
        if ch in translation_map:
            am, nghia = translation_map[ch]
            results.append({"chu": ch, "am_han_viet": am, "nghia": nghia})
    return results


def _build_response(
    match: Optional[Dict[str, Any]],
    match_type: str,
    ocr_text: str,
    confidence: float,
    top_matches: List[Dict[str, Any]],
) -> Dict[str, Any]:
    year_range = "Chưa xác định"
    if match and match.get("nam_bat_dau") and match.get("nam_ket_thuc"):
        year_range = f"{match['nam_bat_dau']} - {match['nam_ket_thuc']}"
    translation_list = _build_translation_list(ocr_text)
    if match:
        best_chu_han = match.get("chu_han")
        ocr_len = len(ocr_text.strip())
        candidates = []
        if match.get("chu_han_6"): candidates.append(match.get("chu_han_6"))
        if match.get("chu_han_4"): candidates.append(match.get("chu_han_4"))
        if match.get("chu_han"): candidates.append(match.get("chu_han"))
        if match.get("bien_the"): candidates.extend(match.get("bien_the"))
        found_exact = False
        for cand in candidates:
            if cand and len(cand.strip()) == ocr_len:
                best_chu_han = cand.strip()
                found_exact = True
                break
        
        if not found_exact and ocr_len >= 3:
            best_chu_han = ocr_text.strip()

        return {
            "chu_han": best_chu_han,
            "chu_han_4": match.get("chu_han_4"),
            "chu_han_6": match.get("chu_han_6"),
            "bien_the": match.get("bien_the", []),
            "ten_viet": match.get("ten_viet"),
            "trieu_dai": match.get("trieu_dai"),
            "hoang_de": match.get("hoang_de"),
            "nien_hieu": _extract_nien_hieu(match),
            "nien_dai": year_range,
            "phien_am": match.get("phien_am"),
            "ghi_chu": match.get("ghi_chu"),
            "confidence": confidence,
            "match_type": match_type,
            "dich_nghia_tung_chu": translation_list,
            "top_matches": top_matches,
        }
    return {
        "chu_han": ocr_text or "Không rõ",
        "trieu_dai": "Chưa xác định",
        "nien_hieu": "Chưa xác định",
        "dich_nghia_tung_chu": translation_list,
        "ghi_chu": "Không tìm thấy trong database. Dịch nghĩa tham khảo từng chữ.",
        "confidence": confidence,
        "match_type": match_type,
        "top_matches": top_matches,
    }


def find_best_matches(ocr_text: str, database: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    normalized = _normalize_cjk(ocr_text)
    if not normalized:
        return []

    SIMILAR_GROUPS = [
        {"大", "天", "太", "夫", "犬"},
        {"明", "朋", "目", "月", "囧"},
        {"治", "冶", "始", "沿", "怡"},
        {"平", "干", "千", "年", "半"},
        {"順", "頓", "碩", "預", "煩"},
        {"年", "牛", "午", "平", "半"},
        {"製", "制"},
        {"隆", "降", "窿", "融"},
        {"慶", "麗", "廢", "應"},
        {"嘉", "喜", "家", "善"},
        {"靖", "清", "情", "精", "請"},
        {"萬", "万"},
        {"曆", "歷", "厤", "歴"},
        {"宣", "官", "宜", "直"},
        {"德", "徳", "得"},
        {"洪", "鴻", "泓", "汪"},
        {"武", "式", "戊"},
        {"成", "戊", "戌", "戍"},
        {"弘", "宏", "泓"},
        {"正", "政", "証", "征"},
        {"統", "緒", "絲"},
        {"内", "內"},  # simplified/traditional
        {"贵", "貴"},
        {"长", "長"},
        {"宝", "寶"},
        {"龙", "龍"},
        {"万", "萬"},
    ]

    def similarity(ch1: str, ch2: str) -> float:
        if ch1 == ch2:
            return 1.0
        for group in SIMILAR_GROUPS:
            if ch1 in group and ch2 in group:
                return 0.6
        return 0.0

    def char_seq_score(s1: str, s2: str) -> float:
        if not s1 or not s2:
            return 0.0
        len1, len2 = len(s1), len(s2)
        max_len = max(len1, len2)
        positional_score = sum(similarity(s1[i], s2[i]) for i in range(min(len1, len2))) / max_len
        best_align = 0.0
        for offset in range(-2, 3):
            score = sum(
                similarity(s1[i], s2[i + offset])
                for i in range(len1)
                if 0 <= i + offset < len2
            )
            best_align = max(best_align, score / max_len)
        set_score = (
            sum(max((similarity(c1, c2) for c2 in s2), default=0) for c1 in s1) / max_len
        )
        return positional_score * 0.40 + best_align * 0.35 + set_score * 0.25

    scored = []
    for item in database:
        targets = []
        for field in ["chu_han", "chu_han_4", "chu_han_6"]:
            val = item.get(field, "")
            if val:
                targets.append(_normalize_cjk(val))
        for bien_the in item.get("bien_the", []) or []:
            if bien_the:
                targets.append(_normalize_cjk(bien_the))
        best = max((char_seq_score(normalized, t) for t in targets if t), default=0.0)
        scored.append((best, item))

    if normalized:
        for idx, (score, item) in enumerate(scored):
            targets = [
                _normalize_cjk(item.get("chu_han", "")),
                _normalize_cjk(item.get("chu_han_4", "")),
                _normalize_cjk(item.get("chu_han_6", "")),
            ]
            if any(normalized in t for t in targets if t):
                scored[idx] = (score + 0.3, item)

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:top_n]
    max_score = top[0][0] if top and top[0][0] > 0 else 1.0

    return [
        {
            **item,
            "match_score": round((score / max_score) * 100, 1),
            "raw_score": round(score, 4),
        }
        for score, item in top
    ]


def rank_by_multi_candidates(
    candidates: List[str], database: List[Dict[str, Any]], top_n: int = 5
) -> List[Dict[str, Any]]:
    """Gộp nhiều candidate OCR để giảm sai lệch do 1 lần đọc nhầm."""
    clean_candidates = [_normalize_cjk(c) for c in candidates if _normalize_cjk(c)]
    if not clean_candidates:
        return []

    agg: Dict[int, Dict[str, Any]] = {}
    for idx, candidate in enumerate(clean_candidates):
        weight = 1.0 if idx == 0 else 0.72
        ranked = find_best_matches(candidate, database, top_n=top_n)
        for rank, match in enumerate(ranked):
            item_id = match.get("id")
            if item_id is None:
                continue
            rank_decay = 1.0 / (1.0 + rank * 0.45)
            base_score = float(match.get("raw_score", 0.0))
            combined = base_score * weight * rank_decay

            if item_id not in agg:
                agg[item_id] = {**match, "agg_score": 0.0, "votes": 0}
            agg[item_id]["agg_score"] += combined
            agg[item_id]["votes"] += 1

    final = list(agg.values())
    final.sort(key=lambda x: (x.get("agg_score", 0.0), x.get("votes", 0)), reverse=True)
    top = final[:top_n]
    max_score = top[0]["agg_score"] if top and top[0]["agg_score"] > 0 else 1.0
    for row in top:
        row["match_score"] = round((row["agg_score"] / max_score) * 100, 1)
        row["raw_score"] = round(row["agg_score"], 4)
    return top


def _detect_dynasty_prefixes(texts: List[str]) -> List[str]:
    prefixes = []
    for raw in texts:
        text = _normalize_cjk(raw or "")
        if "大明" in text and "大明" not in prefixes:
            prefixes.append("大明")
        if "大清" in text and "大清" not in prefixes:
            prefixes.append("大清")
        if "大南" in text and "大南" not in prefixes:
            prefixes.append("大南")
    return prefixes


def _normalize_mark_candidate(raw: str) -> str:
    """
    Chuẩn hóa các lỗi OCR phổ biến theo ngữ cảnh hiệu đề.
    Giữ quy tắc bảo thủ: chỉ thay thế khi có pattern đặc trưng.
    """
    s = _normalize_cjk(raw or "")
    if not s:
        return s

    # Ký tự cuối thường bị OCR lệch khi gặp "年製"
    s = s.replace("年泉", "年製").replace("年型", "年製").replace("年装", "年製")
    s = s.replace("年盒", "年製").replace("年皿", "年製")

    # Một số ảnh mờ đọc nhầm 乾 -> 农/蓬 khi đi cùng 隆年
    if "隆年" in s:
        s = s.replace("农隆", "乾隆").replace("蓬隆", "乾隆")

    # Nếu chuỗi có 年 nhưng thiếu 製/造 thì thử bổ sung hậu tố phổ biến.
    if "年" in s and not any(x in s for x in ("製", "造", "玩")):
        if s.endswith("年"):
            s = s + "製"

    # Heuristic cho mẫu "內府侍X" khi OCR nhiễu chữ gần nét.
    # QUAN TRỌNG: Có nhiều biến thể (侍右, 侍旨, 侍南, 侍左, 侍中, 侍從) — KHÔNG được ép cố định!
    # Chỉ sửa ký tự thứ 3 khi bị OCR đọc sai (特→侍, 社→侍), GIỮ NGUYÊN ký tự thứ 4.
    # Ký tự thứ 4 sẽ được xử lý bởi _boost_neifu_match_score() thay vì normalize cứng.
    has_nei = any(ch in s for ch in ("內", "内"))
    has_fu = "府" in s
    if has_nei and has_fu:
        # Sửa ký tự thứ 3 bị OCR đọc nhầm: 特→侍, 社→侍, 待→侍
        for wrong_shi in ("特", "社", "待"):
            if wrong_shi in s:
                s = s.replace(wrong_shi, "侍", 1)
        # ĐÃ XÓA: Không normalize cứng ký tự thứ 4 nữa.
        # Lý do: các biến thể 侍左/侍右/侍旨/侍南/侍中 dễ bị nhầm lẫn khi dùng if-elif chain.
        # Thay bằng: _boost_neifu_match_score() sẽ điều chỉnh score dựa trên char thứ 4 OCR đọc được.

    qing_reigns = {"康熙", "雍正", "乾隆", "嘉慶", "道光", "咸豐", "同治", "光緒", "宣統"}
    nguyen_reigns = {"嘉隆", "明命", "紹治", "嗣德", "建福", "咸宜", "同慶", "成泰", "維新", "啟定", "保大"}

    # Fix dynasty confusion: 大南 + Qing reign -> 大清; 大清 + Nguyen reign -> 大南
    if s.startswith("大南") and any(r in s for r in qing_reigns):
        s = s.replace("大南", "大清", 1)
    if s.startswith("大清") and any(r in s for r in nguyen_reigns):
        s = s.replace("大清", "大南", 1)

    # Confusion pairs for Khangxi and dynasty chars
    if "雅" in s and "齋" in s and "年" in s:
        s = s.replace("雅", "康").replace("齋", "熙")
    if "鹿" in s and "年" in s:
        s = s.replace("鹿", "康")
    if "希" in s and "年" in s:
        s = s.replace("希", "熙")

    # Common confusion pairs for dynasty characters
    if s.startswith("太清"):
        s = s.replace("太清", "大清", 1)
    if s.startswith("太明"):
        s = s.replace("太明", "大明", 1)
    if s.startswith("太南"):
        s = s.replace("太南", "大南", 1)
    if "大太" in s:
        s = s.replace("大太", "大")
    # REMOVED: Overly aggressive rules that replaced 南→清 and 保→康
    # These caused misidentification by corrupting valid OCR readings.
    return s


def _inject_qing_kangxi_if_evidence(raw: str) -> Optional[str]:
    """
    Chỉ inject 大清康熙年製 khi có bằng chứng cụ thể rằng cả hai ký tự 康 VÀ 熙
    (hoặc biến thể OCR gần đúng) đều xuất hiện trong kết quả OCR.
    KHÔNG inject mặc định khi chỉ thấy 大清…年製 — đó là lỗi cũ gây nhầm triều đại.
    """
    s = _normalize_cjk(raw or "")
    if not s or "康熙" in s:
        return None
    # Chỉ inject khi có cả 康 VÀ (熙 hoặc biến thể gần nét)
    has_kang = "康" in s or "鹿" in s
    has_xi = "熙" in s or "希" in s
    if has_kang and has_xi and "年" in s:
        return "大清康熙年製"
    return None


def _is_incomplete_dynasty_mark(text: str) -> bool:
    clean = _normalize_cjk(text)
    return clean in {"大明年製", "大清年製", "大南年製"}


def _expand_incomplete_dynasty_candidates(text: str) -> List[str]:
    clean = _normalize_cjk(text)
    if clean == "大明年製":
        reigns = ["洪武", "永樂", "宣德", "成化", "嘉靖", "萬曆", "天順", "弘治", "正德", "景泰", "天啟", "崇禎"]
        return [f"大明{r}年製" for r in reigns]
    if clean == "大清年製":
        reigns = ["康熙", "雍正", "乾隆", "嘉慶", "道光", "咸豐", "同治", "光緒", "宣統"]
        return [f"大清{r}年製" for r in reigns]
    if clean == "大南年製":
        reigns = ["嘉隆", "明命", "紹治", "嗣德", "建福", "咸宜", "同慶", "成泰", "維新", "啟定", "保大"]
        return [f"大南{r}年製" for r in reigns]
    return []


def _column_reconstruction(text: str) -> List[str]:
    clean = _normalize_cjk(text)
    if len(clean) != 4 or not clean.endswith("年製"):
        return []
    a, b, c, d = clean
    if a in "大明大清大南":
        return []
    return ["".join([b, a, c, d])]


def _expand_ocr_candidates(primary: str, candidates: List[str], blur_score: Optional[float] = None) -> List[str]:
    base = [primary] + [c for c in candidates if c and c != primary]
    has_dynasty_prefix = False
    for item in base:
        clean = _normalize_cjk(item or "")
        if any(prefix in clean for prefix in ("大明", "大清", "大南")):
            has_dynasty_prefix = True
            break
    # Collect supplementary candidates (injections) — but do NOT prioritize them.
    # They will be appended at the end, after the actual OCR results.
    inject_extra: List[str] = []
    for item in base:
        norm = _normalize_mark_candidate(item or "")
        for raw in (item, norm):
            if not raw:
                continue
            inj = _inject_qing_kangxi_if_evidence(raw)
            if inj and inj not in inject_extra:
                inject_extra.append(inj)

            # Heuristic: small square mark can be misread as 建福年製 instead of 甲子年製.
            raw_clean = _normalize_cjk(raw)
            if (
                ("建福年製" in raw_clean or "建福年造" in raw_clean)
                and not has_dynasty_prefix
                and "甲子年製" not in inject_extra
            ):
                inject_extra.append("甲子年製")

    expanded: List[str] = []
    seen: set = set()

    for item in base:
        clean = _normalize_cjk(item or "")
        if clean and clean not in seen:
            expanded.append(clean)
            seen.add(clean)
        normalized = _normalize_mark_candidate(item or "")
        if normalized and normalized not in seen:
            expanded.append(normalized)
            seen.add(normalized)

        # Expand incomplete dynasty marks
        if _is_incomplete_dynasty_mark(clean):
            for c in _expand_incomplete_dynasty_candidates(clean):
                if c not in seen:
                    expanded.append(c)
                    seen.add(c)

        # Column reconstruction for 4-char XX年製
        for c in _column_reconstruction(clean):
            if c not in seen:
                expanded.append(c)
                seen.add(c)

    # Append injected candidates at the END (not front) so they don't
    # override actual OCR evidence.
    for inj in inject_extra:
        if inj not in seen:
            expanded.append(inj)
            seen.add(inj)

    return expanded


def _max_char_overlap(candidates: List[str], target: str) -> int:
    target_set = set(_normalize_cjk(target))
    if not target_set:
        return 0
    best = 0
    for c in candidates:
        c_set = set(_normalize_cjk(c))
        if not c_set:
            continue
        best = max(best, len(c_set & target_set))
    return best


def _support_votes_for_match(candidates: List[str], target: str) -> int:
    target_clean = _normalize_cjk(target)
    if not target_clean:
        return 0
    votes = 0
    for c in candidates:
        c_clean = _normalize_cjk(c)
        if not c_clean:
            continue
        overlap = len(set(c_clean) & set(target_clean))
        ratio = difflib.SequenceMatcher(None, c_clean, target_clean).ratio()
        if overlap >= 3 or ratio >= 0.56:
            votes += 1
    return votes


def _is_year_mark_text(text: str) -> bool:
    clean = _normalize_cjk(text or "")
    if not clean:
        return False
    return ("年" in clean) and any(s in clean for s in ("製", "造", "玩"))


def _is_can_chi_mark(text: str) -> bool:
    clean = _normalize_cjk(text or "")
    if not clean or "年" not in clean:
        return False
    stems = set("甲乙丙丁戊己庚辛壬癸")
    branches = set("子丑寅卯辰巳午未申酉戌亥")
    # Expect stem + branch + 年製/年造/年玩 (4 chars total or 2+suffix)
    if len(clean) < 4:
        return False
    has_stem = any(ch in stems for ch in clean)
    has_branch = any(ch in branches for ch in clean)
    return has_stem and has_branch and _is_year_mark_text(clean)


def _has_can_chi_evidence(candidates: List[str]) -> bool:
    stems = set("甲乙丙丁戊己庚辛壬癸")
    branches = set("子丑寅卯辰巳午未申酉戌亥")
    for c in candidates:
        clean = _normalize_cjk(c)
        if not clean:
            continue
        if any(ch in stems for ch in clean) and any(ch in branches for ch in clean):
            return True
    return False


def _char_overlap_ratio(a: str, b: str) -> float:
    a_clean = _normalize_cjk(a)
    b_clean = _normalize_cjk(b)
    if not a_clean or not b_clean:
        return 0.0
    sa, sb = set(a_clean), set(b_clean)
    inter = len(sa & sb)
    union = len(sa | sb)
    if union == 0:
        return 0.0
    return inter / union


NEIFU_4TH_CHAR_MAP = {
    # Các lỗi OCR phổ biến cho ký tự thứ 4 trong chuỗi "內府侍X"
    # Map: (ký tự OCR sai) -> (ký tự đúng)
    # --- 侍左 (Thị Tả) ---
    "生": "左", "在": "左", "左": "左", "址": "左", "注": "左", "庄": "左", "杜": "左",
    # --- 侍右 (Thị Hữu) ---
    "有": "右", "石": "右", "右": "右", "名": "右",
    # --- 侍旨 (Thị Chỉ) ---
    "血": "旨", "盒": "旨", "皿": "旨", "旨": "旨", "日": "旨", "曰": "旨",
    # --- 侍南 (Thị Nam) ---
    "南": "南", "雨": "南", "两": "南", "甬": "南",
    # --- 侍中 (Thị Trung) ---
    "中": "中", "申": "中", "巾": "中",
    # --- 侍從 (Thị Tòng) ---
    "從": "從", "从": "從",
}

NEIFU_VARIANTS_4TH = {
    "左": "內府侍左",
    "右": "內府侍右",
    "旨": "內府侍旨",
    "南": "內府侍南",
    "中": "內府侍中",
    "從": "內府侍從",
}


def _extract_neifu_4th_char(ocr_text: str) -> str:
    """
    Từ chuỗi OCR có chứa 內府侍, cố gắng xác định ký tự thứ 4.
    Không phụ thuộc vào thứ tự chuỗi do PaddleOCR thường sắp xếp lộn xộn các ký tự 
    của hiệu đề viết dọc / viết vuông 4 chữ.
    """
    s = "".join(ch for ch in (ocr_text or "") if "\u4e00" <= ch <= "\u9fff")
    
    # Kiểm tra xem có đủ các kí tự cấu thành "Nội Phủ Thị" không (bất kể thứ tự)
    has_nei = "内" in s or "內" in s
    has_fu = "府" in s
    # 侍 hay bị nhầm thành các chữ này
    has_shi = any(ch in s for ch in ("侍", "待", "特", "社", "挂", "诗"))
    
    if has_nei and has_fu:
        # Nếu có Nội và Phủ, ta quét tìm xem trong chuỗi có chữ nào 
        # map được với ký tự thứ 4 không.
        for ch in s:
            canonical = NEIFU_4TH_CHAR_MAP.get(ch, "")
            if canonical:
                return NEIFU_VARIANTS_4TH.get(canonical, "")
        
        # Nếu không có chữ nào khớp trong map, ta đành chịu
        return ""
    
    return ""


def _boost_neifu_match_score(
    candidates, scored_items, normalize_cjk_fn, sequence_matcher_fn
):
    """
    Tăng score cho entry Nội Phủ có chữ thứ 4 khớp với OCR,
    đồng thời phạt các entry Nội Phủ có chữ thứ 4 KHÔNG khớp.
    
    Args:
        candidates: list[str] — các chuỗi OCR đã normalize
        scored_items: list[dict] — kết quả từ rank_by_multi_candidates / find_best_matches
        normalize_cjk_fn: hàm _normalize_cjk
        sequence_matcher_fn: difflib.SequenceMatcher
    
    Returns:
        list[dict] đã được re-sort theo score mới
    """
    # Tìm chữ thứ 4 từ các candidates
    best_4th = ""
    best_neifu_candidate = ""
    for c in candidates:
        result = _extract_neifu_4th_char(c)
        if result:
            best_neifu_candidate = result
            # Lấy chữ thứ 4
            nc = normalize_cjk_fn(result)
            if len(nc) >= 4:
                best_4th = nc[3]
            break
    
    if not best_4th:
        return scored_items  # Không có tín hiệu Nội Phủ rõ ràng → giữ nguyên
    
    print(f"  [neifu_boost] detected 4th char='{best_4th}', expected='{best_neifu_candidate}'")
    
    adjusted = []
    for item in scored_items:
        chu_han = normalize_cjk_fn(item.get("chu_han", "") or "")
        is_neifu = ("內府" in chu_han) or ("内府" in chu_han)
        
        if not is_neifu:
            adjusted.append(item)
            continue
        
        # Lấy chữ thứ 4 của entry này
        entry_4th = chu_han[3] if len(chu_han) >= 4 else ""
        current_score = float(item.get("match_score", item.get("score", 50)) or 50)
        raw_score = float(item.get("raw_score", item.get("agg_score", 0)) or 0)
        
        if entry_4th == best_4th:
            # Khớp chữ thứ 4: boost mạnh
            boost = 25.0
            print(f"  [neifu_boost] BOOST +{boost} for {chu_han}")
        else:
            # Sai chữ thứ 4: phạt
            boost = -20.0
            print(f"  [neifu_boost] PENALIZE {boost} for {chu_han}")
        
        adjusted.append({
            **item,
            "match_score": min(100.0, max(0.0, current_score + boost)),
            "raw_score": raw_score,
            "_neifu_adjusted": True,
        })
    
    adjusted.sort(key=lambda x: float(x.get("match_score", x.get("score", 0)) or 0), reverse=True)
    return adjusted


def _choose_display_mark(
    selected_report: Optional[Dict[str, Any]],
    merged_candidates: List[str],
    ocr_text: str,
) -> str:
    """
    Chọn text hiển thị theo bằng chứng OCR:
    - Ảnh 4 chữ -> ưu tiên chu_han_4
    - Ảnh 6 chữ -> ưu tiên chu_han
    Tránh tự thêm tiền tố triều đại khi không có trong ảnh.
    """
    if not selected_report:
        return ocr_text

    mark4_raw = selected_report.get("chu_han_4") or selected_report.get("chu_han") or ""
    mark6_raw = selected_report.get("chu_han_6") or selected_report.get("chu_han") or ""
    mark4 = _normalize_cjk(mark4_raw)
    mark6 = _normalize_cjk(mark6_raw)
    if not mark4 and not mark6:
        return ocr_text

    evidence = [_normalize_cjk(x) for x in merged_candidates if _normalize_cjk(x)]
    if not evidence and _normalize_cjk(ocr_text):
        evidence = [_normalize_cjk(ocr_text)]

    if not evidence:
        return selected_report.get("chu_han_4") or selected_report.get("chu_han") or ocr_text

    best_len = max((len(x) for x in evidence), default=0)
    best4 = max((_char_overlap_ratio(x, mark4) for x in evidence), default=0.0) if mark4 else 0.0
    best6 = max((_char_overlap_ratio(x, mark6) for x in evidence), default=0.0) if mark6 else 0.0
    has_dynasty_hint = any(any(prefix in x for prefix in ("大明", "大清", "大南")) for x in evidence)

    # Có tín hiệu 6 chữ rõ -> hiển thị đủ 6 chữ.
    if mark6 and (has_dynasty_hint or best_len >= 5 or best6 >= 0.75):
        return mark6_raw

    # Có tín hiệu 4 chữ rõ -> hiển thị đúng 4 chữ.
    if mark4 and (best_len <= 4 or (best4 >= 0.5 and best6 < 0.7)):
        return mark4_raw

    # Fallback bảo thủ
    return mark4_raw or mark6_raw or ocr_text


def _get_top_matches_from_candidates(
    candidates: List[str], database: List[Dict[str, Any]], limit: int = 5
) -> List[Dict[str, Any]]:
    if not candidates:
        return []

    scored = []
    for item in database:
        targets = [item.get("chu_han"), item.get("chu_han_4", "")]
        targets += item.get("bien_the", []) or []
        targets = [t for t in targets if t]
        best = 0.0
        for candidate in candidates:
            for target in targets:
                ocr_set = set(candidate)
                tgt_set = set(target)
                common = ocr_set & tgt_set
                if not tgt_set:
                    continue
                overlap_score = len(common) / len(ocr_set | tgt_set)
                substr_bonus = 0.0
                for i in range(len(candidate) - 1):
                    if candidate[i: i + 2] in target:
                        substr_bonus += 0.15
                for i in range(len(candidate) - 2):
                    if candidate[i: i + 3] in target:
                        substr_bonus += 0.25
                seq = difflib.SequenceMatcher(None, candidate, target).ratio()
                score = overlap_score * 0.4 + seq * 0.4 + min(substr_bonus, 0.5) * 0.2
                if _is_incomplete_dynasty_mark(target):
                    score = max(0.0, score - 0.3)
                if score > best:
                    best = score
        scored.append((best, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]
    max_score = top[0][0] if top and top[0][0] > 0 else 1

    results = []
    for score, item in top:
        results.append(
            {
                "chu_han": item.get("chu_han"),
                "ten_viet": item.get("ten_viet"),
                "trieu_dai": item.get("trieu_dai"),
                "nien_dai": (
                    f"{item.get('nam_bat_dau')} - {item.get('nam_ket_thuc')}"
                    if item.get("nam_bat_dau") and item.get("nam_ket_thuc")
                    else "Chua xac dinh"
                ),
                "score": round((score / max_score) * 100, 1),
                "match_score": round((score / max_score) * 100, 1),
            }
        )
    if results and len(results) > 1:
        top_item = results[0]
        runner = results[1]
        top_len = len(_normalize_cjk(top_item.get("chu_han", "")))
        runner_len = len(_normalize_cjk(runner.get("chu_han", "")))
        top_score = float(top_item.get("score", 0) or 0) / 100.0
        runner_score = float(runner.get("score", 0) or 0) / 100.0
        if top_len <= 3 and runner_len >= 6 and (top_score - runner_score) < 0.15:
            results = [runner] + [r for r in results if r is not runner]
    return results


def _apply_crop(image_bytes: bytes, crop: Dict[str, float]) -> bytes:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return image_bytes
    height, width = img.shape[:2]
    x = int(max(0.0, min(1.0, crop["x"])) * width)
    y = int(max(0.0, min(1.0, crop["y"])) * height)
    w = int(max(0.0, min(1.0, crop["w"])) * width)
    h = int(max(0.0, min(1.0, crop["h"])) * height)
    if w <= 1 or h <= 1:
        return image_bytes
    x2 = min(width, x + w)
    y2 = min(height, y + h)
    cropped = img[y:y2, x:x2]
    if cropped.size == 0:
        return image_bytes
    success, encoded = cv2.imencode(".png", cropped)
    if not success:
        return image_bytes
    return encoded.tobytes()


def _estimate_blur_score(image_bytes: bytes) -> float:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _auto_use_deep_mode(image_bytes: bytes) -> bool:
    # Laplacian variance thấp => ảnh mờ/thiếu chi tiết, nên dùng deep mode.
    blur_score = _estimate_blur_score(image_bytes)
    print(f"[auto_mode] blur_score={blur_score:.2f}")
    return blur_score < 120.0


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Loi xu ly OCR: {exc}"})


@app.get("/")
def read_index():
    index_path = os.path.join(os.path.dirname(__file__), "index.html")
    return FileResponse(index_path)

@app.get("/logo.png")
def read_logo():
    logo_path = os.path.join(os.path.dirname(__file__), "logo.png")
    if os.path.exists(logo_path):
        return FileResponse(logo_path)
    return JSONResponse(status_code=404, content={"message": "Logo not found"})


@app.get("/data/hieu_de_database.json")
def read_reign_database():
    data_path = os.path.join(os.path.dirname(__file__), "data", "hieu_de_database.json")
    return FileResponse(data_path)


@app.post("/ocr")
async def ocr_endpoint(
    file: UploadFile = File(...),
    crop_x: Optional[float] = Form(None),
    crop_y: Optional[float] = Form(None),
    crop_w: Optional[float] = Form(None),
    crop_h: Optional[float] = Form(None),
    deep_mode: Optional[bool] = Form(None),
):
    try:
        if not file:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Không tìm thấy tệp hình ảnh.", "chu_han": "", "top5": [], "report": None},
            )

        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Định dạng ảnh không được hỗ trợ.", "chu_han": "", "top5": [], "report": None},
            )

        image_bytes = await file.read()
        if None not in (crop_x, crop_y, crop_w, crop_h):
            image_bytes = _apply_crop(image_bytes, {"x": crop_x, "y": crop_y, "w": crop_w, "h": crop_h})

        # 1. Kiểm tra thư viện tham chiếu (ORB)
        matched_report = match_image(image_bytes)

        # 2. Chạy OCR (auto deep cho ảnh mờ nếu client không chỉ định)
        blur_score = _estimate_blur_score(image_bytes)
        use_deep_mode = bool(deep_mode) if deep_mode is not None else _auto_use_deep_mode(image_bytes)
        result = read_chinese_mark(image_bytes, deep_mode=use_deep_mode)
        ocr_text = result.get("text", "")
        candidates = result.get("candidates", [])

        # Nếu pass nhanh chưa ra kết quả, tự fallback sang deep mode.
        if (not ocr_text and not candidates) and not use_deep_mode:
            print("[auto_mode] fast pass empty -> retry deep mode")
            result = read_chinese_mark(image_bytes, deep_mode=True)
            ocr_text = result.get("text", "")
            candidates = result.get("candidates", [])

        # 3. Xác minh ORB match bằng tỷ lệ best/second-best + OCR.
        if matched_report:
            orb_best = matched_report.pop("_orb_best", 0)
            orb_second = matched_report.pop("_orb_second", 0)
            ref_chu_han = _normalize_cjk(matched_report.get("chu_han", ""))
            
            # Nếu best >> second-best: rất có thể là cùng một ảnh → tin ORB ngay.
            # Ví dụ: cùng ảnh best=300, second=50 → ratio=6.0 → tin ORB
            # Ảnh khác nền giống: best=100, second=95 → ratio=1.05 → cần kiểm tra OCR
            orb_ratio = orb_best / max(orb_second, 1)
            print(f"[ORB verify] ref='{ref_chu_han}', best={orb_best}, second={orb_second}, ratio={orb_ratio:.2f}")
            
            if orb_ratio >= 1.5 and orb_best >= 50:
                # ORB rất tự tin: best vượt trội hẳn second → tin ORB không cần OCR
                print(f"[ORB verify] HIGH CONFIDENCE (ratio={orb_ratio:.2f}). Trusting ORB match.")
                return JSONResponse(status_code=200, content=matched_report)
            
            # ORB match gần nhau → cần kiểm tra bằng OCR
            ref_chars = set(ref_chu_han)
            all_evidence_chars = set(_normalize_cjk(ocr_text))
            for c in candidates:
                all_evidence_chars.update(set(_normalize_cjk(c)))

            overlap = len(all_evidence_chars & ref_chars)
            total_ref = len(ref_chars)
            print(f"[ORB verify] ocr_evidence={all_evidence_chars}, overlap={overlap}/{total_ref}")

            if not all_evidence_chars:
                # OCR không đọc được gì → tin ORB
                print("[ORB verify] No OCR evidence, trusting ORB match.")
                return JSONResponse(status_code=200, content=matched_report)
            elif total_ref > 0 and overlap >= max(4, total_ref - 1):
                # Đủ ký tự trùng → tin ORB
                print(f"[ORB verify] PASS — overlap sufficient ({overlap}/{total_ref}). Returning ORB match.")
                return JSONResponse(status_code=200, content=matched_report)
            else:
                # Ký tự OCR mâu thuẫn với ORB → bỏ qua ORB, tiếp tục OCR
                print(f"[ORB verify] FAIL — OCR contradicts ORB ({overlap}/{total_ref}). Falling through to OCR pipeline.")
                matched_report = None

        if not ocr_text and not candidates:
            return JSONResponse(
                content={"success": False, "message": "Không đọc được chữ trong ảnh. Thử chụp rõ hơn.", "chu_han": "", "top5": [], "report": None}
            )

        print(f"OCR text: '{ocr_text}'")
        merged_candidates = _expand_ocr_candidates(ocr_text, candidates, blur_score=blur_score)
        max_candidate_len = max((len(_normalize_cjk(c)) for c in merged_candidates), default=0)
        has_any_dynasty_hint = any(
            any(prefix in _normalize_cjk(c) for prefix in ("大明", "大清", "大南"))
            for c in merged_candidates
        )
        if max_candidate_len <= 1 and not has_any_dynasty_hint:
            return JSONResponse(
                content={
                    "success": False,
                    "message": "Ảnh quá mờ hoặc chữ quá nhỏ, không đủ dữ liệu để xác định hiệu đề.",
                    "chu_han": "",
                    "top5": [],
                    "report": None,
                }
            )
        matches = rank_by_multi_candidates(merged_candidates, REIGN_DATABASE, top_n=5)
        if not matches:
            matches = find_best_matches(ocr_text, REIGN_DATABASE, top_n=5)

        dynasty_prefixes = _detect_dynasty_prefixes(merged_candidates)
        if dynasty_prefixes:
            filtered_matches = [
                m for m in matches
                if any(_normalize_cjk(m.get("chu_han", "")).startswith(prefix) for prefix in dynasty_prefixes)
            ]
            if filtered_matches:
                matches = filtered_matches
        has_year_signal = any("年" in _normalize_cjk(c) for c in merged_candidates)
        if has_year_signal:
            reign_matches = [m for m in matches if _is_year_mark_text(m.get("chu_han", ""))]
            if reign_matches:
                matches = reign_matches

        can_chi_evidence = _has_can_chi_evidence(merged_candidates)
        if can_chi_evidence:
            can_chi_matches = [m for m in matches if _is_can_chi_mark(m.get("chu_han", ""))]
            if can_chi_matches:
                matches.sort(key=lambda m: float(m.get("match_score", m.get("score", 0)) or 0), reverse=True)
                best_can_chi = max(
                    can_chi_matches,
                    key=lambda m: float(m.get("match_score", m.get("score", 0)) or 0),
                )
                best_can_chi_score = float(best_can_chi.get("match_score", best_can_chi.get("score", 0)) or 0)
                best_overall_score = float(matches[0].get("match_score", matches[0].get("score", 0)) or 0)
                if not _is_can_chi_mark(matches[0].get("chu_han", "")) and (best_overall_score - best_can_chi_score) <= 8.0:
                    matches = [best_can_chi] + [m for m in matches if m is not best_can_chi]

        for m in matches[:3]:
            print(f"  Match: {m.get('chu_han', '')} score={m.get('raw_score', 0):.4f}")

        # FIX Nội Phủ: Điều chỉnh score dựa trên chữ thứ 4 OCR đọc được
        # QUAN TRỌNG: Phải boost trên danh sách đầy đủ `matches` trước,
        # bởi vì nếu biến thể đúng bị văng khỏi top 5 từ sớm (do nhiễu OCR),
        # nó sẽ không bao giờ được phục hồi.
        import difflib as _difflib
        neifu_in_matches = any(
            ("內府" in _normalize_cjk(m.get("chu_han", "") or ""))
            or ("内府" in _normalize_cjk(m.get("chu_han", "") or ""))
            for m in (matches or [])
        )
        if neifu_in_matches:
            matches = _boost_neifu_match_score(
                merged_candidates, matches,
                _normalize_cjk,
                _difflib.SequenceMatcher,
            )
            # Re-slice top 5 sau khi đã boost lại điểm
            top5 = matches[:5]
        else:
            top5 = _get_top_matches_from_candidates(merged_candidates, REIGN_DATABASE, limit=5)
            if not top5:
                top5 = matches
            
            if dynasty_prefixes:
                filtered_top5 = [
                    m for m in top5
                    if any(_normalize_cjk(m.get("chu_han", "")).startswith(prefix) for prefix in dynasty_prefixes)
                ]
                if filtered_top5:
                    top5 = filtered_top5
        if has_year_signal:
            reign_top5 = [m for m in top5 if _is_year_mark_text(m.get("chu_han", ""))]
            if reign_top5:
                top5 = reign_top5

        if can_chi_evidence:
            can_chi_top5 = [m for m in top5 if _is_can_chi_mark(m.get("chu_han", ""))]
            if can_chi_top5:
                top5.sort(key=lambda m: float(m.get("match_score", m.get("score", 0)) or 0), reverse=True)
                best_can_chi = max(
                    can_chi_top5,
                    key=lambda m: float(m.get("match_score", m.get("score", 0)) or 0),
                )
                best_can_chi_score = float(best_can_chi.get("match_score", best_can_chi.get("score", 0)) or 0)
                best_overall_score = float(top5[0].get("match_score", top5[0].get("score", 0)) or 0)
                if not _is_can_chi_mark(top5[0].get("chu_han", "")) and (best_overall_score - best_can_chi_score) <= 8.0:
                    top5 = [best_can_chi] + [m for m in top5 if m is not best_can_chi]

        ocr_clean = _normalize_cjk(ocr_text)
        ocr_len = len(ocr_clean)
        is_short_dynasty = ocr_clean in {"大明", "大清", "大南"}

        if is_short_dynasty:
            orb_match, orb_score = match_image_by_prefix(image_bytes, [ocr_clean])
            if orb_match:
                print(f"ORB Prefix Match: {orb_score} good matches for {ocr_clean}")
                return JSONResponse(status_code=200, content=orb_match)
            return JSONResponse(
                content={"success": False, "message": "Khong du thong tin de xac dinh. Vui long chup lai ro hon.", "chu_han": "", "top5": [], "report": None}
            )

        if ocr_len > 2:
            longer_matches = [item for item in top5 if len(_normalize_cjk(item.get("chu_han", ""))) > 2]
            if longer_matches:
                top5 = longer_matches

        # Không đảo thứ hạng dựa trên tỷ lệ không rõ ràng (bỏ logic swap cũ dễ gây lỗi)

        selected_report = top5[0] if top5 else None
        if selected_report and not selected_report.get("hien_thi_chinh"):
            lookup_key = selected_report.get("chu_han")
            if lookup_key:
                for entry in REIGN_DATABASE:
                    if entry.get("chu_han") == lookup_key or entry.get("chu_han_4") == lookup_key:
                        selected_report = {**entry, **selected_report}
                        break

        if selected_report:
            if has_year_signal and not _is_year_mark_text(selected_report.get("chu_han", "")):
                return JSONResponse(
                    content={
                        "success": False,
                        "message": "Kết quả hiện tại không đủ dấu hiệu của hiệu đề niên chế (年製/年造). Vui lòng thử ảnh rõ hơn.",
                        "chu_han": "",
                        "top5": top5,
                        "report": None,
                    }
                )
            evidence_overlap = _max_char_overlap(merged_candidates, selected_report.get("chu_han", ""))
            model_score = float(selected_report.get("raw_score", selected_report.get("score", 0)) or 0)
            # Chặn trả sai khi OCR quá yếu (vd chỉ 1-2 ký tự nhiễu nhưng vẫn match vào DB).
            if evidence_overlap < 2 and model_score < 0.8:
                return JSONResponse(
                    content={
                        "success": False,
                        "message": "Không đủ bằng chứng để xác định chính xác hiệu đề. Vui lòng thử ảnh rõ hơn hoặc chụp thẳng, đủ sáng phần đáy.",
                        "chu_han": "",
                        "top5": top5,
                        "report": None,
                    }
                )
            # Deep mode thường sinh kết quả ngắn gây nhầm triều đại; yêu cầu chứng cứ mạnh hơn.
            if bool(deep_mode):
                selected_clean = _normalize_cjk(selected_report.get("chu_han", ""))
                has_dynasty_hint = bool(dynasty_prefixes) or any(
                    p in selected_clean for p in ("大明", "大清", "大南")
                )
                support_votes = _support_votes_for_match(merged_candidates, selected_clean)
                is_neifu_mark = ("內府" in selected_clean) or ("内府" in selected_clean)
                runner_up_score = 0.0
                if top5 and len(top5) > 1:
                    runner_up_score = float(top5[1].get("score", top5[1].get("match_score", 0)) or 0)
                selected_score = float(selected_report.get("score", selected_report.get("match_score", 0)) or 0)
                neifu_is_clear_winner = is_neifu_mark and (selected_score - runner_up_score >= 10.0)
                if neifu_is_clear_winner:
                    support_votes = max(support_votes, 2)
                print(
                    "[deep_gate]",
                    f"selected={selected_clean}",
                    f"overlap={evidence_overlap}",
                    f"votes={support_votes}",
                    f"score={selected_score:.1f}",
                    f"runner_up={runner_up_score:.1f}",
                    f"dynasty_hint={has_dynasty_hint}",
                )
                if is_neifu_mark and selected_score >= 70.0:
                    pass
                elif len(selected_clean) <= 4 and not has_dynasty_hint and (evidence_overlap < 3 and support_votes < 2):
                    return JSONResponse(
                        content={
                            "success": False,
                            "message": "Ảnh quá mờ, hệ thống chưa đủ chắc chắn để kết luận chính xác hiệu đề.",
                            "chu_han": "",
                            "top5": top5,
                            "report": None,
                        }
                    )

        display_text = _choose_display_mark(selected_report, merged_candidates, ocr_text)

        return JSONResponse(
            content={
                "success": True,
                "chu_han": display_text,
                "confidence": result.get("confidence", 0),
                "top5": top5,
                "report": selected_report,
            }
        )

    except Exception as e:
        import traceback
        try:
            print("ERROR:", traceback.format_exc())
        except Exception:
            print("ERROR: (traceback contains unencodable characters)")
        err_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Loi xu ly OCR: {err_msg}", "chu_han": "", "error": err_msg},
        )


@app.post("/memorize")
async def memorize_endpoint(
    file: UploadFile = File(...),
    report_data: str = Form(...),
):
    try:
        if not file:
            return JSONResponse(status_code=400, content={"success": False, "message": "No image"})
        image_bytes = await file.read()
        json_data = json.loads(report_data)
        saved = save_reference(image_bytes, json_data)
        if saved:
            return JSONResponse(status_code=200, content={"success": True, "message": "Đã lưu thành công vào thư viện tham chiếu!"})
        else:
            return JSONResponse(status_code=500, content={"success": False, "message": "Không thể lưu ảnh mẫu."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

# Trigger reload
