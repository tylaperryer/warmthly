import { trapFocus } from '/lego/utils/focus-trap.js';
import { ariaAnnouncer } from '/lego/utils/aria-announcer.js';
import {
  lockBodyScroll,
  forceUnlockScroll,
  cleanupYocoState,
  initYocoStyleObserver,
} from '/lego/utils/scroll-lock.js';
import { initLinkPrefetch } from '/lego/utils/prefetch.js';
import { WARMTHLY_CONFIG } from '/lego/config/warmthly-config.js';
import { getErrorPopupTimeout, getSuccessPopupTimeout } from '/lego/utils/user-preferences.js';
import { initTextSpacing } from '/lego/utils/text-spacing.js';

// Initialize text spacing on page load (WCAG 2.1 AAA 1.4.8)
initTextSpacing();

window.trapFocus = trapFocus;
window.ariaAnnouncer = ariaAnnouncer;
window.lockBodyScroll = lockBodyScroll;
window.forceUnlockScroll = forceUnlockScroll;
window.cleanupYocoState = cleanupYocoState;

function showPaymentErrorPopup(message) {
  try {
    const errorPopup = document.getElementById('errorPopup');
    const errorMessage = document.getElementById('errorMessage');

    if (message && errorMessage) {
      errorMessage.textContent = message;
    }

    if (errorPopup) {
      errorPopup.style.display = 'flex';
      errorPopup.style.zIndex = '100000';
      errorPopup.classList.add('active');
      errorPopup.setAttribute('aria-hidden', 'false');

      if (window.ariaAnnouncer) {
        const announcementMessage = message || 'Payment was not processed. Please try again.';
        window.ariaAnnouncer.announce(announcementMessage, 'assertive');
      }

      const closeErrorPopup = () => {
        errorPopup.classList.remove('active');
        errorPopup.style.display = 'none';
        errorPopup.setAttribute('aria-hidden', 'true');

        if (errorMessage) {
          errorMessage.textContent =
            'Your payment was not processed. This could be due to insufficient funds, a declined card, or the payment was cancelled.';
        }

        forceUnlockScroll();
      };

      const errorButton = document.getElementById('errorPopupButton');
      if (errorButton) {
        errorButton.onclick = null;
        errorButton.onclick = closeErrorPopup;
      }

      const handleErrorClickOutside = e => {
        if (e.target === errorPopup) {
          closeErrorPopup();
          errorPopup.removeEventListener('click', handleErrorClickOutside);
        }
      };
      errorPopup.addEventListener('click', handleErrorClickOutside);

      const errorContent = errorPopup.querySelector('.error-popup-content');
      if (errorContent) {
        errorContent.addEventListener('click', e => {
          e.stopPropagation();
        });
      }

      // Use user preference for timeout (WCAG 2.1 AAA 2.2.3 - No Timing)
      const errorTimeout = getErrorPopupTimeout(WARMTHLY_CONFIG.constants.errorPopupTimeout);
      if (errorTimeout !== null) {
        setTimeout(closeErrorPopup, errorTimeout);
      }
    }
  } catch {
    // Phase 8 Issue 8.11: Use error popup instead of alert
    showPaymentErrorPopup('Payment was not completed. Please try again.');
  }
}

window.showPaymentErrorPopup = showPaymentErrorPopup;

const currencyDisplayNames = {
  USD: 'USD ($)',
  EUR: 'EUR (â‚¬)',
  GBP: 'GBP (Â£)',
  CAD: 'CAD (C$)',
  AUD: 'AUD (A$)',
  JPY: 'JPY (Â¥)',
  CHF: 'CHF (Fr)',
  NZD: 'NZD (NZ$)',
  SEK: 'SEK (kr)',
  NOK: 'NOK (kr)',
  DKK: 'DKK (kr)',
  SGD: 'SGD (S$)',
  HKD: 'HKD (HK$)',
  ZAR: 'ZAR (R)',
};

