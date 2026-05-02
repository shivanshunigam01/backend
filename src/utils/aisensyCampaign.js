/**
 * AiSensy WhatsApp campaign API — sends template messages (e.g. OTP campaign).
 * @see https://aisensy.com/tutorials/api-reference-docs
 */
const DEFAULT_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';

function normalizeDestination(mobile10) {
  const d = String(mobile10 || '').replace(/\D/g, '');
  if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`;
  if (d.length === 12 && d.startsWith('91')) return d;
  return d;
}

/** AiSensy accepts E.164 (+9198…) or 91… per account; toggle with AISENSY_DESTINATION_USE_PLUS. */
function destinationForAisensy(mobile10) {
  const digits = normalizeDestination(mobile10);
  if (!digits || digits.length < 11) return null;
  if (digits.startsWith('+')) return digits;
  const usePlus = process.env.AISENSY_DESTINATION_USE_PLUS !== 'false';
  return usePlus ? `+${digits}` : digits;
}

/**
 * Build templateParams based on env — matches your WhatsApp template variable order.
 * AISENSY_OTP_TEMPLATE_MODE=two (default: [FirstName, OTP]) | one (OTP only)
 */
function buildTemplateParams(displayName, otpCode) {
  const mode = (process.env.AISENSY_OTP_TEMPLATE_MODE || 'two').toLowerCase();
  const first = String(displayName || 'Customer').trim().slice(0, 60) || 'Customer';
  const code = String(otpCode);
  if (mode === 'one' || mode === '1') return [code];
  return [first, code];
}

async function sendCampaignPayload(payload) {
  const url = (process.env.AISENSY_API_URL || DEFAULT_URL).trim();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg =
      json.message ||
      json.error ||
      json.msg ||
      (Array.isArray(json.errors) && json.errors.join?.('; ')) ||
      text ||
      `HTTP ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.aisensyBody = json;
    throw err;
  }
  if (json && json.success === false) {
    const msg = json.message || json.error || 'AiSensy rejected the request';
    const err = new Error(msg);
    err.aisensyBody = json;
    throw err;
  }
  return json;
}

/**
 * Send OTP via AiSensy campaign named AISENSY_OTP_CAMPAIGN_NAME (e.g. "otp").
 */
async function sendOtpViaAisensy({ mobile10, displayName, otpCode }) {
  const apiKey = process.env.AISENSY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('AISENSY_API_KEY is not configured');
  }

  const destination = destinationForAisensy(mobile10);
  if (!destination) {
    throw new Error('Invalid destination mobile');
  }

  const campaignName = process.env.AISENSY_OTP_CAMPAIGN_NAME?.trim() || 'otp';
  const userName =
    process.env.AISENSY_USER_NAME?.trim() ||
    process.env.AISENSY_SENDER_USER_NAME?.trim() ||
    'Customer';

  const templateParams = buildTemplateParams(displayName, otpCode);
  const firstNameFallback =
    String(displayName || 'Customer')
      .trim()
      .split(/\s+/)[0] || 'user';

  const mode = (process.env.AISENSY_OTP_TEMPLATE_MODE || 'two').toLowerCase();
  const otpOnlyTemplate = mode === 'one' || mode === '1';
  const useFirstNameFallback =
    !otpOnlyTemplate && process.env.AISENSY_USE_PARAMS_FALLBACK_FIRSTNAME !== 'false';

  // Shape matches AiSensy campaign POST examples / n8n integration — avoid empty media/buttons objects.
  const payload = {
    apiKey,
    campaignName,
    destination,
    userName,
    templateParams,
    source: process.env.AISENSY_SOURCE?.trim() || 'website-form',
    attributes: {},
    meta_data: [],
    defaultCountryCode: process.env.AISENSY_DEFAULT_COUNTRY_CODE?.trim() || 'IN',
    paramsFallbackValue: useFirstNameFallback ? { FirstName: firstNameFallback } : {},
  };

  return sendCampaignPayload(payload);
}

module.exports = {
  sendOtpViaAisensy,
  normalizeDestination,
  destinationForAisensy,
};
