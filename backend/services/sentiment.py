from huggingface_hub import InferenceClient
from config import HUGGINGFACE_API_KEY
from services.slang import normalize_slang
import re
import math

# Initialize the client
client = InferenceClient(api_key=HUGGINGFACE_API_KEY)
MODEL_ID = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"

# -----------------------------------------------------------------------------
# MALAY LEXICON ENGINE (VADER-Style)
# Handles intensifiers, diminishers, negations, and contrastive logic.
# -----------------------------------------------------------------------------

CRITICAL_TRIGGERS = {"mentah": -4, "x masak": -4, "tak masak": -4, "basi": -4, "busuk": -4, "lalat": -4, "ulat": -4, "keracunan": -4}
NEG_TRIGGERS = {"lambat": -2, "mahal": -2, "kotor": -3, "kecewa": -3, "teruk": -3, "hambar": -2, "tawar": -2, "masin": -2, "kurang ajar": -4, "biadap": -4, "sombong": -3, "bising": -1, "panas": -2}
POS_TRIGGERS = {"sedap": 2, "lazat": 3, "mantap": 3, "padu": 3, "best": 2, "terbaik": 3, "murah": 2, "bersih": 2, "cepat": 2, "pantas": 2, "ramah": 2, "mesra": 2, "berbaloi": 2, "puas": 2, "baik": 1, "bagus": 2, "selesa": 2}

NEGATIONS = ["tidak", "tak", "x", "bukan", "jangan", "tiada", "xde"]
INTENSIFIERS = {"sangat": 1.5, "gila": 2.0, "terlalu": 1.5, "paling": 2.0, "amat": 1.5, "betul": 1.5}
DIMINISHERS = {"kurang": 0.5, "agak": 0.5, "sedikit": 0.5, "sikit": 0.5, "biasa": 0.2}
CONTRAST_MARKERS = ["tapi", "tetapi", "walau", "walaupun", "meskipun", "namun", "cuma", "but", "however"]

def _lexicon_score(text: str) -> dict:
    """
    Computes a valence score (-1.0 to 1.0) using heuristic rules.
    """
    words = text.lower().split()
    total_score = 0.0
    critical_hit = False
    
    # Split text by contrast markers. The clause AFTER "tapi" carries 1.5x weight.
    # E.g., "makanan sedap tapi mahal" -> "mahal" dominates the overall feeling.
    clauses = [words]
    for marker in CONTRAST_MARKERS:
        if marker in words:
            idx = words.index(marker)
            clauses = [words[:idx], words[idx+1:]]
            break

    for c_idx, clause in enumerate(clauses):
        clause_weight = 1.5 if c_idx == 1 else 1.0 # Second clause after 'tapi' is heavier
        
        for i, word in enumerate(clause):
            base_val = 0
            is_critical = False
            
            # Check dictionaries
            if word in CRITICAL_TRIGGERS:
                base_val = CRITICAL_TRIGGERS[word]
                is_critical = True
                critical_hit = True
            elif word in NEG_TRIGGERS:
                base_val = NEG_TRIGGERS[word]
            elif word in POS_TRIGGERS:
                base_val = POS_TRIGGERS[word]
            else:
                # Multi-word checks (e.g. "x masak")
                for mw, val in {**CRITICAL_TRIGGERS, **NEG_TRIGGERS, **POS_TRIGGERS}.items():
                    if len(mw.split()) > 1 and mw in " ".join(clause):
                        base_val = val
                        if mw in CRITICAL_TRIGGERS: critical_hit = True
                        break

            if base_val != 0:
                # Look back 2 words for negations or modifiers
                window = clause[max(0, i-2):i]
                multiplier = 1.0
                
                # Negation flips polarity (but critical issues stay negative even if negated, usually)
                if any(n in window for n in NEGATIONS) and not is_critical:
                    multiplier *= -1.0
                    
                # Intensifiers & Diminishers
                for mod in window:
                    if mod in INTENSIFIERS: multiplier *= INTENSIFIERS[mod]
                    if mod in DIMINISHERS: multiplier *= DIMINISHERS[mod]
                
                # Exclamation marks boost score
                if "!" in text:
                    multiplier *= 1.2
                    
                total_score += (base_val * multiplier * clause_weight)

    # Normalize score between -1 and 1 using a logistic function
    normalized_score = total_score / math.sqrt(total_score**2 + 15)
    
    if critical_hit:
        # Force a strong negative score if a critical issue was detected
        normalized_score = min(normalized_score, -0.8)
        
    return {"compound": normalized_score, "critical": critical_hit, "is_mixed": len(clauses) > 1}


