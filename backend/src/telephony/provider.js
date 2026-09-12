const { LANGUAGES } = require('../services/ivr/prompts');

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

class MockTelephonyProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'mock';
  }

  format(response) {
    return response;
  }
}

class TwilioTelephonyProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'twilio';
  }

  voiceFor(language) {
    if (language === 'mr') return 'Google.mr-IN-Wavenet-A';
    if (language === 'en') return 'Google.en-IN-Wavenet-A';
    return 'Google.hi-IN-Wavenet-A';
  }

  languageFor(language) {
    return LANGUAGES[language]?.locale || 'hi-IN';
  }

  format(response, actionUrl) {
    const say = `<Say language="${this.languageFor(response.language)}" voice="${this.voiceFor(response.language)}">${escapeXml(response.prompt)}</Say>`;

    if ((response.action === 'transfer' || response.action === 'support') && response.transferTo) {
      return `<?xml version="1.0" encoding="UTF-8"?><Response>${say}<Dial>${escapeXml(response.transferTo)}</Dial></Response>`;
    }

    if (response.action === 'simulate_transfer' || response.expecting === 'none') {
      return `<?xml version="1.0" encoding="UTF-8"?><Response>${say}<Hangup/></Response>`;
    }

    const finishOnKey = response.expecting === 'weight' || response.expecting === 'lot_id' ? ' finishOnKey="#" timeout="8"' : ' numDigits="1" timeout="5"';
    const redirect = `<Redirect method="POST">${escapeXml(`${actionUrl}&empty=1`)}</Redirect>`;
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Gather input="dtmf" action="${escapeXml(actionUrl)}" method="POST"${finishOnKey}>${say}</Gather>${redirect}</Response>`;
  }
}

function createTelephonyProvider() {
  const provider = (process.env.IVR_PROVIDER || 'mock').toLowerCase();
  if (provider === 'twilio') return new TwilioTelephonyProvider(process.env);
  return new MockTelephonyProvider(process.env);
}

module.exports = {
  MockTelephonyProvider,
  TwilioTelephonyProvider,
  createTelephonyProvider,
};