const currencyInfo = {
  USD: { symbol: '$', name: 'USD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  EUR: { symbol: 'â‚¬', name: 'EUR', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  GBP: { symbol: 'Â£', name: 'GBP', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  CAD: { symbol: 'C$', name: 'CAD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  AUD: { symbol: 'A$', name: 'AUD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  JPY: { symbol: 'Â¥', name: 'JPY', usesCents: false, defaultAmounts: [1000, 2500, 5000, 10000] },
  CHF: { symbol: 'Fr', name: 'CHF', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  NZD: { symbol: 'NZ$', name: 'NZD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  SEK: { symbol: 'kr', name: 'SEK', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  NOK: { symbol: 'kr', name: 'NOK', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  DKK: { symbol: 'kr', name: 'DKK', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  SGD: { symbol: 'S$', name: 'SGD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  HKD: { symbol: 'HK$', name: 'HKD', usesCents: true, defaultAmounts: [1000, 2500, 5000, 10000] },
  ZAR: { symbol: 'R', name: 'ZAR', usesCents: true, defaultAmounts: [10000, 25000, 50000, 100000] },
};

function formatAmount(amount, currency) {
  const info = currencyInfo[currency];
  if (!info) return amount.toString();

  const displayAmount = info.usesCents ? amount / 100 : amount;
  const formatted = displayAmount.toLocaleString('en-US', {
    minimumFractionDigits: info.usesCents ? 2 : 0,
    maximumFractionDigits: info.usesCents ? 2 : 0,
  });
  return `${info.symbol}${formatted}`;
}

async function convertToZAR(amountInCents, fromCurrency) {
  try {
    // SECURITY: Validate currency code client-side before API call
    const { validateCurrency } = await import('/lego/utils/currency-validation.js');
    validateCurrency(fromCurrency);
    validateCurrency('ZAR'); // Always converting to ZAR

    const { getApiUrl } = await import('/lego/config/secure-api-config.js');
    const response = await fetch(
      getApiUrl(`api/convert-currency?amount=${amountInCents}&from=${fromCurrency}&to=ZAR`)
    );
    if (!response.ok) {
      throw new Error('Failed to convert currency');
    }
    const data = await response.json();
    return {
      zarCents: data.convertedAmount,
      rate: data.rate,
      formattedOriginal: data.formattedOriginal,
      formattedZAR: data.formattedConverted,
    };
  } catch {
    // SECURITY: Do not use fallback rates - block payment when live rates unavailable
    // This prevents abuse by forcing network failures to charge incorrect amounts
    throw new Error('Currency conversion unavailable. Please try again later or contact support.');
  }
}

const donateButton = document.getElementById('donateButton');
const donationModal = document.getElementById('donationModal');
const proceedButton = document.getElementById('proceedDonation');
const cancelButton = document.getElementById('cancelDonation');
const customAmountInput = document.getElementById('customAmount');
const amountButtons = document.querySelectorAll('.amount-btn');
const conversionNotice = document.getElementById('conversionNotice');
const currencyDropdown = document.getElementById('currencyDropdown');
const currencySelect = document.getElementById('currencySelect');
const currencyOptions = document.getElementById('currencyOptions');
const currencyDisplay = currencySelect ? currencySelect.querySelector('.currency-display') : null;

let selectedAmount = null;
let convertedAmount = null;
let currentCurrency = 'USD';
let paymentSucceeded = false;
let paymentAttempted = false;

function updateButtonLabels() {
  const info = currencyInfo[currentCurrency];
  amountButtons.forEach((btn, index) => {
    const amount = info.defaultAmounts[index] || info.defaultAmounts[0];
    btn.dataset.amount = amount;
    btn.textContent = formatAmount(amount, currentCurrency);
  });

  customAmountInput.placeholder = `Custom amount (${info.symbol})`;
}

function updateConversionNotice() {
  if (selectedAmount && selectedAmount > 0 && convertedAmount) {
    const info = currencyInfo[currentCurrency];
    const originalAmount = info.usesCents ? selectedAmount / 100 : selectedAmount;
    const zarAmount = (convertedAmount / 100).toFixed(2);
    const formattedOriginal = originalAmount.toLocaleString('en-US', {
      minimumFractionDigits: info.usesCents ? 2 : 0,
      maximumFractionDigits: info.usesCents ? 2 : 0,
    });
    conversionNotice.textContent = `ðŸ’± ${info.symbol}${formattedOriginal} ${currentCurrency} will be converted to approximately R${zarAmount} ZAR at current exchange rates`;
    conversionNotice.style.display = 'block';
  } else if (selectedAmount && selectedAmount > 0) {
    conversionNotice.textContent =
      'ðŸ’± Amounts will be converted to South African Rand (ZAR) at current exchange rates';
    conversionNotice.style.display = 'block';
  } else {
    conversionNotice.style.display = 'none';
  }
}

currencySelect.addEventListener('click', e => {
  e.stopPropagation();
  currencySelect.classList.toggle('active');
  currencyOptions.classList.toggle('show');
});

document.addEventListener('click', e => {
  if (!currencyDropdown.contains(e.target)) {
    currencySelect.classList.remove('active');
    currencyOptions.classList.remove('show');
  }
});

currencyOptions.querySelectorAll('.currency-option').forEach(option => {
  option.addEventListener('click', e => {
    e.stopPropagation();
    const value = option.dataset.value;
    currentCurrency = value;
    if (currencyDisplay) {
      currencyDisplay.textContent = currencyDisplayNames[value];
    }
    if (currencyOptions) {
      currencyOptions.querySelectorAll('.currency-option').forEach(opt => {
        opt.classList.remove('selected');
      });
    }
    option.classList.add('selected');
    currencySelect.classList.remove('active');
    currencyOptions.classList.remove('show');
    updateButtonLabels();
    selectedAmount = null;
    convertedAmount = null;
    customAmountInput.value = '';
    amountButtons.forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    updateConversionNotice();
  });
});

const selectedCurrencyOption = currencyOptions.querySelector(`[data-value="${currentCurrency}"]`);
if (selectedCurrencyOption) {
  selectedCurrencyOption.classList.add('selected');
}
updateButtonLabels();

amountButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    amountButtons.forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    selectedAmount = parseInt(btn.dataset.amount) || 0;
    customAmountInput.value = '';
    updateConversionNotice();
    void convertToZAR(selectedAmount, currentCurrency).then(result => {
      convertedAmount = result.zarCents;
      updateConversionNotice();
    });
  });
});

