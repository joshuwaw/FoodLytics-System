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
# -----------------------------------------------------------------------------

CRITICAL_TRIGGERS = {"mentah": -4, "x masak": -4, "tak masak": -4, "basi": -4, "busuk": -4, "lalat": -4, "ulat": -4, "keracunan": -4}
NEG_TRIGGERS = {"lambat": -2, "mahal": -2, "kotor": -3, "kecewa": -3, "teruk": -3, "hambar": -2, "tawar": -2, "masin": -2, "kurang ajar": -4, "biadap": -4, "sombong": -3, "bising": -1, "panas": -2}
POS_TRIGGERS = {"sedap": 2, "lazat": 3, "mantap": 3, "padu": 3, "best": 2, "terbaik": 3, "murah": 2, "bersih": 2, "cepat": 2, "pantas": 2, "ramah": 2, "mesra": 2, "berbaloi": 2, "puas": 2, "baik": 1, "bagus": 2, "selesa": 2}

NEGATIONS = ["tidak", "tak", "x", "bukan", "jangan", "tiada", "xde"]
INTENSIFIERS = {"sangat": 1.5, "gila": 2.0, "terlalu": 1.5, "paling": 2.0, "amat": 1.5, "betul": 1.5}
DIMINISHERS = {"kurang": 0.5, "agak": 0.5, "sedikit": 0.5, "sikit": 0.5, "biasa": 0.2}
CONTRAST_MARKERS = ["tapi", "tetapi", "walau", "walaupun", "meskipun", "namun", "cuma", "but", "however"]

def _split_into_clauses(text: str) -> list:
    """Splits text into clauses based on contrast markers and punctuation."""
    # Replace punctuation with a common delimiter
    clean_text = re.sub(r'[,.!?;]', ' | ', text)
    for marker in CONTRAST_MARKERS:
        clean_text = clean_text.replace(f" {marker} ", f" | {marker} ")
    
    # Split and clean
    clauses = [c.strip() for c in clean_text.split('|') if c.strip()]
    return clauses if clauses else [text]

def _lexicon_score(text: str) -> dict:
    """Computes a valence score (-1.0 to 1.0) using heuristic rules."""
    words = text.lower().split()
    total_score = 0.0
    critical_hit = False
    
    clauses = [words]
    for marker in CONTRAST_MARKERS:
        if marker in words:
            idx = words.index(marker)
            clauses = [words[:idx], words[idx+1:]]
            break

    for c_idx, clause in enumerate(clauses):
        clause_weight = 1.5 if c_idx == 1 else 1.0
        
        for i, word in enumerate(clause):
            base_val = 0
            is_critical = False
            
            if word in CRITICAL_TRIGGERS:
                base_val = CRITICAL_TRIGGERS[word]
                is_critical = True
                critical_hit = True
            elif word in NEG_TRIGGERS:
                base_val = NEG_TRIGGERS[word]
            elif word in POS_TRIGGERS:
                base_val = POS_TRIGGERS[word]
            else:
                for mw, val in {**CRITICAL_TRIGGERS, **NEG_TRIGGERS, **POS_TRIGGERS}.items():
                    if len(mw.split()) > 1 and mw in " ".join(clause):
                        base_val = val
                        if mw in CRITICAL_TRIGGERS: critical_hit = True
                        break

            if base_val != 0:
                window = clause[max(0, i-2):i]
                multiplier = 1.0
                
                if any(n in window for n in NEGATIONS) and not is_critical:
                    multiplier *= -1.0
                    
                for mod in window:
                    if mod in INTENSIFIERS: multiplier *= INTENSIFIERS[mod]
                    if mod in DIMINISHERS: multiplier *= DIMINISHERS[mod]
                
                if "!" in text:
                    multiplier *= 1.2
                    
                total_score += (base_val * multiplier * clause_weight)

    normalized_score = total_score / math.sqrt(total_score**2 + 15)
    
    if critical_hit:
        normalized_score = min(normalized_score, -0.8)
        
    return {"compound": normalized_score, "critical": critical_hit, "is_mixed": len(clauses) > 1}

# -----------------------------------------------------------------------------
# GLOBAL SENTIMENT (Legacy / Overview)
# -----------------------------------------------------------------------------

