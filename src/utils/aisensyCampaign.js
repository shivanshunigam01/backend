/**
 * WhatsApp OTP — Zentroverse / api-wa.co campaign API.
 * URL and apiKey are fixed in code (not read from .env).
 * Dynamic per send: destination (user’s number), OTP in button param, FirstName from the form.
 */

const ZENTROVERSE_WA_CAMPAIGN_URL =
  'https://backend.api-wa.co/campaign/zentroverse-global/api/v2';

const ZENTROVERSE_WA_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjgxMWVkODNiYjg3MjY3NGFmMmE3ZSIsIm5hbWUiOiJaZW50cm92ZXJzZSIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2OWI4MTFlZDkwZjZjZjBlMDY0NzBkMTciLCJhY3RpdmVQbGFuIjoiTk9ORSIsImlhdCI6MTc3MzY3MDg5M30.wFOeDPo6S3cd2cRlhZ31r_zBS_lTLRgXS-FQuk9XFuc';

const ZENTROVERSE_CAMPAIGN_NAME = 'otp';
const ZENTROVERSE_USER_NAME = 'Zentroverse';
const ZENTROVERSE_SOURCE = 'new-landing-page form';

/**
 * Same shape as sample: "09771495587" — leading 0 + 10-digit Indian mobile.
 */
function destinationForZentroverseWa(mobile10) {
  const d = String(mobile10 || '')
    .replace(/\D/g, '')
    .slice(-10);
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return `0${d}`;
}

async function parseCampaignResponse(res, text) {
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
    const msg = json.message || json.error || 'WhatsApp campaign API rejected the request';
    const err = new Error(msg);
    err.aisensyBody = json;
    throw err;
  }
  return json;
}

/**
 * Send OTP via Zentroverse WA campaign (replaces env-driven AiSensy URL).
 */
async function sendOtpViaAisensy({ mobile10, displayName, otpCode }) {
  const destination = destinationForZentroverseWa(mobile10);
  if (!destination) {
    throw new Error('Invalid destination mobile');
  }

  const firstNameFallback =
    String(displayName || 'Customer')
      .trim()
      .split(/\s+/)[0] || 'user';

  const payload = {
    apiKey: ZENTROVERSE_WA_API_KEY,
    campaignName: ZENTROVERSE_CAMPAIGN_NAME,
    destination,
    userName: ZENTROVERSE_USER_NAME,
    templateParams: ['$FirstName'],
    source: ZENTROVERSE_SOURCE,
    media: {},
    buttons: [
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          {
            type: 'text',
            text: String(otpCode),
          },
        ],
      },
    ],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {
      FirstName: firstNameFallback,
    },
  };

  const res = await fetch(ZENTROVERSE_WA_CAMPAIGN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return parseCampaignResponse(res, text);
}

function normalizeDestination(mobile10) {
  const d = String(mobile10 || '').replace(/\D/g, '');
  if (d.length === 10 && /^[6-9]/.test(d)) return `91${d}`;
  if (d.length === 12 && d.startsWith('91')) return d;
  return d;
}

function destinationForAisensy(mobile10) {
  return destinationForZentroverseWa(mobile10);
}

module.exports = {
  sendOtpViaAisensy,
  normalizeDestination,
  destinationForAisensy,
};
