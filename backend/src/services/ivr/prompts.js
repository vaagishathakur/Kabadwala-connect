const LANGUAGES = {
  hi: { label: 'Hindi', locale: 'hi-IN' },
  mr: { label: 'Marathi', locale: 'mr-IN' },
  en: { label: 'English', locale: 'en-IN' },
};

const MATERIALS = [
  { key: '1', category: 'PCB', names: { hi: 'पीसीबी', mr: 'पीसीबी', en: 'PCB' } },
  { key: '2', category: 'Cable', names: { hi: 'तार और केबल', mr: 'तार आणि केबल', en: 'Cable' } },
  { key: '3', category: 'Battery', names: { hi: 'बैटरी', mr: 'बॅटरी', en: 'Battery' } },
  { key: '4', category: 'LCD', names: { hi: 'एलसीडी', mr: 'एलसीडी', en: 'LCD' } },
  { key: '5', category: 'CRT', names: { hi: 'सी आर टी', mr: 'सी आर टी', en: 'CRT' } },
  { key: '6', category: 'Motor', names: { hi: 'मोटर', mr: 'मोटर', en: 'Motor' } },
  { key: '7', category: 'Plastic', names: { hi: 'प्लास्टिक', mr: 'प्लास्टिक', en: 'Plastic' } },
  { key: '8', category: 'Mixed', names: { hi: 'मिश्रित सामान', mr: 'मिश्र साहित्य', en: 'Mixed' } },
  { key: '9', category: 'Other', names: { hi: 'अन्य सामान', mr: 'इतर साहित्य', en: 'Other' } },
];

const MATERIAL_BY_KEY = MATERIALS.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

function materialName(category, language = 'hi') {
  const item = MATERIALS.find((m) => m.category === category);
  return item ? item.names[language] || item.names.en : category;
}

function materialMenu(language = 'hi') {
  const copy = {
    hi: 'सामग्री चुनें। पीसीबी के लिए 1, केबल के लिए 2, बैटरी के लिए 3, एलसीडी के लिए 4, सी आर टी के लिए 5, मोटर के लिए 6, प्लास्टिक के लिए 7, मिश्रित के लिए 8, अन्य के लिए 9 दबाएं।',
    mr: 'साहित्य निवडा. पीसीबीसाठी 1, केबलसाठी 2, बॅटरीसाठी 3, एलसीडीसाठी 4, सी आर टीसाठी 5, मोटरसाठी 6, प्लास्टिकसाठी 7, मिश्रसाठी 8, इतरसाठी 9 दाबा.',
    en: 'Choose material. Press 1 for PCB, 2 for cable, 3 for battery, 4 for LCD, 5 for CRT, 6 for motor, 7 for plastic, 8 for mixed, 9 for other.',
  };
  return copy[language] || copy.hi;
}

