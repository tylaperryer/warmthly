# Alerting Integration Guide

**Phase 3 Issue 3.20: TODO Comments for Alerting**

## Overview

The Warmthly application includes security monitoring and certificate monitoring features that detect and log security events. Currently, these events are stored in Redis but alerting integration is incomplete.

## Current State

### Security Monitor (`warmthly/api/security/security-monitor.ts`)

The security monitor detects and logs various security events:

- XSS attempts
- SQL injection attempts
- Rate limit violations
- Anomalous request patterns
- Suspicious activity

**Current Implementation:**

- Events are logged to Redis with 7-day retention
- Events are stored with severity levels (INFO, WARNING, CRITICAL)
- TODO comment at line 228 indicates alerting integration needed

### Certificate Monitor (`warmthly/api/security/certificate-monitoring.ts`)

The certificate monitor tracks SSL/TLS certificate changes:

- Certificate expiration warnings
- Certificate changes
- Certificate validation failures

**Current Implementation:**

- Certificate events are logged
- TODO comment at line 207 indicates alerting integration needed

## Recommended Alerting Integration

### 1. Email Notifications

**Implementation:**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSecurityAlert(event: SecurityEvent): Promise<void> {
  const severity =
    event.severity === SecurityEventSeverity.CRITICAL
      ? '🚨 CRITICAL'
      : event.severity === SecurityEventSeverity.WARNING
        ? '⚠️ WARNING'
        : 'ℹ️ INFO';

  await resend.emails.send({
    from: 'Security Monitor <security@warmthly.org>',
    to: [process.env.ADMIN_EMAIL || 'desk@warmthly.org'],
    subject: `${severity} Security Alert: ${event.type}`,
    html: `
      <h2>Security Alert</h2>
      <p><strong>Type:</strong> ${event.type}</p>
      <p><strong>Severity:</strong> ${event.severity}</p>
      <p><strong>Timestamp:</strong> ${new Date(event.timestamp).toISOString()}</p>
      <p><strong>Identifier:</strong> ${event.identifier}</p>
      <pre>${JSON.stringify(event.details, null, 2)}</pre>
    `,
  });
}
```

**Configuration:**

- Set `RESEND_API_KEY` environment variable
- Set `ADMIN_EMAIL` environment variable
- Configure alert thresholds (e.g., only send CRITICAL alerts, or batch WARNING alerts)

### 2. Slack/Discord Webhooks

**Implementation:**

```typescript
async function sendSlackAlert(event: SecurityEvent): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color =
    event.severity === SecurityEventSeverity.CRITICAL
      ? 'danger'
      : event.severity === SecurityEventSeverity.WARNING
        ? 'warning'
        : 'good';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [
        {
          color,
          title: `Security Alert: ${event.type}`,
          fields: [
            { title: 'Severity', value: event.severity, short: true },
            { title: 'Identifier', value: event.identifier, short: true },
            { title: 'Timestamp', value: new Date(event.timestamp).toISOString(), short: true },
            { title: 'Details', value: JSON.stringify(event.details, null, 2), short: false },
          ],
        },
      ],
    }),
  });
}
```

**Configuration:**

- Set `SLACK_WEBHOOK_URL` environment variable
- Create Slack webhook in Slack workspace settings
- Configure alert channels (e.g., #security-alerts)

### 3. PagerDuty Integration

**Implementation:**

```typescript
async function sendPagerDutyAlert(event: SecurityEvent): Promise<void> {
  // Only send CRITICAL events to PagerDuty
  if (event.severity !== SecurityEventSeverity.CRITICAL) return;

  const pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY;
  if (!pagerDutyKey) return;

  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token token=${pagerDutyKey}`,
    },
    body: JSON.stringify({
      routing_key: pagerDutyKey,
      event_action: 'trigger',
      payload: {
        summary: `Security Alert: ${event.type}`,
        severity: 'critical',
        source: 'warmthly-security-monitor',
        custom_details: event.details,
      },
    }),
  });
}
```

**Configuration:**

- Set `PAGERDUTY_INTEGRATION_KEY` environment variable
- Create PagerDuty service and integration
- Configure escalation policies

### 4. SIEM Integration

For enterprise deployments, integrate with SIEM systems:

- Splunk
- Datadog
- New Relic
- AWS CloudWatch
- Azure Monitor

**Implementation:**
Send structured logs to SIEM endpoints or use log forwarding services.

## Alert Thresholds

### Recommended Thresholds

**CRITICAL (Immediate Alert):**

- XSS attempts
- SQL injection attempts
- Certificate expiration < 7 days
- Multiple failed authentication attempts
- Rate limit violations > 1000/hour

**WARNING (Batch Alerts):**

- Suspicious request patterns
- Certificate expiration < 30 days
- Rate limit violations > 100/hour
- Anomalous traffic patterns

**INFO (Log Only):**

- Normal security events
- Certificate renewals
- Rate limit violations < 100/hour

## Implementation Steps

1. **Add Alerting Configuration**
   - Create `warmthly/api/config/alerting.ts` with alert thresholds
   - Add environment variables for alerting services

2. **Update Security Monitor**
   - Replace TODO at line 228 with alerting function calls
   - Add alert batching to prevent alert fatigue
   - Add rate limiting for alerts

3. **Update Certificate Monitor**
   - Replace TODO at line 207 with alerting function calls
   - Add certificate expiration alerts
   - Add certificate change notifications

4. **Testing**
   - Test email alerts
   - Test webhook integrations
   - Verify alert thresholds
   - Test alert batching

5. **Monitoring**
   - Monitor alert delivery success rates
   - Track alert response times
   - Review alert effectiveness

## Environment Variables

```bash
# Email alerts
RESEND_API_KEY=re_...
ADMIN_EMAIL=desk@warmthly.org

# Slack alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# PagerDuty alerts
PAGERDUTY_INTEGRATION_KEY=pdi_...

# Alert thresholds
ALERT_CRITICAL_THRESHOLD=1
ALERT_WARNING_THRESHOLD=10
ALERT_BATCH_INTERVAL=300000  # 5 minutes
```

## Best Practices

1. **Alert Batching**: Batch non-critical alerts to prevent alert fatigue
2. **Rate Limiting**: Limit alert frequency to prevent spam
3. **Escalation**: Implement escalation policies for critical alerts
4. **Testing**: Regularly test alert delivery
5. **Documentation**: Document alert meanings and response procedures
6. **Monitoring**: Monitor alert system health

## Next Steps

1. Implement email alerting (highest priority)
2. Add Slack webhook integration
3. Configure alert thresholds
4. Test alert delivery
5. Document response procedures
6. Set up alert monitoring