customAmountInput.addEventListener('input', e => {
  const rawValue = e.target.value.trim();
  // Phase 8 Issue 8.4: Enhanced input validation
  // Input validation: Only allow numbers and decimal point
  if (!/^\d*\.?\d*$/.test(rawValue)) {
    e.target.value = rawValue.replace(/[^\d.]/g, '');
    return;
  }

  // Prevent multiple decimal points
  const parts = rawValue.split('.');
  if (parts.length > 2) {
    e.target.value = parts[0] + '.' + parts.slice(1).join('');
    return;
  }

  // Limit decimal places (max 2 for currencies with cents)
  const info = currencyInfo[currentCurrency];
  if (info.usesCents && parts[1] && parts[1].length > 2) {
    e.target.value = parts[0] + '.' + parts[1].substring(0, 2);
    return;
  }

  const value = parseFloat(rawValue);

  // Phase 8 Issue 8.4: Validate value is a valid number
  if (isNaN(value) || !isFinite(value)) {
    selectedAmount = null;
    convertedAmount = null;
    updateConversionNotice();
    return;
  }

  const minAmount = info.usesCents ? 0.01 : 1;
  const maxAmount = info.usesCents ? 1000000 : 1000000; // Max $10,000 or equivalent

  // Phase 8 Issue 8.4: Validate currency code
  if (!currentCurrency || !currencyInfo[currentCurrency]) {
    selectedAmount = null;
    convertedAmount = null;
    updateConversionNotice();
    return;
  }

  if (value && value > 0 && value >= minAmount && value <= maxAmount) {
    selectedAmount = info.usesCents ? Math.round(value * 100) : Math.round(value);
    amountButtons.forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    updateConversionNotice();
    void convertToZAR(selectedAmount, currentCurrency)
      .then(result => {
        convertedAmount = result.zarCents;
        updateConversionNotice();
      })
      .catch(() => {
        // Conversion failed - handled by convertToZAR
        selectedAmount = null;
        convertedAmount = null;
        updateConversionNotice();
      });
  } else {
    selectedAmount = null;
    convertedAmount = null;
    updateConversionNotice();
  }
});

function closeModal() {
  try {
    const donationModal = document.getElementById('donationModal');

    if (donationModal) {
      donationModal.classList.remove('active');
      donationModal.setAttribute('aria-hidden', 'true');
    }

    if (window.donationModalFocusTrap) {
      window.donationModalFocusTrap();
      window.donationModalFocusTrap = null;
    }

    if (donateButton) {
      donateButton.focus();
    }

    setTimeout(() => {
      forceUnlockScroll();
    }, WARMTHLY_CONFIG.constants.scrollUnlockDelay);

    selectedAmount = null;
    convertedAmount = null;
    if (customAmountInput) {
      customAmountInput.value = '';
    }
    amountButtons.forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    if (proceedButton) {
      proceedButton.disabled = false;
      proceedButton.textContent = 'Proceed to Payment';
    }
    if (currencyDisplay) {
      currentCurrency = 'USD';
      currencyDisplay.textContent = currencyDisplayNames['USD'];
    }
    if (currencyOptions) {
      currencyOptions.querySelectorAll('.currency-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      const usdOption = currencyOptions.querySelector('[data-value="USD"]');
      if (usdOption) {
        usdOption.classList.add('selected');
      }
      updateButtonLabels();
    }
    updateConversionNotice();

    const donationForm = document.getElementById('donationForm');
    const yocoPaymentContainer = document.getElementById('yocoPaymentContainer');
    const yocoIframeContainer = document.getElementById('yocoIframeContainer');

    if (donationForm) donationForm.style.display = 'block';
    if (yocoPaymentContainer) yocoPaymentContainer.style.display = 'none';
    if (yocoIframeContainer) yocoIframeContainer.innerHTML = '';
  } catch {
    forceUnlockScroll();
  }
}

donateButton.addEventListener('click', () => {
  try {
    if (proceedButton) {
      proceedButton.disabled = false;
      proceedButton.textContent = 'Proceed to Payment';
    }
    lockBodyScroll();
    donationModal.classList.add('active');
    donationModal.setAttribute('aria-hidden', 'false');
    donationModal.setAttribute('role', 'dialog');
    donationModal.setAttribute('aria-labelledby', 'donationModalTitle');

    const modalTitle = donationModal.querySelector('h2');
    if (modalTitle && !modalTitle.id) {
      modalTitle.id = 'donationModalTitle';
    }

    if (trapFocus) {
      window.donationModalFocusTrap = trapFocus(donationModal);
    }

    const firstFocusable = donationModal.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), WARMTHLY_CONFIG.constants.modalFocusDelay);
    }

    if (ariaAnnouncer) {
      ariaAnnouncer.announce('Donation modal opened', 'polite');
    }
  } catch {
    // Silently fail - modal opening is non-critical
  }
});

