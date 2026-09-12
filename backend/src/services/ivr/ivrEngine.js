const { v4: uuidv4 } = require('uuid');
const { IVRCall } = require('../../models');
const {
  MATERIAL_BY_KEY,
  PROMPTS,
  SAFETY_TOPICS,
  materialMenu,
  materialName,
} = require('./prompts');
const {
  DEFAULT_CITY,
  createSellingLot,
  estimateLot,
  findLotByDigits,
  findOrCreateCollector,
  getPriceSummary,
  getRankedRecyclers,
  getTransactionSummary,
  hashPhone,
  setCollectorLanguage,
} = require('./ivrData');
const logger = require('../../utils/logger');

const sessions = new Map();
const MAX_RETRIES = 2;

function prompt(key, language = 'hi') {
  return PROMPTS[key]?.[language] || PROMPTS[key]?.hi || '';
}

function normalizeDigits(input) {
  return String(input || '').trim().replace(/\s/g, '');
}

function parseWeight(input) {
  const cleaned = normalizeDigits(input).replace(/#/g, '');
  const weight = parseFloat(cleaned);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 10000) return null;
  return weight;
}

function trendWord(trend, language) {
  const words = {
    up: { hi: 'थोड़ा बढ़ा है', mr: 'थोडा वाढला आहे', en: 'has increased slightly' },
    down: { hi: 'थोड़ा घटा है', mr: 'थोडा कमी झाला आहे', en: 'has decreased slightly' },
    stable: { hi: 'स्थिर है', mr: 'स्थिर आहे', en: 'is stable' },
  };
  return words[trend]?.[language] || words.stable[language] || words.stable.hi;
}

function statusWord(status, language) {
  const words = {
    Created: { hi: 'बन गया है', mr: 'तयार झाला आहे', en: 'created' },
    Matched: { hi: 'रीसायकलर से मैच हो गया है', mr: 'रिसायकलरशी जुळला आहे', en: 'matched with a recycler' },
    Confirmed: { hi: 'पुष्टि हो गई है', mr: 'पुष्टी झाली आहे', en: 'confirmed' },
    Completed: { hi: 'पूरा हो गया है', mr: 'पूर्ण झाला आहे', en: 'completed' },
    Cancelled: { hi: 'रद्द हो गया है', mr: 'रद्द झाला आहे', en: 'cancelled' },
    Pending: { hi: 'लंबित है', mr: 'प्रलंबित आहे', en: 'pending' },
    Paid: { hi: 'भुगतान हो चुका है', mr: 'पेमेंट झाले आहे', en: 'paid' },
    Disputed: { hi: 'विवादित है', mr: 'विवादित आहे', en: 'disputed' },
  };
  return words[status]?.[language] || status;
}

function menuFor(stage, language, data = {}) {
  if (stage === 'sellMaterial' || stage === 'priceMaterial' || stage === 'recyclerMaterial') return materialMenu(language);
  if (stage === 'sellWeight') return prompt('weight', language);
  if (stage === 'transactions') return prompt('transactionMenu', language);
  if (stage === 'safety') return prompt('safetyMenu', language);
  if (stage === 'lotStatus') return prompt('lotStatus', language);
  if (stage === 'language') return prompt('language', language);
  if (stage === 'main') return prompt('main', language);
  return data.prompt || prompt('main', language);
}

function makeResponse(session, text, extras = {}) {
  return {
    callId: session.id,
    language: session.language,
    stage: session.stage,
    prompt: text,
    menuPath: session.menuPath,
    metrics: session.metrics,
    ...extras,
  };
}

async function safeLogStart(session) {
  try {
    const log = await IVRCall.create({
      id: uuidv4(),
      provider_call_id: session.providerCallId,
      caller_hash: session.callerHash,
      language: session.language,
      menu_path: session.menuPath,
      metrics: session.metrics,
      outcome: 'started',
    });
    session.logId = log.id;
  } catch (err) {
    logger.debug(`IVR log start skipped: ${err.message}`);
  }
}

