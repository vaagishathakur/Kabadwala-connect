// src/services/notifications/receiptSender.js
const logger = require('../../utils/logger');

const TEMPLATES = {
  hi: (data) =>
`🌿 *कबाड़कनेक्ट ई-वेस्ट रसीद* (CPCB अनुपालन)
━━━━━━━━━━━━━━━━━━━━━
👤 *विक्रेता / कबाड़ीवाला:* ${data.collector_name}
📦 *लॉट संदर्भ कोड:* ${data.reference}
📋 *सामग्री श्रेणी:* ${data.cpcb_code} (${data.material_name})
⚖️ *प्रमाणित शुद्ध वजन:* ${data.net_weight_kg} kg (शुद्धता: ${data.purity}%)
💰 *कुल भुगतान राशि:* ₹${data.amount}
⚡ *भुगतान माध्यम:* ${data.payment_mode === 'UPI' ? `UPI (UTR: ${data.utr})` : 'नकद (Cash)'}
🏭 *अधिकृत रिसायकलर:* ${data.recycler_name}
📜 *CPCB पंजीयन:* ${data.cpcb_reg_no}
🔐 *डिजिटल ऑडिट हैश:* ${data.audit_hash_short}
━━━━━━━━━━━━━━━━━━━━━
भारत सरकार ई-कचरा प्रबंधन नियम 2022 के तहत पर्यावरण संरक्षण में सहयोग के लिए धन्यवाद!`,

  mr: (data) =>
`🌿 *कबाडकनेक्ट ई-कचरा पावती* (CPCB नियम)
━━━━━━━━━━━━━━━━━━━━━
👤 *संकलक नाव:* ${data.collector_name}
📦 *लॉट संदर्भ:* ${data.reference}
📋 *श्रेणी:* ${data.cpcb_code} (${data.material_name})
⚖️ *प्रमाणित निव्वळ वजन:* ${data.net_weight_kg} kg (शुद्धता: ${data.purity}%)
💰 *एकूण रक्कम:* ₹${data.amount}
⚡ *पेमेंट पद्धत:* ${data.payment_mode === 'UPI' ? `UPI (UTR: ${data.utr})` : 'रोख (Cash)'}
🏭 *मान्यताप्राप्त रिसायकलर:* ${data.recycler_name}
📜 *CPCB नोंदणी:* ${data.cpcb_reg_no}
🔐 *डिजिटल ऑडिट स्वाक्षरी:* ${data.audit_hash_short}
━━━━━━━━━━━━━━━━━━━━━
महाराष्ट्र व भारत सरकारच्या नियमांनुसार ई-कचरा पुनर्वापरासाठी धन्यवाद!`,

  en: (data) =>
`🌿 *KabadConnect Official E-Waste Receipt*
━━━━━━━━━━━━━━━━━━━━━
👤 *Collector:* ${data.collector_name}
📦 *Lot Reference:* ${data.reference}
📋 *CPCB Category:* ${data.cpcb_code} (${data.material_name})
⚖️ *Certified Net Weight:* ${data.net_weight_kg} kg (Purity: ${data.purity}%)
💰 *Total Settlement:* ₹${data.amount}
⚡ *Payment Method:* ${data.payment_mode === 'UPI' ? `UPI (UTR: ${data.utr})` : 'Cash'}
🏭 *Authorized Recycler:* ${data.recycler_name}
📜 *CPCB Reg No:* ${data.cpcb_reg_no}
🔐 *Audit Signature:* ${data.audit_hash_short}
━━━━━━━━━━━━━━━━━━━━━
Issued under India E-Waste (Management) Rules, 2022 Form-6 Schedule.`
};

function formatReceipt(data, lang = 'hi') {
  const chosen = TEMPLATES[lang] || TEMPLATES.hi;
  return chosen(data);
}

function generateWhatsAppUrl(phone, message) {
  const clean = String(phone || '').replace(/[^0-9]/g, '');
  const withCode = clean.length === 10 ? `91${clean}` : clean;
  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
}

async function dispatchSmsNotification(phone, message) {
  // In production: dispatch via SMS gateway (Exotel / MSG91 / Twilio) with DLT template
  logger.info(`[SMS SIMULATION] Dispatched receipt to ${phone.slice(-4).padStart(phone.length, '*')}`);
  return {
    success: true,
    provider: 'Simulated DLT Gateway',
    phone_masked: phone.slice(-4).padStart(phone.length, '*'),
    dispatched_at: new Date().toISOString(),
    dlt_template_id: '140716892019482',
  };
}

module.exports = {
  formatReceipt,
  generateWhatsAppUrl,
  dispatchSmsNotification,
};