# -----------------------------------------------------------------------------
# MAIN ENSEMBLE PIPELINE
# -----------------------------------------------------------------------------

def analyse_sentiment(ulasan_teks: str, bilangan_bintang: int = None,
                      makanan: int = None, layanan: int = None, suasana: int = None) -> dict:
    """
    Enterprise-grade ensemble sentiment analysis.
    Combines VADER-style lexicon scoring with HuggingFace Deep Learning.
    """
    if bilangan_bintang is None and all(v is not None for v in [makanan, layanan, suasana]):
        bilangan_bintang = round((makanan + layanan + suasana) / 3)

    ulasan_normal = normalize_slang(ulasan_teks)
    
    # ── 1. Lexicon Engine ──────────────────────────────────────────────────
    lex_res = _lexicon_score(ulasan_normal)
    lex_val = lex_res["compound"]
    
    # ── 2. Deep Learning Engine (HuggingFace) ──────────────────────────────
    hf_val = 0.0
    if HUGGINGFACE_API_KEY:
        try:
            analysis_text = f"Rating: {bilangan_bintang}/5. {ulasan_normal}" if bilangan_bintang else ulasan_normal
            results = client.text_classification(analysis_text, model=MODEL_ID)
            if results:
                top = max(results, key=lambda x: x.score)
                # Convert HF label to -1.0 to 1.0 scale
                hf_val = top.score if top.label.lower() in ['positive', 'positif'] else \
                         -top.score if top.label.lower() in ['negative', 'negatif'] else 0.0
        except Exception as e:
            print(f"[Sentiment] HF Error: {e}")

    # ── 3. Ensemble Blend ──────────────────────────────────────────────────
    # If lexicon detects critical, trust lexicon 100%. Else blend 60% Lexicon / 40% HF.
    if lex_res["critical"]:
        final_val = lex_val
    else:
        final_val = (lex_val * 0.6) + (hf_val * 0.4)

    # Map float to Label and Confidence
    if final_val > 0.2:
        sentiment = "Positif"
        skor = min(0.5 + (final_val / 2), 0.99)
    elif final_val < -0.2:
        sentiment = "Negatif"
        skor = min(0.5 + (abs(final_val) / 2), 0.99)
    else:
        sentiment = "Neutral"
        skor = 1.0 - abs(final_val)

    if lex_res["is_mixed"] and abs(final_val) < 0.4:
        sentiment = "Neutral"

    # ── 4. Behavioral Rating Override (The Customer's Truth) ───────────────
    min_rating = min([v for v in [makanan, layanan, suasana] if v is not None] or [bilangan_bintang or 5])
    
    # Pain Point Override
    if min_rating <= 2 and sentiment == "Positif":
        sentiment = "Neutral"
        skor = 0.5
        
    # Global Rating Override
    if bilangan_bintang is not None:
        if bilangan_bintang <= 2:
            sentiment = "Negatif"
            skor = max(skor, 0.85)
        elif bilangan_bintang >= 4:
            if sentiment == "Negatif" and not lex_res["critical"]:
                sentiment = "Neutral"
                skor = 0.5

    return {"sentimen": sentiment, "skor": round(skor, 3)}

if __name__ == "__main__":
    import dotenv, os, sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dotenv.load_dotenv()
    
    test_cases = [
        ("kedai bau busuk", 2),
        ("roti x masak", 2),
        ("sedap gila!", 5),
        ("makanan sedap tapi servis lambat babeng", 4), # Contrast check
        ("makanan okay tapi mahal", 3),                 
        ("walaupun lambat, sedap sangat", 5),           
        ("bukan tak sedap, tapi portion sikit", 3),     # Double negation + contrast
        ("servis teramat laju", 5),                     # Intensifier
    ]
    for t, s in test_cases:
        res = analyse_sentiment(t, s)
        print(f"Result: '{t}' ({s}*) -> {res['sentimen']} (Score: {res['skor']})")