async function safeLogProgress(session, outcome = null) {
  if (!session.logId) return;
  try {
    await IVRCall.update({
      language: session.language,
      menu_path: session.menuPath,
      metrics: session.metrics,
      outcome: outcome || session.outcome || 'in_progress',
      ended_at: outcome === 'ended' ? new Date() : null,
    }, { where: { id: session.logId } });
  } catch (err) {
    logger.debug(`IVR log update skipped: ${err.message}`);
  }
}

function bumpMetric(session, key) {
  session.metrics[key] = (session.metrics[key] || 0) + 1;
}

function resetRetries(session) {
  session.invalidAttempts = 0;
  session.noInputAttempts = 0;
}

async function fallbackOrRetry(session, isNoInput = false) {
  if (isNoInput) {
    session.noInputAttempts += 1;
    bumpMetric(session, 'no_input');
  } else {
    session.invalidAttempts += 1;
    bumpMetric(session, 'failed_input');
  }

  const attempts = Math.max(session.invalidAttempts, session.noInputAttempts);
  if (attempts > MAX_RETRIES) {
    session.stage = 'support';
    session.outcome = 'support_after_failed_input';
    bumpMetric(session, 'human_support_requests');
    await safeLogProgress(session);
    return makeResponse(session, prompt('failureSupport', session.language), {
      action: 'support',
      transferTo: process.env.IVR_SUPPORT_NUMBER || null,
      expecting: 'none',
    });
  }

  const currentMenu = menuFor(session.stage, session.language);
  const prefix = isNoInput ? prompt('noInput', session.language) : prompt('invalid', session.language);
  await safeLogProgress(session);
  return makeResponse(session, `${prefix} ${currentMenu}`, { expecting: session.expecting || 'digit' });
}

async function startCall({ providerCallId, caller = 'simulator', language = null } = {}) {
  const callId = providerCallId || uuidv4();
  let collector = null;
  let callerHash = hashPhone(caller);
  let created = true;
  let preferredLanguage = language || 'hi';

  try {
    const result = await findOrCreateCollector(caller, preferredLanguage);
    collector = result.collector;
    callerHash = result.callerHash;
    created = result.created;
    preferredLanguage = language || collector.preferred_language || 'hi';
  } catch (err) {
    logger.debug(`IVR collector lookup fallback: ${err.message}`);
  }

  const session = {
    id: callId,
    providerCallId,
    callerHash,
    collectorId: collector?.id || null,
    language: preferredLanguage,
    stage: created && !language ? 'language' : 'main',
    menuPath: [],
    metrics: {},
    data: { city: collector?.operating_city || DEFAULT_CITY },
    invalidAttempts: 0,
    noInputAttempts: 0,
    expecting: created && !language ? 'digit' : 'digit',
    outcome: 'started',
  };

  sessions.set(callId, session);
  await safeLogStart(session);

  const text = session.stage === 'language' ? prompt('language', session.language) : prompt('main', session.language);
  return makeResponse(session, text, { expecting: 'digit' });
}

function getSession(callId) {
  return sessions.get(callId);
}

async function handleLanguage(session, digit) {
  const languages = { 1: 'hi', 2: 'mr', 3: 'en' };
  if (!languages[digit]) return fallbackOrRetry(session);
  session.language = languages[digit];
  session.stage = 'main';
  resetRetries(session);
  bumpMetric(session, 'language_chosen');
  session.menuPath.push(`language:${session.language}`);
  if (session.collectorId) await setCollectorLanguage(session.collectorId, session.language).catch(() => {});
  await safeLogProgress(session);
  return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
}

function enterStage(session, stage, metric) {
  session.stage = stage;
  resetRetries(session);
  if (metric) bumpMetric(session, metric);
  session.menuPath.push(stage);
}

