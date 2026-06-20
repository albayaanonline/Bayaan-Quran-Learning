// Nawawi 40 Hadith — Lessons 3–40 (lessons 1–2 exist in arabic-lessons.ts)
// All hadith texts are authentic, from Bukhari, Muslim, Tirmidhi, and other collections.

export const nawawi40Data = [
  { bookId:"hadith-arbaeen-nawawi", lessonNum:3, title:"Hadith 3 — The Five Pillars of Islam", titleArabic:"الحَدِيثُ الثَّالِث: أَرْكَانُ الإِسْلَامِ الخَمْسَة",
    description:"Islam is built on five pillars. This hadith defines the structural foundation of every Muslim's practice.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عُمَرَ رَضِيَ اللهُ عَنْهُمَا قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ:\nشَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ،\nوَإِقَامِ الصَّلَاةِ،\nوَإِيتَاءِ الزَّكَاةِ،\nوَحَجِّ البَيْتِ،\nوَصَوْمِ رَمَضَانَ»\n[البُخَارِيّ ٨ — مُسْلِم ١٦]",
        translation:"On the authority of Ibn Umar RA: The Prophet ﷺ said: 'Islam is built on five: bearing witness there is no god but Allah and Muhammad is His Messenger, establishing prayer, giving zakah, performing Hajj of the House, and fasting Ramadan.' [Bukhari 8, Muslim 16]",
        transliteration:"Buniya l-islāmu ʿalā khams: shahādati an lā ilāha illā llāhu wa anna muḥammadan rasūlu llāh, wa iqāmi ṣ-ṣalāh, wa ītāʾi z-zakāh, wa ḥajji l-bayt, wa ṣawmi ramaḍān.",
        note:"بُنِيَ (passive: 'was built') — the building metaphor is intentional: remove a pillar and the structure collapses. The 5 pillars are mutually supportive." },
      { id:2, arabic:"الشَّرْح:\n١. الشَّهَادَة — أَسَاسُ الإِسْلَام: الاعْتِرَافُ بِالتَّوْحِيد وَالرِّسَالَة (بِاللِّسَانِ وَالقَلْبِ)\n٢. الصَّلَاة — الصِّلَةُ المُبَاشِرَة بِاللهِ — خَمْسُ مَرَّاتٍ يَوْمِيًّا\n٣. الزَّكَاة — تَطْهِيرُ المَالِ وَسَدُّ حَاجَةِ الفُقَرَاء\n٤. الحَجّ — اجْتِمَاعُ الأُمَّة عِنْدَ البَيْتِ الحَرَام — مَرَّةً فِي العُمُر (لِلمُسْتَطِيع)\n٥. الصَّوْم — تَزْكِيَةُ النَّفْسِ وَضَبْطُ الشَّهَوَات",
        translation:"Explanation:\n1. Shahada — The foundation: testifying Tawhid and Prophethood (tongue + heart)\n2. Salah — Direct connection with Allah — 5 times daily\n3. Zakah — Purifying wealth and meeting the poor's needs\n4. Hajj — The Ummah gathering at the Sacred House — once in a lifetime (for those able)\n5. Sawm — Purifying the soul and controlling desires",
        transliteration:"Sharḥ al-arkān al-khamsah.",
        note:"Why is Hajj before Sawm in this hadith? — In Arabic style (waaw does not require order). Both orders are mentioned in various narrations." }
    ],
    vocabulary:[
      { arabic:"بُنِيَ", transliteration:"buniya", english:"was built (passive)", pos:"verb (passive past)" },
      { arabic:"خَمْس", transliteration:"khams", english:"five", pos:"number" },
      { arabic:"شَهَادَة", transliteration:"shahādah", english:"testimony / bearing witness", pos:"noun (f)" },
      { arabic:"إِقَامَة", transliteration:"iqāmah", english:"establishing / maintaining", pos:"noun (f)" },
      { arabic:"إِيتَاء", transliteration:"ītāʾ", english:"giving / rendering", pos:"noun (m)" },
      { arabic:"مُسْتَطِيع", transliteration:"mustaṭīʿ", english:"one who is able / capable", pos:"adjective" },
    ],
    grammar:{ title:"Passive Voice — بُنِيَ", titleArabic:"الفِعْلُ المَبْنِيُّ لِلْمَجْهُول",
      explanation:"بُنِيَ is the passive of بَنَى (to build). In Arabic, the passive is formed by changing the vowel pattern:\n• Active: بَنَى (banā) — he built\n• Passive: بُنِيَ (buniya) — was built\n\nWhy use passive here? To emphasize the BUILDING itself, not the builder. The architecture of Islam matters, not who designed it.",
      examples:[{ arabic:"بُنِيَ البَيْتُ فِي يَوْم", translation:"The house was built in one day" },{ arabic:"كُتِبَ الكِتَابُ", translation:"The book was written" }] },
    exercises:[{ type:"choose", instruction:"About the Five Pillars.", instructionArabic:"أَجِبْ عَنْ أَرْكَانِ الإِسْلَام.",
      items:[
        { question:"How many pillars of Islam are in this hadith?", options:["Three","Four","Five","Six"], answer:2 },
        { question:"Which pillar is the FIRST mentioned?", options:["Salah","Hajj","Shahada","Zakah"], answer:2 },
        { question:"Hajj is obligatory:", options:["Every year","Once in a lifetime for the able","Twice in a lifetime","Only for men"], answer:1 }
      ], answers:[2,2,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:4, title:"Hadith 4 — Creation in the Womb & Divine Decree", titleArabic:"الحَدِيثُ الرَّابِع: خَلْقُ الإِنْسَانِ وَالقَدَر",
    description:"The stages of human creation and the writing of destiny — one of Islam's most profound teachings on Qadar.",
    pages:[
      { id:1, arabic:"عَنْ عَبْدِ اللهِ بْنِ مَسْعُودٍ رَضِيَ اللهُ عَنْهُ قَالَ: حَدَّثَنَا رَسُولُ اللهِ ﷺ وَهُوَ الصَّادِقُ المَصْدُوق:\n«إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا نُطْفَةً، ثُمَّ يَكُونُ عَلَقَةً مِثْلَ ذَلِكَ، ثُمَّ يَكُونُ مُضْغَةً مِثْلَ ذَلِكَ، ثُمَّ يُرْسَلُ إِلَيْهِ المَلَكُ فَيَنْفُخُ فِيهِ الرُّوحَ، وَيُؤْمَرُ بِأَرْبَعِ كَلِمَاتٍ: بِكَتْبِ رِزْقِهِ وَأَجَلِهِ وَعَمَلِهِ وَشَقِيٌّ أَوْ سَعِيد»\n[البُخَارِيّ ٣٢٠٨ — مُسْلِم ٢٦٤٣]",
        translation:"On the authority of Ibn Mas'ud RA: The Messenger of Allah ﷺ — the truthful and trusted — said: 'Each of you is assembled in the womb for 40 days as a drop of fluid (nutfah), then as a clinging clot (alaqah) for the same, then as a lump of flesh (mudghah) for the same. Then an angel is sent and blows the soul into him, commanded to write four things: his provision (rizq), his term (ajal), his deeds (amal), and whether he will be wretched or happy.' [Bukhari 3208, Muslim 2643]",
        transliteration:"Inna aḥadakum yujmaʿu khalquhu fī baṭni ummihi arbaʿīna yawman nuṭfatan...",
        note:"الصَّادِق المَصْدُوق (the truthful one who is confirmed truthful) — Ibn Mas'ud's introduction emphasizes certainty of this report. The Prophet speaks of the unseen by divine revelation." },
      { id:2, arabic:"الأَرْبَعُ مَكْتُوبَات:\n١. الرِّزْق — مَا قَسَمَهُ اللهُ مِنَ المَالِ وَالصِّحَّةِ\n٢. الأَجَل — وَقْتُ الوَفَاة المُحَدَّد\n٣. العَمَل — مَا سَيَعْمَلُهُ فِي حَيَاتِه\n٤. الشَّقَاوَة أَوِ السَّعَادَة — مَصِيرُهُ النِّهَائِيّ\n\nهَذَا لَا يَعْنِي الجَبْر! الإِنْسَانُ مُخْتَار وَمَسْؤُول.\nقَالَ رَسُولُ اللهِ ﷺ: «اعْمَلُوا فَكُلٌّ مُيَسَّرٌ لِمَا خُلِقَ لَهُ»",
        translation:"The Four Things Written:\n1. Rizq — what Allah apportioned of wealth and health\n2. Ajal — the exact time of death\n3. Amal — what he will do in his life\n4. Wretched or happy — his ultimate destiny\n\nThis does NOT mean fatalism! The human has choice and responsibility.\nProphet ﷺ said: 'Act, for everyone is facilitated towards what he was created for.'",
        transliteration:"Al-arbaʿu l-maktūbāt: ar-rizq, al-ajal, al-ʿamal, ash-shaqāwah aw as-saʿādah.",
        note:"The answer to the apparent paradox: Allah's knowledge of our choices does not CAUSE those choices. His knowledge is like a video of the future — He knows what we'll freely choose." }
    ],
    vocabulary:[
      { arabic:"نُطْفَة", transliteration:"nuṭfah", english:"drop of fluid (first stage)", pos:"noun (f)" },
      { arabic:"عَلَقَة", transliteration:"ʿalaqah", english:"clinging clot (second stage)", pos:"noun (f)" },
      { arabic:"مُضْغَة", transliteration:"mudghah", english:"lump of flesh (third stage)", pos:"noun (f)" },
      { arabic:"رُوح", transliteration:"rūḥ", english:"soul / spirit", pos:"noun (f)" },
      { arabic:"رِزْق", transliteration:"rizq", english:"provision / sustenance", pos:"noun (m)" },
      { arabic:"أَجَل", transliteration:"ajal", english:"appointed term / time of death", pos:"noun (m)" },
      { arabic:"شَقِيّ / سَعِيد", transliteration:"shaqiyy / saʿīd", english:"wretched / happy (in Hereafter)", pos:"adjective" },
    ],
    grammar:{ title:"ثُمَّ — Sequential Conjunction", titleArabic:"ثُمَّ — حَرْفُ التَّرَاخِي",
      explanation:"ثُمَّ connects events with TIME between them (unlike وَ which just lists):\n• نُطْفَة — (40 days) → ثُمَّ عَلَقَة — (40 days) → ثُمَّ مُضْغَة — (40 days)\n\nTotal: 120 days before the soul is breathed in.\n\nثُمَّ vs. فَ:\n• فَ = immediate sequence (then immediately)\n• ثُمَّ = delayed sequence (then, after some time)",
      examples:[{ arabic:"دَرَسَ ثُمَّ نَامَ", translation:"He studied, then (after a while) slept" },{ arabic:"أَكَلَ فَشَرِبَ", translation:"He ate and immediately drank" }] },
    exercises:[{ type:"choose", instruction:"About Hadith 4 — Creation and Decree.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الرَّابِع.",
      items:[
        { question:"How long does each stage of creation last?", options:["10 days","20 days","40 days","90 days"], answer:2 },
        { question:"Who blows the soul into the fetus?", options:["Allah directly","Jibreel","An angel (sent by Allah)","The mother"], answer:2 },
        { question:"How many things does the angel write?", options:["Two","Three","Four","Five"], answer:2 }
      ], answers:[2,2,2] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:5, title:"Hadith 5 — Every Innovation is Rejected", titleArabic:"الحَدِيثُ الخَامِس: كُلُّ بِدْعَةٍ ضَلَالَة",
    description:"The prophetic standard for authentic practice — only what aligns with the Prophet's example is accepted.",
    pages:[
      { id:1, arabic:"عَنْ أُمِّ المُؤْمِنِينَ أُمِّ عَبْدِ اللهِ عَائِشَة رَضِيَ اللهُ عَنْهَا قَالَتْ: قَالَ رَسُولُ اللهِ ﷺ:\n«مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ»\n[البُخَارِيّ ٢٦٩٧ — مُسْلِم ١٧١٨]\n\nوَفِي رِوَايَةٍ لِمُسْلِم:\n«مَنْ عَمِلَ عَمَلًا لَيْسَ عَلَيْهِ أَمْرُنَا فَهُوَ رَدٌّ»",
        translation:"On the authority of Aisha RA: The Messenger ﷺ said: 'Whoever introduces into this affair of ours something that is not from it, it is rejected.' [Bukhari 2697, Muslim 1718]\n\nIn Muslim's version: 'Whoever performs a deed that is not in accordance with our affair — it is rejected.'",
        transliteration:"Man aḥdatha fī amrinā hādhā mā laysa minhu fahuwa radd.",
        note:"رَدٌّ = refused/rejected — as one returns a defective product. The second narration is EVEN STRONGER: covers even existing practices done WRONGLY." },
      { id:2, arabic:"تَعْرِيفُ البِدْعَة:\nالبِدْعَةُ: كُلُّ مُحْدَثٍ فِي الدِّينِ لَيْسَ لَهُ أَصْلٌ فِي الشَّرِيعَة.\n\nمَا لَيْسَ بِدْعَة:\n• العَادَاتُ الدُّنْيَوِيَّة (السَّيَّارَة، الكَمْبيُوتَر، المَيْكرُوفُون)\n• الاجْتِهَادُ فِي مَسَائِلَ لَهَا أَصْل\n\nأَمْثِلَةُ البِدْعَة:\n• الاحْتِفَالُ بِالمَوْلِدِ بِطُرُقٍ مُعَيَّنَة لَيْسَ لَهَا أَصْل\n• اخْتِرَاعُ صِيَغٍ جَدِيدَةٍ لِلأَذْكَار\n• تَحْدِيدُ عِبَادَاتٍ بِأَوْقَاتٍ لَمْ يُحَدِّدْهَا الشَّرْع",
        translation:"Definition of Bid'ah:\nBid'ah: Any newly invented matter in religion that has no basis in Sharia.\n\nWhat is NOT Bid'ah:\n• Worldly customs (cars, computers, microphones)\n• Ijtihad on issues that have a foundation\n\nExamples of Bid'ah:\n• Celebrating Mawlid in specific uninstituted ways\n• Inventing new forms of adhkar\n• Specifying acts of worship to times the Sharia didn't specify",
        transliteration:"Taʿrīfu l-bidʿah wa mā laysa bidʿah.",
        note:"The great scholars distinguish: المَصَالِح المُرْسَلَة (general interests) are NOT bid'ah — they are tools serving existing principles. E.g., collecting Quran into one book — this was a tool, not a new act of worship." }
    ],
    vocabulary:[
      { arabic:"أَحْدَثَ", transliteration:"aḥdatha", english:"introduced / invented (something new)", pos:"verb (past)" },
      { arabic:"أَمْر", transliteration:"amr", english:"affair / matter (here: religion)", pos:"noun (m)" },
      { arabic:"رَدّ", transliteration:"radd", english:"rejected / returned / refused", pos:"adjective/noun" },
      { arabic:"بِدْعَة", transliteration:"bidʿah", english:"innovation (in religion)", pos:"noun (f)", plural:"بِدَع" },
      { arabic:"مُحْدَث", transliteration:"muḥdath", english:"newly invented / introduced matter", pos:"adjective" },
      { arabic:"أَصْل", transliteration:"aṣl", english:"foundation / root / basis", pos:"noun (m)", plural:"أُصُول" },
    ],
    grammar:{ title:"مَنْ الشَّرْطِيَّة — Conditional Who", titleArabic:"مَنْ الشَّرْطِيَّة",
      explanation:"«مَنْ أَحْدَثَ... فَهُوَ رَدٌّ» — مَنْ here is a conditional particle meaning 'whoever':\n\nPattern: مَنْ + verb (past) + فَ + result\n• مَنْ عَمِلَ خَيْرًا فَلَهُ أَجْر = Whoever does good, has reward\n• مَنْ صَبَرَ فَاللهُ مَعَهُ = Whoever is patient, Allah is with them\n\nThe فَ in the result (جَوَاب الشَّرْط) is required when the condition uses مَنْ.",
      examples:[{ arabic:"مَنْ أَحْدَثَ فِي أَمْرِنَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ", translation:"Whoever introduces what is not from our affair — it is rejected" }] },
    exercises:[{ type:"choose", instruction:"Hadith 5 — Understanding Bid'ah.", instructionArabic:"فَهْمُ الحَدِيثِ الخَامِس.",
      items:[
        { question:"What does 'radd' (رَدٌّ) mean in this hadith?", options:["Answer","Rejected","Result","Permission"], answer:1 },
        { question:"Is using a microphone in the masjid considered bid'ah?", options:["Yes, it's a new thing","No, it's a worldly tool serving an existing worship","Yes, it changed prayer","Depends on the madhhab"], answer:1 },
        { question:"The second Muslim narration is more comprehensive because:", options:["It covers existing practices done wrongly","It allows more things","It only covers innovations","It is longer"], answer:0 }
      ], answers:[1,1,0] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:6, title:"Hadith 6 — Halal, Haram & the Doubtful", titleArabic:"الحَدِيثُ السَّادِس: الحَلَالُ بَيِّنٌ وَالحَرَامُ بَيِّن",
    description:"The foundational ethical principle for everyday Muslim decisions — navigating the clear and the ambiguous.",
    pages:[
      { id:1, arabic:"عَنِ النُّعْمَانِ بْنِ بَشِيرٍ رَضِيَ اللهُ عَنْهُمَا قَالَ: سَمِعْتُ رَسُولَ اللهِ ﷺ يَقُولُ:\n«إِنَّ الحَلَالَ بَيِّنٌ وَإِنَّ الحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ، وَمَنْ وَقَعَ فِي الشُّبُهَاتِ وَقَعَ فِي الحَرَامِ كَالرَّاعِي يَرْعَى حَوْلَ الحِمَى يُوشِكُ أَنْ يَرْتَعَ فِيهِ. أَلَا وَإِنَّ لِكُلِّ مَلِكٍ حِمًى أَلَا وَإِنَّ حِمَى اللهِ مَحَارِمُهُ»\n[البُخَارِيّ ٥٢ — مُسْلِم ١٥٩٩]",
        translation:"'The halal is clear and the haram is clear. Between them are doubtful matters that many people do not know. Whoever avoids the doubtful preserves their religion and honor. Whoever falls into the doubtful falls into the haram — like a shepherd grazing near a protected area who is likely to enter it. Every king has a protected area — and Allah's protected area is His prohibitions.' [Bukhari 52, Muslim 1599]",
        transliteration:"Inna l-ḥalāla bayyinun wa inna l-ḥarāma bayyinun...",
        note:"Three zones: Clear Halal / Clear Haram / Doubtful (Shubuhāt). Most fiqh disputes are in the third zone. The shepherd analogy is powerful: proximity to forbidden = danger." },
      { id:2, arabic:"الثَّلَاثَةُ الأَقْسَام:\n١. الحَلَالُ البَيِّن: كُلُّ مَا أَذِنَ بِهِ الشَّرْع صَرَاحَةً (الزِّوَاج، التِّجَارَة المَشْرُوعَة...)\n٢. الحَرَامُ البَيِّن: كُلُّ مَا نَهَى عَنْهُ الشَّرْع صَرَاحَةً (الخَمْر، الزِّنَا، الرِّبَا...)\n٣. المُشْتَبِهَات: مَا لَمْ يَتَّضِحْ حُكْمُهُ — فِيهِ اجْتِهَادٌ بَيْنَ العُلَمَاء\n\nالوَرَع = تَرْكُ الحَلَالِ خَشْيَةَ الوُقُوعِ فِي الحَرَام\n«دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ»",
        translation:"The Three Categories:\n1. Clear Halal: Everything Sharia explicitly permitted (marriage, lawful trade...)\n2. Clear Haram: Everything Sharia explicitly prohibited (alcohol, fornication, riba...)\n3. Doubtful: What's not clear — subject to scholarly ijtihad\n\nWaraʿ = leaving even the halal out of fear of falling into haram.\n'Leave what gives you doubt for what gives you no doubt.'",
        transliteration:"Ath-thalāthat al-aqsām: al-ḥalāl al-bayyīn, al-ḥarām al-bayyīn, al-mushtabahāt.",
        note:"اسْتَبْرَأَ = 'cleared himself' — used for verifying livestock are not pregnant. Here: verify your religion is free from contamination." }
    ],
    vocabulary:[
      { arabic:"بَيِّن", transliteration:"bayyīn", english:"clear / manifest / obvious", pos:"adjective" },
      { arabic:"مُشْتَبِهَات", transliteration:"mushtabahāt", english:"doubtful matters / ambiguities", pos:"noun (f.pl)" },
      { arabic:"اتَّقَى", transliteration:"ittaqā", english:"avoided / was wary of", pos:"verb (past)" },
      { arabic:"اسْتَبْرَأَ", transliteration:"istabraʾa", english:"cleared himself / verified purity", pos:"verb (past)" },
      { arabic:"حِمَى", transliteration:"ḥimā", english:"protected area / sanctuary", pos:"noun (m)" },
      { arabic:"رَاعِي", transliteration:"rāʿī", english:"shepherd / herdsman", pos:"noun (m)" },
    ],
    grammar:{ title:"Comparison — كَ (Like)", titleArabic:"التَّشْبِيه بِكَاف التَّشْبِيه",
      explanation:"كَالرَّاعِي = like the shepherd. The كَ of comparison (كَاف التَّشْبِيه) compares two things:\n• كَالرَّاعِي = like a shepherd\n• كَالأَسَد = like a lion\n\nThis is one of the Quran and Hadith's most effective teaching tools — the Prophet ﷺ used concrete analogies to make abstract rulings immediately understandable.\n\nThe shepherd analogy teaches: small compromises lead to big violations. Stay away from the boundary.",
      examples:[{ arabic:"كَالرَّاعِي يَرْعَى حَوْلَ الحِمَى يُوشِكُ أَنْ يَرْتَعَ فِيهِ", translation:"Like a shepherd grazing near a protected area who is likely to enter it" }] },
    exercises:[{ type:"choose", instruction:"Hadith 6 — Halal and Haram.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّادِس.",
      items:[
        { question:"According to the hadith, doubtful matters:", options:["Are all halal","Are all haram","Are between clear halal and clear haram","Don't exist"], answer:2 },
        { question:"Whoever falls into doubtful matters:", options:["Gains extra reward","Is in danger of falling into haram","Is safe if they pray","Has no issue"], answer:1 },
        { question:"What does 'Allah's protected area' mean?", options:["The Ka'bah","His prohibitions","Makkah","Angels' realm"], answer:1 }
      ], answers:[2,1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:7, title:"Hadith 7 — Religion is Sincere Counsel (Nasihah)", titleArabic:"الحَدِيثُ السَّابِع: الدِّينُ النَّصِيحَة",
    description:"The entire religion can be summarized as sincere counsel and goodwill — to Allah, His Book, His Messenger, leaders, and the Muslim community.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي رُقَيَّةَ تَمِيمِ بْنِ أَوْسٍ الدَّارِيِّ رَضِيَ اللهُ عَنْهُ أَنَّ النَّبِيَّ ﷺ قَالَ:\n«الدِّينُ النَّصِيحَةُ»\nقُلْنَا: لِمَنْ؟\nقَالَ: «للهِ، وَلِكِتَابِهِ، وَلِرَسُولِهِ، وَلِأَئِمَّةِ المُسْلِمِينَ، وَعَامَّتِهِمْ»\n[مُسْلِم ٥٥]",
        translation:"On the authority of Tamim ibn Aws al-Dari RA: The Prophet ﷺ said: 'Religion is sincere counsel (nasihah).' We asked: For whom? He said: 'For Allah, His Book, His Messenger, the leaders of Muslims, and their common people.' [Muslim 55]",
        transliteration:"Ad-dīnu n-naṣīḥah. Qulnā: Li-man? Qāla: Li-llāhi wa li-kitābihi wa li-rasūlihi wa li-aimmati l-muslimīna wa ʿāmmatihim.",
        note:"الدِّينُ النَّصِيحَةُ — both words are definite → 'THE religion IS sincerity.' The equation sign emphasizes completeness: the entire religion IS sincere goodwill." },
      { id:2, arabic:"النَّصِيحَةُ الخَمْسَة:\n١. للهِ: الإِيمَانُ بِوُجُودِهِ وَوَحْدَانِيَّتِهِ وَإِخْلَاصُ العِبَادَة\n٢. لِكِتَابِهِ: تَلَاوَتُهُ وَتَدَبُّرُهُ وَالعَمَلُ بِهِ وَالدَّعْوَةُ إِلَيْه\n٣. لِرَسُولِهِ ﷺ: مَحَبَّتُهُ وَالاقْتِدَاءُ بِهِ وَنَشْرُ سُنَّتِه\n٤. لِأَئِمَّةِ المُسْلِمِين: طَاعَتُهُمْ فِي المَعْرُوفِ وَالدُّعَاءُ لَهُم\n٥. لِعَامَّةِ المُسْلِمِين: حُبُّهُمْ وَإِرْشَادُهُمْ وَدَرْءُ الأَذَى عَنْهُمْ",
        translation:"The Five Nasihahs:\n1. To Allah: Believing in His existence, uniqueness, and worshipping Him with sincerity\n2. To His Book: Reciting, reflecting, acting on, and calling to it\n3. To His Messenger ﷺ: Loving him, following his example, spreading his Sunnah\n4. To Muslim leaders: Obeying them in good, supplicating for them\n5. To common Muslims: Loving them, guiding them, and removing harm from them",
        transliteration:"An-naṣīḥah al-khamsah.",
        note:"نَصِيحَة ≠ criticism. True nasihah is WANTING goodness for the other. It's the opposite of selfishness. Imam al-Shafi'i said: 'Man is the enemy of what he doesn't know.'" }
    ],
    vocabulary:[
      { arabic:"نَصِيحَة", transliteration:"naṣīḥah", english:"sincere counsel / goodwill / sincerity", pos:"noun (f)" },
      { arabic:"أَئِمَّة", transliteration:"aimmah", english:"leaders / imams", pos:"noun (f.pl)" },
      { arabic:"عَامَّة", transliteration:"ʿāmmah", english:"common people / general public", pos:"noun (f)" },
      { arabic:"إِخْلَاص", transliteration:"ikhlāṣ", english:"sincerity / purity of intention", pos:"noun (m)" },
      { arabic:"اقْتِدَاء", transliteration:"iqtidāʾ", english:"following / emulating", pos:"noun (m)" },
    ],
    grammar:{ title:"Equational Sentence — الجُمْلَةُ الاسْمِيَّة", titleArabic:"الجُمْلَةُ الاسْمِيَّة",
      explanation:"«الدِّينُ النَّصِيحَةُ» is a nominal (equational) sentence:\n• مُبْتَدَأ: الدِّينُ (subject)\n• خَبَر: النَّصِيحَةُ (predicate)\n\nBoth are definite (with ال) — this makes the equation EXCLUSIVE:\n'THE religion IS THE nasihah' — all of it, completely.\n\nIf only النَّصِيحَة were definite: 'Religion is THE nasihah' (she is one of its pillars)\nBut since both are: 'The religion = the nasihah' — they completely overlap.",
      examples:[{ arabic:"المُؤْمِنُ أَخُو المُؤْمِن", translation:"The believer IS the brother of the believer (they are equals in brotherhood)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 7 — Nasihah.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّابِع.",
      items:[
        { question:"Nasihah 'to the Book of Allah' includes:", options:["Keeping it on a high shelf","Reading, reflecting, acting on, and calling to it","Never translating it","Reciting it once a year"], answer:1 },
        { question:"Nasihah to Muslim leaders means:", options:["Always obeying them even in sin","Obeying in good and supplicating for them","Criticizing them publicly","Ignoring them"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:8, title:"Hadith 8 — The Sanctity of Muslim Life", titleArabic:"الحَدِيثُ الثَّامِن: حُرْمَةُ دَمِ المُسْلِم",
    description:"The severe protection of Muslim life, wealth, and honor — the foundation of Islamic criminal law.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عُمَرَ رَضِيَ اللهُ عَنْهُمَا قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَيُقِيمُوا الصَّلَاةَ، وَيُؤْتُوا الزَّكَاةَ، فَإِذَا فَعَلُوا ذَلِكَ عَصَمُوا مِنِّي دِمَاءَهُمْ وَأَمْوَالَهُمْ إِلَّا بِحَقِّ الإِسْلَامِ، وَحِسَابُهُمْ عَلَى اللهِ»\n[البُخَارِيّ ٢٥ — مُسْلِم ٢٢]",
        translation:"'I have been ordered to fight the people until they testify there is no god but Allah and Muhammad is His Messenger, establish prayer, and give zakah. If they do so, they have protected their blood and wealth from me — except by the right of Islam. Their reckoning is with Allah.' [Bukhari 25]",
        transliteration:"Umirtu an uqātila n-nāsa ḥattā yashadū an lā ilāha illā llāhu...",
        note:"This hadith speaks about the CONTEXT of early Islamic warfare (protecting the Muslim community from military aggression). عَصَمُوا = they have protected — the verb conveys active protection, not just exemption." },
      { id:2, arabic:"حُقُوقُ المُسْلِمِ المُكَفَّلَة:\nعَنِ النَّبِيِّ ﷺ: «كُلُّ المُسْلِمِ عَلَى المُسْلِمِ حَرَامٌ: دَمُهُ وَمَالُهُ وَعِرْضُهُ»\n[مُسْلِم ٢٥٦٤]\n\nالثَّلَاثَةُ الحُرُمَات:\n١. الدَّم — لَا يَجُوزُ قَتْلُ مُسْلِمٍ إِلَّا بِحَقّ\n٢. المَال — لَا يَجُوزُ أَخْذُ مَالِهِ بِغَيْرِ حَقّ\n٣. العِرْض — لَا يَجُوزُ انْتِهَاكُ شَرَفِهِ وَكَرَامَتِه\n\nقَالَ النَّبِيُّ ﷺ فِي حَجَّةِ الوَدَاع: «إِنَّ دِمَاءَكُمْ وَأَمْوَالَكُمْ وَأَعْرَاضَكُمْ عَلَيْكُمْ حَرَامٌ كَحُرْمَةِ يَوْمِكُمْ هَذَا»",
        translation:"The Three Protected Rights:\n1. Blood — it is impermissible to kill a Muslim except by right\n2. Wealth — impermissible to take his wealth without right\n3. Honor — impermissible to violate his honor and dignity\n\nThe Prophet ﷺ in the Farewell Sermon: 'Your blood, wealth, and honor are sacred to you — as sacred as this day of yours.'",
        transliteration:"Kullu l-muslimi ʿalā l-muslimi ḥarām: damuhu wa māluhu wa ʿirḍuh.",
        note:"إِلَّا بِحَقِّ الإِسْلَامِ — three exceptions: apostasy, murder, married adulterer — all requiring proper Islamic court procedure. NOT vigilante justice." }
    ],
    vocabulary:[
      { arabic:"عَصَمَ", transliteration:"ʿaṣama", english:"protected / made inviolable", pos:"verb (past)" },
      { arabic:"دَم", transliteration:"dam", english:"blood", pos:"noun (m)" },
      { arabic:"عِرْض", transliteration:"ʿirḍ", english:"honor / dignity", pos:"noun (m)" },
      { arabic:"حُرْمَة", transliteration:"ḥurmah", english:"sanctity / inviolability", pos:"noun (f)" },
      { arabic:"حِسَاب", transliteration:"ḥisāb", english:"reckoning / account", pos:"noun (m)" },
    ],
    grammar:{ title:"أُمِرْتُ — The Passive of الأَمْر", titleArabic:"الفِعْلُ المَبْنِيُّ لِلْمَجْهُول: أُمِرْتُ",
      explanation:"أُمِرْتُ = 'I was commanded' — passive of أَمَرَ (to command).\nWho commanded? — Allah, through revelation. The passive avoids stating the obvious.\n\nPattern of the passive first person singular:\n• فَعَلْتُ → فُعِلْتُ (active → passive)\n• أَمَرَ → أُمِرَ; أَمَرْتُ → أُمِرْتُ",
      examples:[{ arabic:"«أُمِرْتُ أَنْ أَسْجُدَ للهِ»", translation:"'I was commanded to prostrate to Allah' (Quran 39:11)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 8 — Muslim sanctity.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّامِن.",
      items:[
        { question:"What three things of a Muslim are declared sacred in the hadith from Muslim?", options:["Salah, Zakah, Hajj","Blood, wealth, and honor","Family, home, masjid","Prayer, fasting, charity"], answer:1 },
        { question:"'Their reckoning is with Allah' means:", options:["Their intentions are judged by Allah alone","We can execute anyone","Muslims need no courts","We judge their hearts"], answer:0 }
      ], answers:[1,0] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:9, title:"Hadith 9 — Do What You Can", titleArabic:"الحَدِيثُ التَّاسِع: افْعَلُوا مَا اسْتَطَعْتُم",
    description:"The principle of capability and ease in Islam — the Sharia works within human limits, not against them.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ قَالَ:\n«مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ، فَإِنَّمَا أَهْلَكَ الَّذِينَ مِنْ قَبْلِكُمْ كَثْرَةُ مَسَائِلِهِمْ وَاخْتِلَافُهُمْ عَلَى أَنْبِيَائِهِمْ»\n[البُخَارِيّ ٧٢٨٨ — مُسْلِم ١٣٣٧]",
        translation:"'What I have forbidden you, avoid it entirely. What I have commanded you, do of it what you are able. What destroyed those before you was their excessive questioning and disagreeing with their prophets.' [Bukhari 7288, Muslim 1337]",
        transliteration:"Mā nahayтukum ʿanhu fa-jtanibūhu wa mā amartukum bihi fa-ʾtū minhu mā staṭaʿtum.",
        note:"Two contrasting rulings: PROHIBITION = total avoidance (no exceptions for difficulty). COMMAND = do what you can (scaled to ability). This is the principle of طَاقَة (capacity) in fiqh." },
      { id:2, arabic:"الفَرْق بَيْنَ المَنْهِيَّات وَالمَأْمُورَات:\n\nالمَنْهِيَّات (الحَرَام):\n→ اجْتَنِبُوهُ — أَتَمَّ اجْتِنَاب — لَا تَقْرَبُوه أَبَدًا\n(لَا يُوجَدُ «أَحْيَانًا» فِي الحَرَام)\n\nالمَأْمُورَات:\n→ مَا اسْتَطَعْتُمْ — بِحَسَبِ الطَّاقَة\nمَرِيضٌ يُصَلِّي قَاعِدًا — مُسَافِرٌ يُقَصِّرُ — مُضْطَرٌّ يَأْكُلُ الحَرَام\n\n﴿لَا يُكَلِّفُ اللهُ نَفْسًا إِلَّا وُسْعَهَا﴾ [البَقَرَة: ٢٨٦]",
        translation:"The difference between prohibitions and commands:\n\nProhibitions (Haram):\n→ Avoid entirely — completely — never approach\n(There is no 'sometimes' in the haram)\n\nCommands:\n→ As much as you are able — according to capacity\nSick person prays sitting — traveler shortens — person in necessity eats the haram\n\n'Allah does not burden a soul beyond its capacity.' [2:286]",
        transliteration:"Al-farq bayna l-manhiyyāt wa l-maʾmūrāt.",
        note:"كَثْرَةُ مَسَائِلِهِمْ — excessive questioning led previous nations astray. Example: 'Which cow exactly?' — they over-specified until they almost didn't comply. Don't make religion harder than it is." }
    ],
    vocabulary:[
      { arabic:"اجْتَنَبَ", transliteration:"ijtanaba", english:"avoided / stayed away from", pos:"verb (past)" },
      { arabic:"اسْتَطَاعَ", transliteration:"istaṭāʿa", english:"was able / had capability", pos:"verb (past)" },
      { arabic:"أَهْلَكَ", transliteration:"ahlaka", english:"destroyed / ruined", pos:"verb (past)" },
      { arabic:"كَثْرَة", transliteration:"kathrah", english:"abundance / excessive amount", pos:"noun (f)" },
      { arabic:"وُسْع", transliteration:"wusʿ", english:"capacity / ability / scope", pos:"noun (m)" },
    ],
    grammar:{ title:"فَاجْتَنِبُوهُ — Command + Attached Pronoun", titleArabic:"فِعْلُ الأَمْرِ مَعَ ضَمِيرِ المَفْعُول",
      explanation:"فَاجْتَنِبُوهُ = فَ (so) + اجْتَنِبُوا (avoid! — command plural) + هُ (it — attached object pronoun)\n\nThe هُ refers back to مَا نَهَيْتُكُمْ عَنْهُ (what I forbade you). The pronoun keeps the sentence concise.\n\nCommand + Object Pronouns:\n• اتْرُكْهُ = leave it!\n• اتَّبِعُوهُ = follow it!\n• اعْبُدْهُ = worship Him!",
      examples:[{ arabic:"مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ", translation:"What I forbade you — avoid IT (the forbidden thing)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 9 — Capability and avoidance.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ التَّاسِع.",
      items:[
        { question:"For PROHIBITIONS, the standard is:", options:["Avoid when possible","Do what you can","Total avoidance — no exceptions for convenience","Try to avoid"], answer:2 },
        { question:"What destroyed previous nations according to this hadith?", options:["Their lack of prayer","Excessive questioning and disagreeing with prophets","Fighting too much","Not giving charity"], answer:1 }
      ], answers:[2,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:10, title:"Hadith 10 — Eat Only What is Pure", titleArabic:"الحَدِيثُ العَاشِر: أَكْلُ الطَّيِّبَات",
    description:"The prophetic teaching on the connection between pure earnings, accepted worship, and answered supplications.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«إِنَّ اللهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا، وَإِنَّ اللهَ أَمَرَ المُؤْمِنِينَ بِمَا أَمَرَ بِهِ المُرْسَلِينَ فَقَالَ: ﴿يَا أَيُّهَا الرُّسُلُ كُلُوا مِنَ الطَّيِّبَاتِ وَاعْمَلُوا صَالِحًا﴾ وَقَالَ: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِنْ طَيِّبَاتِ مَا رَزَقْنَاكُمْ﴾»\nثُمَّ ذَكَرَ الرَّجُلَ يُطِيلُ السَّفَرَ أَشْعَثَ أَغْبَرَ يَمُدُّ يَدَيْهِ إِلَى السَّمَاءِ: «يَا رَبِّ يَا رَبِّ وَمَطْعَمُهُ حَرَامٌ وَمَشْرَبُهُ حَرَامٌ وَمَلْبَسُهُ حَرَامٌ وَغُذِيَ بِالحَرَامِ، فَأَنَّى يُسْتَجَابُ لِذَلِكَ؟»\n[مُسْلِم ١٠١٥]",
        translation:"'Allah is pure and accepts only what is pure. Allah commanded the believers with what He commanded the messengers.' Then he described a man: exhausted traveler — disheveled, dusty — raising his hands to the sky: 'O Lord! O Lord!' — but his food is haram, his drink is haram, his clothing is haram, nourished by haram — how will his supplication be answered?",
        transliteration:"Inna llāha ṭayyibun lā yaqbalu illā ṭayyibā.",
        note:"فَأَنَّى يُسْتَجَابُ = 'how would it be answered?' — rhetorical question implying: it WILL NOT be answered. The conditions of travel and outward humility are present, but the inner purity is absent." },
      { id:2, arabic:"الطَّيِّبُ يَقْبَلُ الطَّيِّب:\nاللهُ طَيِّبٌ → يَقْبَلُ فَقَطِ الطَّيِّبَ:\n• الطَّيِّب فِي العِبَادَة: الإِخْلَاص وَالمُتَابَعَة\n• الطَّيِّب فِي الرِّزْق: الكَسْبُ الحَلَال\n• الطَّيِّب فِي العَمَل: الإِتْقَان وَالنِّيَّة الحَسَنَة\n\nشُرُوطُ قَبُولِ الدُّعَاء:\n١. إِخْلَاصُ النِّيَّة\n٢. الكَسْبُ الحَلَال\n٣. الابْتِعَادُ عَنِ المَحَارِم\n٤. الدُّعَاءُ بِآدَابِه (الاسْتِقْبَال، رَفْعُ اليَدَيْن...)",
        translation:"The Pure accepts only the Pure:\nAllah is pure → accepts ONLY what is pure:\n• Pure in worship: sincerity and following the Prophet's example\n• Pure in earnings: halal income\n• Pure in deeds: excellence and good intention\n\nConditions for accepted supplication:\n1. Sincerity of intention\n2. Halal earnings\n3. Staying away from prohibitions\n4. Making du'a with its etiquettes",
        transliteration:"Aṭ-ṭayyibu yaqbalu ṭ-ṭayyib.",
        note:"Scholars say: this hadith is one of the greatest motivators for pursuing HALAL earnings. The one whose food comes from haram cuts the connection between themselves and Allah's acceptance." }
    ],
    vocabulary:[
      { arabic:"طَيِّب", transliteration:"ṭayyib", english:"pure / good / wholesome", pos:"adjective" },
      { arabic:"يَقْبَل", transliteration:"yaqbal", english:"accepts", pos:"verb (present)" },
      { arabic:"أَشْعَث", transliteration:"ashʿath", english:"disheveled / unkempt (hair)", pos:"adjective" },
      { arabic:"أَغْبَر", transliteration:"aghbar", english:"dusty / covered in dust", pos:"adjective" },
      { arabic:"مَطْعَم", transliteration:"maṭʿam", english:"food / what is eaten", pos:"noun (m)" },
      { arabic:"غُذِيَ", transliteration:"ghudiya", english:"was nourished / fed (passive)", pos:"verb (passive past)" },
    ],
    grammar:{ title:"إِلَّا الاسْتِثْنَائِيَّة — Exclusive 'Except'", titleArabic:"إِلَّا لِلْحَصْر وَالاسْتِثْنَاء",
      explanation:"«لَا يَقْبَلُ إِلَّا طَيِّبًا» — لَا + verb + إِلَّا = exclusive statement:\n'Does not accept EXCEPT pure.' Meaning: ONLY pure is accepted.\n\nThis is called النَّفْيُ وَالاسْتِثْنَاء (negation + exception) which conveys COMPLETE EXCLUSIVITY:\n• لَا إِلَهَ إِلَّا اللهُ = No god EXCEPT Allah (only Allah)\n• لَا تَقُلْ إِلَّا خَيْرًا = Say nothing EXCEPT good\n\nإِلَّا here limits/restricts what Allah accepts to ONLY the pure.",
      examples:[{ arabic:"«لَا يَقْبَلُ اللهُ صَلَاةً بِغَيْرِ طَهُور»", translation:"'Allah does not accept a prayer without purification.' — same exclusive pattern" }] },
    exercises:[{ type:"choose", instruction:"Hadith 10 — Pure earnings.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ العَاشِر.",
      items:[
        { question:"What does 'Allah is pure and accepts only the pure' mean for a Muslim?", options:["Worship must be physically clean only","Earnings, worship, and intent must all be pure","Only ablution matters","Food must be expensive"], answer:1 },
        { question:"Why was the traveler's du'a not answered despite his outward humility?", options:["He didn't know the right words","His food, drink, and clothing came from haram","He wasn't facing Qibla","It wasn't the right time"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:11, title:"Hadith 11 — Leave What Doesn't Concern You", titleArabic:"الحَدِيثُ الحَادِي عَشَر: تَرْكُ مَا لَا يَعْنِي",
    description:"Excellence in Islam: the art of purposeful living — focusing only on what matters for your deen and dunya.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ قَالَ:\n«مِنْ حُسْنِ إِسْلَامِ المَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ»\n[الترمذي ٢٣١٧ — ابن ماجه ٣٩٧٦ — حديث حسن صحيح]",
        translation:"'Part of the excellence of a person's Islam is leaving what does not concern them.' [Tirmidhi 2317 — Hadith Hasan Sahih]",
        transliteration:"Min ḥusni islāmi l-marʾi tarkuhu mā lā yaʿnīh.",
        note:"This hadith is a pillar of Islamic character. Imam Shafi'i: 'The most deserving of people to have much speech is the one who has much knowledge. The most deserving to have little speech is the one who has little knowledge.'" },
      { id:2, arabic:"مَا يَعْنِيكَ وَمَا لَا يَعْنِيك:\n\nمَا يَعْنِيكَ (يَسْتَحِقُّ انْتِبَاهَكَ):\n• دِينُكَ وَعِبَادَتُكَ\n• أَهْلُكَ وَأَقَارِبُكَ\n• عَمَلُكَ وَرِزْقُكَ\n• صِحَّتُكَ وَتَعَلُّمُكَ\n\nمَا لَا يَعْنِيكَ:\n• أَخْبَارُ النَّاسِ وَغِيبَتُهُم\n• الجِدَالُ فِي مَسَائِلَ لَا فَائِدَة مِنْهَا\n• الإِكْثَارُ مِنَ الكَلَامِ بِلَا هَدَف\n• التَّدَخُّلُ فِيمَا لَا يَعْنِيك",
        translation:"What concerns you vs. what doesn't:\n\nWhat concerns you (deserves your attention):\n• Your religion and worship\n• Your family and relatives\n• Your work and livelihood\n• Your health and learning\n\nWhat doesn't concern you:\n• People's news and their backbiting\n• Arguing about useless matters\n• Excessive talking without purpose\n• Interfering in what doesn't concern you",
        transliteration:"Mā yaʿnīka wa mā lā yaʿnīk.",
        note:"حُسْن الإِسْلَام = excellence of Islam (not its minimum). This is about QUALITY of practice, not just avoiding the forbidden. The Muslim of ihsan lives purposefully." }
    ],
    vocabulary:[
      { arabic:"حُسْن", transliteration:"ḥusn", english:"excellence / beauty / goodness", pos:"noun (m)" },
      { arabic:"مَرْء", transliteration:"marʾ", english:"person / man", pos:"noun (m)" },
      { arabic:"يَعْنِي", transliteration:"yaʿnī", english:"concerns / is relevant to", pos:"verb (present, 3rd m.sg)" },
      { arabic:"تَدَخُّل", transliteration:"tadakhkhul", english:"interference / meddling", pos:"noun (m)" },
      { arabic:"فُضُول", transliteration:"fuḍūl", english:"excessive curiosity / nosiness", pos:"noun (m)" },
    ],
    grammar:{ title:"مِنْ التَّبْعِيضِيَّة — Partitive مِنْ", titleArabic:"مِنْ التَّبْعِيضِيَّة",
      explanation:"«مِنْ حُسْنِ إِسْلَامِ المَرْء» — مِنْ here means 'PART OF':\n'PART OF the excellence of a person's Islam is...'\n\nThis مِنْ (partitive) appears frequently in hadith:\n• مِنَ الإِيمَانِ أَنْ... = Part of faith is...\n• مِنَ الإِسْلَامِ = Part of Islam is...\n• مِنَ البِرِّ = Part of righteousness is...\n\nDoes NOT mean 'this is ALL of Islam' — it's a COMPONENT, a sign.",
      examples:[{ arabic:"«مِنَ الإِيمَانِ أَنْ تُحِبَّ لِأَخِيكَ مَا تُحِبُّ لِنَفْسِك»", translation:"Part of faith is to love for your brother what you love for yourself." }] },
    exercises:[{ type:"choose", instruction:"Hadith 11 — Purposeful living.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الحَادِي عَشَر.",
      items:[
        { question:"This hadith is a sign of which level of Islam?", options:["Minimum required Islam","Excellence of Islam (Ihsan level)","Innovation in worship","Nafilah only"], answer:1 },
        { question:"Leaving what doesn't concern you leads to:", options:["Less productivity","Preserving time, honor, and relationships","Arrogance","Isolation"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:12, title:"Hadith 12 — Leave What Makes You Doubt", titleArabic:"الحَدِيثُ الثَّانِي عَشَر: دَعْ مَا يَرِيبُك",
    description:"The principle of following your conscience — leave doubt for certainty. Truth brings peace; falsehood brings anxiety.",
    pages:[
      { id:1, arabic:"عَنِ الحَسَنِ بْنِ عَلِيٍّ رَضِيَ اللهُ عَنْهُمَا قَالَ: حَفِظْتُ مِنْ رَسُولِ اللهِ ﷺ:\n«دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ، فَإِنَّ الصِّدْقَ طُمَأْنِينَةٌ وَإِنَّ الكَذِبَ رِيبَةٌ»\n[الترمذي ٢٥١٨ — النسائي — حديث صحيح]",
        translation:"On the authority of Al-Hasan ibn Ali RA: 'I memorized from the Messenger of Allah ﷺ: Leave what makes you doubt for what does not make you doubt. Truth brings tranquility; lying brings doubt.' [Tirmidhi 2518 — Authentic]",
        transliteration:"Daʿ mā yarībuka ilā mā lā yarībuka. Fa-inna ṣ-ṣidqa ṭumaʾnīnah wa inna l-kadhiba rībah.",
        note:"طُمَأْنِينَة = serenity / peace of heart. This is the internal test: does it settle the heart or disturb it? The heart has moral intelligence — train it, then trust it." },
      { id:2, arabic:"الفِقْرَة الثَّانِيَة:\nالصِّدْق = طُمَأْنِينَة: الحَقُّ يُرِيحُ القَلْب\nالكَذِب = رِيبَة: البَاطِلُ يُضْطَرِبُ فِيهِ القَلْب\n\nالتَّطْبِيق:\n• عِنْدَ الشَّكِّ فِي حِلِّ مَعَامَلَة → دَعْهَا\n• عِنْدَ الشَّكِّ فِي وُجُوبِ عِبَادَة → افْعَلْهَا احْتِيَاطًا\n• عِنْدَ الشَّكِّ فِي صِحَّةِ خَبَر → لَا تَنْشُرْهُ\n\nصَلَةٌ بِالحَدِيثِ ٦: الشُّبُهَات — اتْرُكْهَا",
        translation:"Second clause:\nTruth = tranquility: the right thing puts the heart at rest\nFalsehood = doubt: the wrong thing makes the heart uneasy\n\nApplication:\n• Doubt about a transaction's permissibility → leave it\n• Doubt about whether a worship is obligatory → do it as precaution\n• Doubt about truth of a report → don't spread it\n\nConnection to Hadith 6: the doubtful matters — leave them",
        transliteration:"Aṣ-ṣidqu ṭumaʾnīnah wa l-kadhibu rībah.",
        note:"Al-Hasan ibn Ali RA memorized this from his grandfather, the Prophet ﷺ. He used to say: 'This is the greatest thing I memorized from him.'" }
    ],
    vocabulary:[
      { arabic:"رَابَ / يَرِيب", transliteration:"rāba / yarīb", english:"made doubtful / caused anxiety", pos:"verb" },
      { arabic:"طُمَأْنِينَة", transliteration:"ṭumaʾnīnah", english:"tranquility / peace of heart", pos:"noun (f)" },
      { arabic:"رِيبَة", transliteration:"rībah", english:"doubt / suspicion / anxiety", pos:"noun (f)" },
      { arabic:"حَفِظَ", transliteration:"ḥafiẓa", english:"memorized / preserved / guarded", pos:"verb (past)" },
      { arabic:"صِدْق", transliteration:"ṣidq", english:"truthfulness / truth", pos:"noun (m)" },
    ],
    grammar:{ title:"دَعْ — Imperative of وَدَعَ", titleArabic:"فِعْلُ الأَمْرِ: دَعْ",
      explanation:"دَعْ = 'Leave!' — imperative of وَدَعَ/يَدَع (to leave/abandon).\n\nThis is a defective verb (Naaqis): the waw is dropped in most forms:\n• يَدَعُ (present) → دَعْ (command)\n• لَا تَدَعْ (don't leave)\n\nOther examples:\n• خُذْ (take!) from أَخَذَ\n• كُلْ (eat!) from أَكَلَ — hamzah dropped",
      examples:[{ arabic:"«دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُك»", translation:"Leave what makes you doubt for what gives you no doubt" }] },
    exercises:[{ type:"choose", instruction:"Hadith 12 — Truth and doubt.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّانِي عَشَر.",
      items:[
        { question:"According to this hadith, what does truth bring?", options:["Profit","Tranquility and peace of heart","More knowledge","Ease in worship only"], answer:1 },
        { question:"When in doubt about the permissibility of a transaction, you should:", options:["Do it anyway and repent later","Ask others","Leave it — choose certainty over doubt","Ignore your doubt"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:13, title:"Hadith 13 — Love for Your Brother What You Love", titleArabic:"الحَدِيثُ الثَّالِثَ عَشَر: المَحَبَّة لِلْأَخ",
    description:"The golden rule of Islamic brotherhood — a benchmark of true faith.",
    pages:[
      { id:1, arabic:"عَنْ أَنَسِ بْنِ مَالِكٍ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ قَالَ:\n«لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ»\n[البُخَارِيّ ١٣ — مُسْلِم ٤٥]",
        translation:"'None of you truly believes until he loves for his brother what he loves for himself.' [Bukhari 13, Muslim 45]",
        transliteration:"Lā yuʾminu aḥadukum ḥattā yuḥibba li-akhīhi mā yuḥibbu li-nafsih.",
        note:"لَا يُؤْمِنُ = 'does not truly believe' (complete Iman) — NOT 'is a kafir'. The negated iman here refers to COMPLETE/PERFECT iman, not its foundation." },
      { id:2, arabic:"التَّطْبِيق:\n«أَخُوهُ» — يَشْمَل:\n• المُسْلِم فِي كُلِّ مَكَان\n• الأَخ فِي الدِّين لَا فِي النَّسَب فَقَط\n\nعَلَامَاتُ هَذِهِ المَحَبَّة:\n• الدُّعَاءُ لَهُ بِظَهْرِ الغَيْب\n• فَرَحُكَ بِنِعْمَتِهِ كَفَرَحِكَ بِنِعْمَتِكَ\n• كَرَاهِيَةُ السَّوْءِ لَهُ كَكَرَاهِيَتِهِ لِنَفْسِك\n• نَصِيحَتُهُ بِمَا تَنْصَحُ بِهِ نَفْسَك\n\nضِدُّهُ: الحَسَد — تَمَنِّي زَوَالِ نِعْمَةِ الغَيْر",
        translation:"Application:\n'His brother' includes:\n• Every Muslim everywhere\n• Brother in faith — not only in lineage\n\nSigns of this love:\n• Supplicating for him in his absence\n• Rejoicing in his blessing as you rejoice in yours\n• Disliking harm for him as you dislike it for yourself\n• Advising him as you would advise yourself\n\nIts opposite: Hasad (envy) — wishing for the removal of others' blessings",
        transliteration:"Aʿlāmātu hādhihi l-maḥabbah.",
        note:"القَاضِي عِيَاض: The meaning includes loving SPIRITUAL good — wanting for your brother that he be guided, forgiven, and admitted to Paradise. Not just worldly goods." }
    ],
    vocabulary:[
      { arabic:"يُؤْمِن", transliteration:"yuʾmin", english:"truly believes / has complete faith", pos:"verb (present)" },
      { arabic:"يُحِبّ", transliteration:"yuḥibb", english:"loves", pos:"verb (present)" },
      { arabic:"أَخ", transliteration:"akh", english:"brother (in faith)", pos:"noun (m)", plural:"إِخْوَة" },
      { arabic:"حَسَد", transliteration:"ḥasad", english:"envy (wishing removal of another's blessing)", pos:"noun (m)" },
      { arabic:"نَصِيحَة", transliteration:"naṣīḥah", english:"sincere counsel / advice", pos:"noun (f)" },
    ],
    grammar:{ title:"حَتَّى — Until / To the extent that", titleArabic:"حَتَّى الغَائِيَّة",
      explanation:"«لَا يُؤْمِنُ... حَتَّى يُحِبَّ» — حَتَّى here marks the CONDITION for completing the main verb:\n'Does not truly believe UNTIL he loves...'\n\nحَتَّى + subjunctive (مَنْصُوب المُضَارِع):\n• يُؤْمِنُ (indicative) → يُحِبَّ (subjunctive after حَتَّى)\n• لَا يَدْخُلُ الجَنَّةَ حَتَّى يُؤْمِنَ (won't enter Paradise until he believes)\n\nThe subjunctive ending here = ـَ replacing the normal ـُ.",
      examples:[{ arabic:"«لَا يَدْخُلُ الجَنَّةَ مَنْ كَانَ فِي قَلْبِهِ مِثْقَالُ حَبَّةٍ مِنْ خَرْدَلٍ مِنْ كِبْر»", translation:"'No one with a mustard seed of arrogance in their heart will enter Paradise.'" }] },
    exercises:[{ type:"choose", instruction:"Hadith 13 — Brotherhood in Islam.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّالِثَ عَشَر.",
      items:[
        { question:"'Not truly believing' in this hadith means:", options:["Being a disbeliever","Not having complete/perfect faith","Having no faith at all","Being a hypocrite"], answer:1 },
        { question:"The opposite of loving good for your brother is:", options:["Indifference","Hasad (envy)","Competing","Not praying for him"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:14, title:"Hadith 14 — The Three Cases Where Muslim Blood is Permitted", titleArabic:"الحَدِيثُ الرَّابِعَ عَشَر: حُرْمَةُ الدِّمَاء",
    description:"The absolute protection of Muslim life — only three precise legal conditions can permit what is otherwise completely forbidden.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ مَسْعُودٍ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ يَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنِّي رَسُولُ اللهِ إِلَّا بِإِحْدَى ثَلَاثٍ:\nالثَّيِّبُ الزَّانِي، وَالنَّفْسُ بِالنَّفْسِ، وَالتَّارِكُ لِدِينِهِ المُفَارِقُ لِلْجَمَاعَة»\n[البُخَارِيّ ٦٨٧٨ — مُسْلِم ١٦٧٦]",
        translation:"'The blood of a Muslim who testifies there is no god but Allah and that I am His Messenger is not permissible except in one of three cases: the married adulterer, a life for a life, and the one who abandons his religion and separates from the community.' [Bukhari 6878]",
        transliteration:"Lā yaḥillu damu mriʾin muslimin... illā bi-iḥdā thalāth.",
        note:"These three exceptions REQUIRE an established Islamic court. Vigilante justice is NEVER justified. The entire weight of these hadiths is to PROTECT life, not endanger it." },
      { id:2, arabic:"الثَّلَاثَةُ الاسْتِثْنَاءَات:\n١. الثَّيِّبُ الزَّانِي: المُتَزَوِّج الَّذِي يَزْنِي — يَحْتَاجُ إِلَى قَضَاءٍ وَشُهُود\n٢. النَّفْسُ بِالنَّفْسِ: القِصَاص عِنْدَ القَتْلِ العَمْد — بِشُرُوطِهِ\n٣. التَّارِكُ لِدِينِهِ: الرِّدَّة — بَعْدَ اسْتِتَابَة وَقَضَاء\n\nكُلُّهَا تَحْتَاج:\n• مَحْكَمَة شَرْعِيَّة\n• قَاضٍ مُؤَهَّل\n• أَدِلَّة مُثْبَتَة\n\n«القَتْلُ أَعَزُّ مِنْ أَنْ يُقَامَ بِالشُّبُهَات»",
        translation:"The Three Exceptions:\n1. Married adulterer: requires court, witnesses, process\n2. Life for life: retaliation for intentional murder — with conditions\n3. Apostate: after seeking repentance and court ruling\n\nAll require:\n• Islamic court\n• Qualified judge\n• Established evidence\n\n'Life is too precious to be taken based on doubts.'",
        transliteration:"Ath-thalāthatu l-isthithnāʾāt: ath-thayyibu z-zānī, an-nafsu bi-n-nafs, at-tāriku li-dīnih.",
        note:"اقتل المفارق للجماعة: 'separating from the community' — scholars interpret this as active armed insurrection against the Muslim state, not mere disagreement or criticism." }
    ],
    vocabulary:[
      { arabic:"يَحِلّ", transliteration:"yaḥill", english:"is permissible / is lawful", pos:"verb (present)" },
      { arabic:"امْرُؤ", transliteration:"amruʾ", english:"person / man", pos:"noun (m)" },
      { arabic:"ثَيِّب", transliteration:"thayyib", english:"previously married (person)", pos:"adjective" },
      { arabic:"قِصَاص", transliteration:"qiṣāṣ", english:"retaliation / equal punishment", pos:"noun (m)" },
      { arabic:"رِدَّة", transliteration:"riddah", english:"apostasy / leaving Islam", pos:"noun (f)" },
    ],
    grammar:{ title:"إِلَّا — Exception with Condition", titleArabic:"الاسْتِثْنَاء بِـ إِلَّا",
      explanation:"«لَا يَحِلُّ... إِلَّا بِإِحْدَى ثَلَاث» — The structure:\n• لَا يَحِلُّ = General prohibition (blood is forbidden)\n• إِلَّا = exception marker\n• بِإِحْدَى ثَلَاث = in one of three cases\n\nThe بِ (by/with) after إِلَّا means: ONLY WITH the condition of one of these three.\n\nThis structure is common in fiqh:\n• لَا صَلَاةَ إِلَّا بِطَهُور = No prayer except with purification\n• لَا نِكَاحَ إِلَّا بِوَلِيّ = No marriage except with a guardian",
      examples:[{ arabic:"لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ إِلَّا بِإِحْدَى ثَلَاث", translation:"Muslim blood is not lawful except in one of three cases" }] },
    exercises:[{ type:"choose", instruction:"Hadith 14 — Protection of life.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الرَّابِعَ عَشَر.",
      items:[
        { question:"Can an individual take action against the three cases without a court?", options:["Yes if they are sure","No — always requires Islamic court and process","Yes if two witnesses confirm","Only in self-defense"], answer:1 },
        { question:"The purpose of these strict exceptions is:", options:["To make life easy to take","To emphasize the EXTREME sanctity of Muslim life","To punish people more","To allow vigilante justice"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:15, title:"Hadith 15 — Speak Good or Stay Silent", titleArabic:"الحَدِيثُ الخَامِسَ عَشَر: قُلْ خَيْرًا أَوِ اصْمُت",
    description:"Three signs of true faith in one hadith — honoring neighbors, guests, and controlling the tongue.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ أَنَّ رَسُولَ اللهِ ﷺ قَالَ:\n«مَنْ كَانَ يُؤْمِنُ بِاللهِ وَاليَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ\nوَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَاليَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ\nوَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَاليَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ»\n[البُخَارِيّ ٦٠١٨ — مُسْلِم ٤٧]",
        translation:"'Whoever believes in Allah and the Last Day, let him speak good or stay silent. Whoever believes in Allah and the Last Day, let him honor his neighbor. Whoever believes in Allah and the Last Day, let him honor his guest.' [Bukhari 6018]",
        transliteration:"Man kāna yuʾminu bi-llāhi wa l-yawmi l-ākhiri fal-yaqul khayran aw liyaṣmut...",
        note:"Three commands, each attached to the condition of Iman. The test of your faith in the Last Day = your tongue, your treatment of neighbors, your generosity with guests." },
      { id:2, arabic:"الثَّلَاثَة الشُّعَب:\n١. التَّحَكُّمُ فِي اللِّسَان:\nخَيْرٌ (مُفِيد ، صَادِق، رَاقٍ) → قُلْهُ\nلَيْسَ خَيْرًا → اصْمُتْ\nلَا تُوجَدُ مَنْزِلَة «لَا خَيْر وَلَا شَرّ» — الصَّمْتُ فِي هَذِهِ الحَالَة أَفْضَل\n\n٢. إِكْرَامُ الجَار:\nحَقُّ الجِوَار — النَّبِيُّ ﷺ: «مَا زَالَ جِبْرِيلُ يُوصِينِي بِالجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُه»\n\n٣. إِكْرَامُ الضَّيْف:\nمِنَ السُّنَّة: الضِّيَافَة ثَلَاثَة أَيَّام",
        translation:"The Three Branches:\n1. Tongue control:\nGood (beneficial, true, noble) → say it / Not good → stay silent\nNo middle ground — silence is better than neutral speech\n\n2. Honoring the neighbor:\nRight of neighborly ties. Prophet ﷺ: 'Jibreel kept commanding me about the neighbor until I thought he would make him an heir.'\n\n3. Honoring the guest:\nSunnah: hospitality for three days",
        transliteration:"Ath-thalāthatu sh-shuʿab: al-lisān, al-jār, aḍ-ḍayf.",
        note:"فَلْيَقُلْ = Let him say (command through فَ + لَـ + verb). The structure links belief with action: IF you believe → THEN let your actions show it." }
    ],
    vocabulary:[
      { arabic:"يَصْمُت", transliteration:"yaṣmut", english:"stays silent / is quiet", pos:"verb (present)" },
      { arabic:"يُكْرِم", transliteration:"yukrimu", english:"honors / respects generously", pos:"verb (present)" },
      { arabic:"جَار", transliteration:"jār", english:"neighbor", pos:"noun (m)", plural:"جِيرَان" },
      { arabic:"ضَيْف", transliteration:"ḍayf", english:"guest", pos:"noun (m)", plural:"ضُيُوف" },
      { arabic:"جِوَار", transliteration:"jiwār", english:"neighborly relationship / proximity", pos:"noun (m)" },
    ],
    grammar:{ title:"فَلْيَفْعَلْ — Commanding the Third Person", titleArabic:"فِعْلُ الأَمْرِ لِلْغَائِب",
      explanation:"فَلْيَقُلْ = 'Let him say!' — command for third person (not the person being spoken to):\n\nFormula: فَ + لَـ (jussive particle) + verb (jussive mood)\n• فَلْيَقُلْ = let him say\n• فَلْيُكْرِمْ = let him honor\n• فَلْيَصْمُتْ = let him be silent\n• فَلْيُصَلِّ = let him pray\n\nCompare with direct command:\n• قُلْ = say! (to you, 2nd person)\n• فَلْيَقُلْ = let him say (about him, 3rd person)",
      examples:[{ arabic:"مَنْ كَانَ يُؤْمِنُ بِاللهِ وَاليَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", translation:"Whoever believes in Allah and the Last Day, let him say good or be silent" }] },
    exercises:[{ type:"choose", instruction:"Hadith 15 — Tongue, neighbor, guest.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الخَامِسَ عَشَر.",
      items:[
        { question:"If speech is neither clearly good nor clearly harmful, you should:", options:["Say it","Stay silent — silence is better","Ask a scholar first","Post it online"], answer:1 },
        { question:"How many days is the Sunnah of hospitality?", options:["One day","Two days","Three days","Seven days"], answer:2 }
      ], answers:[1,2] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:16, title:"Hadith 16 — Do Not Be Angry", titleArabic:"الحَدِيثُ السَّادِسَ عَشَر: لَا تَغْضَب",
    description:"The Prophet's three-word prescription for a virtuous life — anger management as a path to paradise.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ أَنَّ رَجُلًا قَالَ لِلنَّبِيِّ ﷺ:\nأَوْصِنِي.\nقَالَ: «لَا تَغْضَبْ».\nفَرَدَّدَ مِرَارًا، قَالَ: «لَا تَغْضَبْ»\n[البُخَارِيّ ٦١١٦]",
        translation:"A man came to the Prophet ﷺ and said: 'Advise me.' He said: 'Do not be angry.' The man repeated [the request] several times. Each time the Prophet said: 'Do not be angry.' [Bukhari 6116]",
        transliteration:"Awṣinī. Qāla: Lā taghḍab. Fa-raddada mirāran, qāla: Lā taghḍab.",
        note:"The Prophet ﷺ could have said anything — prayer, fasting, Quran — but he chose 'do not be angry' three times. Why? Because anger destroys all good deeds, relationships, and judgement." },
      { id:2, arabic:"الغَضَبُ وَعِلَاجُهُ:\nعَنِ النَّبِيِّ ﷺ: «لَيْسَ الشَّدِيدُ بِالصُّرَعَة، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الغَضَب»\n\nعِلَاجُ الغَضَب:\n١. التَّعَوُّذُ: «أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيم»\n٢. السُّكُوت: لَا تَنْطِقْ وَأَنْتَ غَاضِب\n٣. تَغْيِيرُ الحَال: قُمْ إِنْ كُنْتَ جَالِسًا، اجْلِسْ إِنْ كُنْتَ قَائِمًا\n٤. الوُضُوء: «الغَضَبُ مِنَ الشَّيْطَانِ وَالشَّيْطَانُ مِنَ النَّار وَالمَاءُ يُطْفِئُ النَّار»\n٥. الانْتِقَال مِنَ المَكَان",
        translation:"Anger and its remedy:\nProphet ﷺ: 'The strong man is not the wrestler. The truly strong is the one who controls himself when angry.' [Bukhari 6114]\n\nRememdy for anger:\n1. Seek refuge: 'I seek refuge in Allah from Shaytan'\n2. Silence: don't speak while angry\n3. Change position: stand if sitting, sit if standing\n4. Wudu: 'Anger is from Shaytan and Shaytan is from fire — water extinguishes fire'\n5. Leave the place",
        transliteration:"Al-ghaḍabu wa ʿilājuh.",
        note:"Anger is described as 'a coal in the heart of man' — it burns the angry person first, then spreads to others. Controlling anger = protecting yourself and everyone around you." }
    ],
    vocabulary:[
      { arabic:"يَغْضَب", transliteration:"yaghḍab", english:"becomes angry", pos:"verb (present)" },
      { arabic:"أَوْصِنِي", transliteration:"awṣinī", english:"advise me / counsel me", pos:"verb (imperative + pronoun)" },
      { arabic:"رَدَّدَ", transliteration:"raddada", english:"repeated (the question)", pos:"verb (past)" },
      { arabic:"مِرَارًا", transliteration:"mirāran", english:"several times / repeatedly", pos:"adverb" },
      { arabic:"صُرَعَة", transliteration:"ṣuraʿah", english:"wrestler / one who throws others", pos:"noun (m)" },
    ],
    grammar:{ title:"لَا النَّاهِيَة — The Prohibitive لَا", titleArabic:"لَا النَّاهِيَة",
      explanation:"«لَا تَغْضَبْ» — لَا النَّاهِيَة (the prohibitive 'lā') + jussive verb:\n\nlā + verb in jussive (مَجْزُوم) = 'Do not [verb]!'\n\nلَا + تَغْضَبُ (indicative) → لَا تَغْضَبْ (jussive — notice the sukun)\n\nMore examples:\n• لَا تَكْذِبْ = Don't lie!\n• لَا تَكُنْ مِنَ الغَافِلِين = Don't be among the heedless!\n• لَا تَيْأَسْ = Don't despair!\n\nCompare: لَا + noun (no verb) = 'There is no...' — different function.",
      examples:[{ arabic:"لَا تَغْضَبْ فَلَكَ الجَنَّة", translation:"Do not be angry and Paradise is yours." }] },
    exercises:[{ type:"choose", instruction:"Hadith 16 — Anger.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّادِسَ عَشَر.",
      items:[
        { question:"According to the Prophet, the 'strong person' is:", options:["The physically strongest","The one who controls themselves when angry","The most patient in fasting","The wealthiest"], answer:1 },
        { question:"One Sunnah remedy for anger is:", options:["Shout to release frustration","Make wudu (ablution) — water extinguishes fire","Read a book","Eat something"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:17, title:"Hadith 17 — Allah Has Written Excellence (Ihsan) on Everything", titleArabic:"الحَدِيثُ السَّابِعَ عَشَر: الإِحْسَانُ فِي كُلِّ شَيْء",
    description:"The Islamic ethic of excellence in everything you do — even the most difficult acts must be done with perfection.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي يَعْلَى شَدَّادِ بْنِ أَوْسٍ رَضِيَ اللهُ عَنْهُ عَنْ رَسُولِ اللهِ ﷺ قَالَ:\n«إِنَّ اللهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ، فَإِذَا قَتَلْتُمْ فَأَحْسِنُوا القِتْلَةَ، وَإِذَا ذَبَحْتُمْ فَأَحْسِنُوا الذِّبْحَةَ، وَلْيُحِدَّ أَحَدُكُمْ شَفْرَتَهُ وَلْيُرِحْ ذَبِيحَتَهُ»\n[مُسْلِم ١٩٥٥]",
        translation:"'Allah has prescribed excellence (Ihsan) for everything. So if you kill, do it excellently. If you slaughter, do it excellently. Let one of you sharpen his blade and give ease to his animal.' [Muslim 1955]",
        transliteration:"Inna llāha kataba l-iḥsāna ʿalā kulli shayʾin...",
        note:"كَتَبَ الإِحْسَان = 'decreed excellence as an obligation.' Even slaughtering animals must be done with the sharpest blade, swiftly, away from other animals — Islamic ethics of animal welfare." },
      { id:2, arabic:"الإِحْسَانُ فِي كُلِّ الأَعْمَال:\n• الصَّلَاة: خُشُوع، إِتْمَام الأَرْكَان، تَدَبُّر\n• العَمَل: إِتْقَانٌ وَأَمَانَة: «إِنَّ اللهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ»\n• الطَّعَام: إِعْدَادُهُ بِعِنَايَة لِمَنْ تُحِب\n• التَّعَامُل: حُسْنُ الخُلُق مَعَ كُلِّ أَحَد\n• التَّعَلُّم: الجِدِّيَّة وَالاسْتِيعَاب\n\nالإِحْسَانُ فِي اللُّغَة: أَنْ تَعْبُدَ اللهَ كَأَنَّكَ تَرَاه",
        translation:"Excellence in all acts:\n• Salah: Concentration, completing pillars, reflecting\n• Work: Mastery and trust: 'Allah loves when one of you works, that they do it with excellence.'\n• Food: Preparing it with care for those you love\n• Interaction: Beautiful character with everyone\n• Learning: Seriousness and comprehension\n\nIhsan linguistically: to worship Allah as if you see Him.",
        transliteration:"Al-iḥsānu fī kulli l-aʿmāl.",
        note:"قَالَ الإِمَام النَّوَوِيّ: هَذَا الحَدِيثُ مِنَ الأُصُولِ الجَامِعَة لِلدِّين — 'This hadith is among the comprehensive foundations of the religion.'" }
    ],
    vocabulary:[
      { arabic:"إِحْسَان", transliteration:"iḥsān", english:"excellence / doing the best / ihsan", pos:"noun (m)" },
      { arabic:"كَتَبَ", transliteration:"kataba", english:"wrote / prescribed / decreed", pos:"verb (past)" },
      { arabic:"ذَبَحَ", transliteration:"dhabaḥa", english:"slaughtered (animal)", pos:"verb (past)" },
      { arabic:"شَفْرَة", transliteration:"shafrah", english:"blade / knife", pos:"noun (f)" },
      { arabic:"إِتْقَان", transliteration:"itqān", english:"mastery / perfection / excellence in work", pos:"noun (m)" },
    ],
    grammar:{ title:"وَلْيُحِدَّ — Jussive Command (3rd person)", titleArabic:"فِعْلُ الأَمْرِ الغَائِب: وَلْيُحِدَّ",
      explanation:"«وَلْيُحِدَّ أَحَدُكُمْ شَفْرَتَه» — Let one of you sharpen his blade.\n\nوَ + لَـ + يُحِدَّ (jussive of حَدَّدَ/يُحَدِّد)\n\nNote: يُحِدَّ is from أَحَدَّ يُحِدُّ (to sharpen). The double-letter root (ح-د-د) causes the final letter to double, and in jussive it merges: يُحِدُّ → يُحِدَّ\n\nThis is the same command form as in Hadith 15: فَلْيَقُلْ (let him say).",
      examples:[{ arabic:"وَلْيُحِدَّ أَحَدُكُمْ شَفْرَتَهُ وَلْيُرِحْ ذَبِيحَتَهُ", translation:"Let each of you sharpen his blade and put his animal at ease." }] },
    exercises:[{ type:"choose", instruction:"Hadith 17 — Ihsan in everything.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّابِعَ عَشَر.",
      items:[
        { question:"'Allah has prescribed Ihsan' means:", options:["Excellence is recommended","Excellence is decreed as an obligation","Excellence is only for worship","Excellence is only for the righteous"], answer:1 },
        { question:"In slaughtering, Ihsan means:", options:["Any quick method","Sharpening the blade and putting the animal at ease","Avoiding meat","Asking permission"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:18, title:"Hadith 18 — Fear Allah, Follow Bad with Good", titleArabic:"الحَدِيثُ الثَّامِنَ عَشَر: تَقْوَى اللهِ وَحُسْنُ الخُلُق",
    description:"Three pillars of the Muslim life: Taqwa everywhere, erasing bad deeds with good ones, and beautiful character with all people.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي ذَرٍّ جُنْدُبِ بْنِ جُنَادَةَ وَأَبِي عَبْدِ الرَّحْمَنِ مُعَاذِ بْنِ جَبَلٍ رَضِيَ اللهُ عَنْهُمَا عَنْ رَسُولِ اللهِ ﷺ قَالَ:\n«اتَّقِ اللهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ»\n[الترمذي ١٩٨٧ — حديث حسن]",
        translation:"'Fear Allah wherever you are. Follow a bad deed with a good deed — it will erase it. And treat people with beautiful character.' [Tirmidhi 1987 — Hasan]",
        transliteration:"Ittaqi llāha ḥaythumā kunta, wa atbiʿi s-sayyiʾata l-ḥasanata tamḥuhā, wa khāliqī n-nāsa bi-khuluqin ḥasan.",
        note:"حَيْثُمَا كُنْتَ = wherever you are — in public AND private. Taqwa is 24/7, not just in the masjid. This is the essence of the phrase: 'fear the corner that sees you when no one else does.'" },
      { id:2, arabic:"الثَّلَاثَةُ الوَصَايَا:\n١. التَّقْوَى فِي كُلِّ مَكَان:\nإِحْسَاسٌ دَائِمٌ بِرِقَابَةِ اللهِ — ﴿إِنَّ اللهَ كَانَ عَلَيْكُمْ رَقِيبًا﴾\n\n٢. تَمْحِيَةُ السَّيِّئَات بِالحَسَنَات:\n﴿إِنَّ الحَسَنَاتِ يُذْهِبْنَ السَّيِّئَات﴾ [هُود: ١١٤]\nالتَّوْبَة + الحَسَنَة بَعْدَ السَّيِّئَة = أَهَمُّ عِلَاج\n\n٣. حُسْنُ الخُلُق:\nأَثْقَلُ شَيْءٍ فِي المِيزَان — «مَا شَيْءٌ أَثْقَلُ فِي مِيزَانِ المُؤْمِنِ يَوْمَ القِيَامَةِ مِنْ حُسْنِ الخُلُق»",
        translation:"The Three Counsel:\n1. Taqwa everywhere:\nConstant awareness of Allah's watching — 'Allah is ever watching over you.'\n\n2. Erasing bad with good:\n'Indeed good deeds wipe away bad deeds.' [11:114]\nRepentance + good deed after a bad one = the greatest remedy\n\n3. Beautiful character:\nHeaviest thing on the scale — 'Nothing is heavier on the scale of the believer on Judgment Day than good character.'",
        transliteration:"Ath-thalāthatu l-waṣāyā.",
        note:"خَالِقِ النَّاس = 'have beautiful character with PEOPLE' — not just Muslims. This includes non-Muslims. Prophet ﷺ was known by Makkans as Al-Amin even before his prophethood." }
    ],
    vocabulary:[
      { arabic:"اتَّقِ", transliteration:"ittaqi", english:"fear / be mindful of (command)", pos:"verb (imperative)" },
      { arabic:"حَيْثُمَا", transliteration:"ḥaythumā", english:"wherever / no matter where", pos:"conjunction" },
      { arabic:"أَتْبَعَ", transliteration:"atbaʿa", english:"followed up with / caused to follow", pos:"verb (past)" },
      { arabic:"تَمْحُو", transliteration:"tamḥū", english:"erases / wipes away", pos:"verb (present)" },
      { arabic:"خُلُق", transliteration:"khuluq", english:"character / moral conduct", pos:"noun (m)" },
    ],
    grammar:{ title:"جُمْلَة الحَال — Circumstantial Clause", titleArabic:"جُمْلَةُ الحَال",
      explanation:"«وَأَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا» — تَمْحُهَا here is a حَال (circumstantial clause):\n\n'Follow the bad deed with a good deed [so that it] erases it.'\nThe present verb تَمْحُهَا describes the RESULT/STATE of the action.\n\nHāl answers the question: 'In what state/condition/result?'\n\nMore examples:\n• جَاءَ مُسْرِعًا = He came running (مُسْرِعًا = hāl)\n• خَرَجَ ضَاحِكًا = He went out laughing",
      examples:[{ arabic:"أَتْبِعِ السَّيِّئَةَ الحَسَنَةَ تَمْحُهَا", translation:"Follow the bad deed with good — it will erase it (the hāl shows the result)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 18 — Taqwa and character.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّامِنَ عَشَر.",
      items:[
        { question:"'Fear Allah wherever you are' means:", options:["Only in the masjid","When others are watching","At all times — public and private","During Ramadan only"], answer:2 },
        { question:"What is the remedy for a bad deed according to this hadith?", options:["Repentance alone is enough","Follow it with a good deed that erases it","Sadaqah only","Hajj"], answer:1 }
      ], answers:[2,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:19, title:"Hadith 19 — Guard the Rights of Allah, He Guards You", titleArabic:"الحَدِيثُ التَّاسِعَ عَشَر: احْفَظِ اللهَ يَحْفَظْكَ",
    description:"The profound conversation of the Prophet ﷺ with young Ibn Abbas — a complete guide to relying on Allah.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا قَالَ: كُنْتُ خَلْفَ النَّبِيِّ ﷺ يَوْمًا فَقَالَ:\n«يَا غُلَامُ، إِنِّي أُعَلِّمُكَ كَلِمَاتٍ: احْفَظِ اللهَ يَحْفَظْكَ، احْفَظِ اللهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللهِ، وَاعْلَمْ أَنَّ الأُمَّةَ لَوِ اجْتَمَعَتْ عَلَى أَنْ يَنْفَعُوكَ بِشَيْءٍ لَمْ يَنْفَعُوكَ إِلَّا بِشَيْءٍ قَدْ كَتَبَهُ اللهُ لَكَ»\n[الترمذي ٢٥١٦ — حديث صحيح]",
        translation:"'O young man, I will teach you some words: Guard the rights of Allah, He will guard you. Guard Allah, you will find Him before you. When you ask — ask Allah. When you seek help — seek it from Allah. Know that if the entire nation gathered to benefit you with something, they could only benefit you with what Allah has already written for you.' [Tirmidhi 2516]",
        transliteration:"Iḥfaẓi llāha yaḥfaẓka. Iḥfaẓi llāha tajidhu tujāhak.",
        note:"احْفَظِ اللهَ = guard Allah's rights (His commands and prohibitions). يَحْفَظْكَ = He will guard YOU (your life, family, wealth, deen). The divine guarantee: protect what Allah loves, and Allah protects you." },
      { id:2, arabic:"وَاعْلَمْ أَنَّ النَّصْرَ مَعَ الصَّبْر:\n«وَاعْلَمْ أَنَّ النَّصْرَ مَعَ الصَّبْرِ وَأَنَّ الفَرَجَ مَعَ الكَرْبِ وَأَنَّ مَعَ العُسْرِ يُسْرًا»\n\nالحَدِيثُ يُعَلِّمُ:\n١. التَّوَكُّلُ الصَّحِيح: اطْلُبِ الأَسْبَاب ثُمَّ تَوَكَّلْ على اللهِ\n٢. اليَقِينُ بِالقَدَر: لَا أَحَدٌ يَمْلِكُ نَفْعًا أَوْ ضَرًّا إِلَّا بِإِذْنِ اللهِ\n٣. الاتِّجَاهُ إِلَى اللهِ: فِي كُلِّ حَاجَة وَفِي كُلِّ كَرْبَة",
        translation:"Know that victory comes with patience:\n'Know that victory comes with patience, relief comes with distress, and with hardship comes ease.'\n\nThe hadith teaches:\n1. Correct tawakkul: take means then rely on Allah\n2. Certainty in Qadar: no one owns benefit or harm except by Allah's permission\n3. Turn to Allah: in every need and in every difficulty",
        transliteration:"Al-naṣru maʿa ṣ-ṣabr wa l-faraju maʿa l-karb.",
        note:"ابن عباس كان يَوْمَئِذٍ حَدَثًا صَغِيرًا (young boy). These words were his guide for his entire life. He became one of the greatest scholars of Islam — proof that tawakkul builds great people." }
    ],
    vocabulary:[
      { arabic:"يَحْفَظ", transliteration:"yaḥfaẓ", english:"guards / protects / preserves", pos:"verb (present)" },
      { arabic:"تُجَاهَك", transliteration:"tujāhaka", english:"before you / in front of you", pos:"adverb" },
      { arabic:"اسْتَعَانَ", transliteration:"istaʿāna", english:"sought help from", pos:"verb (past)" },
      { arabic:"فَرَج", transliteration:"faraj", english:"relief / ease after difficulty", pos:"noun (m)" },
      { arabic:"كَرْب", transliteration:"karb", english:"distress / anguish", pos:"noun (m)" },
      { arabic:"تَوَكُّل", transliteration:"tawakkul", english:"reliance on Allah after taking means", pos:"noun (m)" },
    ],
    grammar:{ title:"لَوِ الشَّرْطِيَّة — Hypothetical Conditional", titleArabic:"لَوْ الشَّرْطِيَّة",
      explanation:"«لَوِ اجْتَمَعَتِ الأُمَّةُ عَلَى أَنْ يَنْفَعُوكَ» — لَوْ introduces a HYPOTHETICAL/IMPOSSIBLE condition:\n\nلَوْ + verb (past) → even if [impossible scenario]\n\n'EVEN IF the entire Ummah gathered...' — this extreme example emphasizes: ONLY Allah's decree matters. Creation is powerless except by His permission.\n\nCompare:\n• إِنْ = ordinary condition (if — possible)\n• لَوْ = hypothetical condition (even if — unlikely or impossible)",
      examples:[{ arabic:"«لَوِ اجْتَمَعَ النَّاسُ كُلُّهُمْ عَلَى أَنْ يَقْتُلُوكَ لَمْ يَقْدِرُوا»", translation:"'Even if all people gathered to kill you, they could not — unless Allah permitted it.'" }] },
    exercises:[{ type:"choose", instruction:"Hadith 19 — Guarding Allah's rights.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ التَّاسِعَ عَشَر.",
      items:[
        { question:"'Guard Allah' means:", options:["Defend Islam against critics","Fulfill Allah's commands and avoid His prohibitions","Memorize the Quran","Build mosques"], answer:1 },
        { question:"'If the entire Ummah gathered to harm you...' teaches:", options:["Muslims must unite","Nothing can harm you except by Allah's decree","Political unity is important","Avoid people"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:20, title:"Hadith 20 — Modesty: If No Shame, Do As You Wish", titleArabic:"الحَدِيثُ العِشْرُون: الحَيَاءُ مِنَ الإِيمَان",
    description:"Haya (modesty/shyness) is a distinctive mark of Islam — one of the oldest teachings passed down from the prophets.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي مَسْعُودٍ عُقْبَةَ بْنِ عَمْرٍو الأَنْصَارِيِّ البَدْرِيِّ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«إِنَّ مِمَّا أَدْرَكَ النَّاسُ مِنْ كَلَامِ النُّبُوَّةِ الأُولَى: إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ»\n[البُخَارِيّ ٦١٢٠]",
        translation:"'Among what the people have received from the speech of the earlier prophets: If you have no shame (haya'), then do as you wish.' [Bukhari 6120]",
        transliteration:"Inna mimmā adraka n-nāsu min kalāmi n-nubuwwati l-ūlā: Idhā lam tastaḥi fa-ṣnaʿ mā shiʾta.",
        note:"This is from the original prophetic wisdom — passed down through all prophets. Haya' is part of the universal message of prophethood, not unique to Islam alone." },
      { id:2, arabic:"الحَيَاءُ قِسْمَان:\n١. الحَيَاءُ الصَّحِيح: ارْتِدَاعٌ عَنِ القَبِيح خَشِيَةَ لَوْمِ العُقَلَاء وَخَشِيَةَ اللهِ\n• مِنَ اللهِ: حَيَاءُ العِبَادَة وَالطَّاعَة\n• مِنَ النَّاسِ الصَّالِحِين: حَيَاءٌ اجْتِمَاعِيّ\n• مِنَ النَّفْسِ: الشَّرَف وَالعِفَّة\n\n٢. الحَيَاءُ المَذْمُوم: الحَيَاءُ مِنْ قَوْلِ الحَقِّ أَوِ الأَمْرِ بِالمَعْرُوف\n\n«الحَيَاءُ لَا يَأْتِي إِلَّا بِخَيْر» — النَّبِيُّ ﷺ",
        translation:"Haya has two types:\n1. Correct Haya': Restraining from the shameful out of care for wise people's opinion and Allah's approval:\n• From Allah: haya' of worship and obedience\n• From righteous people: social decency\n• From oneself: honor and chastity\n\n2. Blameworthy Haya': being embarrassed to speak truth or command good\n\n'Haya' brings nothing except good.' — The Prophet ﷺ",
        transliteration:"Al-ḥayāʾu qismān: al-ḥayāʾu ṣ-ṣaḥīḥ wa l-ḥayāʾu l-madhmūm.",
        note:"إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ — this is NOT permission to do anything. It's a WARNING: if a person has lost haya', nothing stops them from any evil — they've lost their internal moral compass." }
    ],
    vocabulary:[
      { arabic:"حَيَاء", transliteration:"ḥayāʾ", english:"modesty / shame / shyness (positive)", pos:"noun (m)" },
      { arabic:"اسْتَحَى", transliteration:"istaḥā", english:"felt shame / was modest", pos:"verb (past)" },
      { arabic:"صَنَعَ", transliteration:"ṣanaʿa", english:"did / made", pos:"verb (past)" },
      { arabic:"شَاءَ", transliteration:"shāʾa", english:"willed / wished", pos:"verb (past)" },
      { arabic:"النُّبُوَّة الأُولَى", transliteration:"an-nubuwwatu l-ūlā", english:"earlier prophethood (previous prophets)", pos:"noun phrase" },
    ],
    grammar:{ title:"إِذَا الشَّرْطِيَّة — Conditional 'When/If'", titleArabic:"إِذَا الشَّرْطِيَّة",
      explanation:"«إِذَا لَمْ تَسْتَحِ فَاصْنَعْ» — إِذَا + verb = 'When/If'\n\nإِذَا typically implies something LIKELY to happen (unlike لَوْ which implies unlikely):\n\nFormula: إِذَا + verb (past/present) + فَ + result\n• إِذَا جَاءَ الصَّيْفُ فَاسْتَعِدّ = When summer comes, prepare\n• إِذَا سَمِعْتَ الأَذَانَ فَأَجِبْ = When you hear the adhan, respond\n\nHere: إِذَا لَمْ تَسْتَحِ = If/when you don't feel shame",
      examples:[{ arabic:"إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ", translation:"If you have no shame — do as you wish (warning: you've lost your moral guard)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 20 — Haya (Modesty).", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ العِشْرِين.",
      items:[
        { question:"From which earlier tradition does 'if no shame, do as you wish' come?", options:["Only from Islam","From the speech of earlier prophets","From Arabic poetry","From the Companions"], answer:1 },
        { question:"Blameworthy haya' is:", options:["Being modest in dress","Being embarrassed to speak truth or command good","Shyness with Allah","Modesty with elders"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:21, title:"Hadith 21 — Say: I Believe, Then Be Steadfast", titleArabic:"الحَدِيثُ الحَادِي وَالعِشْرُون: قُلْ آمَنْتُ ثُمَّ اسْتَقِمْ",
    description:"Two words summarize the path to Allah: Iman and Istiqamah (steadfast perseverance).",
    pages:[
      { id:1, arabic:"عَنْ أَبِي عَمْرٍو وَقِيلَ أَبِي عَمْرَةَ سُفْيَانَ بْنِ عَبْدِ اللهِ رَضِيَ اللهُ عَنْهُ قَالَ:\nقُلْتُ: يَا رَسُولَ اللهِ، قُلْ لِي فِي الإِسْلَامِ قَوْلًا لَا أَسْأَلُ عَنْهُ أَحَدًا غَيْرَكَ.\nقَالَ: «قُلْ: آمَنْتُ بِاللهِ ثُمَّ اسْتَقِمْ»\n[مُسْلِم ٣٨]",
        translation:"'Tell me something about Islam that I won't need to ask anyone else about.' He said: 'Say: I believe in Allah — then be steadfast.' [Muslim 38]",
        transliteration:"Qul: āmantu bi-llāhi thumma staqim.",
        note:"Only 5 Arabic words: «آمَنْتُ بِاللهِ ثُمَّ اسْتَقِمْ» — and they contain the entire religion. Iman = foundation. Istiqamah = lifelong practice. These are the two wings of every Muslim's flight." },
      { id:2, arabic:"الاسْتِقَامَة:\n﴿فَاسْتَقِمْ كَمَا أُمِرْتَ وَمَنْ تَابَ مَعَكَ﴾ [هُود: ١١٢]\nقَالَ النَّبِيُّ ﷺ: «شَيَّبَتْنِي هُودٌ» — لِهَذِهِ الآيَة\n\nمَعْنَى الاسْتِقَامَة:\n• الثَّبَاتُ عَلَى الإِيمَانِ فِي كُلِّ الأَحْوَال\n• العَمَلُ بِمُوجَبِ الإِيمَانِ فِي الأَوَامِرِ وَالنَّوَاهِي\n• الصَّبْرُ عَلَى الطَّاعَةِ حَتَّى المَوْت\n\nضِدُّهَا: الانْحِرَاف، التَّذَبْذُب، النِّفَاق",
        translation:"Istiqamah (Steadfastness):\n'Be steadfast as you have been commanded.' [11:112] — Prophet ﷺ said: 'Surah Hud aged me' — because of this verse\n\nMeaning of Istiqamah:\n• Firmness on Iman in all circumstances\n• Acting on the implications of Iman in commands and prohibitions\n• Perseverance in obedience until death\n\nIts opposite: deviation, wavering, hypocrisy",
        transliteration:"Maʿnā l-istiqāmah.",
        note:"الاسْتِقَامَةُ أَعَزُّ مِنَ الكَرَامَة — 'Steadfastness is more precious than miracles.' A consistent believer who prays, fasts, and serves humbly is more beloved to Allah than one who walks on water but abandons duties." }
    ],
    vocabulary:[
      { arabic:"آمَنَ", transliteration:"āmana", english:"believed (in Allah)", pos:"verb (past)" },
      { arabic:"اسْتَقَامَ", transliteration:"istaqāma", english:"was steadfast / remained firm", pos:"verb (past)" },
      { arabic:"اسْتِقَامَة", transliteration:"istiqāmah", english:"steadfastness / consistency / uprightness", pos:"noun (f)" },
      { arabic:"ثَبَاتٌ", transliteration:"thabāt", english:"firmness / stability / constancy", pos:"noun (m)" },
      { arabic:"انْحِرَاف", transliteration:"inḥirāf", english:"deviation / going astray", pos:"noun (m)" },
    ],
    grammar:{ title:"ثُمَّ — Marking Sequence with Importance", titleArabic:"ثُمَّ لِلتَّرَاخِي وَالتَّعْقِيب",
      explanation:"«آمَنْتُ بِاللهِ ثُمَّ اسْتَقِمْ» — ثُمَّ here marks:\n\n1. Logical sequence: First Iman, THEN Istiqamah (istiqamah flows from iman)\n2. The word ثُمَّ also implies PERSISTENCE — not 'believe and then stop', but 'believe AND MAINTAIN that belief'\n\nThe choice of ثُمَّ over وَ is deliberate:\n• وَ would mean: believe AND be steadfast (simultaneous)\n• ثُمَّ means: believe, AND THEN, as a RESULT, be steadfast (sequential/causal)",
      examples:[{ arabic:"قُلْ آمَنْتُ بِاللهِ ثُمَّ اسْتَقِمْ", translation:"Say: I believe in Allah — then (consistently, persistently) be steadfast" }] },
    exercises:[{ type:"choose", instruction:"Hadith 21 — Iman and Istiqamah.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الحَادِي وَالعِشْرِين.",
      items:[
        { question:"Why did the Prophet ﷺ say 'Surah Hud aged me'?", options:["It's long","The verse commanding Istiqamah shows how serious the responsibility is","It talks about punishment","It has difficult vocabulary"], answer:1 },
        { question:"Istiqamah means:", options:["Performing extra prayers only","Firmness on Iman in all circumstances, acting on its requirements until death","Performing Hajj every year","Being a scholar"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:22, title:"Hadith 22 — Purification is Half of Faith", titleArabic:"الحَدِيثُ الثَّانِي وَالعِشْرُون: الطَّهُورُ شَطْرُ الإِيمَان",
    description:"A comprehensive hadith covering purification, the virtues of core acts of worship, and the scales on Judgment Day.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي مَالِكٍ الأَشْعَرِيِّ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«الطَّهُورُ شَطْرُ الإِيمَانِ، وَالحَمْدُ للهِ تَمْلَأُ المِيزَانَ، وَسُبْحَانَ اللهِ وَالحَمْدُ للهِ تَمْلَآنِ — أَوْ تَمْلَأُ — مَا بَيْنَ السَّمَاوَاتِ وَالأَرْضِ، وَالصَّلَاةُ نُورٌ، وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ، وَالقُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْكَ»\n[مُسْلِم ٢٢٣]",
        translation:"'Purification is half of faith. Alhamdulillah fills the scale. SubhanAllah and Alhamdulillah fill — or fill — what is between the heavens and earth. Prayer is light. Charity is proof. Patience is illumination. The Quran is evidence for or against you.' [Muslim 223]",
        transliteration:"Aṭ-ṭahūru shaṭru l-īmān, wa l-ḥamdu li-llāhi tamlaʾu l-mīzān...",
        note:"الطَّهُور شَطْر الإِيمَان — scholars say: Iman has OUTER (purification, body) and INNER (heart's belief) dimensions. Taharah represents the outer dimension = half." },
      { id:2, arabic:"خَمْسَةُ الأَعْمَالِ العَظِيمَة:\n١. الطَّهَارَة → شَطْرُ الإِيمَان\n٢. الحَمْدُ للهِ → تَمْلَأُ المِيزَان\n٣. سُبْحَانَ اللهِ + الحَمْدُ → تَمْلَآنِ مَا بَيْنَ السَّمَاء وَالأَرْض\n٤. الصَّلَاة → نُور (فِي القَبْرِ وَالقِيَامَة)\n٥. الصَّدَقَة → بُرْهَان عَلَى صِدْقِ الإِيمَان\n٦. الصَّبْر → ضِيَاء (نُور يَقُود)\n٧. القُرْآن → حُجَّة (شَاهِد يَوْمَ القِيَامَة)",
        translation:"Five/Seven Great Acts:\n1. Purification → half of faith\n2. Alhamdulillah → fills the scale\n3. SubhanAllah + Alhamdulillah → fill what's between heaven and earth\n4. Prayer → light (in the grave and on Judgment Day)\n5. Charity → proof of genuine faith\n6. Patience → illumination (light that guides)\n7. Quran → evidence for or against you",
        transliteration:"Khamsat al-aʿmāl al-ʿaẓīmah.",
        note:"القُرْآنُ حُجَّةٌ لَكَ أَوْ عَلَيْك — If you learned it, applied it, lived by it → witness FOR you. If you neglected it → witness AGAINST you. The Quran is not neutral." }
    ],
    vocabulary:[
      { arabic:"طَهُور", transliteration:"ṭahūr", english:"purification / purity (physical and ritual)", pos:"noun (m)" },
      { arabic:"شَطْر", transliteration:"shaṭr", english:"half / portion", pos:"noun (m)" },
      { arabic:"مِيزَان", transliteration:"mīzān", english:"scale / balance (of deeds)", pos:"noun (m)" },
      { arabic:"بُرْهَان", transliteration:"burhān", english:"clear proof / evidence", pos:"noun (m)" },
      { arabic:"ضِيَاء", transliteration:"ḍiyāʾ", english:"illumination / bright light", pos:"noun (m)" },
      { arabic:"حُجَّة", transliteration:"ḥujjah", english:"proof / argument / evidence", pos:"noun (f)" },
    ],
    grammar:{ title:"الجُمْلَة الاسْمِيَّة — Equational Sentences", titleArabic:"الجُمَلُ الاسْمِيَّة فِي الحَدِيث",
      explanation:"This hadith is full of equational sentences (مُبْتَدَأ + خَبَر):\n• الطَّهُورُ شَطْرُ الإِيمَانِ = Purification [is] half of faith\n• الصَّلَاةُ نُورٌ = Prayer [is] light\n• الصَّدَقَةُ بُرْهَانٌ = Charity [is] proof\n\nNote: خَبَر is in the indefinite (نَكِرَة) form → implies 'A great light', 'A definitive proof'\n\nIf they were definite (النُّور، البُرْهَان) → 'Prayer IS THE light' — even stronger exclusivity.",
      examples:[{ arabic:"الصَّلَاةُ نُورٌ — الصَّدَقَةُ بُرْهَانٌ — الصَّبْرُ ضِيَاءٌ", translation:"Prayer is light — Charity is proof — Patience is illumination" }] },
    exercises:[{ type:"choose", instruction:"Hadith 22 — Great acts of worship.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّانِي وَالعِشْرِين.",
      items:[
        { question:"'Prayer is light' refers to:", options:["Prayer burns calories","Prayer provides light in the grave and on Judgment Day","Prayer is done facing Makkah","Prayer is beautiful"], answer:1 },
        { question:"'The Quran is evidence for or against you' means:", options:["The Quran judges all people equally","How you treated the Quran determines whether it testifies for or against you","All memorizers go to Paradise","The Quran doesn't change"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:23, title:"Hadith 23 — Allah's Pure Commands", titleArabic:"الحَدِيثُ الثَّالِثُ وَالعِشْرُون: الحُدُود وَالحَلَال وَالحَرَام",
    description:"Allah's boundaries are defined — do not transgress them. The Quran guides, forbids, and permits.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي ثَعْلَبَةَ الخُشَنِيِّ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«إِنَّ اللهَ فَرَضَ فَرَائِضَ فَلَا تُضَيِّعُوهَا، وَحَدَّ حُدُودًا فَلَا تَعْتَدُوهَا، وَحَرَّمَ أَشْيَاءَ فَلَا تَنْتَهِكُوهَا، وَسَكَتَ عَنْ أَشْيَاءَ رَحْمَةً بِكُمْ غَيْرَ نِسْيَانٍ فَلَا تَبْحَثُوا عَنْهَا»\n[الدَّارَقُطْنِيّ — حديث حسن]",
        translation:"'Allah has obligated obligations — do not neglect them. Set limits — do not transgress them. Forbidden things — do not violate them. And He has been silent about some things — out of mercy for you, not forgetfulness — so do not seek them out.' [Daraqutni — Hasan]",
        transliteration:"Inna llāha faraḍa farāʾiḍa fa-lā tuḍayyiʿūhā, wa ḥadda ḥudūdan fa-lā taʿtadūhā...",
        note:"سَكَتَ عَنْ أَشْيَاء رَحْمَةً — Allah's silence is mercy, not oversight. The things not mentioned = مُبَاحَات (permissible). The Sharia does not need to explicitly permit everything it allows." },
      { id:2, arabic:"الأَقْسَامُ الأَرْبَعَة:\n١. الفَرَائِض: الصَّلَاة، الزَّكَاة، الصَّوْم، الحَجّ — لَا تُهْمَل\n٢. الحُدُود: الحَلَال وَالحَرَام — لَا تُتَجَاوَز\n٣. المُحَرَّمَات: الخَمْر، الزِّنَا، الرِّبَا — لَا تُنْتَهَك\n٤. المُبَاحَات: مَا سَكَتَ عَنْهُ الشَّرْع — عَفْوٌ لَا يُبْحَثُ عَنْهُ\n\n«مَا أَحَلَّ اللهُ فِي كِتَابِهِ فَهُوَ حَلَال وَمَا حَرَّمَ فَهُوَ حَرَام وَمَا سَكَتَ عَنْهُ فَهُوَ عَفْو»",
        translation:"The Four Categories:\n1. Obligations: Prayer, Zakah, Fasting, Hajj — don't neglect\n2. Limits: the halal/haram boundary — don't transgress\n3. Prohibitions: Alcohol, fornication, riba — don't violate\n4. Permissibles: What Sharia is silent about — pardoned, don't seek to restrict\n\n'What Allah permitted in His Book is halal, what He prohibited is haram, what He is silent about is pardoned.'",
        transliteration:"Al-aqsāmu l-arbaʿah: al-farāʾiḍ, al-ḥudūd, al-muḥarramāt, al-mubāḥāt.",
        note:"فَلَا تَبْحَثُوا عَنْهَا — Don't seek out what Allah was silent about. This protects against excessive religiosity that makes religion harder than Allah intended." }
    ],
    vocabulary:[
      { arabic:"فَرَضَ", transliteration:"faraḍa", english:"obligated / made compulsory", pos:"verb (past)" },
      { arabic:"فَرِيضَة", transliteration:"farīḍah", english:"obligation / duty", pos:"noun (f)", plural:"فَرَائِض" },
      { arabic:"حُدُود", transliteration:"ḥudūd", english:"limits / boundaries", pos:"noun (m.pl)" },
      { arabic:"اعْتَدَى", transliteration:"iʿtadā", english:"transgressed / exceeded the limit", pos:"verb (past)" },
      { arabic:"سَكَتَ", transliteration:"sakata", english:"was silent about / did not speak of", pos:"verb (past)" },
    ],
    grammar:{ title:"فَلَا — Command for Omission", titleArabic:"النَّهْيُ المُفَسَّر بِـ فَلَا",
      explanation:"«فَلَا تُضَيِّعُوهَا» — فَ (consequence) + لَا (prohibitive) + تُضَيِّعُوا (jussive plural):\n\n'Therefore, do NOT neglect them.'\n\nThe فَ creates a logical connection: Since Allah obligated → therefore don't neglect.\n\nThis pattern appears three times:\n• فَلَا تُضَيِّعُوهَا (don't neglect them — farāʾid)\n• فَلَا تَعْتَدُوهَا (don't transgress them — ḥudūd)\n• فَلَا تَنْتَهِكُوهَا (don't violate them — muḥarramāt)",
      examples:[{ arabic:"وَسَكَتَ عَنْ أَشْيَاءَ رَحْمَةً بِكُمْ فَلَا تَبْحَثُوا عَنْهَا", translation:"He was silent about some things out of mercy for you — so don't seek them out" }] },
    exercises:[{ type:"choose", instruction:"Hadith 23 — Allah's categories of rulings.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّالِثِ وَالعِشْرِين.",
      items:[
        { question:"Why did Allah remain silent about some things?", options:["He forgot","Out of mercy for us — they are pardoned","They are forbidden","Scholars must decide"], answer:1 },
        { question:"About the things Allah was silent about, we should:", options:["Seek scholarly opinions to restrict them","Leave them as permissible and don't seek to limit them","Avoid them to be safe","Follow majority custom"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:24, title:"Hadith 24 — Prohibition of All Injustice (Hadith Qudsi)", titleArabic:"الحَدِيثُ الرَّابِعُ وَالعِشْرُون: تَحْرِيمُ الظُّلْم",
    description:"One of the most comprehensive Hadith Qudsi — Allah's direct command against all forms of oppression.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي ذَرٍّ الغِفَارِيِّ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ فِيمَا يَرْوِيهِ عَنْ رَبِّهِ تَبَارَكَ وَتَعَالَى أَنَّهُ قَالَ:\n«يَا عِبَادِي إِنِّي حَرَّمْتُ الظُّلْمَ عَلَى نَفْسِي وَجَعَلْتُهُ بَيْنَكُمْ مُحَرَّمًا فَلَا تَظَالَمُوا.\nيَا عِبَادِي كُلُّكُمْ ضَالٌّ إِلَّا مَنْ هَدَيْتُهُ فَاسْتَهْدُونِي أَهْدِكُمْ.\nيَا عِبَادِي كُلُّكُمْ جَائِعٌ إِلَّا مَنْ أَطْعَمْتُهُ فَاسْتَطْعِمُونِي أُطْعِمْكُمْ.»\n[مُسْلِم ٢٥٧٧]",
        translation:"Allah (in Hadith Qudsi) says: 'O My servants, I have forbidden oppression for Myself and made it forbidden among you — so do not oppress one another. O My servants, all of you are astray except those whom I guide — so seek guidance from Me. O My servants, all of you are hungry except those whom I feed — so ask Me for food.' [Muslim 2577]",
        transliteration:"Yā ʿibādī, innī ḥarramtu ẓ-ẓulma ʿalā nafsī wa jaʿaltuhu baynakum muḥarraman fa-lā taẓālamū.",
        note:"حَدِيثٌ قُدْسِيّ = Allah's words, narrated by the Prophet ﷺ. Different from Quran: Quran is Allah's words with miraculous expression; Hadith Qudsi is the meaning in the Prophet's narration form." },
      { id:2, arabic:"يَا عِبَادِي — النِّدَاءُ الخَمْسَة:\n١. الظُّلْمُ مُحَرَّمٌ على اللهِ وَعَلَيْكُم → لَا تَظَالَمُوا\n٢. كُلُّكُمْ ضَالٌّ → فَاسْتَهْدُونِي\n٣. كُلُّكُمْ جَائِع → فَاسْتَطْعِمُونِي\n٤. كُلُّكُمْ عَارٍ → فَاسْتَكْسُونِي\n٥. أَعْمَالُكُمْ → أَحْصِيهَا وَأُوَفِّيكُمْ بِهَا إِيَّاهَا\n\n«لَوْ أَنَّ أَوَّلَكُمْ وَآخِرَكُمْ وَإِنْسَكُمْ وَجِنَّكُمْ كَانُوا عَلَى أَتْقَى قَلْبِ رَجُلٍ وَاحِدٍ مَا زَادَ ذَلِكَ فِي مُلْكِي شَيْئًا»",
        translation:"The Five Callings 'O My Servants':\n1. Oppression forbidden for Me and you → don't oppress each other\n2. All of you are astray → so seek guidance from Me\n3. All of you are hungry → so ask Me for food\n4. All of you are naked → so ask Me for clothing\n5. Your deeds → I count and reward them fully\n\n'Even if all of you — first and last, jinn and human — had the heart of the most pious person, that would not add to My dominion.'",
        transliteration:"Yā ʿibādī — an-nidāʾu l-khamsah.",
        note:"This hadith demonstrates total human dependence on Allah. The proper response to this is: gratitude, humility, and constant dua — not arrogance or self-sufficiency." }
    ],
    vocabulary:[
      { arabic:"حَرَّمَ", transliteration:"ḥarrama", english:"forbade / made forbidden", pos:"verb (past)" },
      { arabic:"ظُلْم", transliteration:"ẓulm", english:"oppression / injustice / wrongdoing", pos:"noun (m)" },
      { arabic:"اسْتَهَدَى", transliteration:"istahdā", english:"sought guidance from", pos:"verb (past)" },
      { arabic:"ضَالّ", transliteration:"ḍāll", english:"astray / misguided", pos:"adjective" },
      { arabic:"حَدِيث قُدْسِيّ", transliteration:"ḥadīth qudsiyy", english:"a hadith in which the Prophet narrates Allah's words", pos:"noun phrase" },
    ],
    grammar:{ title:"فَاسْتَفْعِلُونِي — Request Form (Seeking from Allah)", titleArabic:"صِيغَةُ الاسْتِفْعَال: طَلَبُ الفِعْل",
      explanation:"فَاسْتَهْدُونِي = 'So SEEK GUIDANCE from Me!'\n\nاسْتَفْعَلَ = a verb form meaning 'to seek/ask for [the root action]':\n• هَدَى (guided) → اسْتَهْدَى (sought guidance)\n• أَطْعَمَ (fed) → اسْتَطْعَمَ (asked for food)\n• غَفَرَ (forgave) → اسْتَغْفَرَ (sought forgiveness)\n\nWhen directed to Allah:\n• اسْتَهْدِنِي = guide me!\n• اسْتَغْفِرِ اللهَ = seek Allah's forgiveness\n• اسْتَعِنْ بِاللهِ = seek Allah's help",
      examples:[{ arabic:"فَاسْتَهْدُونِي أَهْدِكُمْ — فَاسْتَطْعِمُونِي أُطْعِمْكُمْ", translation:"So seek guidance from Me — I will guide you. Ask Me for food — I will feed you." }] },
    exercises:[{ type:"choose", instruction:"Hadith 24 — Prohibition of oppression.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الرَّابِعِ وَالعِشْرِين.",
      items:[
        { question:"What is a Hadith Qudsi?", options:["A weak hadith","A hadith where the Prophet narrates Allah's own words","A hadith about the Quran only","A fabricated narration"], answer:1 },
        { question:"'All of you are astray except those I guide' teaches:", options:["Predestination removes responsibility","Complete dependence on Allah for guidance — seek it from Him","Everyone goes to hellfire","Humans are evil"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:25, title:"Hadith 25 — Charity for Every Joint Every Day", titleArabic:"الحَدِيثُ الخَامِسُ وَالعِشْرُون: الصَّدَقَةُ عَنْ كُلِّ سُلَامَى",
    description:"Every day requires gratitude for each bone in your body — prayer at Duha fulfills this debt beautifully.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«كُلُّ سُلَامَى مِنَ النَّاسِ عَلَيْهِ صَدَقَةٌ، كُلَّ يَوْمٍ تَطْلُعُ فِيهِ الشَّمْس: تَعْدِلُ بَيْنَ اثْنَيْنِ صَدَقَةٌ، وَتُعِينُ الرَّجُلَ فِي دَابَّتِهِ فَتَحْمِلُهُ عَلَيْهَا أَوْ تَرْفَعُ لَهُ مَتَاعَهُ صَدَقَةٌ، وَالكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ، وَبِكُلِّ خُطْوَةٍ تَمْشِيهَا إِلَى الصَّلَاةِ صَدَقَةٌ، وَتُمِيطُ الأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ»\n[البُخَارِيّ ٢٩٨٩ — مُسْلِم ١٠٠٩]",
        translation:"'Every joint of a person must give charity every day the sun rises: making justice between two is charity, helping someone with their animal to mount it or lift their load is charity, a good word is charity, every step to prayer is charity, and removing harm from the road is charity.' [Bukhari 2989, Muslim 1009]",
        transliteration:"Kullu sulāmā mina n-nāsi ʿalayhi ṣadaqah, kulla yawmin taṭluʿu fīhi sh-shams...",
        note:"The human body has 360 joints (sulāmā). Each requires a daily 'payment' of gratitude. This teaches: gratitude is not just words — it's SERVICE to others." },
      { id:2, arabic:"وَيُجْزِئُ مِنْ ذَلِكَ رَكْعَتَانِ يَرْكَعُهُمَا مِنَ الضُّحَى:\n\nصَلَاةُ الضُّحَى: تُكَفِّي جَمِيعَ الصَّدَقَات\nوَقْتُهَا: مِنَ ارْتِفَاعِ الشَّمْسِ إِلَى قَبْيلِ الزَّوَال\nأَقَلُّهَا: رَكْعَتَان — أَكْثَرُهَا: ثَمَانِي رَكَعَات\n\nأَنْوَاعُ الصَّدَقَات المَذْكُورَة:\n• العَدْلُ بَيْنَ النَّاسِ → صَدَقَة\n• إِعَانَةُ المُحْتَاجِ → صَدَقَة\n• الكَلِمَةُ الطَّيِّبَة → صَدَقَة\n• المَشْيُ إِلَى الصَّلَاة → صَدَقَة\n• إِزَالَةُ الأَذَى → صَدَقَة",
        translation:"Two rak'ahs of Duha prayer cover all these charities:\n\nDuha Prayer: Covers all 360 joints' charities\nTime: From when the sun rises until just before midday\nMinimum: 2 rak'ahs — maximum: 8 rak'ahs\n\nTypes of charities mentioned:\n• Justice between people → charity\n• Helping the needy → charity\n• Good word → charity\n• Walking to prayer → charity\n• Removing harm → charity",
        transliteration:"Ṣalātu ḍ-ḍuḥā tukaffī jamīʿa ṣ-ṣadaqāt.",
        note:"Islam transforms DAILY LIFE into worship. Smiling, helping, speaking kindly — all become acts of charity. This is how the Muslim turns every moment into an opportunity for reward." }
    ],
    vocabulary:[
      { arabic:"سُلَامَى", transliteration:"sulāmā", english:"joint (of the body)", pos:"noun (f)", plural:"سُلَامَيَات" },
      { arabic:"تَعْدِل", transliteration:"taʿdilu", english:"makes just / arbitrates fairly", pos:"verb (present)" },
      { arabic:"تُمِيط", transliteration:"tumīṭu", english:"removes / clears away", pos:"verb (present)" },
      { arabic:"أَذَى", transliteration:"adhan", english:"harm / something harmful", pos:"noun (m)" },
      { arabic:"يُجْزِئ", transliteration:"yujziʾ", english:"suffices / fulfills the requirement", pos:"verb (present)" },
    ],
    grammar:{ title:"كُلّ + مَنْصُوب — Each/Every with Accusative", titleArabic:"كُلٌّ مَعَ المَنْصُوب",
      explanation:"«كُلَّ يَوْمٍ» — كُلّ here is in the accusative (منصوب) because it's a time adverb:\n\n• كُلَّ يَوْمٍ = every day (ظَرْف زَمَان، مَنْصُوب)\n• كُلَّ لَيْلَة = every night\n• كُلَّ جُمُعَة = every Friday\n\nWhen كُلّ is a SUBJECT (مُبْتَدَأ) it stays مَرْفُوع:\n• كُلُّ سُلَامَى عَلَيْهِ صَدَقَةٌ (مُبْتَدَأ مَرْفُوع)\n\nWhen it's a TIME ADVERB it's مَنْصُوب:\n• كُلَّ يَوْمٍ (زَمَان مَنْصُوب)",
      examples:[{ arabic:"كُلُّ سُلَامَى مِنَ النَّاسِ عَلَيْهِ صَدَقَةٌ — كُلَّ يَوْمٍ تَطْلُعُ فِيهِ الشَّمْس", translation:"Every joint of a person owes charity — every day the sun rises" }] },
    exercises:[{ type:"choose", instruction:"Hadith 25 — Charity for every joint.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الخَامِسِ وَالعِشْرِين.",
      items:[
        { question:"How many joints (sulāmā) does a human have according to Islamic medicine?", options:["100","360","260","500"], answer:1 },
        { question:"What fulfills the charity for ALL 360 joints in a simple way?", options:["Giving money daily","Two rak'ahs of Duha prayer","Fasting","Reading Quran for one hour"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:26, title:"Hadith 26 — Every Good Deed is Charity", titleArabic:"الحَدِيثُ السَّادِسُ وَالعِشْرُون: كُلُّ مَعْرُوفٍ صَدَقَة",
    description:"Islam expands the definition of charity far beyond money — every good deed towards another being is sadaqah.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«كُلُّ مَعْرُوفٍ صَدَقَةٌ»\n[البُخَارِيّ ٦٠٢١]\n\nوَعَنْ جَابِرٍ رَضِيَ اللهُ عَنْهُ:\n«كُلُّ مَعْرُوفٍ صَدَقَةٌ وَإِنَّ مِنَ المَعْرُوفِ أَنْ تَلْقَى أَخَاكَ بِوَجْهٍ طَلْقٍ وَأَنْ تُفْرِغَ مِنْ دَلْوِكَ فِي إِنَاءِ أَخِيك»\n[الترمذي]",
        translation:"'Every act of goodness (ma'ruf) is charity.' [Bukhari 6021]\n\nFrom Jabir RA: 'Every good deed is charity, and among goodness: meeting your brother with a cheerful face, and pouring from your bucket into your brother's vessel.' [Tirmidhi]",
        transliteration:"Kullu maʿrūfin ṣadaqah.",
        note:"مَعْرُوف = 'known/recognized good' — the Arabic word for goodness is linked to what is 'known' to be good by sound human nature. Sadaqah = purification and growth." },
      { id:2, arabic:"أَنْوَاعُ المَعْرُوف الَّذِي هُوَ صَدَقَة:\n• الابْتِسَامَة: «تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَة»\n• إِرْشَادُ الضَّالّ: «وَإِرْشَادُكَ الرَّجُلَ فِي أَرْضِ الضَّلَالَةِ صَدَقَة»\n• إِمَاطَةُ الأَذَى: «وَإِمَاطَتُكَ الأَذَى وَالشَّوْكَةَ وَالعَظْمَ عَنِ الطَّرِيقِ صَدَقَة»\n• الكَلِمَة الطَّيِّبَة: «وَبِكُلِّ تَسْبِيحَةٍ صَدَقَة وَبِكُلِّ تَحْمِيدَةٍ صَدَقَة»\n• البَصَر النَّافِع: «إِبْصَارُكَ لِلرَّجُلِ الرَّدِيء البَصَرِ لَكَ صَدَقَة»",
        translation:"Types of ma'ruf that are charity:\n• Smiling: 'Your smile at your brother is charity'\n• Guiding the lost: 'Guiding a person in a land of confusion is charity'\n• Removing harm: 'Removing harm, a thorn, or bone from the road is charity'\n• Good word: 'Every SubhanAllah is charity, every Alhamdulillah is charity'\n• Helping the visually impaired navigate: 'charity'",
        transliteration:"Anwāʿu l-maʿrūf alladhī huwa ṣadaqah.",
        note:"This hadith revolutionizes generosity. You don't need money to give sadaqah. Your smile, your direction-giving, your good words — all are currency with Allah." }
    ],
    vocabulary:[
      { arabic:"مَعْرُوف", transliteration:"maʿrūf", english: "goodness / recognized good deed / kindness", pos:"noun (m)" },
      { arabic:"صَدَقَة", transliteration:"ṣadaqah", english:"charity / charitable act", pos:"noun (f)" },
      { arabic:"طَلْق", transliteration:"ṭalq", english:"cheerful / open (face)", pos:"adjective" },
      { arabic:"دَلْو", transliteration:"dalw", english:"bucket / pail", pos:"noun (m)" },
      { arabic:"تَبَسُّم", transliteration:"tabassum", english:"smiling", pos:"noun (m)" },
    ],
    grammar:{ title:"الجُمْلَة الاسْمِيَّة المُفِيدَة لِلعُمُوم", titleArabic:"العُمُوم فِي الجُمْلَة الاسْمِيَّة",
      explanation:"«كُلُّ مَعْرُوفٍ صَدَقَةٌ» — كُلّ + indefinite noun (نَكِرَة) = EVERY:\n\n'EVERY goodness is charity' — كُلّ + مَعْرُوف (نَكِرَة) = universal statement.\n\nIf it said المَعْرُوف (definite): 'The recognized goodness is charity' — still general but slightly narrower.\n\nكُلّ + نَكِرَة = the broadest possible universal:\n• كُلُّ نَفْسٍ ذَائِقَةُ المَوْت = Every soul will taste death\n• كُلُّ مُسْلِمٍ عَلَى المُسْلِمِ حَرَامٌ = Every Muslim's [rights are sacred to the Muslim]",
      examples:[{ arabic:"كُلُّ مَعْرُوفٍ صَدَقَةٌ — كُلُّ سُلَامَى صَدَقَةٌ", translation:"Every good deed is charity — every joint [owes] charity" }] },
    exercises:[{ type:"choose", instruction:"Hadith 26 — Ma'ruf as sadaqah.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّادِسِ وَالعِشْرِين.",
      items:[
        { question:"'Every ma'ruf is sadaqah' teaches:", options:["Only money is charity","Goodness in any form is charity with Allah","Charity requires witnesses","Only zakat counts"], answer:1 },
        { question:"Which of these is mentioned as sadaqah in the hadiths?", options:["Owning property","Smiling at your Muslim brother","Only praying more","Only fasting voluntarily"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:27, title:"Hadith 27 — Righteousness is Good Character", titleArabic:"الحَدِيثُ السَّابِعُ وَالعِشْرُون: البِرُّ حُسْنُ الخُلُق",
    description:"The definition of righteousness and sin from the Prophet's own words — anchored in the heart and conscience.",
    pages:[
      { id:1, arabic:"عَنِ النَّوَّاسِ بْنِ سَمْعَانَ الأَنْصَارِيِّ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ قَالَ:\n«البِرُّ حُسْنُ الخُلُقِ، وَالإِثْمُ مَا حَاكَ فِي نَفْسِكَ وَكَرِهْتَ أَنْ يَطَّلِعَ عَلَيْهِ النَّاسُ»\n[مُسْلِم ٢٥٥٣]\n\nوَعَنْ وَابِصَةَ بْنِ مَعْبَدٍ رَضِيَ اللهُ عَنْهُ:\n«جِئْتُ إِلَى رَسُولِ اللهِ ﷺ أَسْأَلُهُ عَنِ البِرِّ وَالإِثْمِ. فَقَالَ: اسْتَفْتِ قَلْبَكَ — البِرُّ مَا اطْمَأَنَّتْ إِلَيْهِ النَّفْسُ وَالإِثْمُ مَا حَاكَ فِي النَّفْسِ»\n[أحمد — حديث حسن]",
        translation:"'Righteousness is beautiful character. Sin is what troubles the heart and what you dislike others to see.' [Muslim 2553]\n\nFrom Wabisah: 'I came to the Prophet to ask about righteousness and sin. He said: Ask your heart — righteousness is what the soul is at peace with. Sin is what troubles the soul.' [Ahmad — Hasan]",
        transliteration:"Al-birru ḥusnu l-khuluq, wa l-ithmu mā ḥāka fī nafsika wa kariha an yaṭṭaliʿa ʿalayhi n-nās.",
        note:"حَاكَ = 'troubled / disturbed' — from the word for sawing/rubbing. Sin DISTURBS the pure heart as a saw disturbs wood. The metaphor is precise." },
      { id:2, arabic:"ثَلَاثَةُ مَعَايِيرَ لِمَعْرِفَةِ البِرِّ وَالإِثْم:\n١. الخُلُق الحَسَن: العَلَامَةُ الخَارِجِيَّة — الأَدَب مَعَ الكُلّ\n٢. اطْمِئْنَانُ النَّفْس: العَلَامَةُ الدَّاخِلِيَّة — هَلْ يُرِيحُ؟\n٣. الكَرَاهِيَةُ مِنَ الاطِّلَاع: هَلْ تُحِبُّ أَنَّ الصَّالِحِينَ يَرَوْنَهُ؟\n\nمِيزَانُ الصَّالِح: «اسْأَلْ قَلْبَكَ» — شَرْطُ صَلَاحِ القَلْب أَوَّلًا\n«اسْتَفْتِ قَلْبَكَ وَإِنْ أَفْتَاكَ النَّاسُ وَأَفْتَوْكَ»",
        translation:"Three tests to know righteousness and sin:\n1. Good character: External sign — politeness with everyone\n2. Heart's peace: Internal sign — does it settle the heart?\n3. Disliking others to see: Would you be ashamed if the righteous saw it?\n\nThe test of the righteous: 'Ask your heart' — ONLY works if the heart is healthy.\n'Consult your heart, even if people give you verdicts.'",
        transliteration:"Thalāthat maʿāyīr li-maʿrifati l-birri wa l-ithm.",
        note:"هَذَا لِمَنْ زَكَّى قَلْبَه — The conscience test only works for those who have purified their heart. A corrupt heart is unreliable. First step: purify the heart through worship and taqwa." }
    ],
    vocabulary:[
      { arabic:"بِرّ", transliteration:"birr", english:"righteousness / goodness / piety", pos:"noun (m)" },
      { arabic: "إِثْم", transliteration:"ithm", english:"sin / wrongdoing", pos:"noun (m)" },
      { arabic:"حَاكَ", transliteration:"ḥāka", english:"troubled / disturbed (the heart)", pos:"verb (past)" },
      { arabic:"اطْمَأَنَّ", transliteration:"iṭmaʾanna", english:"was at peace / was tranquil", pos:"verb (past)" },
      { arabic:"اسْتَفْتَى", transliteration:"istaftā", english:"sought a verdict / consulted", pos:"verb (past)" },
    ],
    grammar:{ title:"مَا المَوْصُولَة — Relative Clause with مَا", titleArabic:"مَا المَوْصُولَة",
      explanation:"«الإِثْمُ مَا حَاكَ» — مَا here is a RELATIVE PRONOUN meaning 'that which / what':\n\n'Sin is THAT WHICH troubles your heart'\n\nمَا + verb = 'what/that which [verb]':\n• مَا حَاكَ = what troubles\n• مَا اطْمَأَنَّتْ إِلَيْهِ = what (the soul) is at peace with\n• مَا كَرِهَ = what he disliked\n\nThis is different from the interrogative مَا (what?) and the negative مَا (not).",
      examples:[{ arabic:"«البِرُّ مَا اطْمَأَنَّتْ إِلَيْهِ النَّفْسُ وَالإِثْمُ مَا حَاكَ فِي النَّفْس»", translation:"Righteousness is what the soul is at peace with, and sin is what troubles the soul." }] },
    exercises:[{ type:"choose", instruction:"Hadith 27 — Righteousness and sin.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّابِعِ وَالعِشْرِين.",
      items:[
        { question:"According to this hadith, righteousness is:", options:["Performing extra prayers","Beautiful character","Reading Quran every day","Fasting Mondays and Thursdays"], answer:1 },
        { question:"The 'ask your heart' test works ONLY when:", options:["You are a scholar","The heart is healthy and purified through taqwa","You have memorized the Quran","You are alone"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:28, title:"Hadith 28 — Hold Fast to the Sunnah", titleArabic:"الحَدِيثُ الثَّامِنُ وَالعِشْرُون: التَّمَسُّكُ بِالسُّنَّة",
    description:"The prophetic prescription for the Ummah after him: hold to the Sunnah and the way of the Rightly-Guided Caliphs.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي نَجِيحٍ العِرْبَاضِ بْنِ سَارِيَةَ رَضِيَ اللهُ عَنْهُ قَالَ: وَعَظَنَا رَسُولُ اللهِ ﷺ مَوْعِظَةً وَجِلَتْ مِنْهَا القُلُوبُ وَذَرَفَتْ مِنْهَا العُيُون.\nفَقُلْنَا: يَا رَسُولَ اللهِ كَأَنَّهَا مَوْعِظَةُ مُوَدِّعٍ فَأَوْصِنَا. قَالَ:\n«أُوصِيكُمْ بِتَقْوَى اللهِ وَالسَّمْعِ وَالطَّاعَةِ وَإِنْ تَأَمَّرَ عَلَيْكُمْ عَبْدٌ، وَإِنَّهُ مَنْ يَعِشْ مِنْكُمْ فَسَيَرَى اخْتِلَافًا كَثِيرًا، فَعَلَيْكُمْ بِسُنَّتِي وَسُنَّةِ الخُلَفَاءِ الرَّاشِدِينَ المَهْدِيِّينَ، عَضُّوا عَلَيْهَا بِالنَّوَاجِذِ، وَإِيَّاكُمْ وَمُحْدَثَاتِ الأُمُورِ فَإِنَّ كُلَّ بِدْعَةٍ ضَلَالَةٌ»\n[أبو داود — الترمذي — صحيح]",
        translation:"He gave us an admonition that made hearts tremble and eyes weep. We said: 'This feels like a farewell sermon — advise us!' He said: 'I advise you: taqwa and listening and obeying [the leader] even if a slave is placed over you. Whoever of you lives will see much disagreement — hold to MY Sunnah and the Sunnah of the Rightly-Guided Caliphs — bite onto it with your molar teeth. Beware of newly invented matters — every innovation is misguidance.' [Abu Dawud, Tirmidhi]",
        transliteration:"ʿalaykum bi-sunnатī wa sunnati l-khulafāʾi r-rāshidīna l-mahdiyyīn, ʿaḍḍū ʿalayhā bi-n-nawājidhи.",
        note:"عَضُّوا بِالنَّوَاجِذِ = 'bite onto it with the molar teeth' — the molar is the STRONGEST tooth, used to hold on firmly. This is the most intense metaphor for holding to the Sunnah." },
      { id:2, arabic:"الوَصَايَا الأَرْبَع:\n١. تَقْوَى اللهِ — الأَسَاس\n٢. السَّمْع وَالطَّاعَة — لِوَلِيِّ الأَمْرِ فِي المَعْرُوف\n٣. التَّمَسُّك بِالسُّنَّة — سُنَّةُ النَّبِيِّ وَالخُلَفَاءِ الرَّاشِدِين\n٤. الابْتِعَادُ عَنِ البِدَع — كُلُّ بِدْعَةٍ ضَلَالَة\n\nالخُلَفَاءُ الرَّاشِدُونَ الأَرْبَعَة:\n• أَبُو بَكْرٍ الصِّدِّيق\n• عُمَرُ بْنُ الخَطَّاب\n• عُثْمَانُ بْنُ عَفَّان\n• عَلِيُّ بْنُ أَبِي طَالِب",
        translation:"The Four Counsels:\n1. Taqwa — the foundation\n2. Listening and obeying the leader in good\n3. Holding to the Sunnah of the Prophet and Rightly-Guided Caliphs\n4. Avoiding innovations — every bid'ah is misguidance\n\nThe Four Rightly-Guided Caliphs:\n• Abu Bakr Al-Siddiq\n• Umar ibn Al-Khattab\n• Uthman ibn Affan\n• Ali ibn Abi Talib",
        transliteration:"Al-waṣāyā l-arbaʿ.",
        note:"كَأَنَّهَا مَوْعِظَةُ مُوَدِّعٍ — 'as if it's a farewell sermon' — this hadith captures a moment where the companions could sense the Prophet's ﷺ approaching departure. The urgency of his message." }
    ],
    vocabulary:[
      { arabic:"وَعَظَ", transliteration:"waʿaẓa", english:"admonished / gave a sermon", pos:"verb (past)" },
      { arabic:"وَجِلَتْ", transliteration:"wajilat", english:"trembled / became fearful (hearts)", pos:"verb (past)" },
      { arabic:"ذَرَفَتْ", transliteration:"dharafat", english:"flowed (tears)", pos:"verb (past)" },
      { arabic:"النَّوَاجِذ", transliteration:"an-nawājidh", english:"molar teeth (back teeth)", pos:"noun (m.pl)" },
      { arabic:"ضَلَالَة", transliteration:"ḍalālah", english:"misguidance / going astray", pos:"noun (f)" },
    ],
    grammar:{ title:"إِيَّاكُمْ وَ — Strong Warning Formula", titleArabic:"إِيَّاكُمْ وَ لِلتَّحْذِير",
      explanation:"«إِيَّاكُمْ وَمُحْدَثَاتِ الأُمُورِ» — a powerful warning formula:\n\nإِيَّاكُمْ + وَ + what to avoid = 'Beware of [X]!'\n\n• إِيَّاكَ وَالكَذِبَ = Beware of lying!\n• إِيَّاكُمْ وَالغِيبَة = Beware of backbiting!\n• إِيَّاكُمْ وَالحَسَد = Beware of envy!\n\nThe وَ here is وَاو التَّحْذِير (waw of warning), not simple conjunction.",
      examples:[{ arabic:"إِيَّاكُمْ وَمُحْدَثَاتِ الأُمُورِ فَإِنَّ كُلَّ بِدْعَةٍ ضَلَالَةٌ", translation:"Beware of newly invented matters — for every innovation is misguidance" }] },
    exercises:[{ type:"choose", instruction:"Hadith 28 — Sunnah and Bid'ah.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّامِنِ وَالعِشْرِين.",
      items:[
        { question:"'Bite onto it with molar teeth' is a metaphor for:", options:["Eating halal food","Holding firmly to the Sunnah","Praying loudly","Physical jihad"], answer:1 },
        { question:"The Rightly-Guided Caliphs (Khulafa Rashidun) are:", options:["Only the 12 imams of Shia","Abu Bakr, Umar, Uthman, and Ali","The companions of Badr","All caliphs until the Ottoman era"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:29, title:"Hadith 29 — Teaching Good is Like Doing Good", titleArabic:"الحَدِيثُ التَّاسِعُ وَالعِشْرُون: الدَّالُّ عَلَى الخَيْرِ كَفَاعِلِهِ",
    description:"The multiplying power of teaching and sharing good — you receive the reward of everyone you guide.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي مَسْعُودٍ عُقْبَةَ بْنِ عَمْرٍو الأَنْصَارِيِّ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ»\n[مُسْلِم ١٨٩٣]\n\nوَعَنْ أَبِي هُرَيْرَةَ:\n«مَنْ دَعَا إِلَى هُدًى كَانَ لَهُ مِنَ الأَجْرِ مِثْلُ أُجُورِ مَنِ اتَّبَعَهُ لَا يَنْقُصُ ذَلِكَ مِنْ أُجُورِهِمْ شَيْئًا»\n[مُسْلِم ٢٦٧٤]",
        translation:"'Whoever guides to a good deed, for him is a reward like the one who did it.' [Muslim 1893]\n\nFrom Abu Hurayrah: 'Whoever calls to guidance — for him is a reward like those who follow him, without diminishing their rewards at all.' [Muslim 2674]",
        transliteration:"Man dalla ʿalā khayrin fa-lahu mithlu ajri fāʿilih.",
        note:"لَا يَنْقُصُ ذَلِكَ مِنْ أُجُورِهِمْ شَيْئًا — 'without diminishing their rewards at all'. The reward is DUPLICATED, not SHARED. Both the teacher and the student get FULL reward." },
      { id:2, arabic:"وَقَابِلُ ذَلِكَ:\n«مَنْ دَعَا إِلَى ضَلَالَةٍ كَانَ عَلَيْهِ مِنَ الإِثْمِ مِثْلُ آثَامِ مَنِ اتَّبَعَهُ»\nفَالدَّاعِي إِلَى الشَّرِّ يَحْمِلُ وِزْرَ كُلِّ مَنِ اتَّبَعَهُ!\n\nالتَّطْبِيق:\n• مَنْ عَلَّمَ شَخْصًا الصَّلَاة → أَجْرُ صَلَاتِهِ كُلَّهَا\n• مَنْ نَشَرَ خَيْرًا فِي وَسَائِلِ التَّوَاصُل → أَجْرُ مَنِ انْتَفَعَ\n• مَنْ دَلَّ إِنْسَانًا عَلَى إِسْلَامٍ → أَجْرُ إِسْلَامِهِ",
        translation:"Its opposite:\n'Whoever calls to misguidance bears the sin of all who follow him — without reducing their sins.'\nThe caller to evil carries the burden of everyone who follows him!\n\nApplication:\n• Whoever taught someone prayer → reward of all their prayers\n• Whoever shares good on social media → reward of those who benefit\n• Whoever guided someone to Islam → reward of their entire Islam",
        transliteration:"Wa qābiluhu: man daʿā ilā ḍalālatin...",
        note:"نَشْرُ العِلْمِ هُوَ أَعْظَمُ الصَّدَقَاتِ الجَارِيَة — spreading knowledge is among the greatest forms of continuing charity (sadaqah jariyah) because the reward continues after your death." }
    ],
    vocabulary:[
      { arabic:"دَلَّ عَلَى", transliteration:"dalla ʿalā", english:"guided to / pointed to / directed", pos:"verb phrase" },
      { arabic:"مِثْل", transliteration:"mithl", english:"like / equal to / equivalent", pos:"noun (m)" },
      { arabic:"أَجْر", transliteration:"ajr", english:"reward / recompense", pos:"noun (m)", plural:"أُجُور" },
      { arabic:"يَنْقُص", transliteration:"yanquṣ", english:"decreases / diminishes", pos:"verb (present)" },
      { arabic:"دَاعِي", transliteration:"dāʿī", english:"caller / one who calls (to something)", pos:"noun (m)" },
    ],
    grammar:{ title:"مَنْ + فَلَهُ — Conditional Reward Structure", titleArabic:"مَنْ الشَّرْطِيَّة مَعَ جَوَابِ الفَاء",
      explanation:"«مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ»\n\nPattern: مَنْ + verb + فَ + reward:\n• مَنْ = whoever (conditional 'man')\n• دَلَّ = guided (condition — past tense)\n• فَلَهُ = then for him (فَ + لَهُ — result)\n• مِثْلُ أَجْرِ فَاعِلِهِ = equal to the doer's reward\n\nThis structure is one of the most rewarding structures in the Quran and Sunnah — Allah makes GIVING a condition for RECEIVING:",
      examples:[{ arabic:"مَنْ عَمِلَ صَالِحًا فَلِنَفْسِهِ", translation:"Whoever does righteous deeds — it is for himself [the reward is his own]" }] },
    exercises:[{ type:"choose", instruction:"Hadith 29 — Teaching good.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ التَّاسِعِ وَالعِشْرِين.",
      items:[
        { question:"If you teach someone to pray and they pray for 30 years, you receive:", options:["1 reward","Equal reward to all their prayers — without reducing theirs at all","Half their reward","Depends on your intention"], answer:1 },
        { question:"The opposite: whoever calls to misguidance:", options:["Only bears their own sin","Bears sins like those of all who follow them","Is forgiven if repentant","Has no extra sin"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:30, title:"Hadith 30 — Allah is Pure and Accepts Only the Pure", titleArabic:"الحَدِيثُ الثَّلَاثُون: اللهُ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",
    description:"A complete Hadith about the connection between pure earnings, sincere worship, and accepted supplication.",
    pages:[
      { id:1, arabic:"هَذَا هُوَ الحَدِيثُ العَاشِرُ مُكَرَّرًا بِشَرْحٍ أَعْمَق:\n\nعَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ:\n«إِنَّ اللهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا»\n\nالطَّيِّبُ يُعَادِلُ:\n• طَهَارَةُ المَصْدَر (الكَسْب الحَلَال)\n• طَهَارَةُ القَلْب (الإِخْلَاص)\n• طَهَارَةُ العَمَل (المُوَافَقَة لِلشَّرِيعَة)\n• طَهَارَةُ الجَسَد (الوُضُوء، الطَّهَارَة)",
        translation:"Lesson 30 builds on Hadith 10 with deeper analysis:\n\n'Allah is pure and accepts only the pure.'\n\nThe 'pure' (ṭayyib) covers:\n• Purity of source (halal earnings)\n• Purity of heart (sincerity/ikhlās)\n• Purity of action (conforming to Sharia)\n• Purity of body (wudu, ritual cleanliness)",
        transliteration:"Inna llāha ṭayyibun lā yaqbalu illā ṭayyibā.",
        note:"This hadith is placed twice (10 and 30) in Nawawi 40 because some manuscripts differ. Lesson 30 focuses on the DEEPER dimensions of 'ṭayyib'." },
      { id:2, arabic:"الحَدِيثُ يَجْمَعُ أُصُولًا ثَلَاثَة:\n\n١. تَوْحِيدُ الأَسْمَاءِ وَالصِّفَات:\nاللهُ طَيِّبٌ = مِنْ أَسْمَائِهِ وَصِفَاتِه\n\n٢. شَرْطُ قَبُولِ الأَعْمَال:\nالإِخْلَاص + المُتَابَعَة + الكَسْب الحَلَال\n\n٣. المُسَاوَاة بَيْنَ المُؤْمِنِينَ وَالأَنْبِيَاء:\n﴿يَا أَيُّهَا الرُّسُلُ كُلُوا مِنَ الطَّيِّبَات﴾\n﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِنْ طَيِّبَاتِ مَا رَزَقْنَاكُمْ﴾\nالأَمْرُ وَاحِد للجَمِيع",
        translation:"The hadith combines three principles:\n\n1. Tawhid of Names and Attributes:\nAllah is pure = one of His Names and Attributes\n\n2. Conditions for accepted deeds:\nSincerity + following Sunnah + halal earnings\n\n3. Equality between believers and prophets:\n'O Messengers — eat from the pure things' [23:51]\n'O believers — eat from the pure things We provided' [2:172]\nThe same command for everyone",
        transliteration:"Al-ḥadīthu yajmaʿu uṣūlan thalāthah.",
        note:"مَنْ أَرَادَ أَنْ تُسْتَجَابَ دَعْوَتُهُ فَلْيَتَحَرَّ الحَلَال — Whoever wants their du'a answered must pursue the halal rigorously. This is the prophetic formula for accepted supplication." }
    ],
    vocabulary:[
      { arabic:"تَحَرَّى", transliteration:"taḥarrā", english:"sought rigorously / was diligent about (halal)", pos:"verb (past)" },
      { arabic:"مَصْدَر", transliteration:"maṣdar", english:"source / origin", pos:"noun (m)" },
      { arabic:"إِخْلَاص", transliteration:"ikhlāṣ", english:"sincerity of intention (for Allah alone)", pos:"noun (m)" },
      { arabic:"مُتَابَعَة", transliteration:"mutābaʿah", english:"following the Prophet's example", pos:"noun (f)" },
      { arabic:"الأَسْمَاء وَالصِّفَات", transliteration:"al-asmāʾ wa ṣ-ṣifāt", english:"Names and Attributes (of Allah)", pos:"noun phrase" },
    ],
    grammar:{ title:"لَا يَقْبَلُ إِلَّا — Exclusive Negation (Advanced)", titleArabic:"الحَصْرُ بِالنَّفْيِ وَالاسْتِثْنَاء",
      explanation:"«لَا يَقْبَلُ إِلَّا طَيِّبًا» — one of the strongest ways to express exclusivity in Arabic:\n\nNegation + إِلَّا = complete exclusivity:\n• لَا يَقْبَلُ إِلَّا طَيِّبًا = Accepts ONLY pure (nothing else)\n• لَا إِلَهَ إِلَّا اللهُ = No god ONLY Allah (exclusivity of worship)\n\nThe structure لَا... إِلَّا is used for the most important Islamic exclusivities:\n• In Tawhid: 'No god except Allah'\n• In worship conditions: 'No prayer except with purification'\n• In this hadith: 'Accepts nothing except the pure'",
      examples:[{ arabic:"«لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الكِتَاب»", translation:"No prayer for one who doesn't recite Al-Fatiha — same لَا + condition exclusivity" }] },
    exercises:[{ type:"choose", instruction:"Hadith 30 — Purity and acceptance.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّلَاثِين.",
      items:[
        { question:"The three conditions for accepted deeds are:", options:["Lots of worship, charity, and fasting","Sincerity, following Sunnah, and halal earnings","Prayer, Zakah, and Hajj only","Being a scholar"], answer:1 }
      ], answers:[1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:31, title:"Hadith 31 — Beware of Religious Extremism", titleArabic:"الحَدِيثُ الحَادِي وَالثَّلَاثُون: لَا تُشَدِّدُوا فِي الدِّين",
    description:"Islam is the middle way — extremism destroys the person who practices it. The Sharia is built on ease.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا قَالَ: قِيلَ لِرَسُولِ اللهِ ﷺ غَدَاةَ العَقَبَةِ وَهُوَ عَلَى رَاحِلَتِهِ: الْقُطْ لِي الحَصَى. فَالْتَقَطْتُ لَهُ سَبْعَ حَصَيَاتٍ هُنَّ حَصَى الخَذْفِ.\nقَالَ: «بِأَمْثَالِ هَؤُلَاءِ فَارْمِ — ثُمَّ قَالَ — يَا أَيُّهَا النَّاسُ إِيَّاكُمْ وَالغُلُوَّ فِي الدِّينِ فَإِنَّمَا أَهْلَكَ مَنْ كَانَ قَبْلَكُمُ الغُلُوُّ فِي الدِّين»\n[النسائي — ابن ماجه — صحيح]\n\nوَعَنِ النَّبِيِّ ﷺ: «لَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلَّا غَلَبَهُ»",
        translation:"Ibn Abbas RA said: On the morning of Aqabah, the Prophet ﷺ (on his camel) said: 'Pick up pebbles for me.' I picked up 7 small pebbles. He said: 'Stone with the like of these — then: O people! Beware of extremism (ghuluww) in religion! What destroyed those before you was extremism in religion.' [Nasai, Ibn Majah]\n\nFrom the Prophet ﷺ: 'No one can overburden themselves in religion without it overpowering them.'",
        transliteration:"Iyyākum wa l-ghuluwwa fī d-dīn fa-innamā ahlaka man kāna qablakumu l-ghuluwwu fī d-dīn.",
        note:"هَذَا الحَدِيثُ فِي سِيَاقِ رَمْيِ الجِمَار — pebbles for stoning during Hajj. Small pebbles = balanced act. The Prophet chose THIS moment to warn against excess in religion." },
      { id:2, arabic:"الغُلُوُّ نَوْعَان:\n١. الغُلُوُّ العَقَدِيّ: الغُلُوُّ فِي الأَنْبِيَاءِ وَالأَوْلِيَاء (كَعِيسَى وَالمَسِيح)\n٢. الغُلُوُّ العَمَلِيّ: التَّشْدِيدُ عَلَى النَّفْسِ فَوْقَ الطَّاقَة\n\nالإِسْلَامُ وَسَطٌ:\n«وَكَذَلِكَ جَعَلْنَاكُمْ أُمَّةً وَسَطًا» [البَقَرَة: ١٤٣]\nالوَسَطِيَّة فِي الطَّعَام، الصَّوْم، العِبَادَة، التَّعَامُل\n\nتَرْكُ رَجُلٍ صَوْمَهُ وَتَهَجُّدَهُ لِلتَّعَبِ مَكْرُوه — قَالَ ﷺ: «اكْلَفُوا مِنَ العَمَلِ مَا تُطِيقُون»",
        translation:"Extremism has two types:\n1. Doctrinal extremism: exaggerating prophets and saints (like the Christians did with Jesus)\n2. Practical extremism: overburdening oneself beyond capacity\n\nIslam is the middle way:\n'And We made you a middle nation.' [2:143]\nModeration in food, fasting, worship, dealings\n\n'Take on only as much worship as you are able.'",
        transliteration:"Al-ghuluwwu nawʿān: al-ghuluwwu l-ʿaqadiyy wa l-ghuluwwu l-ʿamaliyy.",
        note:"لَنْ يُشَادَّ الدِّينَ أَحَدٌ إِلَّا غَلَبَهُ — the religion always wins against the extremist. They burn out, quit, or go to the opposite extreme. The consistent middle path endures forever." }
    ],
    vocabulary:[
      { arabic:"غُلُوّ", transliteration:"ghuluww", english:"extremism / going beyond bounds (in religion)", pos:"noun (m)" },
      { arabic:"وَسَط", transliteration:"wasaṭ", english:"middle / moderate / balanced", pos:"adjective/noun" },
      { arabic:"يُشَادّ", transliteration:"yushādd", english:"overburs / fights against", pos:"verb (present)" },
      { arabic:"طَاقَة", transliteration:"ṭāqah", english:"capacity / ability / endurance", pos:"noun (f)" },
      { arabic:"اكْتَفَى", transliteration:"iktafā", english:"was content with / sufficed with", pos:"verb (past)" },
    ],
    grammar:{ title:"إِيَّاكُمْ وَ — Emphatic Warning (Repeated)", titleArabic:"إِيَّاكُمْ وَ التَّحْذِير الشَّدِيد",
      explanation:"«إِيَّاكُمْ وَالغُلُوَّ» — the warning formula used again (also in Hadith 28).\n\nإِيَّاكُمْ + وَ + what to avoid (accusative):\n• إِيَّاكُمْ وَالغُلُوَّ = Beware of extremism!\n• إِيَّاكُمْ وَالغِيبَةَ = Beware of backbiting!\n• إِيَّاكَ وَالكَذِبَ = Beware of lying!\n\nWhy is it so emphatic? Because إِيَّا is a DETACHED pronoun that only exists in this warning formula — its standalone form shows maximum emphasis.",
      examples:[{ arabic:"إِيَّاكُمْ وَالغُلُوَّ فِي الدِّينِ فَإِنَّمَا أَهْلَكَ مَنْ كَانَ قَبْلَكُمُ الغُلُوُّ", translation:"Beware of extremism in religion — what destroyed those before you was extremism in religion" }] },
    exercises:[{ type:"choose", instruction:"Hadith 31 — Avoiding extremism.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الحَادِي وَالثَّلَاثِين.",
      items:[
        { question:"'No one overburdens themselves in religion except it overpowers them' means:", options:["You must push yourself hard","Extremism leads to burnout and leaving religion","Allah is against extra worship","Only obligatory acts should be done"], answer:1 },
        { question:"Islam is described as:", options:["The most difficult religion","The middle/moderate nation and way","The strictest code","The most lenient religion"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:32, title:"Hadith 32 — No Harm and No Reciprocal Harm", titleArabic:"الحَدِيثُ الثَّانِي وَالثَّلَاثُون: لَا ضَرَرَ وَلَا ضِرَار",
    description:"Five words that form the greatest legal maxim of Islamic law — the absolute prohibition of harm.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا أَنَّ رَسُولَ اللهِ ﷺ قَالَ:\n«لَا ضَرَرَ وَلَا ضِرَارَ»\n[ابن ماجه — الدَّارَقُطْنِيّ — موطأ مالك — حسن]\n\nهَذِهِ خَمْسُ كَلِمَاتٍ أَصْبَحَتْ قَاعِدَةً كُبْرَى مِنَ القَوَاعِدِ الفِقْهِيَّة الخَمْس:\nالقَاعِدَة الثَّانِيَة: «الضَّرَرُ يُزَال» — harm must be removed",
        translation:"'No harm and no reciprocal harm.' [Ibn Majah, Daraqutni, Muwatta — Hasan]\n\nThese five words became one of the five greatest maxims of Islamic jurisprudence:\n'The harm must be removed' (Aḍ-ḍararu yuzāl)",
        transliteration:"Lā ḍarara wa lā ḍirār.",
        note:"ضَرَر = causing harm (initial harm). ضِرَار = retaliating with harm (reciprocal harm). Both are prohibited. You cannot harm others AND you cannot use 'they harmed me first' as justification to harm back." },
      { id:2, arabic:"القَوَاعِدُ الفِقْهِيَّةُ الخَمْس:\n١. الأُمُورُ بِمَقَاصِدِهَا (matters by their purposes)\n٢. الضَّرَرُ يُزَال (harm must be removed) ← مِنْ هَذَا الحَدِيث\n٣. العَادَةُ مُحَكَّمَة (custom has authority)\n٤. اليَقِينُ لَا يُزَالُ بِالشَّكّ (certainty is not removed by doubt)\n٥. المَشَقَّةُ تَجْلِبُ التَّيْسِير (hardship brings ease)\n\nتَطْبِيقَات: لَا ضَرَرَ وَلَا ضِرَار:\n• لَا يَجُوزُ رَفْعُ الصَّوْتِ لِإِيذَاءِ الجَار\n• لَا يَجُوزُ انْتِقَام بِالمِثْل فَوْقَ القِصَاص\n• لَا يَجُوزُ مَنْعُ المَاءِ عَنِ الآخَرِين لِإِيذَائِهِم",
        translation:"The Five Fiqh Maxims:\n1. Matters are by their purposes (intentions)\n2. Harm must be removed ← from THIS hadith\n3. Custom has legal authority\n4. Certainty is not removed by doubt\n5. Hardship brings ease\n\nApplications:\n• Not permissible to raise your voice to harm the neighbor\n• Not permissible to retaliate beyond exact equivalence\n• Not permissible to withhold water from others to harm them",
        transliteration:"Al-qawāʿidu l-fiqhiyyatu l-khams.",
        note:"الإِسْلَامُ أَوَّلُ مَنْ أَرْسَى مَبْدَأَ «لَا ضَرَر» — Islam was the first civilization to establish 'do no harm' as a legal principle. Western legal systems developed similar principles centuries later." }
    ],
    vocabulary:[
      { arabic:"ضَرَر", transliteration:"ḍarar", english:"harm / damage (initial)", pos:"noun (m)" },
      { arabic:"ضِرَار", transliteration:"ḍirār", english:"reciprocal harm / harming in retaliation", pos:"noun (m)" },
      { arabic:"يُزَال", transliteration:"yuzāl", english:"is removed / must be eliminated", pos:"verb (passive present)" },
      { arabic:"قَاعِدَة", transliteration:"qāʿidah", english:"legal maxim / fundamental rule", pos:"noun (f)", plural:"قَوَاعِد" },
      { arabic:"قِصَاص", transliteration:"qiṣāṣ", english:"retaliation / exact retribution", pos:"noun (m)" },
    ],
    grammar:{ title:"لَا النَّافِيَةُ لِلْجِنْس — Total Negation", titleArabic:"لَا النَّافِيَةُ لِلْجِنْس",
      explanation:"«لَا ضَرَرَ وَلَا ضِرَارَ» — both words are in the accusative (فَتْحَة) because of لَا النَّافِيَة لِلْجِنْس:\n\nThis type of لَا negates the ENTIRE CATEGORY — not just some harm, but ALL harm:\n\n• لَا إِلَهَ إِلَّا اللهُ = No god [of any kind] except Allah\n• لَا رَيْبَ فِيهِ = No doubt [of any kind] in it\n• لَا ضَرَرَ وَلَا ضِرَارَ = No harm [of any kind] and no retaliation\n\nIf it said لَيْسَ ضَرَرٌ — it would negate a SPECIFIC harm, not all harm.",
      examples:[{ arabic:"«لَا ضَرَرَ وَلَا ضِرَارَ» — الضَّرَرُ يُزَال", translation:"No harm and no reciprocal harm — harm must be removed (the resulting maxim)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 32 — No harm.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّانِي وَالثَّلَاثِين.",
      items:[
        { question:"What is the difference between ḍarar and ḍirār?", options:["They are the same","Ḍarar = initial harm; ḍirār = harming back in retaliation","Ḍarar is small, ḍirār is large","Ḍarar is physical, ḍirār is emotional"], answer:1 },
        { question:"'Harm must be removed' (Aḍ-ḍararu yuzāl) means:", options:["Ignore harm if it's small","Islamic law actively works to eliminate harm — it's a legal obligation","Only scholars can address harm","Harm is sometimes acceptable"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:33, title:"Hadith 33 — Proof on the Claimant, Oath on the Denier", titleArabic:"الحَدِيثُ الثَّالِثُ وَالثَّلَاثُون: البَيِّنَةُ عَلَى المُدَّعِي",
    description:"The foundational principle of Islamic legal procedure — the burden of proof and the oath system.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا أَنَّ النَّبِيَّ ﷺ قَالَ:\n«لَوْ يُعْطَى النَّاسُ بِدَعْوَاهُمْ لَادَّعَى نَاسٌ دِمَاءَ رِجَالٍ وَأَمْوَالَهُمْ وَلَكِنِ اليَمِينُ عَلَى المُدَّعَى عَلَيْهِ»\n[البُخَارِيّ ٤٥٥٢ — مُسْلِم ١٧١١]\n\nالقَاعِدَة الَّتِي أَخَذَ مِنْهَا الفُقَهَاء:\n«البَيِّنَةُ عَلَى المُدَّعِي وَاليَمِينُ عَلَى مَنْ أَنْكَر»\n[حَدِيثُ الدَّارَقُطْنِيّ وَابن مَاجَه]",
        translation:"'If people were given [what they claim] based only on their claims, people would claim the blood and wealth of other men. But the oath is upon the defendant.' [Bukhari 4552]\n\nThe legal maxim derived:\n'Proof (bayyinah) is on the claimant; the oath (yamīn) is on the denier.'",
        transliteration:"Al-bayyinatu ʿalā l-muddaʿī wa l-yamīnu ʿalā man ankara.",
        note:"هَذَا المَبْدَأ مَوْجُود فِي القَانُون الدُّوَلِيِّ الحَدِيث: 'Presumption of innocence' and 'burden of proof' — the Prophet established this 1,400 years ago." },
      { id:2, arabic:"المُصْطَلَحَات القَانُونِيَّة:\n• المُدَّعِي (Plaintiff): مَنْ يَطْلُبُ حَقًّا لِنَفْسِهِ\n• المُدَّعَى عَلَيْهِ (Defendant): مَنْ يُنْكِرُ الدَّعْوَى\n• البَيِّنَة (Evidence): شَاهِدَان مُسْلِمَان عَادِلَان (عِنْدَ الجُمْهُور)\n• اليَمِين (Oath): الحَلِف بِاللهِ عَلَى صِحَّةِ الإِنْكَار\n\nمَبْدَأُ الإِسْلَام: المُتَّهَمُ بَرِيءٌ حَتَّى تَثْبُتَ إِدَانَتُهُ\nالدَّلِيل يُقِيمُهُ المُدَّعِي — لَا يُعَاكَسُ الأَمْر",
        translation:"Legal Terminology:\n• Plaintiff (Muddaʿī): one who seeks a right for themselves\n• Defendant (Muddaʿā ʿalayhi): one who denies the claim\n• Evidence (Bayyinah): two just Muslim witnesses (majority opinion)\n• Oath (Yamīn): swearing by Allah of the denial's truth\n\nIslamic Principle: Accused is innocent until guilt is established\nProof is on the claimant — NOT reversed",
        transliteration:"Al-muṣṭalaḥāt al-qānūniyyah fī l-islām.",
        note:"الدِّيمُقْرَاطِيَّاتُ الحَدِيثَة تَأَخَّذَتْ مَبْدَأَ «البَيِّنَة عَلَى المُدَّعِي» مِنَ الشَّرِيعَة الإِسْلَامِيَّة عَبْرَ المَدَارِسِ القَانُونِيَّة الأُورُوبِيَّة فِي الأَنْدَلُس." }
    ],
    vocabulary:[
      { arabic:"مُدَّعِي", transliteration:"muddaʿī", english:"claimant / plaintiff", pos:"noun (m)" },
      { arabic:"بَيِّنَة", transliteration:"bayyinah", english:"clear proof / evidence", pos:"noun (f)" },
      { arabic:"يَمِين", transliteration:"yamīn", english:"oath / swearing (by Allah)", pos:"noun (m)" },
      { arabic:"أَنْكَرَ", transliteration:"ankara", english:"denied / rejected the claim", pos:"verb (past)" },
      { arabic:"دَعْوَى", transliteration:"daʿwā", english:"claim / lawsuit", pos:"noun (f)", plural:"دَعَاوَى" },
    ],
    grammar:{ title:"لَوْ + لَادَّعَى — Hypothetical Consequence", titleArabic:"جَوَابُ لَوْ بِاللَّام",
      explanation:"«لَوْ يُعْطَى النَّاسُ بِدَعْوَاهُمْ لَادَّعَى نَاسٌ...»\n\nلَوْ (if — hypothetical) + لَ in the result:\n• لَوْ + condition → لَ + result (what would happen)\n• لَوْ يُعْطَوْا بِدَعَاوَى = IF they were given what they claimed\n• لَادَّعَى نَاسٌ = THEN people would claim [blood and wealth]\n\nThe لَ before the result verb is called لَام جَوَاب لَوْ — always appears before the outcome when it's past tense.\n\nThis shows the WISDOM behind the rule: without it, chaos would follow.",
      examples:[{ arabic:"«لَوْ كَانَ فِيهِمَا آلِهَةٌ إِلَّا اللهُ لَفَسَدَتَا»", translation:"'If there were gods besides Allah, they would have been ruined.' [21:22]" }] },
    exercises:[{ type:"choose", instruction:"Hadith 33 — Legal procedure in Islam.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّالِثِ وَالثَّلَاثِين.",
      items:[
        { question:"In Islamic law, who bears the burden of proof?", options:["The defendant","The judge","The claimant/plaintiff","The witnesses"], answer:2 },
        { question:"The defendant (who denies) must:", options:["Provide counter-evidence","Take an oath denying the claim","Go to prison","Pay compensation"], answer:1 }
      ], answers:[2,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:34, title:"Hadith 34 — Change Evil with Hand, Tongue, or Heart", titleArabic:"الحَدِيثُ الرَّابِعُ وَالثَّلَاثُون: الإِنْكَارُ بِالقَلْبِ",
    description:"Every Muslim has a role in commanding good and forbidding evil — three levels according to capacity.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي سَعِيدٍ الخُدْرِيِّ رَضِيَ اللهُ عَنْهُ قَالَ: سَمِعْتُ رَسُولَ اللهِ ﷺ يَقُولُ:\n«مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ، وَذَلِكَ أَضْعَفُ الإِيمَانِ»\n[مُسْلِم ٤٩]",
        translation:"'Whoever among you sees an evil (munkar), let him change it with his hand. If he cannot, then with his tongue. If he cannot, then with his heart — and that is the weakest of faith.' [Muslim 49]",
        transliteration:"Man raʾā minkum munkaran fal-yughayyirhu bi-yadihi, fa-in lam yastaṭiʿ fa-bi-lisānihi, fa-in lam yastaṭiʿ fa-bi-qalbihi, wa dhālika aḍʿafu l-īmān.",
        note:"ذَلِكَ أَضْعَفُ الإِيمَان — the heart's rejection is the MINIMUM, not a comfortable resting place. It's 'the weakest of iman' — there's no level below it that still counts as iman." },
      { id:2, arabic:"الثَّلَاثَةُ المَرَاتِب:\n١. بِاليَد: خَاصٌّ بِمَنْ يَمْلِكُ الوِلَايَة (الأَب فِي بَيْتِهِ، الحَاكِم فِي دَوْلَتِهِ)\n٢. بِاللِّسَان: أَمْر بِمَعْرُوفٍ وَنَهْيٌ عَنْ مُنْكَر بِالحِكْمَةِ وَالمَوْعِظَةِ الحَسَنَة\n٣. بِالقَلْب: بُغْضُ المُنْكَرِ وَكَرَاهِيَتُهُ مَعَ العَجْزِ — وَاجِبٌ عَلَى كُلِّ مُسْلِم\n\nالشَّرْط: أَنْ لَا يُفْضِي التَّغْيِيرُ إِلَى مُنْكَرٍ أَكْبَر\nمَثَال: لَا تُكَسِّرُ آلَاتِ الطَّرَب فِي مَكَانٍ يُفْضِي إِلَى فِتْنَة",
        translation:"Three Levels:\n1. By hand: for those with authority (father in home, ruler in state)\n2. By tongue: commanding good and forbidding evil with wisdom and good advice\n3. By heart: hating the evil while unable to change it — obligatory on every Muslim\n\nCondition: The change must not lead to a GREATER evil\nExample: Don't smash instruments in a place that would cause greater fitna",
        transliteration:"Ath-thalāthatu l-marātib: bi-l-yad, bi-l-lisān, bi-l-qalb.",
        note:"لَيْسَ بَعْدَ هَذَا مِنَ الإِيمَانِ حَبَّةُ خَرْدَل — 'Beyond this there is not a mustard seed of faith left.' The hadith makes heart-level rejection of evil the FLOOR of iman, not the ceiling." }
    ],
    vocabulary:[
      { arabic:"مُنْكَر", transliteration:"munkar", english:"evil / prohibited action / wrong", pos:"noun (m)" },
      { arabic:"يُغَيِّر", transliteration:"yughayyir", english:"changes / alters / corrects", pos:"verb (present)" },
      { arabic:"أَضْعَف", transliteration:"aḍʿaf", english:"weakest (superlative)", pos:"adjective" },
      { arabic:"وِلَايَة", transliteration:"wilāyah", english:"authority / guardianship / jurisdiction", pos:"noun (f)" },
      { arabic:"فِتْنَة", transliteration:"fitnah", english:"trial / chaos / strife", pos:"noun (f)" },
    ],
    grammar:{ title:"فَإِنْ لَمْ يَسْتَطِعْ — Escalating Conditional", titleArabic:"الشَّرْطُ التَّصَاعُدِيّ",
      explanation:"The hadith uses a CASCADING conditional structure:\n\n• مَنْ رَأَى... فَلْيُغَيِّرْهُ بِيَدِهِ (condition 1: sees evil → change by hand)\n• فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ (if unable → by tongue)\n• فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ (if unable → by heart)\n\nEach فَإِنْ introduces a FALLBACK condition. This elegant structure shows:\n1. The ideal (hand)\n2. The acceptable alternative (tongue)\n3. The minimum required (heart)\n\nThe same pattern appears in fiqh rulings about prayer positions (standing → sitting → lying).",
      examples:[{ arabic:"فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ", translation:"If he cannot [change by hand] then by tongue; if he cannot, then by heart" }] },
    exercises:[{ type:"choose", instruction:"Hadith 34 — Changing evil.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الرَّابِعِ وَالثَّلَاثِين.",
      items:[
        { question:"Changing evil 'by hand' is specifically for:", options:["Every Muslim","Those with authority and jurisdiction","Scholars only","Men only"], answer:1 },
        { question:"Heart-level rejection of evil is:", options:["Optional for advanced Muslims","The minimum of faith required — obligatory on ALL Muslims","Sufficient for scholars","Higher than tongue-level"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:35, title:"Hadith 35 — Brotherhood, No Envy, No Hatred", titleArabic:"الحَدِيثُ الخَامِسُ وَالثَّلَاثُون: الأُخُوَّةُ الإِسْلَامِيَّة",
    description:"The Prophet's blueprint for Islamic brotherhood — removing the social diseases that destroy communities.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«لَا تَحَاسَدُوا، وَلَا تَنَاجَشُوا، وَلَا تَبَاغَضُوا، وَلَا تَدَابَرُوا، وَلَا يَبِعْ بَعْضُكُمْ عَلَى بَيْعِ بَعْضٍ، وَكُونُوا عِبَادَ اللهِ إِخْوَانًا.\nالمُسْلِمُ أَخُو المُسْلِمِ: لَا يَظْلِمُهُ وَلَا يَخْذُلُهُ وَلَا يَحْقِرُهُ.\nالتَّقْوَى هَاهُنَا — وَيُشِيرُ إِلَى صَدْرِهِ ثَلَاثَ مَرَّات.»\n[مُسْلِم ٢٥٦٤]",
        translation:"'Do not envy one another, do not artificially inflate prices, do not hate one another, do not turn your backs on one another, do not undercut each other's transactions. Be servants of Allah, brothers. The Muslim is the brother of the Muslim: he does not oppress him, abandon him, or belittle him.' [Muslim 2564]",
        transliteration:"Lā taḥāsadū wa lā tanājashū wa lā tabāghaḍū wa lā tadābarū... kūnū ʿibāda llāhi ikhwānā.",
        note:"التَّقْوَى هَاهُنَا — Taqwa is HERE — pointing to his chest three times. Not taqwa in the mouth, not in the appearance, not in the beard — TAQWA IS IN THE HEART." },
      { id:2, arabic:"خَمْسَةُ المَنْهِيَّات:\n١. التَّحَاسُد = مُبَادَلَةُ الحَسَدِ بَيْنَ طَرَفَيْن\n٢. التَّنَاجُش = الاتِّفَاق عَلَى رَفْعِ السِّعْرِ بِلَا شِرَاء (النَّجْش)\n٣. التَّبَاغُض = كَرَاهِيَةُ المُسْلِمِ لِأَخِيهِ بِلَا سَبَب مَشْرُوع\n٤. التَّدَابُر = الاعْتِرَاض بِالكَامِل — كَأَنَّ كُلًّا يُوَلِّي الآخَرَ ظَهْرَهُ\n٥. بَيْعٌ عَلَى بَيْع = التَّدَخُّل فِي صَفْقَةٍ جَارِيَة\n\nالإِيجَابِيَّات:\n«كُونُوا عِبَادَ اللهِ إِخْوَانًا» — الأُخُوَّة هِيَ الهَدَف الإِيجَابِيّ",
        translation:"The Five Prohibitions:\n1. Mutual envy — wishing removal of blessings\n2. Najsh — artificially inflating prices without genuine buying\n3. Mutual hatred — hating a Muslim without legitimate cause\n4. Turning backs — complete social abandonment\n5. Undercutting — interfering in a deal already in progress\n\nThe Positive Command:\n'Be servants of Allah, brothers' — brotherhood is the POSITIVE goal",
        transliteration:"Khamsatu l-manhiyyāt wa l-amru l-ījābiyy.",
        note:"بِحَسْبِ امْرِئٍ مِنَ الشَّرِّ أَنْ يَحْقِرَ أَخَاهُ المُسْلِم — 'It is evil enough for a person to belittle their Muslim brother.' This defines the floor of brotherly respect." }
    ],
    vocabulary:[
      { arabic:"تَحَاسَدَ", transliteration:"taḥāsada", english:"mutually envied each other", pos:"verb (past, reciprocal)" },
      { arabic:"حَسَد", transliteration:"ḥasad", english:"envy (wishing removal of another's blessing)", pos:"noun (m)" },
      { arabic:"خَذَلَ", transliteration:"khadala", english:"abandoned / let down / deserted", pos:"verb (past)" },
      { arabic:"حَقَرَ", transliteration:"ḥaqara", english:"belittled / looked down on", pos:"verb (past)" },
      { arabic:"تَدَابَرَ", transliteration:"tadābara", english:"turned backs on each other / ostracized", pos:"verb (past, reciprocal)" },
    ],
    grammar:{ title:"وَزْن التَّفَاعُل — Reciprocal Verb Form", titleArabic:"وَزْنُ تَفَاعَلَ",
      explanation:"تَفَاعَلَ (tafāʿala) = reciprocal action between two or more parties:\n\n• تَحَاسَدَ = mutually envied EACH OTHER (ح-س-د root + tafāʿala pattern)\n• تَبَاغَضَ = mutually hated EACH OTHER (ب-غ-ض root)\n• تَدَابَرَ = turned backs ON EACH OTHER (د-ب-ر root)\n• تَقَاتَلَ = fought EACH OTHER\n• تَعَاوَنَ = cooperated WITH EACH OTHER\n\nAll the prohibitions use this form because MUTUAL poison destroys communities — one side hating destroys one person; MUTUAL hatred destroys families and nations.",
      examples:[{ arabic:"لَا تَحَاسَدُوا وَلَا تَبَاغَضُوا — وَكُونُوا إِخْوَانًا", translation:"Don't envy each other, don't hate each other — be brothers" }] },
    exercises:[{ type:"choose", instruction:"Hadith 35 — Islamic brotherhood.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الخَامِسِ وَالثَّلَاثِين.",
      items:[
        { question:"'Taqwa is HERE' — the Prophet pointed to:", options:["His head","His chest/heart","The sky","The Quran"], answer:1 },
        { question:"'Najsh' (التَّنَاجُش) is:", options:["Backbiting someone","Artificially inflating prices without genuine intent to buy","Mutual hatred","Abandoning a Muslim"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:36, title:"Hadith 36 — Relieve a Muslim, Allah Relieves You", titleArabic:"الحَدِيثُ السَّادِسُ وَالثَّلَاثُون: تَفْرِيجُ الكُرُبَات",
    description:"The divine exchange: help others in this world, and Allah guarantees help in the next.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ عَنِ النَّبِيِّ ﷺ قَالَ:\n«مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ القِيَامَةِ.\nوَمَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللهُ عَلَيْهِ فِي الدُّنْيَا وَالآخِرَة.\nوَمَنْ سَتَرَ مُسْلِمًا سَتَرَهُ اللهُ فِي الدُّنْيَا وَالآخِرَة.\nوَاللهُ فِي عَوْنِ العَبْدِ مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيه»\n[مُسْلِم ٢٦٩٩]",
        translation:"'Whoever relieves a believer of a worldly difficulty, Allah will relieve him of a difficulty of the Day of Judgment. Whoever gives ease to one in hardship, Allah gives him ease in this world and the next. Whoever covers a Muslim's fault, Allah covers his in this world and the next. Allah is in the aid of the servant as long as the servant is in the aid of his brother.' [Muslim 2699]",
        transliteration:"Man naffasa ʿan muʾminin kurbatan min kurabi d-dunyā naffasa llāhu ʿanhu kurbatan min kurabi yawmi l-qiyāmah.",
        note:"اللهُ فِي عَوْنِ العَبْدِ مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيهِ — the most beautiful reciprocity: Allah's help is CONSTANT as long as your help to others is constant." },
      { id:2, arabic:"الثَّلَاثَةُ الأَعْمَال:\n١. تَفْرِيجُ الكُرْبَة:\nعَزَاءُ مُحْزُون — مُسَاعَدَةُ مَدِين — دَعْم مَكْرُوب\n→ اللهُ يُفَرِّجُ كُرْبَةَ يَوْمِ القِيَامَة\n\n٢. التَّيْسِيرُ عَلَى المُعْسِر:\nتَأْجِيلُ الدَّيْنِ — تَخْفِيفُ الشُّرُوط — إِعَانَة مَالِيَّة\n→ اللهُ يُيَسِّرُ فِي الدُّنْيَا وَالآخِرَة\n\n٣. سَتْرُ المُسْلِمِ:\nسَتْرُ خَطَأِهِ وَزَلَّتِهِ عَنِ الآخَرِين\n→ اللهُ يَسْتُرُ فِي الدُّنْيَا وَالآخِرَة",
        translation:"The Three Acts:\n1. Relieving distress:\nComforting the grief-stricken, helping the indebted, supporting the troubled\n→ Allah relieves a Judgment Day difficulty\n\n2. Easing the hardship of those in difficulty:\nDelaying debt, reducing conditions, financial assistance\n→ Allah gives ease in both worlds\n\n3. Covering the Muslim's fault:\nCovering their error and slip from others\n→ Allah covers in both worlds",
        transliteration:"Ath-thalāthatu l-aʿmāl: taffrīju l-kurbah, at-taysīru ʿalā l-muʿsir, satru l-muslim.",
        note:"مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيه — 'as long as' — the help of Allah is CONTINUOUS and LINKED to the servant's continuous help. Stop helping → Allah's special help stops." }
    ],
    vocabulary:[
      { arabic:"نَفَّسَ", transliteration:"naffasa", english:"relieved / removed (a hardship)", pos:"verb (past)" },
      { arabic:"كُرْبَة", transliteration:"kurbah", english:"distress / difficulty / anguish", pos:"noun (f)", plural:"كُرَب" },
      { arabic:"مُعْسِر", transliteration:"muʿsir", english:"one in financial hardship", pos:"noun (m)" },
      { arabic:"سَتَرَ", transliteration:"satara", english:"covered / concealed (a fault)", pos:"verb (past)" },
      { arabic:"عَوْن", transliteration:"ʿawn", english:"help / aid / assistance", pos:"noun (m)" },
    ],
    grammar:{ title:"مَا كَانَ الشَّرْطِيَّة — As Long As", titleArabic:"مَا كَانَ لِلظَّرْفِيَّة الزَّمَانِيَّة",
      explanation:"«مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيه» — مَا here = 'as long as' (temporal, not negative):\n\n'Allah is in aid of the servant AS LONG AS the servant is in aid of his brother.'\n\nمَا الظَّرْفِيَّة (temporal mā):\n• مَا دُمْتَ = as long as you remain\n• مَا عِشْتُ = as long as I live\n• مَا كَانَ الإِنْسَانُ = as long as the person is\n\nThis creates a direct, continuous link: the cause and consequence are SIMULTANEOUS.",
      examples:[{ arabic:"«وَاللهُ فِي عَوْنِ العَبْدِ مَا كَانَ العَبْدُ فِي عَوْنِ أَخِيه»", translation:"Allah is in the aid of the servant AS LONG AS the servant is in the aid of his brother" }] },
    exercises:[{ type:"choose", instruction:"Hadith 36 — Relief and ease.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّادِسِ وَالثَّلَاثِين.",
      items:[
        { question:"The exchange in this hadith is:", options:["Good deeds for Paradise only","Relieving others' worldly difficulties → Allah relieves your Judgment Day difficulties","Fasting for health","Prayer for rizq"], answer:1 },
        { question:"'Allah is in the aid of the servant as long as the servant aids his brother' means:", options:["Allah only helps scholars","Allah's special ongoing assistance is linked to your help for others","Allah helps everyone equally","Allah helps after death only"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:37, title:"Hadith 37 — Allah Records All Deeds", titleArabic:"الحَدِيثُ السَّابِعُ وَالثَّلَاثُون: كِتَابَةُ الحَسَنَاتِ وَالسَّيِّئَات",
    description:"The comprehensive system of divine accounting — how Allah counts good intentions, good deeds, bad intentions, and bad deeds.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا عَنِ النَّبِيِّ ﷺ فِيمَا يَرْوِيهِ عَنْ رَبِّهِ تَبَارَكَ وَتَعَالَى:\n«إِنَّ اللهَ كَتَبَ الحَسَنَاتِ وَالسَّيِّئَاتِ ثُمَّ بَيَّنَ ذَلِكَ:\nفَمَنْ هَمَّ بِحَسَنَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللهُ عِنْدَهُ حَسَنَةً كَامِلَةً،\nوَمَنْ هَمَّ بِهَا فَعَمِلَهَا كَتَبَهَا اللهُ عِنْدَهُ عَشْرَ حَسَنَاتٍ إِلَى سَبْعِمِائَةِ ضِعْفٍ إِلَى أَضْعَافٍ كَثِيرَةٍ.\nوَمَنْ هَمَّ بِسَيِّئَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللهُ عِنْدَهُ حَسَنَةً كَامِلَةً،\nوَمَنْ هَمَّ بِهَا فَعَمِلَهَا كَتَبَهَا اللهُ عِنْدَهُ سَيِّئَةً وَاحِدَة»\n[البُخَارِيّ ٦٤٩١ — مُسْلِم ١٣٢]",
        translation:"A Hadith Qudsi: 'Allah recorded good and bad deeds. Whoever intends a good deed but doesn't do it — Allah records it as one complete good deed. Whoever intends and does it — 10 to 700 times or more. Whoever intends a bad deed but doesn't do it — Allah records it as one complete good deed. Whoever intends and does it — ONE bad deed only.' [Bukhari 6491]",
        transliteration:"Inna llāha kataba l-ḥasanāti wa s-sayyiʾāti thumma bayyina dhālik...",
        note:"نِظَامُ المَحَبَّةِ الإِلَهِيَّة: The asymmetry is intentional and merciful:\n• Good intention (not done) = 1 full reward\n• Good deed = 10 to 700+\n• Bad intention (not done) = 1 good reward!\n• Bad deed = only 1 sin\nAllah's system FAVORS the believer at EVERY stage." },
      { id:2, arabic:"الجَدْوَل الإِلَهِيّ:\n┌─────────────────────────────────────────┐\n│ النِّيَّة الحَسَنَة بِلَا فِعْل → حَسَنَة كَامِلَة │\n│ النِّيَّة الحَسَنَة + فِعْل → ١٠ إِلَى ٧٠٠+ │\n│ النِّيَّة السَّيِّئَة بِلَا فِعْل → حَسَنَة كَامِلَة │\n│ النِّيَّة السَّيِّئَة + فِعْل → سَيِّئَة وَاحِدَة │\n└─────────────────────────────────────────┘\n\n«مَنْ تَرَكَ السَّيِّئَةَ خَشْيَةَ اللهِ كُتِبَ لَهُ حَسَنَة»\nتَرْكُ الحَرَامِ خَشْيَةَ اللهِ = عَمَلٌ مَكْتُوبٌ كَحَسَنَة!",
        translation:"The Divine Table:\n• Good intention (not done) → full good deed recorded\n• Good intention + action → 10 to 700+\n• Bad intention (not done) → full good deed!\n• Bad intention + action → 1 bad deed only\n\n'Whoever leaves a bad deed out of fear of Allah — a good deed is written for them.'\nLeaving the haram out of taqwa = an act of worship that earns reward!",
        transliteration:"Al-jadwalu l-ilāhiyy.",
        note:"هَذَا يُعَلِّمُنَا: 1. قِيمَةُ النِّيَّة الحَسَنَة (حَتَّى بِلَا عَمَل). 2. فَضْلُ تَرْكِ السَّيِّئَة. 3. رَحْمَةُ اللهِ تَفُوقُ عَدْلَهُ فِي مَصْلَحَةِ المُؤْمِن." }
    ],
    vocabulary:[
      { arabic:"هَمَّ بِ", transliteration:"hamma bi", english:"intended / was determined to do", pos:"verb phrase" },
      { arabic:"حَسَنَة", transliteration:"ḥasanah", english:"good deed", pos:"noun (f)", plural:"حَسَنَات" },
      { arabic:"سَيِّئَة", transliteration:"sayyiʾah", english:"bad deed / sin", pos:"noun (f)", plural:"سَيِّئَات" },
      { arabic:"ضِعْف", transliteration:"ḍiʿf", english:"times / fold (as in 700-fold)", pos:"noun (m)", plural:"أَضْعَاف" },
      { arabic:"كَامِل", transliteration:"kāmil", english:"complete / perfect / whole", pos:"adjective" },
    ],
    grammar:{ title:"مَنْ هَمَّ — Intent as a Conditional", titleArabic:"الهَمُّ بِالفِعْل فِي السِّيَاق الشَّرْعِيّ",
      explanation:"«مَنْ هَمَّ بِحَسَنَةٍ» — هَمَّ بِـ = 'intended / was determined to do'\n\nهَمَّ is a strong intention, not just a passing thought:\n• Passing thought (خَاطِر) = not recorded\n• Desire (رَغَبَ) = not recorded\n• Strong intent to act (هَمَّ) = recorded as GOOD DEED if it's a sin left!\n\nThe فَ connectors:\n• هَمَّ... فَلَمْ يَعْمَلْهَا = intended... but did NOT act\n• هَمَّ... فَعَمِلَهَا = intended... and DID act",
      examples:[{ arabic:"مَنْ هَمَّ بِسَيِّئَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللهُ حَسَنَةً كَامِلَة", translation:"Whoever intended a bad deed but didn't do it — Allah records it as a COMPLETE GOOD DEED" }] },
    exercises:[{ type:"choose", instruction:"Hadith 37 — Recording deeds.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ السَّابِعِ وَالثَّلَاثِين.",
      items:[
        { question:"If you intend a sin but don't do it out of fear of Allah:", options:["It's recorded as 1 sin","It's recorded as 1 GOOD DEED","It's ignored","It remains as intention"], answer:1 },
        { question:"Good deeds are multiplied:", options:["10 times only","10 to 700 times or even more","Exactly 700 times","Depends on the deed only"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:38, title:"Hadith 38 — Drawing Near Through Obligatory Acts and Nawafil", titleArabic:"الحَدِيثُ الثَّامِنُ وَالثَّلَاثُون: التَّقَرُّبُ بِالفَرَائِضِ وَالنَّوَافِل",
    description:"One of the most beloved Hadith Qudsi — how a servant reaches the station of Allah's love through worship.",
    pages:[
      { id:1, arabic:"عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ ﷺ:\n«إِنَّ اللهَ تَعَالَى قَالَ: مَنْ عَادَى لِي وَلِيًّا فَقَدْ آذَنْتُهُ بِالحَرْبِ.\nوَمَا تَقَرَّبَ إِلَيَّ عَبْدِي بِشَيْءٍ أَحَبَّ إِلَيَّ مِمَّا افْتَرَضْتُهُ عَلَيْهِ.\nوَمَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ.\nفَإِذَا أَحْبَبْتُهُ كُنْتُ سَمْعَهُ الَّذِي يَسْمَعُ بِهِ وَبَصَرَهُ الَّذِي يُبْصِرُ بِهِ وَيَدَهُ الَّتِي يَبْطِشُ بِهَا وَرِجْلَهُ الَّتِي يَمْشِي بِهَا.\nوَلَئِنْ سَأَلَنِي لَأُعْطِيَنَّهُ وَلَئِنِ اسْتَعَاذَ بِي لَأُعِيذَنَّهُ»\n[البُخَارِيّ ٦٥٠٢]",
        translation:"'Whoever shows enmity to a friend of Mine (wali), I declare war on them. My servant draws near to Me through nothing more beloved to Me than what I have obligated. My servant continues drawing near through nawafil until I love him. When I love him — I become his hearing by which he hears, his sight by which he sees, his hand by which he strikes, his feet by which he walks. If he asks Me I will give him; if he seeks My protection I will protect him.' [Bukhari 6502]",
        transliteration:"Wa mā taqarraba ilayya ʿabdī bi-shayʾin aḥabba ilayya mimmā ftaraḍtuhu ʿalayh.",
        note:"The path: Farāʾid (foundations) → Nawāfil (growth) → Allah's LOVE → divine empowerment of all faculties. The obligatory is the ENTRY, the nawafil is the ELEVATOR to Allah's love." },
      { id:2, arabic:"مَرَاحِلُ التَّقَرُّب:\n١. الفَرَائِض أَوَّلًا: «أَحَبَّ إِلَيَّ مِمَّا افْتَرَضْتُهُ» — الفَرَائِضُ أَهَمُّ مِنَ النَّوَافِل\n٢. النَّوَافِل تُوَصِّل إِلَى المَحَبَّة: «حَتَّى أُحِبَّه» — المَحَبَّةُ الإِلَهِيَّة هِيَ الغَايَة\n٣. المَحَبَّة = التَّوْفِيق وَالتَّسْدِيد: «كُنْتُ سَمْعَهُ» — يَسْمَعُ بِإِذْنِ اللهِ، يُبْصِرُ بِإِذْنِ اللهِ\n\nوَلِيُّ اللهِ لَيْسَ ذَا كَرَامَات خَارِقَة فَقَطْ — بَلْ هُوَ:\n• مَنْ اتَّقَى اللهَ\n• مَنْ آمَنَ وَعَمِلَ صَالِحًا\n﴿أَلَا إِنَّ أَوْلِيَاءَ اللهِ لَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُون﴾",
        translation:"Stages of drawing near:\n1. Obligatory acts first — more beloved than nawafil\n2. Nawafil lead to LOVE — 'until I love him' — divine love is the goal\n3. Love = divine guidance and success — 'I become his hearing' — he hears/sees guided by Allah\n\nAllah's Wali is not just someone with miracles — they are:\n• One who has Taqwa\n• One who believes and does righteous deeds\n'Verily, the friends of Allah — no fear shall be upon them nor shall they grieve.' [10:62]",
        transliteration:"Marāḥilu t-taqarrub.",
        note:"«كُنْتُ سَمْعَهُ...» — Ibn Hajar: This means Allah GUIDES his faculties to the right use — his ears hear only what pleases Allah, his hands act only in what pleases Allah. Not literal identity." }
    ],
    vocabulary:[
      { arabic:"وَلِيّ", transliteration:"waliyy", english:"friend of Allah / believer with taqwa", pos:"noun (m)", plural:"أَوْلِيَاء" },
      { arabic:"افْتَرَضَ", transliteration:"iftaraḍa", english:"obligated / made compulsory", pos:"verb (past)" },
      { arabic:"نَافِلَة", transliteration:"nāfilah", english:"voluntary act of worship (extra worship)", pos:"noun (f)", plural:"نَوَافِل" },
      { arabic:"بَطَشَ", transliteration:"baṭasha", english:"struck / acted powerfully with", pos:"verb (past)" },
      { arabic:"اسْتَعَاذَ", transliteration:"istaʿādha", english:"sought protection / refuge", pos:"verb (past)" },
    ],
    grammar:{ title:"لَئِنْ + لَأُعْطِيَنَّهُ — Emphatic Oath", titleArabic:"لَئِنْ وَلَام التَّوْكِيد مَعَ النُّون",
      explanation:"«وَلَئِنْ سَأَلَنِي لَأُعْطِيَنَّهُ» — a triple emphasis structure:\n\n• لَئِنْ = combining لَ (oath prefix) + إِنْ (conditional 'if')\n• لَأُعْطِيَنَّهُ = لَـ (oath) + أُعْطِي (I give) + نَّ (emphatic نُون) + هُ (him)\n\nThis is ONE OF THE STRONGEST affirmations in Arabic:\n'I SWEAR — if he asks Me — I WILL MOST CERTAINLY GIVE HIM.'\n\nOnly Allah can make such an absolute, unconditional guarantee. This is the ultimate divine promise to His beloved servant.",
      examples:[{ arabic:"وَلَئِنِ اسْتَعَاذَ بِي لَأُعِيذَنَّه", translation:"And if he seeks My protection — I WILL MOST CERTAINLY PROTECT HIM (triple-emphatic divine guarantee)" }] },
    exercises:[{ type:"choose", instruction:"Hadith 38 — Drawing near to Allah.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الثَّامِنِ وَالثَّلَاثِين.",
      items:[
        { question:"What is MORE BELOVED to Allah than nawafil?", options:["Long supplications","The obligatory acts (farāʾid)","Reading Quran only","Going on Hajj repeatedly"], answer:1 },
        { question:"'I become his hearing by which he hears' means:", options:["Allah hears instead of the servant","Allah guides all the servant's faculties to righteousness","The servant can hear everything","A literal transformation"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:39, title:"Hadith 39 — Forgiveness for Error, Forgetfulness & Compulsion", titleArabic:"الحَدِيثُ التَّاسِعُ وَالثَّلَاثُون: رَفْعُ الخَطَأِ وَالنِّسْيَان",
    description:"Allah's mercy encompasses this Ummah — three categories of sins that are forgiven due to the conditions of their occurrence.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللهُ عَنْهُمَا أَنَّ رَسُولَ اللهِ ﷺ قَالَ:\n«إِنَّ اللهَ تَجَاوَزَ عَنْ أُمَّتِي الخَطَأَ وَالنِّسْيَانَ وَمَا اسْتُكْرِهُوا عَلَيْهِ»\n[ابن ماجه — الطَّبَرَانِيّ — صحيح]\n\nقَالَ اللهُ تَعَالَى: ﴿رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا﴾ [البَقَرَة: ٢٨٦]\nقَالَ اللهُ: قَدْ فَعَلْتُ (رَوَاهُ مُسْلِم)",
        translation:"'Allah has overlooked for my Ummah: mistakes, forgetfulness, and what they are compelled to do.' [Ibn Majah — Authentic]\n\nAllah says: 'Our Lord, do not hold us accountable if we forget or make mistakes.' [2:286] — Allah responded: 'I have done so.' [Muslim]",
        transliteration:"Inna llāha tajāwaza ʿan ummatī l-khaṭaʾa wa n-nisyāna wa mā stukrihū ʿalayh.",
        note:"تَجَاوَزَ = 'passed over / overlooked' — from the root of crossing over. Allah CROSSED OVER the account of these three — as if they don't exist on the books." },
      { id:2, arabic:"الثَّلَاثَة المَرْفُوعَة عَنِ الأُمَّة:\n١. الخَطَأ: فِعْلٌ بِلَا قَصْد وَلَا تَقْصِير\nمِثَال: يَكْسِرُ شَيْئًا أَثْنَاءَ العَمَل بِغَيْرِ إِهْمَال\n\n٢. النِّسْيَان: الفِعْلُ أَوِ التَّرْكُ بِسَبَبِ النِّسْيَانِ الصَّادِق\nمِثَال: نَسِيَ أَنَّهُ صَائِم فَأَكَل\n\n٣. الإِكْرَاه: فِعْلٌ تَحْتَ التَّهْدِيدِ وَالإِجْبَار\nمِثَال: أُكْرِهَ عَلَى الكُفْرِ وَقَلْبُهُ مُطْمَئِنٌّ بِالإِيمَان — مَعْذُور\n\nمَلَاحَظَة: لَا يَسْقُطُ حَقُّ الآخَرِين بِهَذَا — ضَمَان الخَطَأ يَبْقَى",
        translation:"The Three Forgiven Categories:\n1. Mistake (khaṭaʾ): action without intent and without negligence\nExample: breaks something at work without negligence\n\n2. Forgetfulness (nisyān): doing or leaving something due to genuine forgetting\nExample: forgot he was fasting and ate\n\n3. Compulsion (ikrāh): action under threat and force\nExample: forced to utter disbelief while heart is firm in faith — excused\n\nNote: Others' rights are NOT waived — compensation for property remains",
        transliteration:"Ath-thalāthatu l-marfūʿah ʿani l-ummah.",
        note:"هَذَا مِنْ خَصَائِصِ هَذِهِ الأُمَّة — 'This is among the special gifts of this Ummah.' Previous nations were held accountable for forgetfulness and mistakes. Allah eased the accounting for this Ummah as a mercy." }
    ],
    vocabulary:[
      { arabic:"تَجَاوَزَ", transliteration:"tajāwaza", english:"overlooked / passed over / forgave", pos:"verb (past)" },
      { arabic:"خَطَأ", transliteration:"khaṭaʾ", english:"mistake / error (unintentional)", pos:"noun (m)" },
      { arabic:"نِسْيَان", transliteration:"nisyān", english:"forgetting / forgetfulness", pos:"noun (m)" },
      { arabic:"اسْتُكْرِهَ", transliteration:"ustukriha", english:"was compelled / was forced (passive)", pos:"verb (passive past)" },
      { arabic:"إِكْرَاه", transliteration:"ikrāh", english:"compulsion / coercion / force", pos:"noun (m)" },
    ],
    grammar:{ title:"مَا اسْتُكْرِهُوا عَلَيْهِ — Passive Relative Clause", titleArabic:"الفِعْلُ المَبْنِيُّ لِلْمَجْهُول فِي الصِّلَة",
      explanation:"«مَا اسْتُكْرِهُوا عَلَيْهِ» = 'what they were compelled to do'\n\nمَا (relative 'what') + اسْتُكْرِهُوا (passive past 'they were compelled') + عَلَيْهِ (on it)\n\n= 'What they were compelled upon' = actions forced upon them\n\nاسْتُكْرِهَ is passive of اسْتَكْرَهَ (to compel). The passive shows the ACTION was DONE TO them — they didn't choose it.\n\nThis matters in fiqh: a person who CHOOSES is accountable; one who is COMPELLED is not (for the sin, though compensation may still apply).",
      examples:[{ arabic:"«مَا اسْتُكْرِهُوا عَلَيْهِ» = «مَا أُكْرِهُوا عَلَى فِعْلِهِ»", translation:"What they were compelled upon = what they were forced to do" }] },
    exercises:[{ type:"choose", instruction:"Hadith 39 — Forgiveness for error.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ التَّاسِعِ وَالثَّلَاثِين.",
      items:[
        { question:"If someone forgets they are fasting and eats:", options:["Their fast is broken — must make it up","Their fast is VALID — forgetfulness is forgiven","They must pay kaffara","They must fast an extra day"], answer:1 },
        { question:"Do these three exemptions waive other people's property rights?", options:["Yes — forgiveness means no compensation needed","No — divine forgiveness of sin does not remove the obligation to compensate others","Only if it was an accident","Only for the poor"], answer:1 }
      ], answers:[1,1] }]
  },

  { bookId:"hadith-arbaeen-nawawi", lessonNum:40, title:"Hadith 40 — Be in This World as a Stranger or Wayfarer", titleArabic:"الحَدِيثُ الأَرْبَعُون: كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيب",
    description:"The final and most philosophically profound hadith of the collection — the Islamic worldview on this life's purpose.",
    pages:[
      { id:1, arabic:"عَنِ ابْنِ عُمَرَ رَضِيَ اللهُ عَنْهُمَا قَالَ: أَخَذَ رَسُولُ اللهِ ﷺ بِمَنْكِبَيَّ وَقَالَ:\n«كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيل»\nوَكَانَ ابْنُ عُمَرَ يَقُولُ:\n«إِذَا أَمْسَيْتَ فَلَا تَنْتَظِرِ الصَّبَاحَ، وَإِذَا أَصْبَحْتَ فَلَا تَنْتَظِرِ المَسَاءَ، وَخُذْ مِنْ صِحَّتِكَ لِمَرَضِكَ وَمِنْ حَيَاتِكَ لِمَوْتِكَ»\n[البُخَارِيّ ٦٤١٦]",
        translation:"The Prophet ﷺ held my shoulders and said: 'Be in this world as if you were a stranger or a wayfarer.' Ibn Umar would say: 'When evening comes, don't wait for morning. When morning comes, don't wait for evening. Take from your health for your illness. And take from your life for your death.' [Bukhari 6416]",
        transliteration:"Kun fī d-dunyā ka-annaka gharībun aw ʿābiru sabīl.",
        note:"أَخَذَ بِمَنْكِبَيَّ — 'He took me by my shoulders' — a gesture of seriousness and direct transmission. This is how prophets convey their most important advice — face to face, eyes to eyes." },
      { id:2, arabic:"الغَرِيبُ وَعَابِرُ السَّبِيل:\n\nالغَرِيب = stranger (مُسَافِر مُقِيم مُؤَقَّتًا):\n• يَسْكُنُ فِي بَلَدٍ غَرِيب\n• يَعْمَل وَيَأْكُل لَكِنَّ فِكْرَهُ فِي البَلَدِ الأَصْلِيّ\n\nعَابِرُ السَّبِيل = wayfarer (مُسَافِر لَا يَتَوَقَّف):\n• يَمُرُّ بِالدُّنْيَا مُرُورًا\n• لَا يُثَقِّلُ نَفْسَهُ بِمَا لَا يَحْتَاج\n\nوَصِيَّةُ ابْنِ عُمَر: خَمْسٌ قَبْلَ خَمْس:\n«الصِّحَّة، الفَرَاغ، الشَّبَاب، الغِنَى، الحَيَاة» — قَبْلَ أَضْدَادِهِا",
        translation:"The Stranger and the Wayfarer:\n\nStranger = temporary resident:\n• Lives in a foreign land\n• Works and eats but their heart is in the homeland\n\nWayfarer = traveler who doesn't stop:\n• Passes through the world\n• Doesn't burden themselves with what they don't need\n\nIbn Umar's advice — Five before Five:\n'Health, free time, youth, wealth, life' — before their opposites (illness, busyness, old age, poverty, death)",
        transliteration:"Al-gharību wa ʿābiru s-sabīl.",
        note:"هَذَا الحَدِيثُ خِتَامُ الأَرْبَعِين — This hadith closes the collection with the most essential Islamic worldview: THIS world is not the destination — it's the journey. The wise Muslim lives here but is never of here." }
    ],
    vocabulary:[
      { arabic:"غَرِيب", transliteration:"gharīb", english:"stranger / foreigner (in a temporary land)", pos:"adjective/noun" },
      { arabic:"عَابِر سَبِيل", transliteration:"ʿābiru sabīl", english:"wayfarer / traveler passing through", pos:"noun phrase" },
      { arabic:"مَنْكِب", transliteration:"mankib", english:"shoulder", pos:"noun (m)", plural:"مَنَاكِب" },
      { arabic:"أَمْسَى", transliteration:"amsā", english:"reached evening / became evening", pos:"verb (past)" },
      { arabic:"أَصْبَحَ", transliteration:"aṣbaḥa", english:"reached morning / became morning", pos:"verb (past)" },
    ],
    grammar:{ title:"كَأَنَّ — As If / As Though (Resemblance)", titleArabic:"كَأَنَّ لِلتَّشْبِيه",
      explanation:"«كَأَنَّكَ غَرِيبٌ» — كَأَنَّ (ka-anna) + pronoun = 'as if you were [X]':\n\nكَأَنَّ = كَـ (like) + أَنَّ (that) = 'as if'\n• كَأَنَّكَ غَرِيبٌ = as if you were a stranger\n• كَأَنَّهُ يَنْظُرُ إِلَيَّ = as if he is looking at me\n• كَأَنَّهَا النَّجْم = as if it were a star\n\nThis comparison teaches: ACT as if you're a stranger — you're not told 'you ARE a stranger.' The worldly Muslim's mindset requires INTENTIONAL CHOICE to live with detachment.",
      examples:[{ arabic:"«كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيل»", translation:"Be in this world AS IF you were a stranger or wayfarer" }] },
    exercises:[{ type:"choose", instruction:"Hadith 40 — The final lesson.", instructionArabic:"أَجِبْ عَنِ الحَدِيثِ الأَرْبَعِين — الخَتَام.",
      items:[
        { question:"The stranger metaphor teaches:", options:["Avoid buying a home","Live in this world but always remember you're heading to a higher homeland (Akhirah)","Never plan for the future","Avoid all wealth"], answer:1 },
        { question:"Ibn Umar's 'Five before Five' refers to:", options:["Five prayers before five pillars","Five blessings (health, free time, youth, wealth, life) that should be used before their opposites come","Five daily habits","Five pillars of Islam"], answer:1 }
      ], answers:[1,1] }]
  },
];