def analyse_sentiment(ulasan_teks: str, bilangan_bintang: int = None,
                      makanan: int = None, layanan: int = None, suasana: int = None) -> dict:
    """
    Computes global sentiment for the review. 
    Averages out the sentiment unless overridden by ratings.
    """
    if bilangan_bintang is None and all(v is not None for v in [makanan, layanan, suasana]):
        bilangan_bintang = round((makanan + layanan + suasana) / 3)

    ulasan_normal = normalize_slang(ulasan_teks)
    lex_res = _lexicon_score(ulasan_normal)
    lex_val = lex_res["compound"]
    
    hf_val = 0.0
    if HUGGINGFACE_API_KEY:
        try:
            analysis_text = f"Rating: {bilangan_bintang}/5. {ulasan_normal}" if bilangan_bintang else ulasan_normal
            results = client.text_classification(analysis_text, model=MODEL_ID)
            if results:
                top = max(results, key=lambda x: x.score)
                hf_val = top.score if top.label.lower() in ['positive', 'positif'] else \
                         -top.score if top.label.lower() in ['negative', 'negatif'] else 0.0
        except Exception as e:
            print(f"[Sentiment] HF Error: {e}")

    if lex_res["critical"]:
        final_val = lex_val
    else:
        final_val = (lex_val * 0.6) + (hf_val * 0.4)

    if final_val > 0.2:
        sentiment, skor = "Positif", min(0.5 + (final_val / 2), 0.99)
    elif final_val < -0.2:
        sentiment, skor = "Negatif", min(0.5 + (abs(final_val) / 2), 0.99)
    else:
        sentiment, skor = "Neutral", 1.0 - abs(final_val)

    if lex_res["is_mixed"] and abs(final_val) < 0.4:
        sentiment = "Neutral"

    # Rating overrides
    min_rating = min([v for v in [makanan, layanan, suasana] if v is not None] or [bilangan_bintang or 5])
    if min_rating <= 2 and sentiment == "Positif":
        sentiment, skor = "Neutral", 0.5
        
    if bilangan_bintang is not None:
        if bilangan_bintang <= 2:
            sentiment, skor = "Negatif", max(skor, 0.85)
        elif bilangan_bintang >= 4:
            if sentiment == "Negatif" and not lex_res["critical"]:
                sentiment, skor = "Neutral", 0.5

    return {"sentimen": sentiment, "skor": round(skor, 3)}

# -----------------------------------------------------------------------------
# ASPECT-BASED SENTIMENT ANALYSIS (ABSA)
# -----------------------------------------------------------------------------

def analyse_aspect_sentiment(ulasan_teks: str, aspect_keywords: list[str]) -> dict:
    """
    Enterprise-grade ABSA. 
    Finds the specific clause where the aspect keywords appear and evaluates
    sentiment strictly locally. This prevents "sedap tapi servis lambat" from 
    averaging to neutral.
    """
    ulasan_normal = normalize_slang(ulasan_teks).lower()
    clauses = _split_into_clauses(ulasan_normal)
    
    # 1. Identify which clauses contain the aspect
    relevant_clauses = []
    for clause in clauses:
        for kw in aspect_keywords:
            if re.search(r'\b' + re.escape(kw.lower()) + r'\b', clause) or (len(kw.split()) > 1 and kw.lower() in clause):
                relevant_clauses.append(clause)
                break
                
    if not relevant_clauses:
        # Fallback: if keywords not in text (maybe semantic match), just use the whole text but highly penalized confidence
        relevant_clauses = [ulasan_normal]
        
    # 2. Evaluate sentiment ONLY on the relevant clauses
    combined_relevant_text = " . ".join(relevant_clauses)
    lex_res = _lexicon_score(combined_relevant_text)
    lex_val = lex_res["compound"]
    
    # Optional: use HF strictly on the local clause
    hf_val = 0.0
    if HUGGINGFACE_API_KEY:
        try:
            results = client.text_classification(combined_relevant_text, model=MODEL_ID)
            if results:
                top = max(results, key=lambda x: x.score)
                hf_val = top.score if top.label.lower() in ['positive', 'positif'] else \
                         -top.score if top.label.lower() in ['negative', 'negatif'] else 0.0
        except:
            pass

    if lex_res["critical"]:
        final_val = lex_val
    else:
        final_val = (lex_val * 0.7) + (hf_val * 0.3) # Heavy bias towards lexicon for short clauses

    if final_val > 0.15:
        sentiment, skor = "Positif", min(0.5 + (final_val / 2), 0.99)
    elif final_val < -0.15:
        sentiment, skor = "Negatif", min(0.5 + (abs(final_val) / 2), 0.99)
    else:
        sentiment, skor = "Neutral", 1.0 - abs(final_val)

    return {"sentimen": sentiment, "skor": round(skor, 3), "klausa_relevan": combined_relevant_text}

if __name__ == "__main__":
    import dotenv, os, sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dotenv.load_dotenv()
    
    test_text = "makanan sedap tapi servis lambat gila babeng. kotor pula tu meja."
    print("--- GLOBAL ---")
    print(analyse_sentiment(test_text, 3))
    
    print("\n--- ASPECT: Kualiti Makanan ---")
    print(analyse_aspect_sentiment(test_text, ["makanan", "sedap"]))
    
    print("\n--- ASPECT: Layanan Staf ---")
    print(analyse_aspect_sentiment(test_text, ["servis", "lambat"]))
    
    print("\n--- ASPECT: Kebersihan ---")
    print(analyse_aspect_sentiment(test_text, ["kotor", "meja"]))