const PROMPTS = {
  language: {
    hi: 'कबाड़कनेक्ट साथी में आपका स्वागत है। हिंदी के लिए 1 दबाएं। मराठी के लिए 2 दबाएं। English के लिए 3 दबाएं।',
    mr: 'कबाडकनेक्ट साथीमध्ये आपले स्वागत आहे. हिंदीसाठी 1 दाबा. मराठीसाठी 2 दाबा. English साठी 3 दाबा.',
    en: 'Welcome to KabadConnect Saathi. Press 1 for Hindi. Press 2 for Marathi. Press 3 for English.',
  },
  main: {
    hi: 'मुख्य मेनू। भाषा बदलने के लिए 1 दबाएं। ई-वेस्ट बेचने के लिए 2 दबाएं। आज के भाव के लिए 3 दबाएं। अधिकृत रीसायकलर के लिए 4 दबाएं। भुगतान और कमाई के लिए 5 दबाएं। सुरक्षा जानकारी के लिए 6 दबाएं। लॉट की स्थिति के लिए 7 दबाएं। मदद के लिए 8 दबाएं। कस्टमर सपोर्ट के लिए 9 दबाएं। मेनू दोबारा सुनने के लिए 0 दबाएं।',
    mr: 'मुख्य मेनू. भाषा बदलण्यासाठी 1 दाबा. ई-कचरा विकण्यासाठी 2 दाबा. आजचे भाव ऐकण्यासाठी 3 दाबा. अधिकृत रिसायकलरसाठी 4 दाबा. पेमेंट आणि कमाईसाठी 5 दाबा. सुरक्षा माहितीसाठी 6 दाबा. लॉट स्थितीसाठी 7 दाबा. मदतीसाठी 8 दाबा. ग्राहक सपोर्टसाठी 9 दाबा. मेनू पुन्हा ऐकण्यासाठी 0 दाबा.',
    en: 'Main menu. Press 1 for language. Press 2 to sell e-waste. Press 3 for prices. Press 4 for authorized recycler. Press 5 for payments and earnings. Press 6 for safety. Press 7 for lot status. Press 8 for help. Press 9 for support. Press 0 to repeat.',
  },
  invalid: {
    hi: 'यह विकल्प सही नहीं है। कृपया दोबारा चुनें।',
    mr: 'हा पर्याय बरोबर नाही. कृपया पुन्हा निवडा.',
    en: 'That option is not correct. Please choose again.',
  },
  noInput: {
    hi: 'आपने कोई विकल्प नहीं चुना। मुख्य मेनू सुनने के लिए 0 दबाएं।',
    mr: 'आपण कोणताही पर्याय निवडला नाही. मुख्य मेनू ऐकण्यासाठी 0 दाबा.',
    en: 'No option was selected. Press 0 for the main menu.',
  },
  failureSupport: {
    hi: 'मैं आपको कस्टमर सपोर्ट से जोड़ रहा हूं। कृपया लाइन पर रहें।',
    mr: 'मी आपल्याला ग्राहक सपोर्टशी जोडत आहे. कृपया लाईनवर रहा.',
    en: 'I am connecting you to customer support. Please stay on the line.',
  },
  backendDown: {
    hi: 'अभी सर्वर से जानकारी नहीं मिल रही है। थोड़ी देर बाद फिर कोशिश करें या सपोर्ट से बात करें।',
    mr: 'सध्या सर्व्हरकडून माहिती मिळत नाही. थोड्या वेळाने प्रयत्न करा किंवा सपोर्टशी बोला.',
    en: 'I cannot reach the server right now. Please try again later or speak to support.',
  },
  weight: {
    hi: 'अपना वजन किलो में दर्ज करें और अंत में हैश दबाएं। जैसे 10 हैश।',
    mr: 'वजन किलोमध्ये टाका आणि शेवटी हॅश दाबा. उदाहरण 10 हॅश.',
    en: 'Enter weight in kilograms and press hash. For example, 10 hash.',
  },
  transactionMenu: {
    hi: 'लेन-देन मेनू। पिछली बिक्री के लिए 1, लंबित भुगतान के लिए 2, कुल कमाई के लिए 3, हाल की बिक्री के लिए 4, मुख्य मेनू के लिए 0 दबाएं।',
    mr: 'व्यवहार मेनू. शेवटच्या विक्रीसाठी 1, प्रलंबित पेमेंटसाठी 2, एकूण कमाईसाठी 3, अलीकडील विक्रीसाठी 4, मुख्य मेनूसाठी 0 दाबा.',
    en: 'Transactions menu. Press 1 for latest sale, 2 for pending payment, 3 for total earnings, 4 for recent sales, 0 for main menu.',
  },
  safetyMenu: {
    hi: 'सुरक्षा जानकारी। तार न जलाने के लिए 1, बैटरी सुरक्षा के लिए 2, सी आर टी सुरक्षा के लिए 3, पीसीबी सुरक्षा के लिए 4, सामान्य सुरक्षा के लिए 5, मुख्य मेनू के लिए 0 दबाएं।',
    mr: 'सुरक्षा माहिती. तार न जाळण्यासाठी 1, बॅटरी सुरक्षेसाठी 2, सी आर टी सुरक्षेसाठी 3, पीसीबी सुरक्षेसाठी 4, सामान्य सुरक्षेसाठी 5, मुख्य मेनूसाठी 0 दाबा.',
    en: 'Safety. Press 1 for cable burning, 2 for battery safety, 3 for CRT safety, 4 for PCB safety, 5 for general handling, 0 for main menu.',
  },
  help: {
    hi: 'कबाड़कनेक्ट साथी से आप भाव सुन सकते हैं, लॉट बना सकते हैं, अधिकृत रीसायकलर ढूंढ सकते हैं, और भुगतान की जानकारी ले सकते हैं। मुख्य मेनू के लिए 0 दबाएं।',
    mr: 'कबाडकनेक्ट साथीवर आपण भाव ऐकू शकता, लॉट तयार करू शकता, अधिकृत रिसायकलर शोधू शकता, आणि पेमेंट माहिती घेऊ शकता. मुख्य मेनूसाठी 0 दाबा.',
    en: 'With KabadConnect Saathi you can hear prices, create a lot, find an authorized recycler, and check payment information. Press 0 for main menu.',
  },
  lotStatus: {
    hi: 'अपना लॉट नंबर दर्ज करें और अंत में हैश दबाएं।',
    mr: 'आपला लॉट नंबर टाका आणि शेवटी हॅश दाबा.',
    en: 'Enter your lot number and press hash.',
  },
};