cancelButton.addEventListener('click', closeModal);

donationModal.addEventListener('click', e => {
  if (e.target === donationModal) {
    closeModal();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && donationModal.classList.contains('active')) {
    closeModal();
  }
});

proceedButton.addEventListener('click', () => {
  void (async () => {
    const info = currencyInfo[currentCurrency];
    const minAmount = info.usesCents ? 100 : 1;
    if (!selectedAmount || selectedAmount < minAmount) {
      const minDisplay = info.usesCents ? '1.00' : '1';
      // Phase 8 Issue 8.11: Use error popup instead of alert
      showPaymentErrorPopup(
        `Please select or enter an amount (minimum ${info.symbol}${minDisplay})`
      );
      return;
    }

    // AUDIT: Log donation initiation
    const { logPaymentEvent } = await import('/lego/utils/payment-audit.js');
    await logPaymentEvent({
      eventType: 'donation_initiated',
      amount: selectedAmount,
      currency: currentCurrency,
      context: { source: 'website' },
    });

    proceedButton.disabled = true;
    proceedButton.textContent = 'Converting...';
    proceedButton.setAttribute('aria-busy', 'true');

    if (ariaAnnouncer) {
      ariaAnnouncer.announce('Converting currency, please wait', 'polite');
    }

    let conversionResult;
    try {
      conversionResult = await convertToZAR(selectedAmount, currentCurrency);
      convertedAmount = conversionResult.zarCents;

      // AUDIT: Log currency conversion
      await logPaymentEvent({
        eventType: 'currency_conversion',
        amount: selectedAmount,
        currency: currentCurrency,
        convertedAmount: convertedAmount,
        conversionRate: conversionResult.rate,
      });

      proceedButton.setAttribute('aria-busy', 'false');
    } catch {
      proceedButton.disabled = false;
      proceedButton.textContent = 'Proceed to Payment';
      proceedButton.setAttribute('aria-busy', 'false');
      if (ariaAnnouncer) {
        ariaAnnouncer.announce('Failed to convert currency. Please try again.', 'assertive');
      }
      // Phase 8 Issue 8.11: Use error popup instead of alert
      showPaymentErrorPopup('Failed to convert currency. Please try again.');
      return;
    }

    if (!proceedButton) {
      return;
    }

    const originalText = proceedButton.textContent;
    proceedButton.textContent = 'Processing...';

    let yocoSDK = null;
    let yocoSDKPromise = null;

    // Dynamic Yoco SDK loader (Performance Optimization)
    async function loadYocoSDK() {
      if (window.YocoSDK) {
        return window.YocoSDK;
      }
      if (yocoSDKPromise) {
        return yocoSDKPromise;
      }
      yocoSDKPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // SECURITY: Use version-pinned URL for supply chain protection
        script.src = 'https://js.yoco.com/sdk/v1/yoco-sdk-web.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        // SECURITY: Add referrer policy
        script.referrerPolicy = 'strict-origin-when-cross-origin';
        // SECURITY: Subresource Integrity (SRI) hash
        // TODO: Contact Yoco support to obtain the SRI hash for this specific version
        // Once obtained, uncomment and add the hash:
        // script.integrity = 'sha384-...'; // Get from Yoco support
        // For now, we rely on HTTPS and version pinning for security
        // script.integrity = 'sha384-...';
        script.onload = () => {
          if (window.YocoSDK) {
            resolve(window.YocoSDK);
          } else {
            reject(new Error('Yoco SDK failed to load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Yoco SDK'));
        document.head.appendChild(script);
      });
      return yocoSDKPromise;
    }

    async function initializeYocoSDK() {
      try {
        await loadYocoSDK();
      } catch {
        throw new Error('Yoco SDK not loaded. Please refresh the page and try again.');
      }

      if (typeof window.YocoSDK === 'undefined') {
        throw new Error('Yoco SDK not available after loading.');
      }

      let publicKey;
      try {
        const { getApiUrl, validateOrigin } = await import('/lego/config/secure-api-config.js');
        const keyUrl = getApiUrl('api/get-yoco-public-key');

        // SECURITY: Validate origin before fetching
        if (!validateOrigin(keyUrl)) {
          throw new Error('Invalid API origin');
        }

        const keyResponse = await fetch(keyUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // SECURITY: Enforce HTTPS and origin validation
          mode: 'cors',
          credentials: 'omit',
        });

        if (!keyResponse.ok) {
          throw new Error('Failed to fetch public key from server');
        }

        // SECURITY: Validate response origin
        const responseOrigin = new URL(keyResponse.url).origin;
        const expectedOrigin = new URL(keyUrl).origin;
        if (responseOrigin !== expectedOrigin) {
          throw new Error('Origin mismatch in key response');
        }

        const keyData = await keyResponse.json();
        publicKey = keyData.publicKey;

        // SECURITY: Validate public key format
        if (!publicKey || typeof publicKey !== 'string' || !publicKey.startsWith('pk_')) {
          throw new Error('Invalid public key format');
        }
      } catch {
        throw new Error('Yoco public key is not configured. Please contact support.');
      }

      try {
        yocoSDK = new window.YocoSDK({
          publicKey: publicKey,
        });
      } catch (sdkError) {
        throw new Error('Failed to initialize Yoco SDK: ' + (sdkError.message || 'Unknown error'));
      }

      lockBodyScroll();
      donationModal.classList.remove('active');

      const donationSection = document.getElementById('donationSection');
      const donateButton = document.getElementById('donateButton');
      const yocoPaymentEmbed = document.getElementById('yocoPaymentEmbed');
      const yocoEmbedContainer = document.getElementById('yocoEmbedContainer');

      if (!donationSection || !donateButton || !yocoPaymentEmbed || !yocoEmbedContainer) {
        throw new Error('Required payment elements not found on page.');
      }

      donateButton.style.display = 'none';
      yocoPaymentEmbed.style.display = 'block';
      yocoEmbedContainer.innerHTML = '';

      setTimeout(() => {
        try {
          yocoPaymentEmbed.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          // Silently fail - scroll is non-critical
        }
      }, WARMTHLY_CONFIG.constants.scrollUnlockDelay);

      const callbackUrl = window.location.origin + window.location.pathname + '?payment=success';
      const cancelUrl = window.location.origin + window.location.pathname + '?payment=cancelled';
      document.body.classList.add('yoco-active');
      paymentSucceeded = false;
      paymentAttempted = true;

      try {
        const zarAmount = (convertedAmount / 100).toFixed(2);
        const info = currencyInfo[currentCurrency];
        const originalAmount = info.usesCents ? selectedAmount / 100 : selectedAmount;
        const formattedOriginal = originalAmount.toLocaleString('en-US', {
          minimumFractionDigits: info.usesCents ? 2 : 0,
          maximumFractionDigits: info.usesCents ? 2 : 0,
        });

        yocoSDK.showPopup({
          amountInCents: Math.round(convertedAmount),
          currency: 'ZAR',
          name: 'Warmthly Donation',
          description: `Pay R${zarAmount} (${info.symbol}${formattedOriginal} ${currentCurrency} converted at current rate) - Thank you for supporting our mission to rehumanize our world!`,
          callbackUrl: callbackUrl,
          cancelUrl: cancelUrl,
          metadata: {
            source: 'website_donation',
            originalAmountUSD: selectedAmount,
            convertedAmountZAR: convertedAmount,
            conversionRate: conversionResult.rate,
          },
          onClose: () => {
            setTimeout(() => {
              try {
                if (paymentAttempted && !paymentSucceeded) {
                  showPaymentErrorPopup(
                    'Payment was not completed. If you encountered an error, please try again or use a different payment method.'
                  );
                }

                paymentSucceeded = false;
                paymentAttempted = false;
                cleanupYocoState();

                if (proceedButton) {
                  proceedButton.disabled = false;
                  proceedButton.textContent = originalText;
                }

                const donationModal = document.getElementById('donationModal');
                if (donationModal && donationModal.classList.contains('active')) {
                  donationModal.classList.remove('active');
                }

                setTimeout(() => {
                  forceUnlockScroll();
                }, WARMTHLY_CONFIG.constants.scrollUnlockTimeout);
              } catch {
                forceUnlockScroll();
              }
            }, WARMTHLY_CONFIG.constants.scrollUnlockTimeout);
          },
          onSuccess: async data => {
            paymentSucceeded = true;
            paymentAttempted = true;

            // SECURITY: Extract payment ID for server-side verification
            const paymentId = data?.id || data?.checkoutId || data?.paymentId;
            const zarAmount = (convertedAmount / 100).toFixed(2);

            // AUDIT: Log payment success
            const { logPaymentEvent } = await import('/lego/utils/payment-audit.js');
            await logPaymentEvent({
              eventType: 'donation_succeeded',
              amount: selectedAmount,
              currency: currentCurrency,
              convertedAmount: convertedAmount,
              context: { paymentId, source: 'yoco' },
            });

            // SECURITY: Redirect to success URL with payment ID for server-side verification
            if (paymentId) {
              const successUrl = `${window.location.origin}${window.location.pathname}?payment=success&id=${encodeURIComponent(paymentId)}&amount=${encodeURIComponent(zarAmount)}`;
              window.location.href = successUrl;
              return;
            }

            // Fallback: Show success popup if no payment ID (should not happen)
            try {
              const amount = (selectedAmount / 100).toFixed(2);
              cleanupYocoState();

              const successPopup = document.getElementById('successPopup');
              const successAmount = document.getElementById('successAmount');

              if (successAmount) {
                successAmount.textContent = `R${amount}`;
              }

              if (successPopup) {
                successPopup.style.display = 'flex';
                successPopup.style.zIndex = '100000';
                successPopup.classList.add('active');
                successPopup.setAttribute('aria-hidden', 'false');

                if (ariaAnnouncer) {
                  ariaAnnouncer.announce(
                    `Thank you! Your donation of R${amount} was successful!`,
                    'polite'
                  );
                }

                const closeSuccessPopup = () => {
                  successPopup.classList.remove('active');
                  successPopup.style.display = 'none';
                  successPopup.setAttribute('aria-hidden', 'true');
                  const donateButton = document.getElementById('donateButton');
                  if (donateButton) {
                    donateButton.style.display = 'inline-block';
                  }
                  forceUnlockScroll();
                };

                const successButton = document.getElementById('successPopupButton');
                if (successButton) {
                  successButton.onclick = closeSuccessPopup;
                }

                const handleSuccessClickOutside = e => {
                  if (e.target === successPopup) {
                    closeSuccessPopup();
                    successPopup.removeEventListener('click', handleSuccessClickOutside);
                  }
                };
                successPopup.addEventListener('click', handleSuccessClickOutside);

                const successContent = successPopup.querySelector('.success-popup-content');
                if (successContent) {
                  successContent.addEventListener('click', e => {
                    e.stopPropagation();
                  });
                }

                // Use user preference for timeout (WCAG 2.1 AAA 2.2.3 - No Timing)
                const successTimeout = getSuccessPopupTimeout(
                  WARMTHLY_CONFIG.constants.successPopupTimeout
                );
                if (successTimeout !== null) {
                  setTimeout(closeSuccessPopup, successTimeout);
                }
              }

              if (proceedButton) {
                proceedButton.disabled = false;
                proceedButton.textContent = originalText;
              }

              const donationModal = document.getElementById('donationModal');
              if (donationModal) {
                donationModal.classList.remove('active');
              }

              setTimeout(() => {
                forceUnlockScroll();
              }, WARMTHLY_CONFIG.constants.scrollUnlockTimeout);
            } catch {
              forceUnlockScroll();
            }
          },
          onError: async error => {
            try {
              paymentAttempted = true;
              paymentSucceeded = false;

              // AUDIT: Log payment failure
              const { logPaymentEvent } = await import('/lego/utils/payment-audit.js');
              await logPaymentEvent({
                eventType: 'donation_failed',
                amount: selectedAmount,
                currency: currentCurrency,
                error: error.message || 'Unknown error',
                context: { source: 'yoco' },
              });

              // SECURITY: Sanitize error message
              const { sanitizeErrorMessage } = await import('/lego/utils/error-sanitizer.js');
              const errorMsg = sanitizeErrorMessage(error, 'payment_processing');
              showPaymentErrorPopup(errorMsg);
              cleanupYocoState();
              forceUnlockScroll();

              if (proceedButton) {
                proceedButton.disabled = false;
                proceedButton.textContent = originalText;
              }
            } catch {
              cleanupYocoState();
              forceUnlockScroll();
              // Phase 8 Issue 8.11: Use error popup instead of alert
              showPaymentErrorPopup('Payment error. Please try again.');
            }
          },
        });
      } catch (popupError) {
        throw new Error(
          'Failed to show Yoco payment popup: ' + (popupError.message || 'Unknown error')
        );
      }

      setTimeout(() => {
        try {
          const yocoElements = document.querySelectorAll(
            '[class*="yoco" i], [id*="yoco" i], iframe[src*="yoco" i]'
          );
          yocoElements.forEach(el => {
            try {
              const style = window.getComputedStyle(el);
              if (style.position === 'fixed') {
                el.style.zIndex = '999999';
              }
            } catch {
              // Silently fail - non-critical styling operation
            }
          });
        } catch {
          // Silently fail - non-critical scroll unlock operation
        }
      }, WARMTHLY_CONFIG.constants.scrollUnlockDelay);
    }

    try {
      await initializeYocoSDK();
    } catch (error) {
      cleanupYocoState();
      forceUnlockScroll();

      // SECURITY: Sanitize error messages to prevent information leakage
      const { logErrorSecurely } = await import('/lego/utils/error-sanitizer.js');
      // eslint-disable-next-line no-undef
      logErrorSecurely(error, 'payment_initialization', { selectedAmount, currentCurrency });

      // Phase 8 Issue 8.11: Replace alert with user-friendly error modal
      // SECURITY: Use generic error message for users
      showPaymentErrorPopup(
        'Sorry, there was an error processing your donation. Please try again or contact support if the problem persists.'
      );

      const donateButton = document.getElementById('donateButton');
      const yocoPaymentEmbed = document.getElementById('yocoPaymentEmbed');
      if (donateButton) {
        donateButton.style.display = 'inline-block';
      }
      if (yocoPaymentEmbed) {
        yocoPaymentEmbed.style.display = 'none';
      }

      if (proceedButton) {
        proceedButton.disabled = false;
        proceedButton.textContent = originalText;
      }
    }
  })();
});

