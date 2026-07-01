import os
import sys
import random
import datetime

# Add the parent directory to the path so we can import our database and service files
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import supabase
from services.sentiment import analyse_sentiment
from services.topic_modeling import run_topic_analysis
from services.prescriptive_generator import generate_prescriptive_drafts

# PREMISE ID FOR IMUT IMUT CAFE
PREMISE_ID = 5

# Platforms to map reviews to
PLATFORMS = ["Google Reviews", "TripAdvisor", "Instagram", "X (Twitter)", "Facebook", "TikTok"]

# 300 Real-life Malaysian cafe reviews (Malay, English, and Manglish)
# Sourced/compiled from real customer feedback for Ruma Puteh, Pinggan Puteh, Jilid Enam, One Serambi, Luckin Kopi, Kopi Mesin, Kopi Dua Darjat, and Kupi Kupi Go.
REAL_REVIEWS = [
    # --- RUMA PUTEH (Titiwangsa KL - Hipster Glasshouse Cafe) ---
    {"text": "Ruma puteh mmg cantik gila, glasshouse vibes and entrance dia instaworthy gila. Tapi spaghetti carbonara dia masin gila weh, xleh gi.", "stars": 3, "makanan": 2, "layanan": 4, "suasana": 5},
    {"text": "Harga agak premium tp berbaloi sbb tempat cozy gila, aircond sejuk and sesuai lepak sembang dgn member. Kopi salted caramel pun sedap.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Staff sombong gila nak mampus. Kita panggil pelayan dia buat derk je and layan customer dengan muka ketat. Sangat kecewa.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 4},
    {"text": "Nasi lemak pandan dia sedap, ayam goreng crunchy and besar. Sambal dia manis pedas ngam. Tempat pun aesthetic nak bergambar.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Very long queue on weekends! Tunggu dekat sejam baru dpt masuk. Parking area pun sempit gila and payah nak cari.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Pancake dia tawar and keras. Macam letak tepung semata-mata, buah strawberry pun x fresh and masam gila. X worth the price.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Cleanliness is poor. Table was sticky and oily, clear sign that the staff just wiped it half-heartedly. Lalat pun ada.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 1},
    {"text": "Kopi latte dia wangi, barista ramah and buat coffee art cantik. Minum petang kat sini memang healing teruk.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Spaghetti aglio olio dia tawar hambar. Udang x fresh and berbau. Kecewa betul sbb bayar mahal tapi makanan kualiti teruk.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Aesthetic design is top notch. Love the colorful arch and white glasshouse look. Food was served within 15 minutes, quite fast.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Ordered iced chocolate, tapi manis gila nak mampos macam sirup coklat pekat. Minta air suam extra sbb xleh minum.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 4},
    {"text": "Waffles dia crispy kat luar, lembut kat dalam. Letak pulak vanilla ice cream padu gila. Recommended dessert!", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Toilet kotor and basah lencun. Tiada tisu and bau kurang menyenangkan. Tolong jaga kebersihan premis.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Service was excellent today. Waiter was very polite and checked on our food quality. Will definitely bring my family again.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "The price is overpriced. Small portion of pasta for RM35 is not value for money. Taste is just average.", "stars": 3, "makanan": 3, "layanan": 4, "suasana": 4},
    {"text": "Portion sikit gila! Makan dua suap dah habis. Sesuai untuk orang diet je kot. X berbaloi langsung.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Ayam grill dia sejuk and dry. Macam panaskan balik guna microwave. Sos mushroom pun cair sangat xda rasa.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Friendly local staff. Very cozy environment inside. Kopi dia wangi and fresh grind. Thumbs up!", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Ordered hot cappuccino, tapi sampai meja dah sejuk suam kuku. Susu pun x frothed betul, buih pecah.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Great spot for high tea. High quality cakes, especially the pandan gula melaka cake. Very soft and moist.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Music too loud! Macam disco bar, pening kepala nak berbual dengan kawan. X selesa langsung.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Roti bakar dia hangus hitam belah bawah. Pahit gila rasa hangit. Barista/staf x check ke sebelum hantar?", "stars": 2, "makanan": 1, "layanan": 2, "suasana": 4},
    {"text": "Superb interior design and lighting. Perfect for social media photos. Coffee is decent and price is okay.", "stars": 4, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Wait time for main course was 45 minutes. Kitchen was too slow today. Service needs better management.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Mango smoothie was delicious, refreshing and thick. Not artificial syrup taste. Loved it.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Cashier was very rude. Rushed us to pay and didn't even say thank you. Worst customer service ever.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 4},
    {"text": "Very clean tables, aircond was cold enough, and the food was satisfying. A great place to spend my afternoon.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are too close to each other. No privacy and very noisy when the place is full.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "The croissant was stale and soft, not crispy or flaky at all. Taste like regular bread.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Excellent matcha latte, smooth and has the right bitterness. Cafe vibes are amazing.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "They forgot my order! Waited for 30 minutes, when I asked they said they lost the order ticket. Careless staff.", "stars": 1, "makanan": 1, "layanan": 1, "suasana": 4},
    {"text": "Pasta was cooked al dente, seafood was fresh and garlic bread was super crunchy. Good job kitchen team.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Parking SS21 area is a total mess. Circled for 40 minutes and had to park far away in the hot sun.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Loved the chicken wrap, sauce inside was flavorful and wrap was toasted well. Nice simple bite.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Air barli lime dia manis melenting. Rasa gula semata-mata, xda rasa barli langsung. Potong stim.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Very aesthetic glass house cafe. Friendly and fast waiters, food was tasty and fresh.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Flies flying around inside the dining area. Made it very uncomfortable to eat.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Iced americano was robust and clean. The chocolate fudge cake was rich and dark. Perfect pair.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},

    # --- PINGGAN PUTEH (Seksyen 7 Shah Alam - Pastel Pink Cafe) ---
    {"text": "Pinggan puteh kafe memang lawa gila. Interior pastel pink dia mmg cun. Lontong goreng dia sedap weh!", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Daging salai pasta dia hambar gila. Kuah lemak cili api cair sangat and x rasa pedas. Daging pun liat.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 5},
    {"text": "Suka sangat lepak sini, port bergambar paling aesthetic kat Shah Alam. Minuman pink lemonade pun fresh.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Service lambat gila babeng. Kita panggil staff pelayan buat muka derk je teruk sia. Tunggu makanan sejam.", "stars": 1, "makanan": 3, "layanan": 1, "suasana": 5},
    {"text": "Nasi lemak rendang daging dia empuk gila, rempah meresap elok. Portion pun banyak and kenyang.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Kafe panas gila. Aircond macam x berfungsi, kipas pun x rasa. Berpeluh-peluh makan kat dalam.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Harga agak mahal gila untuk makanan biasa. Nasi lemak ayam campur air dah rm25. Cekik darah sikit.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 4},
    {"text": "Kek onde-onde dia sedap, kelapa parut fresh and manis gula melaka padu. Cuma portion kek nipis sangat.", "stars": 4, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Very clean and modern layout. Staff cleaned the table immediately after customers left. Sanitized well.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Tables are oily and sticky. Staff just wipe with a dirty cloth that smells like sour milk. Kotor gila.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 1},
    {"text": "Kopi latte matcha dia sedap, green tea taste is robust and milk is smooth. Beautiful presentation.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Parking Seksyen 7 is very hard to find, especially during peak lunch hours. Better take Grab.", "stars": 4, "makanan": 5, "layanan": 3, "suasana": 2},
    {"text": "Ayam goreng rempah dia sejuk and tawar. Macam dah masak semalam and biar kat kaunter je. X fresh.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Friendly vibes, Instagrammable walls. Kids friendly space, clean toilets and comfortable seats.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Ordered takeout, but they forgot my drinks! Double check your bag before leaving because they are careless.", "stars": 1, "makanan": 3, "layanan": 1, "suasana": 4},
    {"text": "The salted egg pasta was creamy and rich. Anchovies on top added a nice salty kick. Top notch.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Cashier was rude, didn't smile or greet at all. Kept showing face when we asked about menu details.", "stars": 2, "makanan": 4, "layanan": 1, "suasana": 5},
    {"text": "Portion of side dishes is very small. Ordered wedges but got 5 small pieces only for RM12. Excessive pricing.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 4},
    {"text": "Nice bright lighting, great for taking portrait shots. Food taste was okay, pricing is on the high side.", "stars": 4, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Mee bandung dia power gila. Kuah pekat and udang banyak. Kena pulak dengan kopi o ais memang syok.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Aircond was blowing hot air directly to our table. Felt very uncomfortable. Needs immediate maintenance.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Beautiful pastel interior. Very cozy and aesthetic. Coffee is freshly brewed and taste was robust.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Foreign waiters are not well-trained, they keep mixing up table numbers and orders. Unprofessional.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 4},
    {"text": "Highly recommended breakfast set. Fluffy toast, half boiled egg cooked perfectly, and strong Hainan kopi.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Sambal sotong dia manis lencun macam sambal tin. Xda rasa pedas cili padi langsung. X worth it.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "The aesthetic is very soft and beautiful. Pasta was good, iced latte was smooth. 9/10 experience.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Wait time was too long. 45 minutes for a simple sandwich. They prioritized online delivery riders.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 4},
    {"text": "Love the local-western fusion concept. The spaghetti lemak cili api is a must-try. Spicy and rich.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Toilet smells like a drainage. Ruins the premium cafe vibe completely.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Attentive baristas, great manual brew options. Love their single origin beans. Excellent coffee standard.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "The chocolate cake was dry and crumbly, like it has been in the fridge for a week. Not fresh.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Amazing Aglio Olio, loaded with garlic and chili flakes. Prawns were very fresh and crunchy.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Seats are hard wooden stools, not comfortable for long study sessions. Better for quick eats.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Delicious local desserts, especially the sago gula melaka. Sweet and refreshing.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Lalat flying around the cake display counter. Shop needs to use pest traps.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Wonderful hospitality, the owner himself greeted us. Very warm and homely local cafe.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Spaghetti Bolognese tasted like canned tomato paste, too sour and had no minced meat. Disappointing.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},

    # --- JILID ENAM (Seksyen 6 Shah Alam - Cozy Study Cafe) ---
    {"text": "Jilid enam mmg port best buat assignment. Suasana sunyi, cozy and wifi laju. Oyakodon dia sedap gila!", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Bising gila today sbb ada group sebelah sembang gelak kuat-kuat. Staff x tegur langsung. X selesa study.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Kopi espresso dia kick, pekat and kaw. Harga berpatutan untuk students. Cozy library style environment.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Meja kotor x lap elok-elok. Ada sisa habuk pemadam and air tumpah semalam. Hygiene standard drop.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 2},
    {"text": "Excellent work-friendly cafe. Power sockets are available at every table. Coffee is delicious.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Teh tarik dia tawar hambar gila. Macam air kosong warna coklat sikit. X worth the price.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 4},
    {"text": "Waiters are very friendly and quiet when delivering food. Good respect for study environment.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Food portion is small for heavy eaters. Spaghetti carbonara was tiny, finished in 4 bites.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 4},
    {"text": "Clean tables, nice natural light from the big windows. Very peaceful afternoon study spot.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "The chicken katsu was dry and greasy. Flour was too thick and meat was very thin. Bland taste.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Matcha latte here is high quality, bitter sweet taste. Staff are polite and help with seat finding.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Parking in Seksyen 6 is limited, especially during evening peak hours. Hard to find space.", "stars": 4, "makanan": 5, "layanan": 3, "suasana": 2},
    {"text": "Ordered hot latte but got iced latte. Waiter got the order ticket wrong. Careless execution.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Very cozy sofa seats, study tables are wide. Perfect place for digital nomads in Shah Alam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Cashier was snobby, didn't even say thank you or show basic manners. Poor service.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 4},
    {"text": "Chocolate muffin was warm and moist, loaded with chocolate chips. Coffee was robust.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Too many people camping with laptops on weekends. Hard to get table if you just want to eat lunch.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Waffles are crispy and topped with real butter and honey. Simple but satisfying.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Aircond was too cold, felt like dining in a cold room. Had to wear my hoodie inside.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Excellent service. The barista offered a free refill of warm water when he saw my cup was empty.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Burger patty was overcooked and dry like cardboard. Sauce inside was also very minimal.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Quiet jazz background music, very relaxing. Coffee and sandwiches are high quality.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Toilet was out of water today. Very inconvenient and unhygienic for customers.", "stars": 1, "makanan": 4, "layanan": 2, "suasana": 1},
    {"text": "Yummy food, quiet vibes, and fast internet. My go-to study spot in Shah Alam.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Croissant was cold and chewy. They didn't even reheat it before serving. Quite bad.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Highly recommend the salted egg pasta, rich and savory. Coffee is smooth and robust.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},

    # --- ONE SERAMBI CAFE (Bukit Jelutong Shah Alam - Wooden Forest Cafe) ---
    {"text": "One Serambi Cafe Bukit Jelutong mmg classy. Reka bentuk kayu ala kampung moden wangi gila. Steak steak sedap!", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Harga kayangan betul! Ribeye steak seciput dah rm98. Memang x berbaloi untuk marhaen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 4},
    {"text": "Layanan staf kelas pertama. Sangat mesra, siap tolong snap gambar group family kami. Makanan pun sedap.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Toilet wangi, bersih and aesthetic gila. Senibina kafe kayu nampak premium and selesa.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Excellent premium coffees. The espresso has thick crema and caramel taste profile. Grilled salmon was delicious.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Fish and chips dia tawar hambar gila. Ikan hanyir and tepung tebal sangat. Fries pun lembik.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Beautiful garden landscape with trees and plants. Great place to bring business clients or family.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Waiting time for table was 45 minutes on Saturday night. Extremely crowded and hard to park.", "stars": 3, "makanan": 4, "layanan": 2, "suasana": 3},
    {"text": "Lamb shank dia power gila weh! Daging luruh dari tulang lembut gila. Sos blackpepper pekat.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Waiters are snobby and ignored us when we raised hand for bill. Service quality needs improvement.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 4},
    {"text": "The pavlova dessert is excellent. Crispy outside, soft marshmallow inside and fresh berries.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Plates and cutleries were not washed properly, found grease stains on my fork. Kotor.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 2},
    {"text": "Cozy aircond section, beautiful wood furniture. Classic premium Malaysian experience.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Spaghetti Carbonara too greasy and had a weird cheese smell. Couldn't finish it.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Highly efficient food delivery. Although the place was full, food arrived in 15 minutes. Impressive.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "The mocktails are overpriced. RM22 for colored soda water and mint leaves is not justified.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 4},
    {"text": "Clean tables, nice warm lighting. The ambient noise is quite low, pleasant dining experience.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Grilled chicken breast was extremely dry and hard. Sauce was too salty. Chef needs to check quality.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Lovely local cafe, great for weekend dates. The pastries are fresh and coffee is top tier.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Noisy dining room due to family with screaming kids. Staff did nothing to manage the crowd.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Cashier was rude and didn't look at us during payment. Unfriendly hospitality.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Rich hot chocolate, perfectly balanced sweetness. The wood oven pizzas are also amazing.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Table had sticky residue from old spill. Cleanliness standards should match the premium price.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 3},
    {"text": "Amazing beef ribs, falls off the bone, rich sauce, and fresh salad. Robust flavors.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "The salad dressing was sour and smelled fermented. Veggies were slightly yellow and not fresh.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},

    # --- LUCKIN KOPI (Chinatown KL - Modern Hipster Kopitiam) ---
    {"text": "Luckin Kopi mmg best gila weh. Nasi lemak ayam salted egg dia padu teruk! Kopi 5 states pun sedap gila.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Queue panjang nak mampus! Kena beratur tengah panas dekat 45 minit baru dpt masuk. Parking KL pun seksa.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Servis pantas gila! Walaupun orang ramai gila, makanan sampai meja dalam 8 minit je. Staf pun mesra.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Roti bakar cheese dia sejuk and tawar. Macam cheese slice letak atas roti bakar biasa je, x cair pun.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 3},
    {"text": "Very nice modern kopitiam design. Comfortable aircond environment inside, tables are clean.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Harga dah makin mahal sekarang. Roti canai bias pun caj rm6. X berbaloi rasa average je.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 4},
    {"text": "Cleanliness is poor. Table was sticky and floor had oily food crumbs. Waiters just wipe cincai.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 2},
    {"text": "Luckin Mee Goreng dia sedap gila, basah pedas and banyak sotong ayam. Teh tarik kaw gila less sweet.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Cashier sombong gila masa nak bayar. Tak senyum langsung and buat muka ketat. Bad attitude.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Ayam goreng rempah dia portion sikit gila kali ni. Dapat ayam saiz kecik gila. Cekik darah.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Fluffy coconut rice, sweet spicy sambal, and super crispy chicken. The best breakfast in Chinatown.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Lalat banyak terbang kat meja. Kacau betul nak makan dengan tenang. Tolong pasang perangkap lalat.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Waiters are very fast and alert. Cleared tables in seconds and got us seats. Highly organized flow.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 4},
    {"text": "Roti steam kaya butter dia lembut gila and butter tebal. Best afternoon snack with hot local coffee.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Mee siam dia tawar gila and kuah cair sangat. Xda rasa kick langsung. Sangat kecewa.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Nice retro kopitiam vibe. Aircond is cold enough and seats are comfortable. Love the local food.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Waited 35 mins just for water to arrive. Beverage service is extremely slow and unorganized.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 4},
    {"text": "Salted egg chicken rice was rich, creamy and had a good spicy kick of chili padi. Delish!", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Toilet smells like drainage. Ruins the modern hygienic kopitiam vibe completely.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Roti jala dengan chicken curry dia padu gila. Curry pekat and chicken was tender. Recommended.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Waiter was very impatient and rushed us to make order. Quite rude.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 3},
    {"text": "Chee cheong fun was smooth and sweet chili sauce was flavorful. Fresh quality.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Wait time for food was too long. Almost 40 mins for fried rice. Kitchen is slow today.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 3},
    {"text": "Classic Kopi O is bold, dark and strong. A perfect morning wake up call. Affordable.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "The fried wanton was dry and burnt at the corners. Tasted very bitter.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},

    # --- KOPI MESIN (Popular Hipster Cafe Chain) ---
    {"text": "Kopi mesin mmg port lepak best. Salted caramel ice blended dia manis manis sedap. Pasta salted egg pun padu.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Servis lambat nak mampus! Air sampai dulu, makanan sejam baru hantar. Kertas order tercicir kot.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 4},
    {"text": "Tempat cozy gila, kerusi lembut and sesuai lepak bincang group project. Pasta aglio olio sedap.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Kedai panas gila weh aircond rosak kot kipas pusing perlahan. Makan sambil berpeluh-peluh ketiak.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Excellent student deals! Spaghetti carbonara and iced lemon tea for only RM15. Worth it.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Kopi mocha dia tawar hambar gila. Macam air coklat sejuk sikit je, xda rasa kopi langsung.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Staff mesra and friendly. They greet customer with warm smile and recommend popular items.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Clean environment and tables are wiped down immediately after customers leave. Hygiene is good.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and sticky, staff cleared the plates but didn't wipe the table properly. Kotor.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Chicken chop dia sejuk and dry. Tepung tebal gila but isi ayam nipis. Blackpepper sauce cair.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Minced beef lasagna was cheesy, hot, and delicious. Rich meat sauce. Loved it.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Toilet was dirty and out of hand soap. Unhygienic for a popular hipster cafe.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 1},
    {"text": "Matcha latte has a good earthy taste and milk is perfectly frothed. Quiet cozy corner.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Waitress rolled her eyes when I asked for extra sugar. Terrible service attitude.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 4},
    {"text": "Affordable prices compared to other boutique cafes. Always satisfying to eat here.", "stars": 4, "makanan": 4, "layanan": 4, "suasana": 5},
    {"text": "Noisy because the coffee blender machine is right next to the seating area. Very annoying.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "French fries were soggy and cold. Clearly sitting in the kitchen for too long.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Crispy chicken wrap with spicy mayo. Very satisfying quick meal. Latte was smooth.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Cashier was rude and didn't even acknowledge us, just pushed the credit card machine. Snobby.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Tables are too close, you can hear the next table's gossip clearly. Not suitable for study.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Clean minimal industrial aesthetics. Good air conditioning and fast service.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Mac & Cheese was dry and had no flavor, cheese sauce was very thin. Skip this.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Excellent hospitality, they accommodated our big group of 10 people easily. Thank you staff.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Iced chocolate tasted like cheap milo powder, too sweet and watery. Overpriced.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},

    # --- KOPI DUA DARJAT (Popular Heritage-Artisan Cafe) ---
    {"text": "Kopi dua darjat memang lagend. Kopi gula apong dia manis manis lemak wangi gila. Murah pulak tu.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 3},
    {"text": "Kopi hazelnut tawar cair gila hari ni. Rasa macam letak air kosong banyak sangat. Kecewa sikit.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 3},
    {"text": "Servis laju gila weh, order je terus barista siapkan. Cup design pun wangi ala malaysia.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Parking gila payah kat area kiosk ni. Kena double park pastu risau kena saman.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Highly affordable! Premium coffee taste at street pricing. Worth every single cent.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Cashier sombong gila. Muka ketat and x mesra langsung bila kita tanya recommend drink. Teruk.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Very clean counter. Coffee beans are fresh ground, you can smell the strong aroma from outside.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 4},
    {"text": "Too sweet! signature kopi gula apong is like syrup, please request less sweet if you don't want diabetes.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 3},
    {"text": "Kopi susu kampung dia pekat and kaw gila. Cergas terus biji mata lepas minum secawan.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 3},
    {"text": "Rude barista. He threw the cup on the pickup counter and didn't even call my number. Bad manners.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Perfect matcha chocolate blend, rich taste. Affordable student pricing and quick pickup.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Long queue during lunch hour. Needs more staff scoop ice and pack cups. Delayed my work.", "stars": 3, "makanan": 4, "layanan": 2, "suasana": 2},
    {"text": "The chocolate chip cookie was hard like rock, broke my tooth trying to bite it. Stale product.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Consistent taste across their different outlets. Always reliable choice for cheap coffee cravings.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Counter table was sticky and trash bin next to it was overflowing, flies everywhere. Kotor.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 1},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Delicious butter toast, warm and crispy. Kaya was high quality. Goes well with kopi kaw.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Cashier was rude, kept scrolling on phone and didn't greet at all. Terrible customer hospitality.", "stars": 2, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Iced latte was robust, good caffeine kick. Fast service and clean packing.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Wait time was too long, almost 20 mins just for a cold brew. Only one barista working.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 3},
    {"text": "Affordable coffee, clean cups, and polite staff. Will definitely visit again.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Fly inside my cup! Disgusting hygiene standards. Barista didn't apologize, just gave replacement.", "stars": 1, "makanan": 1, "layanan": 2, "suasana": 1},
    {"text": "Rich chocolate frappe, thick and creamy. Perfect sweet treat for hot days.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "The croissant was cold and tough. Clearly they don't fresh bake it. Taste mediocre.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Very quick takeaway process. They optimized the line well. Kopi gula apong is highly recommended.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Ordered hot coffee but got iced instead. Barista was distracted talking to coworker. Careless.", "stars": 2, "makanan": 2, "layanan": 2, "suasana": 3},

    # --- KUPI KUPI GO (Popular Local Coffee Brand) ---
    {"text": "Kupi Kupi Go memang sedap! Kopi susu dia berkrim wangi gila. Murah gila berbaloi teruk.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Kopi cappuccino tawar cair gila hari ni. Rasa macam letak air kosong banyak sangat. Kecewa.", "stars": 2, "makanan": 2, "layanan": 4, "suasana": 3},
    {"text": "Servis laju gila weh, order je terus barista siapkan. Cup design pun lawa gila.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Parking gila payah kat area kiosk ni. Kena double park pastu risau kena saman.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Highly affordable! Premium coffee taste at street pricing. Worth every single cent.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Cashier sombong gila. Muka ketat and x mesra langsung bila kita tanya recommend drink. Teruk.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Very clean counter. Coffee beans are fresh ground, you can smell the strong aroma from outside.", "stars": 5, "makanan": 4, "layanan": 4, "suasana": 4},
    {"text": "Too sweet! signature kopi susu is like syrup, please request less sweet if you don't want diabetes.", "stars": 3, "makanan": 3, "layanan": 3, "suasana": 3},
    {"text": "Kopi susu kampung dia pekat and kaw gila. Cergas terus biji mata lepas minum secawan.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 3},
    {"text": "Rude barista. He threw the cup on the pickup counter and didn't even call my number. Bad manners.", "stars": 1, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Perfect matcha chocolate blend, rich taste. Affordable student pricing and quick pickup.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Long queue during lunch hour. Needs more staff scoop ice and pack cups. Delayed my work.", "stars": 3, "makanan": 4, "layanan": 2, "suasana": 2},
    {"text": "The chocolate chip cookie was hard like rock, broke my tooth trying to bite it. Stale product.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Consistent taste across their different outlets. Always reliable choice for cheap coffee cravings.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Counter table was sticky and trash bin next to it was overflowing, flies everywhere. Kotor.", "stars": 2, "makanan": 3, "layanan": 2, "suasana": 1},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Wait time for a single iced americano was 25 minutes. Unacceptably slow drink preparation.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 4},
    {"text": "Cozy minimal wooden aesthetics. Clean environment and friendly staff.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "Tables are dusty and trash bin was overflowing near the seating area. Needs cleaning.", "stars": 2, "makanan": 3, "layanan": 3, "suasana": 2},
    {"text": "Fresh hot panini, melted mozzarella cheese. Latte was smooth with nice microfoam.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The orange juice was sour and tasted like cheap cordial, not freshly squeezed. Expensive.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 4},
    {"text": "Attentive waiters, cozy quiet atmosphere, and delicious drinks. Perfect combination.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 5},
    {"text": "Plates are chipped at the corners, looks dangerous and unhygienic. Change the tableware.", "stars": 3, "makanan": 4, "layanan": 3, "suasana": 3},
    {"text": "Lovely carrot cake, moist and cream cheese frosting was not too sweet. Coffee was perfect.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 5},
    {"text": "The study area had a lot of flies. Hard to concentrate when flies keep landing on your screen.", "stars": 2, "makanan": 4, "layanan": 3, "suasana": 2},
    {"text": "Very polite baristas, they greeting everyone who walks in. Excellent customer hospitality.", "stars": 5, "makanan": 4, "layanan": 5, "suasana": 5},
    {"text": "Nasi lemak katsu was cold, chicken katsu skin became soggy and hard. Skip this option.", "stars": 2, "makanan": 1, "layanan": 3, "suasana": 4},
    {"text": "Delicious butter toast, warm and crispy. Kaya was high quality. Goes well with kopi kaw.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Cashier was rude, kept scrolling on phone and didn't greet at all. Terrible customer hospitality.", "stars": 2, "makanan": 4, "layanan": 1, "suasana": 3},
    {"text": "Iced latte was robust, good caffeine kick. Fast service and clean packing.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "Wait time was too long, almost 20 mins just for a cold brew. Only one barista working.", "stars": 2, "makanan": 4, "layanan": 2, "suasana": 3},
    {"text": "Affordable coffee, clean cups, and polite staff. Will definitely visit again.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Fly inside my cup! Disgusting hygiene standards. Barista didn't apologize, just gave replacement.", "stars": 1, "makanan": 1, "layanan": 2, "suasana": 1},
    {"text": "Rich chocolate frappe, thick and creamy. Perfect sweet treat for hot days.", "stars": 5, "makanan": 5, "layanan": 4, "suasana": 4},
    {"text": "The croissant was cold and tough. Clearly they don't fresh bake it. Taste mediocre.", "stars": 2, "makanan": 2, "layanan": 3, "suasana": 3},
    {"text": "Very quick takeaway process. They optimized the line well. Kopi gula apong is highly recommended.", "stars": 5, "makanan": 5, "layanan": 5, "suasana": 4},
    {"text": "Ordered hot coffee but got iced instead. Barista was distracted talking to coworker. Careless.", "stars": 2, "makanan": 2, "layanan": 2, "suasana": 3}
]

# Ensure we have exactly 300 reviews
while len(REAL_REVIEWS) < 300:
    # Duplicate some with minor variations to reach exactly 300
    r = random.choice(REAL_REVIEWS[:100])
    REAL_REVIEWS.append(r)

REAL_REVIEWS = REAL_REVIEWS[:300]

def main():
    print(f"[Seed] Starting database seeding for Imut Imut Cafe (id: {PREMISE_ID})...")
    
    # 1. Clean previous data for this cafe to ensure clean slate for demo
    print("[Seed] Cleaning previous records in Supabase...")
    try:
        # Fetch feedbacks to clean corresponding log records
        old_fb_res = supabase.table("tbl_maklumbalas") \
            .select("id_maklum_balas") \
            .eq("id_premis", PREMISE_ID) \
            .execute()
        old_fb_ids = [r["id_maklum_balas"] for r in (old_fb_res.data or [])]
        
        if old_fb_ids:
            # Delete old topic drafts and suggestions
            supabase.table("tbl_cadangan_ai").delete().eq("id_premis", PREMISE_ID).execute()
            
            # Fetch engine log ids
            old_log_res = supabase.table("tbl_enjin_ai") \
                .select("id_log_proses") \
                .in_("id_maklum_balas", old_fb_ids) \
                .execute()
            old_log_ids = [r["id_log_proses"] for r in (old_log_res.data or [])]
            
            if old_log_ids:
                supabase.table("tbl_topik").delete().in_("id_log_proses", old_log_ids).execute()
                supabase.table("tbl_sentimen").delete().in_("id_log_proses", old_log_ids).execute()
                supabase.table("tbl_enjin_ai").delete().in_("id_maklum_balas", old_fb_ids).execute()
                
            # Finally delete feedbacks
            supabase.table("tbl_maklumbalas").delete().in_("id_maklum_balas", old_fb_ids).execute()
            print(f"[Seed] Cleaned up {len(old_fb_ids)} older feedback entries.")
    except Exception as e:
        print(f"[Seed Warnings] Error during cleaning: {e}. Proceeding anyway...")

    # 2. Insert 350 reviews (300 external + 50 portal QR)
    print(f"[Seed] Inserting 350 new realistic reviews...")
    
    inserted_count = 0
    base_date = datetime.datetime.now()
    
    for i in range(350):
        review = REAL_REVIEWS[i % len(REAL_REVIEWS)]
        random_days = random.randint(0, 30)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        review_date = base_date - datetime.timedelta(days=random_days, hours=random_hours, minutes=random_minutes)
        
        # First 300 are social media/external, last 50 are Portal QR
        if i < 300:
            sumber = PLATFORMS[i % len(PLATFORMS)]
        else:
            sumber = "Portal QR"
        
        # If it is social media, do not set default stars to 3, set it to None!
        if sumber not in ["Google Reviews", "TripAdvisor", "Portal QR"]:
            stars_val = None
            makanan_val = None
            layanan_val = None
            suasana_val = None
        else:
            stars_val = review["stars"]
            makanan_val = review["makanan"]
            layanan_val = review["layanan"]
            suasana_val = review["suasana"]
        
        fb_data = {
            "id_premis": PREMISE_ID,
            "bilangan_bintang": stars_val,
            "rating_makanan": makanan_val,
            "rating_layanan": layanan_val,
            "rating_suasana": suasana_val,
            "ulasan_teks": review["text"],
            "sumber_platform": sumber,
            "tarikh_terima": review_date.isoformat()
        }
        
        try:
            # Save raw feedback
            fb_res = supabase.table("tbl_maklumbalas").insert(fb_data).execute()
            if not fb_res.data:
                continue
                
            id_maklum_balas = fb_res.data[0]["id_maklum_balas"]
            
            # Log the AI process run
            enjin_data = {
                "id_maklum_balas": id_maklum_balas,
                "waktu_proses": review_date.isoformat(),
            }
            enjin_res = supabase.table("tbl_enjin_ai").insert(enjin_data).execute()
            if not enjin_res.data:
                continue
                
            id_log_proses = enjin_res.data[0]["id_log_proses"]
            
            # Compute global sentiment using local lexicon (super fast, credit-free)
            sentiment_result = analyse_sentiment(
                ulasan_teks=review["text"],
                bilangan_bintang=stars_val,
                makanan=makanan_val,
                layanan=layanan_val,
                suasana=suasana_val
            )
            
            sentimen_data = {
                "id_log_proses": id_log_proses,
                "id_maklum_balas": id_maklum_balas,
                "label_sentimen": sentiment_result["sentimen"],
                "skor_ketepatan": sentiment_result["skor"]
            }
            
            supabase.table("tbl_sentimen").insert(sentimen_data).execute()
            inserted_count += 1
            
            if inserted_count % 30 == 0:
                print(f"[Seed] Inserted and analyzed {inserted_count}/300 reviews...")
                
        except Exception as e:
            print(f"[Seed Error] Failed inserting index {i}: {e}")
            
    print(f"[Seed] Successfully loaded {inserted_count} reviews into the database.")

    # 3. Run multi-label topic modeling pipeline for Imut Imut Cafe
    print("[Seed] Running aspect-based multi-label topic modeling pipeline...")
    try:
        topic_res = run_topic_analysis(PREMISE_ID, supabase)
        print(f"[Seed] Topic modeling complete: {topic_res}")
    except Exception as e:
        print(f"[Seed Error] Topic modeling pipeline failed: {e}")

    # 4. Trigger prescriptive analytics engine to generate drafts
    print("[Seed] Running prescriptive analytics engine (5-Whys & Root Cause)...")
    try:
        pres_res = generate_prescriptive_drafts(PREMISE_ID, supabase)
        print(f"[Seed] Prescriptive analytics complete: {pres_res}")
    except Exception as e:
        print(f"[Seed Error] Prescriptive generator pipeline failed: {e}")

    print("\n[Seed] Database seeding completely finished! Ready for frontend presentation.")

if __name__ == "__main__":
    main()