const SAFETY_TOPICS = {
  1: {
    hi: 'तार जलाकर तांबा निकालना खतरनाक है। धुएं से स्वास्थ्य को नुकसान हो सकता है। तार अधिकृत रीसायकलर को दें।',
    mr: 'तार जाळून तांबे काढणे धोकादायक आहे. धुरामुळे आरोग्याला नुकसान होऊ शकते. तार अधिकृत रिसायकलरला द्या.',
    en: 'Do not burn wires to remove copper. Smoke can harm your health. Give wires to an authorized recycler.',
  },
  2: {
    hi: 'बैटरी को मत तोड़ें और पानी या आग से दूर रखें। फूली हुई बैटरी अलग रखें और जल्दी रीसायकलर को दें।',
    mr: 'बॅटरी फोडू नका आणि पाणी किंवा आगीपासून दूर ठेवा. फुगलेली बॅटरी वेगळी ठेवा आणि रिसायकलरला द्या.',
    en: 'Do not break batteries. Keep them away from water and fire. Separate swollen batteries and give them to a recycler.',
  },
  3: {
    hi: 'सी आर टी टीवी या मॉनिटर न तोड़ें। कांच और पाउडर खतरनाक हो सकते हैं। इसे सावधानी से उठाएं।',
    mr: 'सी आर टी टीव्ही किंवा मॉनिटर फोडू नका. काच आणि पावडर धोकादायक असू शकतात. काळजीपूर्वक उचला.',
    en: 'Do not break CRT TVs or monitors. Glass and powder can be dangerous. Lift carefully.',
  },
  4: {
    hi: 'पीसीबी को एसिड से साफ न करें। रसायन त्वचा और फेफड़ों को नुकसान पहुंचा सकते हैं।',
    mr: 'पीसीबी अॅसिडने साफ करू नका. रसायने त्वचा आणि फुफ्फुसांना नुकसान करू शकतात.',
    en: 'Do not clean PCB with acid. Chemicals can harm skin and lungs.',
  },
  5: {
    hi: 'दस्ताने पहनें, सामान सूखा रखें, और बच्चों से दूर रखें। अधिकृत रीसायकलर को ही दें।',
    mr: 'हातमोजे वापरा, साहित्य कोरडे ठेवा, आणि मुलांपासून दूर ठेवा. अधिकृत रिसायकलरलाच द्या.',
    en: 'Wear gloves, keep material dry, and keep it away from children. Use authorized recyclers.',
  },
};

module.exports = {
  LANGUAGES,
  MATERIALS,
  MATERIAL_BY_KEY,
  PROMPTS,
  SAFETY_TOPICS,
  materialMenu,
  materialName,
};
