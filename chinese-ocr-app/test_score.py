import json
import pymysql

# Test score from python module
from main import char_seq_score, _normalize_cjk

s1 = _normalize_cjk("熙大年清")

targets = [
    "大清康熙年製", "康熙年製", "大清年製", "大清康熙", 
    "大明洪武年製", "洪武年製", "大明年製",
    "保大年製"
]

for t in targets:
    s2 = _normalize_cjk(t)
    score = char_seq_score(s1, s2)
    print(f"s1: {s1}, s2: {s2}, score: {score:.4f}")
