import os
from sentence_transformers import SentenceTransformer, util
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading model on {device}...")
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2", device=device)

# Extended Taxonomy (Enterprise Grade)
TAXONOMY = {
    "Masalah Tempat Letak Kereta": ["susah nak parking", "takde tempat letak kereta", "parking penuh"],
    "Masalah Pembayaran": ["mesin rosak", "tak boleh bayar kad", "qr tak function", "cashless problem"],
    "Kemudahan Asas (Tandas/Sudu)": ["tandas kotor", "sudu garpu kotor", "takde tisu", "sinki sumbat"],
    "Isu Penghantaran/Bungkus": ["bungkusan bocor", "kuah tumpah", "bekas pecah", "lambat sampai"],
    "Menu Terhad": ["menu sikit", "banyak makanan habis", "pilihan terhad"],
}

# Pre-compute embeddings for taxonomy
taxonomy_embeddings = {}
for label, examples in TAXONOMY.items():
    # Embed the examples and take the mean to represent the category concept
    emb = model.encode(examples, convert_to_tensor=True)
    taxonomy_embeddings[label] = torch.mean(emb, dim=0)

# Test cases that fail rules
test_reviews = [
    "pusing 3 kali tak jumpa ruang letak kereta",
    "kad kredit tak terima, leceh betul",
    "toilet bau hancing gila",
    "air tumpah dalam plastik, habis basah",
    "baru pukul 8 semua dah licin"
]

for review in test_reviews:
    rev_emb = model.encode(review, convert_to_tensor=True)
    
    best_label = None
    best_score = 0.0
    
    for label, concept_emb in taxonomy_embeddings.items():
        score = util.cos_sim(rev_emb, concept_emb).item()
        if score > best_score:
            best_score = score
            best_label = label
            
    print(f"Review: '{review}' -> {best_label} (Score: {best_score:.3f})")