async function handleMain(session, digit) {
  if (digit === '0') {
    resetRetries(session);
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (digit === '1') {
    enterStage(session, 'language');
    return makeResponse(session, prompt('language', session.language), { expecting: 'digit' });
  }
  if (digit === '2') {
    enterStage(session, 'sellMaterial', 'lot_creation_requests');
    const intro = session.language === 'en'
      ? 'To sell e-waste, choose the material type.'
      : session.language === 'mr'
        ? 'ई-कचरा विकण्यासाठी साहित्याचा प्रकार निवडा.'
        : 'ई-वेस्ट बेचने के लिए सामग्री का प्रकार चुनें।';
    return makeResponse(session, `${intro} ${materialMenu(session.language)}`, { expecting: 'digit' });
  }
  if (digit === '3') {
    enterStage(session, 'priceMaterial', 'price_requests');
    return makeResponse(session, materialMenu(session.language), { expecting: 'digit' });
  }
  if (digit === '4') {
    enterStage(session, 'recyclerMaterial', 'recycler_requests');
    return makeResponse(session, materialMenu(session.language), { expecting: 'digit' });
  }
  if (digit === '5') {
    enterStage(session, 'transactions', 'transaction_status_requests');
    return makeResponse(session, prompt('transactionMenu', session.language), { expecting: 'digit' });
  }
  if (digit === '6') {
    enterStage(session, 'safety');
    return makeResponse(session, prompt('safetyMenu', session.language), { expecting: 'digit' });
  }
  if (digit === '7') {
    enterStage(session, 'lotStatus', 'lot_status_requests');
    session.expecting = 'lot_id';
    return makeResponse(session, prompt('lotStatus', session.language), { expecting: 'lot_id' });
  }
  if (digit === '8') {
    session.menuPath.push('help');
    return makeResponse(session, prompt('help', session.language), { expecting: 'digit' });
  }
  if (digit === '9') {
    enterStage(session, 'support', 'human_support_requests');
    session.outcome = 'support_requested';
    await safeLogProgress(session);
    return makeResponse(session, prompt('failureSupport', session.language), {
      action: 'support',
      transferTo: process.env.IVR_SUPPORT_NUMBER || null,
      expecting: 'none',
    });
  }
  return fallbackOrRetry(session);
}

async function handleMaterialChoice(session, digit) {
  const material = MATERIAL_BY_KEY[digit];
  if (!material) return fallbackOrRetry(session);
  session.data.category = material.category;
  session.menuPath.push(`${session.stage}:${material.category}`);
  resetRetries(session);

  if (session.stage === 'sellMaterial') {
    session.stage = 'sellWeight';
    session.expecting = 'weight';
    await safeLogProgress(session);
    return makeResponse(session, prompt('weight', session.language), { expecting: 'weight' });
  }

  if (session.stage === 'priceMaterial') {
    return priceResponse(session, material.category);
  }

  return recyclerResponse(session, material.category, 0);
}

async function priceResponse(session, category) {
  try {
    const summary = await getPriceSummary(category, session.data.city);
    session.stage = 'afterPrice';
    session.data.category = category;
    session.data.lastPricePrompt = summary;
    bumpMetric(session, 'successful_completion');
    const name = materialName(category, session.language);
    const text = session.language === 'en'
      ? `${name} average price today is about ${summary.avg_price_inr} rupees per kilogram. Market range is ${summary.range_low} to ${summary.range_high} rupees. In the last 7 days, price ${trendWord(summary.trend, session.language)}. Press 4 to hear authorized recycler, 3 for another price, or 0 for main menu.`
      : session.language === 'mr'
        ? `${name} चा आजचा सरासरी भाव सुमारे ${summary.avg_price_inr} रुपये किलो आहे. बाजार भाव ${summary.range_low} ते ${summary.range_high} रुपये आहे. मागील 7 दिवसांत भाव ${trendWord(summary.trend, session.language)}. अधिकृत रिसायकलरसाठी 4, दुसरा भाव ऐकण्यासाठी 3, मुख्य मेनूसाठी 0 दाबा.`
        : `${name} का आज का औसत भाव लगभग ${summary.avg_price_inr} रुपये प्रति किलो है। बाजार भाव ${summary.range_low} से ${summary.range_high} रुपये है। पिछले 7 दिनों में भाव ${trendWord(summary.trend, session.language)}। अधिकृत रीसायकलर सुनने के लिए 4, दूसरा भाव सुनने के लिए 3, मुख्य मेनू के लिए 0 दबाएं।`;
    await safeLogProgress(session);
    return makeResponse(session, text, { expecting: 'digit', data: summary });
  } catch (err) {
    logger.error(`IVR price response error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'PRICE_LOOKUP_FAILED' });
  }
}

async function handleAfterPrice(session, digit) {
  if (digit === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (digit === '3') {
    session.stage = 'priceMaterial';
    return makeResponse(session, materialMenu(session.language), { expecting: 'digit' });
  }
  if (digit === '4') {
    bumpMetric(session, 'recycler_requests');
    return recyclerResponse(session, session.data.category, 0);
  }
  return fallbackOrRetry(session);
}

async function handleSellWeight(session, digits) {
  const weightKg = parseWeight(digits);
  if (!weightKg) return fallbackOrRetry(session);
  try {
    const category = session.data.category;
    const estimate = await estimateLot(category, weightKg, session.data.city);
    session.data.weightKg = weightKg;
    session.data.estimate = estimate;
    session.stage = 'sellConfirm';
    session.expecting = 'digit';
    const name = materialName(category, session.language);
    const text = session.language === 'en'
      ? `Your ${weightKg} kilogram ${name} value is about ${Math.round(estimate.estimated_value_inr)} rupees. Today's rate is around ${Math.round(estimate.price_per_kg)} rupees per kilogram. Press 1 to create selling request, 2 to hear price again, 3 to find recycler, 0 for main menu.`
      : session.language === 'mr'
        ? `आपल्या ${weightKg} किलो ${name} ची अंदाजे किंमत सुमारे ${Math.round(estimate.estimated_value_inr)} रुपये आहे. आजचा भाव सुमारे ${Math.round(estimate.price_per_kg)} रुपये किलो आहे. विक्री विनंती तयार करण्यासाठी 1, भाव पुन्हा ऐकण्यासाठी 2, रिसायकलरसाठी 3, मुख्य मेनूसाठी 0 दाबा.`
        : `आपके ${weightKg} किलो ${name} की अनुमानित कीमत लगभग ${Math.round(estimate.estimated_value_inr)} रुपये है। आज का भाव लगभग ${Math.round(estimate.price_per_kg)} रुपये प्रति किलो है। बेचने की रिक्वेस्ट बनाने के लिए 1, भाव दोबारा सुनने के लिए 2, रीसायकलर ढूंढने के लिए 3, मुख्य मेनू के लिए 0 दबाएं।`;
    await safeLogProgress(session);
    return makeResponse(session, text, { expecting: 'digit', data: estimate });
  } catch (err) {
    logger.error(`IVR weight estimate error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'ESTIMATE_FAILED' });
  }
}

async function handleSellConfirm(session, digit) {
  if (digit === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (digit === '2') {
    return handleSellWeight(session, String(session.data.weightKg));
  }
  if (digit === '3') {
    bumpMetric(session, 'recycler_requests');
    return recyclerResponse(session, session.data.category, 0);
  }
  if (digit !== '1') return fallbackOrRetry(session);

  if (!session.collectorId) {
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'COLLECTOR_NOT_AVAILABLE' });
  }

  try {
    const result = await createSellingLot({
      collectorId: session.collectorId,
      category: session.data.category,
      weightKg: session.data.weightKg,
      city: session.data.city,
    });
    session.data.createdLotId = result.lot.id;
    session.outcome = 'lot_created';
    bumpMetric(session, 'successful_completion');
    const digits = String(result.lot.id).replace(/\D/g, '').slice(-4) || '0000';
    const text = session.language === 'en'
      ? `Selling request created. Your lot number ends with ${digits}. Press 4 to find recycler, or 0 for main menu.`
      : session.language === 'mr'
        ? `विक्री विनंती तयार झाली. आपल्या लॉट नंबरचे शेवटचे अंक ${digits} आहेत. रिसायकलरसाठी 4, मुख्य मेनूसाठी 0 दाबा.`
        : `बेचने की रिक्वेस्ट बन गई है। आपके लॉट नंबर के आखिरी अंक ${digits} हैं। रीसायकलर ढूंढने के लिए 4, मुख्य मेनू के लिए 0 दबाएं।`;
    session.stage = 'afterPrice';
    await safeLogProgress(session, 'lot_created');
    return makeResponse(session, text, { expecting: 'digit', data: { lot_id: result.lot.id, lot_digits: digits } });
  } catch (err) {
    logger.error(`IVR lot create error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'LOT_CREATE_FAILED' });
  }
}

async function recyclerResponse(session, category, index = 0) {
  try {
    const recyclers = session.data.recyclers && session.data.recyclerCategory === category
      ? session.data.recyclers
      : await getRankedRecyclers(category);
    session.data.recyclers = recyclers;
    session.data.recyclerCategory = category;
    session.data.recyclerIndex = Math.min(index, Math.max(recyclers.length - 1, 0));
    session.stage = 'recyclerResult';
    const recycler = recyclers[session.data.recyclerIndex];
    if (!recycler) {
      return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit' });
    }
    const position = session.data.recyclerIndex + 1;
    const total = recyclers.length;
    const rate = recycler.offered_rate_for_category ? `${Math.round(recycler.offered_rate_for_category)} रुपये प्रति किलो` : 'भाव उपलब्ध नहीं';
    const pickup = recycler.pickup_available
      ? { hi: 'पिकअप उपलब्ध है', mr: 'पिकअप उपलब्ध आहे', en: 'pickup is available' }[session.language]
      : { hi: 'पिकअप उपलब्ध नहीं है', mr: 'पिकअप उपलब्ध नाही', en: 'pickup is not available' }[session.language];
    const text = session.language === 'en'
      ? `Recycler ${position} of ${total}. ${recycler.name} is about ${recycler.distance_km || 5} kilometers away. Rate is ${recycler.offered_rate_for_category || 'not available'}. ${pickup}. Press 1 to connect, 2 for next recycler, 0 for main menu.`
      : session.language === 'mr'
        ? `${total} अधिकृत रिसायकलर उपलब्ध आहेत. ${position} नंबर: ${recycler.name}, सुमारे ${recycler.distance_km || 5} किलोमीटर दूर. भाव ${rate}. ${pickup}. संपर्कासाठी 1, पुढील रिसायकलरसाठी 2, मुख्य मेनूसाठी 0 दाबा.`
        : `${total} अधिकृत रीसायकलर उपलब्ध हैं। ${position} नंबर: ${recycler.name}, लगभग ${recycler.distance_km || 5} किलोमीटर दूर है। भाव ${rate}। ${pickup}। संपर्क करने के लिए 1, अगला रीसायकलर सुनने के लिए 2, मुख्य मेनू के लिए 0 दबाएं।`;
    await safeLogProgress(session);
    return makeResponse(session, text, { expecting: 'digit', data: { recycler, index: session.data.recyclerIndex, total } });
  } catch (err) {
    logger.error(`IVR recycler response error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'RECYCLER_LOOKUP_FAILED' });
  }
}

async function handleRecyclerResult(session, digit) {
  if (digit === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (digit === '2') {
    const next = (session.data.recyclerIndex || 0) + 1;
    if (next >= (session.data.recyclers || []).length) return recyclerResponse(session, session.data.recyclerCategory, 0);
    return recyclerResponse(session, session.data.recyclerCategory, next);
  }
  if (digit !== '1') return fallbackOrRetry(session);

  const recycler = session.data.recyclers?.[session.data.recyclerIndex || 0];
  session.outcome = 'recycler_connect_requested';
  bumpMetric(session, 'successful_completion');
  await safeLogProgress(session, 'recycler_connect_requested');
  const text = session.language === 'en'
    ? `Connecting to ${recycler?.name || 'the recycler'}. Please stay on the line.`
    : session.language === 'mr'
      ? `${recycler?.name || 'रिसायकलर'} शी जोडत आहे. कृपया लाईनवर रहा.`
      : `${recycler?.name || 'रीसायकलर'} से जोड़ रहा हूं। कृपया लाइन पर रहें।`;
  return makeResponse(session, text, {
    action: recycler?.contact_phone ? 'transfer' : 'simulate_transfer',
    transferTo: recycler?.contact_phone || null,
    expecting: 'none',
    data: { recycler },
  });
}

async function handleTransactions(session, digit) {
  if (digit === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (!['1', '2', '3', '4'].includes(digit)) return fallbackOrRetry(session);
  if (!session.collectorId) return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit' });

  try {
    const summary = await getTransactionSummary(session.collectorId);
    const latest = summary.transactions[0];
    let text;
    if (!latest && digit !== '3' && digit !== '2') {
      text = session.language === 'en' ? 'No transaction found yet. Press 0 for main menu.' : session.language === 'mr' ? 'अजून कोणताही व्यवहार नाही. मुख्य मेनूसाठी 0 दाबा.' : 'अभी कोई लेन-देन नहीं मिला। मुख्य मेनू के लिए 0 दबाएं।';
    } else if (digit === '1') {
      const amount = Math.round(parseFloat(latest.final_price_inr || latest.quoted_price_inr || 0));
      text = session.language === 'en'
        ? `Your latest sale was ${amount} rupees. Payment status is ${latest.payment_status}. Press 0 for main menu.`
        : session.language === 'mr'
          ? `आपली शेवटची विक्री ${amount} रुपयांची होती. पेमेंट स्थिती: ${statusWord(latest.payment_status, session.language)}. मुख्य मेनूसाठी 0 दाबा.`
          : `आपकी पिछली बिक्री ${amount} रुपये की थी। भुगतान की स्थिति: ${statusWord(latest.payment_status, session.language)}। मुख्य मेनू के लिए 0 दबाएं।`;
    } else if (digit === '2') {
      text = session.language === 'en'
        ? `Your pending payment amount is ${summary.totalPending} rupees. Press 0 for main menu.`
        : session.language === 'mr'
          ? `आपली प्रलंबित पेमेंट रक्कम ${summary.totalPending} रुपये आहे. मुख्य मेनूसाठी 0 दाबा.`
          : `आपकी लंबित भुगतान राशि ${summary.totalPending} रुपये है। मुख्य मेनू के लिए 0 दबाएं।`;
    } else if (digit === '3') {
      text = session.language === 'en'
        ? `Your total paid earnings are ${summary.totalEarned} rupees. Press 0 for main menu.`
        : session.language === 'mr'
          ? `आपली एकूण मिळालेली कमाई ${summary.totalEarned} रुपये आहे. मुख्य मेनूसाठी 0 दाबा.`
          : `आपकी कुल मिली हुई कमाई ${summary.totalEarned} रुपये है। मुख्य मेनू के लिए 0 दबाएं।`;
    } else {
      const amounts = summary.transactions.map((tx) => Math.round(parseFloat(tx.final_price_inr || tx.quoted_price_inr || 0))).join(', ');
      text = session.language === 'en'
        ? `Recent sale amounts are ${amounts || 'none'} rupees. Press 0 for main menu.`
        : session.language === 'mr'
          ? `अलीकडील विक्री रक्कम ${amounts || 'नाही'} रुपये. मुख्य मेनूसाठी 0 दाबा.`
          : `हाल की बिक्री रकम ${amounts || 'नहीं'} रुपये है। मुख्य मेनू के लिए 0 दबाएं।`;
    }
    bumpMetric(session, 'successful_completion');
    await safeLogProgress(session);
    return makeResponse(session, text, { expecting: 'digit', data: summary });
  } catch (err) {
    logger.error(`IVR transactions error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'TRANSACTION_LOOKUP_FAILED' });
  }
}

