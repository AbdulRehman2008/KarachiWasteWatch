"""
Citizen Assistant Comprehensive Knowledge Base for Karachi WasteWatch AI.
Contains structured civic operational knowledge with English, Roman Urdu, and Urdu coverage.
"""

KNOWLEDGE_DOCS = [
    {
        "id": "languages_supported",
        "title": "Languages Supported / زبانیں / Zaban",
        "category": "Languages",
        "keywords": "language languages urdu roman speak sindhi bol sakte zaban zuban english",
        "content_en": (
            "I support **English**, **Urdu (اردو)**, and **Roman Urdu** (and basic Sindhi). "
            "You can ask me questions about Karachi WasteWatch AI in any of these languages, "
            "and I will respond in the language of your choice."
        ),
        "content_ur": (
            "میں **انگلش**، **اردو (رسم الخط)**، اور **رومن اردو** میں مکمل رہنمائی فراہم کرتا ہوں۔ "
            "آپ مجھ سے کراچی ویسٹ واچ ایپ کے بارے میں ان میں سے کسی بھی زبان میں سوال پوچھ سکتے ہیں۔"
        ),
        "content_roman": (
            "Main **English**, **Urdu**, aur **Roman Urdu** (aur basic Sindhi) mein aap ki rehnumai kar sakta hoon. "
            "Aap Karachi WasteWatch AI ke hawale se in mein se kisi bhi zaban mein sawal pooch sakte hain."
        ),
    },
    {
        "id": "about_app",
        "title": "What is Karachi WasteWatch AI? / ایپ کا تعارف / App ka ta'aruf",
        "category": "General",
        "keywords": "about what is app wastewatch karachi purpose intro kya hai ye",
        "content_en": (
            "Karachi WasteWatch AI is an intelligent civic waste management platform tailored for Karachi's "
            "15+ million citizens. It allows citizens to take photos of street waste, detects garbage "
            "using computer vision (YOLO AI), creates official tracking complaints, and routes them to "
            "Sindh Solid Waste Management Board (SSWMB) municipal teams for cleanup."
        ),
        "content_ur": (
            "کراچی ویسٹ واچ اے آئی کراچی کے 1.5 کروڑ سے زائد شہریوں کے لیے بنایا گیا ایک سمارٹ بلدیاتی پورٹل ہے۔ "
            "اس کے ذریعے شہری گلی محلوں میں کچرے کی تصویر لے کر شکایت درج کر سکتے ہیں۔ اے آئی خودکار طریقے سے کچرے کا جائزہ "
            "لے کر سندھ سالڈ ویسٹ مینجمنٹ بورڈ (SSWMB) کے عملے کو صفائی کے لیے روانہ کرتی ہے۔"
        ),
        "content_roman": (
            "Karachi WasteWatch AI Karachi ke 1.5 crore se zyada shehriyon ke liye ek intelligent civic portal hai. "
            "Is ke zariye aap street garbage ki tasweer upload kar ke complaint darj kar sakte hain. AI automatically kachre ko "
            "detect karta hai aur SSWMB ki sanitation teams ko safai ke liye dispatch karta hai."
        ),
    },
    {
        "id": "citizen_id",
        "title": "Citizen ID & Account Sign-in / سٹیزن آئی ڈی / Citizen ID",
        "category": "Account",
        "keywords": "citizen id account login signup sign in registration cit number bhool gaye",
        "content_en": (
            "Every registered citizen receives a unique Citizen ID in the format 'CIT-XXXXX' (e.g., CIT-10001). "
            "You can sign in using either your Citizen ID or your registered email address. "
            "Your Citizen ID links all your reported complaints, notifications, and profile statistics."
        ),
        "content_ur": (
            "ہر رجسٹرڈ شہری کو ایک منفرد سٹیزن آئی ڈی دی جاتی ہے جیسے 'CIT-10001'۔ "
            "آپ لاگ ان کرنے کے لیے اپنی سٹیزن آئی ڈی یا ای میل دونوں میں سے کوئی بھی استعمال کر سکتے ہیں۔ "
            "آپ کی تمام درج شدہ شکایات اور نوٹیفیکیشنز اسی آئی ڈی سے منسلک ہوتی ہیں۔"
        ),
        "content_roman": (
            "Har registered citizen ko ek unique Citizen ID milti hai jaise 'CIT-10001'. "
            "Aap login karne ke liye apni Citizen ID ya registered email dono istemal kar sakte hain. "
            "Aap ki tamam complaints, status updates, aur notifications isi ID se juri hoti hain."
        ),
    },
    {
        "id": "how_to_report",
        "title": "How to Report Garbage / کچرا رپورٹ کرنے کا طریقہ / Kachra report kaise karein",
        "category": "Reporting",
        "keywords": "report kachra garbage photo upload submit complaint darj kaise karein tareeqa",
        "content_en": (
            "To report garbage: 1. Click 'Report Waste' from the navigation. 2. Step 1: Upload a photo of the waste and click 'Run AI Detection'. "
            "3. Step 2: Select your Karachi district (South, East, Central, Korangi, Keamari, Malir), add GPS coordinates or location description. "
            "4. Click 'Submit Report'. You will immediately receive a unique Report ID (e.g., RPT-KHI-XXXXX) for official tracking."
        ),
        "content_ur": (
            "کچرا رپورٹ کرنے کا آسان طریقہ: 1. مینو سے 'Report Waste' منتخب کریں۔ 2. مرحلہ 1: کچرے کی تصویر اپ لوڈ کریں اور 'Run AI Detection' پر کلک کریں۔ "
            "3. مرحلہ 2: اپنا ضلع منتخب کریں (جیسے ڈسٹرکٹ ساؤتھ، ایسٹ، سینٹرل وغیرہ)، مقام یا جی پی ایس دیں اور تفصیل لکھیں۔ "
            "4. 'Submit Report' دبائیں۔ آپ کو فوراً باقاعدہ رپورٹ آئی ڈی (جیسے RPT-KHI-XXXXX) مل جائے گی۔"
        ),
        "content_roman": (
            "Kachra report karne ka tareeqa: 1. Navigation se 'Report Waste' par click karein. 2. Step 1: Kachre ki photo upload karein aur 'Run AI Detection' chalayein. "
            "3. Step 2: Apna Karachi district select karein (South, East, Central, Korangi, Keamari, Malir), location/GPS darj karein. "
            "4. 'Submit Report' dabayein. Aap ko foran Report ID (jaise RPT-KHI-XXXXX) mil jayegi jise aap track kar sakte hain."
        ),
    },
    {
        "id": "ai_detection",
        "title": "AI Waste Scanner & Models / اے آئی اسکینر کیسے کام کرتا ہے / AI Scanner kaise chalta hai",
        "category": "AI",
        "keywords": "ai scanner detection yolo model vision severity probability recyclability machine learning kaam kaise",
        "content_en": (
            "Our AI system uses a multi-tier pipeline: 1. Computer Vision Quality Inspector (checks sharpness and illumination). "
            "2. YOLO11 deep neural network detecting individual garbage objects and ground coverage %. "
            "3. Gradient Boosting ML Classifier predicting complaint severity (Low, Medium, High, Critical) with explainable factors. "
            "4. Recyclability & Carbon Engine calculating recyclability %, hazard rating, and estimated kg CO2 savings."
        ),
        "content_ur": (
            "ہمارا اے آئی سسٹم جدید ماڈلز پر کام کرتا ہے: 1. کمپیوٹر ویژن تصویر کا معیار اور صفائی جانچتا ہے۔ "
            "2. YOLO11 نیورل نیٹ ورک کچرے کی اشیاء اور رقبہ معلوم کرتا ہے۔ "
            "3. گریڈینٹ بوسٹنگ ایم ایل ماڈل کچرے کی سنگینی (Low, Medium, High, Critical) کے امکانات کا تعین کرتا ہے۔ "
            "4. ری سائیکلنگ انجن ری سائیکل ہونے والے کچرے اور ماحولیاتی کاربن بچت کا حساب لگاتا ہے۔"
        ),
        "content_roman": (
            "Hamara AI system 4 advanced models par mushtamil hai: 1. Computer Vision Image Quality check karta hai. "
            "2. YOLO11 neural network garbage items aur area coverage % detect karta hai. "
            "3. Gradient Boosting ML model complaint ki severity (Low, Medium, High, Critical) predict karta hai. "
            "4. Recyclability engine batata hai ke kitna kachra recycle ho sakta hai aur kitni carbon CO2 bachegi."
        ),
    },
    {
        "id": "report_statuses",
        "title": "Report Status Meanings / شکایات کی اسٹیٹس کا مطلب / Report status ka matlab",
        "category": "Status",
        "keywords": "status pending verified in progress resolved rejected duplicate stages matlab kya hai",
        "content_en": (
            "Reports progress through 4 primary lifecycle stages: "
            "1. 'Pending': Complaint logged, awaiting administrative review. "
            "2. 'Verified': Admin or AI validated the photo and genuine waste site. "
            "3. 'In Progress': Municipal sanitation team and compactor truck dispatched for physical cleaning. "
            "4. 'Resolved': Site cleaned, after-cleanup photo verified by AI with >70% waste reduction."
        ),
        "content_ur": (
            "شکایات کے 4 مراحل ہوتے ہیں: "
            "1. 'Pending': شکایت موصول ہو چکی ہے اور جائزے کی منتظر ہے۔ "
            "2. 'Verified': تصویر اور مقام کی تصدیق کر لی گئی ہے کہ وہاں کچرا موجود ہے۔ "
            "3. 'In Progress': بلدیاتی عملہ اور گاڑی کچرا اٹھانے کے لیے روانہ ہو چکی ہے۔ "
            "4. 'Resolved': کچرا صاف کر دیا گیا ہے اور بعد کی تصویر نے اے آئی سے صفائی کی تصدیق کر دی ہے۔"
        ),
        "content_roman": (
            "Complaint ke 4 ahem status hotay hain: "
            "1. 'Pending': Complaint darj ho chuki hai aur admin ke jaize ki muntazir hai. "
            "2. 'Verified': Tasweer aur jagah ki tasdeeq ho gayi hai ke waqai kachra mojood hai. "
            "3. 'In Progress': Municipal team aur gaari safai karne ke liye rawana ho chuki hai. "
            "4. 'Resolved': Kachra saaf ho chuka hai aur AI ne safai ki mukammal tasdeeq kar di hai."
        ),
    },
    {
        "id": "tracking_reports",
        "title": "How to Track My Complaints / شکایات ٹریک کرنا / Complaints kaise track karein",
        "category": "Tracking",
        "keywords": "track my reports history audit status updates dekhna kahan",
        "content_en": (
            "Navigate to 'My Reports' in the citizen menu. Click on any complaint card to view its complete audit history, "
            "timestamped status changes, assigned municipal team, and before/after verification photos. "
            "You also receive automated notifications whenever your report status changes."
        ),
        "content_ur": (
            "اپنی شکایات دیکھنے کے لیے 'My Reports' سیکشن میں جائیں۔ کسی بھی رپورٹ پر کلک کر کے آپ اس کی مکمل تاریخ، "
            "موجودہ اسٹیٹس، تعینات عملے کا نام اور نوٹس دیکھ سکتے ہیں۔ اسٹیٹس تبدیل ہونے پر آپ کے ڈیش بورڈ پر نوٹیفیکیشن بھی موصول ہوتا ہے۔"
        ),
        "content_roman": (
            "Apni complaints track karne ke liye 'My Reports' menu mein jayein. Kisi bhi complaint par click kar ke aap "
            "mukammal timeline, assigned municipal team, aur status changes dekh sakte hain. "
            "Jab bhi status update hoga, aap ko dashboard par notification bhi mil jayega."
        ),
    },
    {
        "id": "waste_map",
        "title": "Waste Map & Hotspots / ویسٹ میپ اور ہاٹ اسپاٹس / Waste map aur hotspots",
        "category": "Map",
        "keywords": "map waste map hotspots location red circle points karachi kahan",
        "content_en": (
            "The Waste Map is an interactive GIS view of Karachi. For citizens, 'My Map' shows all your reported locations "
            "and highlights your most active reporting area with a red perimeter ring. Administrators have access to "
            "the DBSCAN Hotspot map displaying recurring waste clusters across all Karachi sectors."
        ),
        "content_ur": (
            "ویسٹ میپ کراچی کا ایک انٹرایکٹو نقشہ ہے۔ شہریوں کے لیے 'My Map' ان کی رپورٹ کردہ تمام جگہیں دکھاتا ہے "
            "اور سب سے زیادہ کچرے والے علاقے کو سرخ دائرے سے نمایاں کرتا ہے۔ ایڈمن پورٹل میں ڈی بی اسکین کلسٹرنگ سے "
            "پورے شہر کے بڑے ہاٹ اسپاٹس ظاہر ہوتے ہیں۔"
        ),
        "content_roman": (
            "Waste Map Karachi ka live OpenStreetMap hai. Citizens ke liye 'My Map' un ki tamam report ki hui jaghein dikhata hai "
            "aur sab se active area ko red circle se highlight karta hai. Admins ke liye machine learning DBSCAN map par "
            "tamam recurring problem zones dikhata hai."
        ),
    },
    {
        "id": "districts_covered",
        "title": "Supported Karachi Districts / کور کیے گئے اضلاع / Karachi ke kon se ilaqay",
        "category": "Coverage",
        "keywords": "districts karachi coverage saddar clifton gulshan nazimabad korangi keamari malir ilaqay",
        "content_en": (
            "Karachi WasteWatch AI covers all 6 administrative municipal districts of Karachi: "
            "1. District South (Saddar, Clifton, DHA, Lyari) "
            "2. District East (Gulshan-e-Iqbal, Gulistan-e-Johar, Jamshed, PECHS) "
            "3. District Central (Nazimabad, North Nazimabad, Liaquatabad, Federal B Area) "
            "4. District Korangi (Korangi, Landhi, Shah Faisal) "
            "5. District Keamari (Keamari, SITE, Baldia) "
            "6. District Malir (Bin Qasim, Gadap, Malir)."
        ),
        "content_ur": (
            "کراچی ویسٹ واچ اے آئی کراچی کے تمام 6 اضلاع کو کور کرتا ہے: "
            "1. ڈسٹرکٹ ساؤتھ (صدر، کلفٹن، ڈی ایچ اے، لیاری) "
            "2. ڈسٹرکٹ ایسٹ (گلشنِ اقبال، گلستانِ جوہر، پی ای سی ایچ ایس) "
            "3. ڈسٹرکٹ سینٹرل (ناظم آباد، نارتھ ناظم آباد، لیاقت آباد) "
            "4. ڈسٹرکٹ کورنگی (کورنگی، لانڈھی، شاہ فیصل) "
            "5. ڈسٹرکٹ کیماڑی (کیماڑی، سائٹ، بلدیہ) "
            "6. ڈسٹرکٹ ملیر (ملیر، بن قاسم، گڈاپ)۔"
        ),
        "content_roman": (
            "Karachi WasteWatch AI tamam 6 districts ko cover karta hai: "
            "District South (Saddar, Clifton, DHA), District East (Gulshan, Johar, PECHS), "
            "District Central (Nazimabad, North Nazimabad, Liaquatabad), District Korangi, "
            "District Keamari, aur District Malir."
        ),
    },
    {
        "id": "cleanup_verification",
        "title": "Cleanup Verification & AI Comparison / صفائی کی تصدیق / Cleanup verification kaise hoti hai",
        "category": "Verification",
        "keywords": "verification cleanup after photo clean saaf tasdeeq kaise",
        "content_en": (
            "Once municipal workers clear a reported site, supervisors upload an 'after-cleanup' photo. "
            "Our AI compares before-and-after garbage object counts and area coverage. If waste reduction "
            "is >=70% or area coverage is negligible (<=5%), the AI marks it 'Verified Clean' and status transitions to 'Resolved'."
        ),
        "content_ur": (
            "جب صفائی کا عملہ کچرا اٹھا لیتا ہے تو سپروائزر صفائی کے بعد کی تصویر اپ لوڈ کرتا ہے۔ "
            "ہمارا اے آئی سسٹم پرانی اور نئی تصویر کا موازنہ کرتا ہے۔ اگر کچرے میں 70 فیصد سے زائد کمی ہو "
            "تو سسٹم اسے 'Verified Clean' قرار دے کر رپورٹ کو 'Resolved' اسٹیٹس میں منتقل کر دیتا ہے۔"
        ),
        "content_roman": (
            "Jab sanitation crew kachra saaf kar leta hai to supervisor safai ke baad ki photo upload karta hai. "
            "AI pehli aur baad ki photo ka computer vision comparison karta hai. Agar 70% se zyada kachra saaf ho chuka ho "
            "to AI 'Verified Clean' ka verdict deta hai aur complaint 'Resolved' ho jati hai."
        ),
    },
    {
        "id": "duplicate_detection",
        "title": "Duplicate Report Prevention / بار بار رپورٹ کرنا / Duplicate complaint",
        "category": "Reporting",
        "keywords": "duplicate dobara same location 50 meters aik jaisi complaint",
        "content_en": (
            "To prevent redundant sanitation dispatches, our Haversine geospatial proximity algorithm "
            "checks whether an active complaint was filed within 75 meters in the last 48 hours. "
            "If detected, it links the complaint as a duplicate community alert without sending double trucks."
        ),
        "content_ur": (
            "وسائل کے ضیاع کو روکنے کے لیے ہمارا جیو اسپیشل الگورتھم خودکار طریقے سے دیکھتا ہے کہ آیا 75 میٹر کے دائرے میں "
            "گزشتہ 48 گھنٹوں کے دوران اسی کچرے کی شکایت درج ہو چکی ہے۔ اگر ایسا ہو تو اسے ڈپلیکیٹ کے طور پر لنک کر لیا جاتا ہے۔"
        ),
        "content_ur": (
            "Aik hi jagah par baar baar gaariyan bhejne se bachne ke liye hamara system 75 meters aur 48 hours ke andar "
            "aane wali complaints ko duplicate check karta hai aur unhe aapas mein link kar deta hai."
        ),
        "content_roman": (
            "Aik hi jagah par baar baar gaariyan bhejne se bachne ke liye hamara Haversine algorithm 75 meters aur 48 hours ke andar "
            "aane wali complaints ko check karta hai aur unhe duplicate alert ke tor par link kar deta hai."
        ),
    },
]
