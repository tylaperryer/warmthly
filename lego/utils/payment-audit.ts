export interface PaymentAuditEvent {
  eventType:
    | 'donation_initiated'
    | 'donation_succeeded'
    | 'donation_failed'
    | 'currency_conversion'
    | 'payment_verified';
  timestamp: string;
  userId?: string;
  sessionId?: string;
  amount?: number;
  currency?: string;
  convertedAmount?: number;
  conversionRate?: number;
  context?: Record<string, unknown>;
  error?: string;
  verified?: boolean;
}

function getSessionId(): string {
  if (typeof sessionStorage !== 'undefined') {
    let sessionId = sessionStorage.getItem('warmthly_session_id');
    if (!sessionId) {
      // Use crypto.getRandomValues for secure randomness
      const array = new Uint8Array(9);
      crypto.getRandomValues(array);
      const randomPart = Array.from(array, byte => byte.toString(36)).join('').substring(0, 9);
      sessionId = `session_${Date.now()}_${randomPart}`;
      sessionStorage.setItem('warmthly_session_id', sessionId);
    }
    return sessionId;
  }
  // Use crypto.getRandomValues for secure randomness
  const array = new Uint8Array(9);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, byte => byte.toString(36)).join('').substring(0, 9);
  return `session_${Date.now()}_${randomPart}`;
}

export async function logPaymentEvent(
  event: Omit<PaymentAuditEvent, 'timestamp' | 'sessionId'>
): Promise<void> {
  try {
    const auditEvent: PaymentAuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
    };

    const { getApiUrl } = await import('../config/secure-api-config.js');

    fetch(getApiUrl('api/audit-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auditEvent),
      keepalive: true,
    }).catch(() => {
    });
  } catch {
  }
}

export async function verifyPaymentSuccess(paymentId: string, amount: number): Promise<boolean> {
  try {
    const { getApiUrl } = await import('../config/secure-api-config.js');

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