async function handleSafety(session, digit) {
  if (digit === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  const topic = SAFETY_TOPICS[digit];
  if (!topic) return fallbackOrRetry(session);
  bumpMetric(session, 'successful_completion');
  await safeLogProgress(session);
  return makeResponse(session, `${topic[session.language] || topic.hi} ${prompt('safetyMenu', session.language)}`, { expecting: 'digit' });
}

async function handleLotStatus(session, digits) {
  if (digits === '0') {
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  }
  if (!session.collectorId) return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit' });
  const cleaned = normalizeDigits(digits).replace(/#/g, '');
  if (!cleaned) return fallbackOrRetry(session);
  try {
    const result = await findLotByDigits(session.collectorId, cleaned);
    if (!result) {
      const text = session.language === 'en' ? 'Lot was not found. Check the number and try again, or press 9 for support.' : session.language === 'mr' ? 'लॉट सापडला नाही. नंबर तपासून पुन्हा प्रयत्न करा, किंवा सपोर्टसाठी 9 दाबा.' : 'लॉट नहीं मिला। नंबर जांच कर फिर कोशिश करें, या सपोर्ट के लिए 9 दबाएं।';
      return makeResponse(session, text, { expecting: 'lot_id' });
    }
    const { lot, transaction } = result;
    const txStatus = transaction ? statusWord(transaction.transaction_status, session.language) : statusWord('Created', session.language);
    const paymentStatus = transaction ? statusWord(transaction.payment_status, session.language) : statusWord('Pending', session.language);
    const text = session.language === 'en'
      ? `Lot status: ${lot.category}, ${parseFloat(lot.approximate_weight_kg)} kilograms. Transaction is ${txStatus}. Payment is ${paymentStatus}. Press 0 for main menu.`
      : session.language === 'mr'
        ? `लॉट स्थिती: ${materialName(lot.category, session.language)}, ${parseFloat(lot.approximate_weight_kg)} किलो. व्यवहार ${txStatus}. पेमेंट ${paymentStatus}. मुख्य मेनूसाठी 0 दाबा.`
        : `लॉट की स्थिति: ${materialName(lot.category, session.language)}, ${parseFloat(lot.approximate_weight_kg)} किलो। लेन-देन ${txStatus}। भुगतान ${paymentStatus}। मुख्य मेनू के लिए 0 दबाएं।`;
    bumpMetric(session, 'successful_completion');
    await safeLogProgress(session);
    return makeResponse(session, text, { expecting: 'digit', data: result });
  } catch (err) {
    logger.error(`IVR lot status error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'LOT_STATUS_FAILED' });
  }
}

async function handleInput(callId, rawDigits) {
  const session = getSession(callId);
  if (!session) return startCall({ providerCallId: callId });

  const digits = normalizeDigits(rawDigits);
  if (!digits) return fallbackOrRetry(session, true);

  try {
    if (session.stage === 'language') return handleLanguage(session, digits);
    if (session.stage === 'main') return handleMain(session, digits);
    if (['sellMaterial', 'priceMaterial', 'recyclerMaterial'].includes(session.stage)) return handleMaterialChoice(session, digits);
    if (session.stage === 'sellWeight') return handleSellWeight(session, digits);
    if (session.stage === 'sellConfirm') return handleSellConfirm(session, digits);
    if (session.stage === 'afterPrice') return handleAfterPrice(session, digits);
    if (session.stage === 'recyclerResult') return handleRecyclerResult(session, digits);
    if (session.stage === 'transactions') return handleTransactions(session, digits);
    if (session.stage === 'safety') return handleSafety(session, digits);
    if (session.stage === 'lotStatus') return handleLotStatus(session, digits);
    if (session.stage === 'support') return makeResponse(session, prompt('failureSupport', session.language), { expecting: 'none', action: 'support', transferTo: process.env.IVR_SUPPORT_NUMBER || null });
    session.stage = 'main';
    return makeResponse(session, prompt('main', session.language), { expecting: 'digit' });
  } catch (err) {
    logger.error(`IVR input error: ${err.message}`);
    return makeResponse(session, prompt('backendDown', session.language), { expecting: 'digit', error: 'IVR_FAILED' });
  }
}

function getDiagnostics(callId) {
  const session = getSession(callId);
  if (!session) return null;
  return {
    callId: session.id,
    language: session.language,
    stage: session.stage,
    menuPath: session.menuPath,
    metrics: session.metrics,
    data: session.data,
  };
}

module.exports = {
  handleInput,
  startCall,
  getDiagnostics,
  _sessions: sessions,
};
