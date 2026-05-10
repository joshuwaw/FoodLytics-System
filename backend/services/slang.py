# Dictionary of Malay Slang/Short-forms and their formal equivalents
import re

# Used to normalize text before sentiment analysis

SLANG_DICT = {
    # --- Negativity & Complaints ---
    "hauk": "teruk",
    "hampeh": "mengecewakan",
    "kencing": "tipu",
    "cekik darah": "mahal",
    "yahudi": "mahal",
    "mahei": "mahal",
    "lembap": "lambat",
    "lembab": "lambat",
    "slow": "lambat",
    "hare": "teruk",
    "sampah": "sangat teruk",
    "indah khabar dari rupa": "mengecewakan",
    "potong stim": "potong minat",
    "beratur": "tunggu lama",
    "queue": "tunggu lama",

    # --- Positivity & Praise ---
    "best": "bagus",
    "mantap": "bagus",
    "padu": "hebat",
    "kawkaw": "sangat kuat",
    "boek": "baik",
    "cunn": "baik",
    "cun": "baik",
    "mantul": "mantap",
    "padu": "hebat",
    "lawa": "cantik",
    "power": "hebat",
    "tiptop": "cemerlang",
    "sedap gila": "sangat sedap",
    "recommended": "disyorkan",
    "recomended": "disyorkan",
    "rekomen": "disyorkan",

    # --- Shortcuts & Abbreviations ---
    "x": "tak",
    "tk": "tak",
    "tdk": "tidak",
    "takde": "tidak ada",
    "xde": "tidak ada",
    "takpe": "tidak mengapa",
    "xpe": "tidak mengapa",
    "yg": "yang",
    "utk": "untuk",
    "dlm": "dalam",
    "dgn": "dengan",
    "pd": "pada",
    "dr": "dari",
    "tu": "itu",
    "ni": "ini",
    "je": "saja",
    "aje": "saja",
    "saje": "saja",
    "ke": "kah",
    "kat": "dekat",
    "kt": "dekat",
    "dh": "dah",
    "dah": "sudah",
    "sdh": "sudah",
    "tau": "tahu",
    "xnak": "tak nak",
    "nak": "hendak",
    "nk": "hendak",
    "gi": "pergi",
    "p": "pergi",
    "mkn": "makan",
    "btl": "betul",
    "skrg": "sekarang",
    "skit": "sedikit",
    "sikit": "sedikit",
    "bnyk": "banyak",
    "byk": "banyak",
    "org": "orang",
    "korg": "korang",
    "mcm": "macam",
    "cam": "macam",
    "camne": "macam mana",
    "mcmne": "macam mana",
    "nnt": "nanti",
    "pastu": "lepas itu",
    "tp": "tapi",
    "klau": "kalau",
    "kalu": "kalau",
    "kalo": "kalau",
    "jer": "saja",
    "kot": "mungkin",
    "kut": "mungkin",
    "sngt": "sangat",
    "sgt": "sangat",
    "tq": "terima kasih",
    "thx": "terima kasih",
    "tqvm": "terima kasih banyak",
    "pls": "tolong",
    "rege": "harga",
    "hrga": "harga",
    "lokasi": "tempat",

    # --- Manglish & English Rojak ---
    "waiting": "tunggu",
    "order": "pesan",
    "serve": "hidang",
    "staff": "staf",
    "service": "layanan",
    "taste": "rasa",
    "flavor": "rasa",
    "texture": "tekstur",
    "portion": "saiz hidangan",
    "parking": "tempat letak kereta",
    "toilet": "tandas",
    "clean": "bersih",
    "dirty": "kotor",
    "bad": "teruk",
    "good": "bagus",
    "waiting time": "masa menunggu",

    # --- Dialect Variations ---
    "sodap": "sedap",
    "sedak": "sedap",
    "nyaman": "sedap",
    "enak": "sedap",
}

def normalize_slang(text: str) -> str:
    """
    Cleans text and replaces slang/short-forms with formal equivalents.
    Handles repeated letters (e.g., 'sedapppp') and punctuation.
    """
    if not text:
        return text
    
    # 1. Lowercase and remove excessive punctuation
    text = text.lower()
    text = re.sub(r'([?.!,])\1+', r'\1', text) # Remove repeated punctuation
    
    # 2. Handle repeated characters (e.g., 'looong' -> 'long', 'sedappp' -> 'sedap')
    # Use a lookahead to find sequences of 3+ identical characters and collapse to 2
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)

    # 3. Handle multi-word slang first (greedy match)
    # Sort keys by length descending to match longest phrases first
    sorted_slang = sorted(SLANG_DICT.keys(), key=len, reverse=True)
    
    for slang in sorted_slang:
        if " " in slang:
            # Match multi-word phrase with word boundaries
            text = re.sub(r'\b' + re.escape(slang) + r'\b', SLANG_DICT[slang], text)

    # 4. Handle single-word slang
    words = text.split()
    normalized_words = [SLANG_DICT.get(word, word) for word in words]
    
    return " ".join(normalized_words)