const cancelPaymentBtn = document.getElementById('cancelPayment');
if (cancelPaymentBtn) {
  cancelPaymentBtn.addEventListener('click', () => {
    try {
      cleanupYocoState();
      const donateButton = document.getElementById('donateButton');
      const yocoPaymentEmbed = document.getElementById('yocoPaymentEmbed');
      if (donateButton) {
        donateButton.style.display = 'inline-block';
      }
      if (yocoPaymentEmbed) {
        yocoPaymentEmbed.style.display = 'none';
      }
    } catch {
      cleanupYocoState();
    }
  });
}

void (async () => {
  try {
    setTimeout(() => {
      if (typeof window.forceUnlockScroll === 'function') {
        forceUnlockScroll();
      }
    }, WARMTHLY_CONFIG.constants.scrollUnlockDelay);

    // SECURITY: Payment success must be verified server-side
    // URL parameters can be forged, so we verify with the server
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const paymentId = urlParams.get('id');
    const urlAmount = urlParams.get('amount');

    if (paymentStatus === 'success' && paymentId && urlAmount) {
      // Phase 8 Issue 8.3: Show loading state until verification completes
      // Never show success message before server verification
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'paymentVerificationLoading';
      loadingIndicator.style.cssText =
        'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 999999; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;';
      loadingIndicator.textContent = 'Verifying payment...';
      document.body.appendChild(loadingIndicator);

      try {
        // Verify payment server-side before showing success
        const { verifyPaymentSuccess } = await import('/lego/utils/payment-audit.js');
        const verified = await verifyPaymentSuccess(paymentId, parseFloat(urlAmount));

        // Remove loading indicator
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }

        if (!verified) {
          // Payment not verified - do not show success message
          window.history.replaceState({}, document.title, window.location.pathname);
          // Phase 8 Issue 8.11: Use error popup instead of alert
          showPaymentErrorPopup(
            'Payment verification failed. Please contact support if you completed a payment.'
          );
          return;
        }
      } catch {
        // Remove loading indicator on error
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        // Payment verification failed - do not show success
        window.history.replaceState({}, document.title, window.location.pathname);
        // Phase 8 Issue 8.11: Use error popup instead of alert
        showPaymentErrorPopup(
          'Unable to verify payment. Please contact support if you completed a payment.'
        );
        return;
      }

      setTimeout(() => {
        const successPopup = document.getElementById('successPopup');
        const successAmount = document.getElementById('successAmount');

        if (successPopup && successAmount) {
          const amount = parseFloat(urlAmount) || 0.0;
          successAmount.textContent = 'R' + amount.toFixed(2);
          successPopup.style.display = 'flex';
          successPopup.style.zIndex = '100000';
          successPopup.classList.add('active');

          const closeSuccessPopup = () => {
            successPopup.classList.remove('active');
            successPopup.style.display = 'none';
            window.history.replaceState({}, document.title, window.location.pathname);
            const donateButton = document.getElementById('donateButton');
            if (donateButton) {
              donateButton.style.display = 'inline-block';
            }
            if (typeof window.forceUnlockScroll === 'function') {
              forceUnlockScroll();
            }
          };

          const successButton = document.getElementById('successPopupButton');
          if (successButton) {
            successButton.onclick = closeSuccessPopup;
          }

          const handleSuccessClickOutside = e => {
            if (e.target === successPopup) {
              closeSuccessPopup();
              successPopup.removeEventListener('click', handleSuccessClickOutside);
            }
          };
          successPopup.addEventListener('click', handleSuccessClickOutside);

          const successContent = successPopup.querySelector('.success-popup-content');
          if (successContent) {
            successContent.addEventListener('click', e => {
              e.stopPropagation();
            });
          }

          // Use user preference for timeout (WCAG 2.1 AAA 2.2.3 - No Timing)
          const successTimeout = getSuccessPopupTimeout(
            WARMTHLY_CONFIG.constants.successPopupTimeout
          );
          if (successTimeout !== null) {
            setTimeout(closeSuccessPopup, successTimeout);
          }
        }
      }, WARMTHLY_CONFIG.constants.paymentStatusDelay);

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (typeof window.forceUnlockScroll === 'function') {
      forceUnlockScroll();
    }
    setTimeout(() => {
      if (typeof window.forceUnlockScroll === 'function') {
        forceUnlockScroll();
      }
    }, WARMTHLY_CONFIG.constants.paymentStatusDelay * 10);
  } catch {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (typeof window.forceUnlockScroll === 'function') {
        forceUnlockScroll();
      }
    } catch {
      // Ignore cleanup errors
    }
  }
})();

