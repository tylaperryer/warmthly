/**
 * Payment Audit Logging
 * Comprehensive audit trail for payment and donation events
 */

/**
 * Generate session ID for tracking
 */
function getSessionId() {
  if (typeof sessionStorage !== 'undefined') {
    let sessionId = sessionStorage.getItem('warmthly_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('warmthly_session_id', sessionId);
    }
    return sessionId;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log payment event to server
 */
export async function logPaymentEvent(event) {
  try {
    const auditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    };

    // Import secure API config
    const { getApiUrl } = await import('/lego/config/secure-api-config.js');

    // Send to audit endpoint (non-blocking)
    fetch(getApiUrl('api/audit-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auditEvent),
      keepalive: true, // Ensure request completes even if page unloads
    }).catch(() => {
      // Silently fail - audit logging should not block user experience
    });
  } catch {
    // Silently fail - audit logging should not block user experience
  }
}

/**
 * Verify payment success server-side
 */
export async function verifyPaymentSuccess(paymentId, amount) {
  try {
    const { getApiUrl } = await import('/lego/config/secure-api-config.js');

    const response = await fetch(
      getApiUrl(`api/verify-payment?id=${encodeURIComponent(paymentId)}&amount=${amount}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verified === true;
  } catch {
    return false;
  }
}
