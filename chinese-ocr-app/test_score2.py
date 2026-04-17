import main

s1 = "熙大年清"

targets = [
    "大清康熙年製", "康熙年製", "大清年製", "大清康熙", 
    "大明洪武年製", "洪武年製", "大明年製",
    "保大年製"
]

def score(t):
    # This is how char_seq_score is calculated:
    s2 = t
    len1, len2 = len(s1), len(s2)
    max_len = max(len1, len2)
    positional_score = sum(main.similarity(s1[i], s2[i]) for i in range(min(len1, len2))) / max_len
    best_align = 0.0
    for offset in range(-2, 3):
        asc = sum(
            main.similarity(s1[i], s2[i + offset])
            for i in range(len1)
            if 0 <= i + offset < len2
        )
        best_align = max(best_align, asc / max_len)
    set_score = (
        sum(max((main.similarity(c1, c2) for c2 in s2), default=0) for c1 in s1) / max_len
    )
    return positional_score * 0.40 + best_align * 0.35 + set_score * 0.25

for t in targets:
    sc = score(t)
    print(f"s1: {s1}, s2: {t}, score: {sc:.4f}")