const cookieButton = document.getElementById('cookieButton');
const cookiePopup = document.getElementById('cookiePopup');
const hasSeenCookiePopup = localStorage.getItem('warmthly_cookie_popup_seen') === 'true';

if (!hasSeenCookiePopup) {
  setTimeout(() => {
    cookieButton.style.display = 'flex';
    setTimeout(() => {
      cookieButton.classList.add('visible');
    }, 100);
  }, 1000);

  cookieButton.addEventListener('click', e => {
    e.stopPropagation();
    cookiePopup.classList.toggle('visible');
  });

  document.addEventListener('click', e => {
    if (!cookieButton.contains(e.target) && !cookiePopup.contains(e.target)) {
      if (cookiePopup.classList.contains('visible')) {
        cookiePopup.classList.remove('visible');
        localStorage.setItem('warmthly_cookie_popup_seen', 'true');
        setTimeout(() => {
          cookieButton.classList.remove('visible');
          setTimeout(() => {
            cookieButton.style.display = 'none';
          }, 300);
        }, 200);
      }
    }
  });

  cookiePopup.addEventListener('click', () => {
    cookiePopup.classList.remove('visible');
    localStorage.setItem('warmthly_cookie_popup_seen', 'true');
    setTimeout(() => {
      cookieButton.classList.remove('visible');
      setTimeout(() => {
        cookieButton.style.display = 'none';
      }, 300);
    }, 200);
  });
}

const methodSection = document.querySelector('.method-section');
if (methodSection) {
  // Fallback: Show immediately if IntersectionObserver is not supported
  if (typeof IntersectionObserver === 'undefined') {
    methodSection.classList.add('visible');
  } else {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(methodSection);

    // Fallback: Show after 1 second if still not visible (in case observer fails)
    setTimeout(() => {
      if (!methodSection.classList.contains('visible')) {
        methodSection.classList.add('visible');
      }
    }, 1000);
  }
}

const videoContainer = document.getElementById('video-container');
if (videoContainer) {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/kVausES-mjk';
  iframe.title = 'Warmthly Video';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  // SECURITY: Add sandbox attribute with restrictive permissions
  iframe.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox'
  );
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '20px';

  videoContainer.appendChild(iframe);
}

initLinkPrefetch();
initYocoStyleObserver();

void import('/lego/config/warmthly-config.js').then(module => {
  const brandLogo = document.getElementById('main-brand-logo');
  if (brandLogo) {
    brandLogo.href = module.WARMTHLY_CONFIG.urls.main;
  }
});
