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
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('warmthly_session_id', sessionId);
    }
    return sessionId;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
