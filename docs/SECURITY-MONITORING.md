# Open-Source Security Monitoring and Logging

## Overview

Warmthly uses a self-hosted, open-source security monitoring stack for comprehensive security analysis without commercial SIEM dependencies.

---

## Architecture

### Option 1: ELK Stack (Elasticsearch, Logstash, Kibana)

```
┌─────────────────┐
│  Application    │
│  (Warmthly)     │
└────────┬────────┘
         │ Security Events
         ▼
┌─────────────────┐
│   Logstash      │ (Collects & processes)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Elasticsearch   │ (Stores & indexes)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Kibana       │ (Visualizes & analyzes)
└─────────────────┘
```

### Option 2: LPG Stack (Loki, Promtail, Grafana)

```
┌─────────────────┐
│  Application    │
│  (Warmthly)     │
└────────┬────────┘
         │ Security Events
         ▼
┌─────────────────┐
│   Promtail      │ (Collects logs)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Loki        │ (Stores logs)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Grafana      │ (Visualizes & alerts)
└─────────────────┘
```

---

## Setup

### Quick Start with Docker Compose

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
# Kibana: http://localhost:5601
# Grafana: http://localhost:3000 (admin/admin)
```

### Configuration

#### Environment Variables

```bash
# ELK Stack
ELASTICSEARCH_URL=http://localhost:9200

# LPG Stack
LOKI_URL=http://localhost:3100

# Export destination
SECURITY_EXPORT_DESTINATION=both  # elasticsearch, loki, or both
```

#### Application Integration

```typescript
import { exportSecurityEvent, initializeExporter } from './api/security-exporter.js';
import { logSecurityEvent } from './api/security-monitor.js';

// Initialize exporter on startup
await initializeExporter({
  destination: ExportDestination.BOTH,
  elasticsearchUrl: process.env.ELASTICSEARCH_URL,
  lokiUrl: process.env.LOKI_URL,
});

// Export events (automatic via security-monitor integration)
// Events are automatically exported when logged
```

---

## Behavioral Anomaly Detection (BAD)

### Features

- ✅ **Time-based Detection**: Identifies activity outside expected hours
- ✅ **Location-based Detection**: Alerts on logins from new countries/cities
- ✅ **Frequency-based Detection**: Detects unusual event patterns
- ✅ **GeoIP Integration**: Uses MaxMind GeoLite2 database

### Configuration

```typescript
import { initializeAnomalyDetection, detectAnomalies } from './api/anomaly-detection.js';

const config = {
  enabled: true,
  timeBased: {
    expectedHours: [9, 10, 11, 12, 13, 14, 15, 16, 17], // 9 AM - 5 PM UTC
    timezone: 'UTC',
  },
  locationBased: {
    maxmindDbPath: '/path/to/GeoLite2-City.mmdb',
    allowedCountries: ['US', 'CA', 'GB'], // ISO 3166-1 alpha-2
    alertOnNewCountry: true,
    alertOnNewCity: false,
  },
  frequencyBased: {
    maxEventsPerWindow: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    thresholdMultiplier: 3,
  },
};

await initializeAnomalyDetection(config);

// Anomalies are automatically detected when security events are logged
```

### GeoIP Database Setup

1. **Download MaxMind GeoLite2 Database:**

   ```bash
   # Free version available at:
   # https://dev.maxmind.com/geoip/geoip2/geolite2/

   # Or use maxmind npm package
   npm install maxmind
   ```

2. **Configure path:**
   ```bash
   export MAXMIND_DB_PATH=/path/to/GeoLite2-City.mmdb
   ```

### Anomaly Types

#### Time-Based Anomaly

- **Trigger**: Activity outside expected hours
- **Severity**: Medium
- **Score**: 70/100

#### Location-Based Anomaly

- **Trigger**: Login from new country or restricted country
- **Severity**: High
- **Score**: 85-90/100

#### Frequency-Based Anomaly

- **Trigger**: Unusual number of events in time window
- **Severity**: Medium to High
- **Score**: 50-100/100 (based on frequency)

---

## Dashboards

### Kibana Dashboards

**Security Events Dashboard:**

- Security events over time
- Failed login attempts
- Top attack sources
- Event type distribution

**Access**: http://localhost:5601

### Grafana Dashboards

**Security Overview Dashboard:**

- Security events timeline
- Anomaly detection metrics
- Geographic attack distribution
- Event severity breakdown

**Access**: http://localhost:3000

**Pre-configured Dashboards:**

- Security Overview (`security-overview.json`)
- Authentication Monitoring
- Anomaly Detection

---

## Alerting Rules

### Grafana Alerting

**Example Alert Rules:**

1. **High Failed Login Attempts:**

   ```yaml
   - alert: HighFailedLogins
     expr: sum(rate(security_events_total{type="authentication_failure"}[5m])) > 10
     for: 5m
     annotations:
       summary: 'High number of failed login attempts detected'
   ```

2. **Anomaly Detected:**

   ```yaml
   - alert: SecurityAnomaly
     expr: security_anomalies_total > 0
     for: 1m
     annotations:
       summary: 'Security anomaly detected: {{ $labels.anomalyType }}'
   ```

3. **Multiple IPs for Same Account:**
   ```yaml
   - alert: MultipleIPsSameAccount
     expr: count(security_events_total) by (account) > 3
     for: 1h
     annotations:
       summary: 'Multiple IP addresses used for account: {{ $labels.account }}'
   ```

### Kibana Alerting

**Example Watcher:**

```json
{
  "trigger": {
    "schedule": {
      "interval": "5m"
    }
  },
  "input": {
    "search": {
      "request": {
        "search_type": "query_then_fetch",
        "indices": ["security-events"],
        "body": {
          "query": {
            "bool": {
              "must": [
                {
                  "range": {
                    "@timestamp": {
                      "gte": "now-5m"
                    }
                  }
                },
                {
                  "term": {
                    "type": "authentication_failure"
                  }
                }
              ]
            }
          }
        }
      }
    }
  },
  "condition": {
    "compare": {
      "ctx.payload.hits.total": {
        "gt": 10
      }
    }
  },
  "actions": {
    "send_email": {
      "email": {
        "to": ["security@warmthly.org"],
        "subject": "High Failed Login Attempts",
        "body": "{{ctx.payload.hits.total}} failed login attempts in the last 5 minutes"
      }
    }
  }
}
```

---

## CI/CD Security Tools

### Static Application Security Testing (SAST)

#### ESLint Security Plugins

```bash
# Install security plugins
npm install --save-dev eslint-plugin-security eslint-plugin-sonarjs

# Run security scan
npm run lint
```

**Configuration** (`.eslintrc.json`):

```json
{
  "plugins": ["security", "sonarjs"],
  "extends": ["plugin:security/recommended", "plugin:sonarjs/recommended"]
}
```

#### Semgrep

```bash
# Install Semgrep
pip install semgrep

# Run scan
semgrep --config=auto --json --output=semgrep-report.json .
```

**GitHub Actions Integration:**

- Automatically runs on every commit
- Uploads results as artifacts
- Fails build on critical findings

### Dependency Scanning

#### OWASP Dependency-Check

```bash
# Run scan
dependency-check --project warmthly --scan . --format JSON --out reports/
```

**Features:**

- Scans package.json and lock files
- Checks against CVE database
- Generates detailed reports

#### Trivy

```bash
# Install Trivy
brew install trivy  # macOS
# or download from: https://github.com/aquasecurity/trivy

# Scan dependencies
trivy fs --severity CRITICAL,HIGH .
```

**GitHub Actions Integration:**

- Uploads results to GitHub Security tab
- SARIF format for code scanning alerts

### Dynamic Application Security Testing (DAST)

#### OWASP ZAP

```bash
# Baseline scan (quick)
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:4173

# Full scan (comprehensive)
docker run -t owasp/zap2docker-stable zap-full-scan.py -t http://localhost:4173
```

**GitHub Actions Integration:**

- Runs on staging environment
- Baseline scan on every push
- Full scan on schedule (weekly)

**Configuration:**

- Rules file: `.zap/rules.tsv`
- Custom rules for false positives
- Severity levels: IGNORE, WARN, FAIL

---

## Monitoring Metrics

### Key Metrics to Track

1. **Security Events:**

   - Total events per type
   - Events per severity
   - Events over time

2. **Authentication:**

   - Failed login attempts
   - Successful logins
   - MFA usage

3. **Anomalies:**

   - Anomalies detected
   - Anomaly types
   - Anomaly scores

4. **Attack Patterns:**
   - XSS attempts
   - SQL injection attempts
   - Rate limit violations

---

## Best Practices

1. **Log Retention:**

   - Keep logs for at least 90 days
   - Archive older logs to cold storage
   - Comply with data retention policies

2. **Alert Tuning:**

   - Start with conservative thresholds
   - Tune based on false positive rate
   - Review and adjust weekly

3. **Dashboard Maintenance:**

   - Review dashboards monthly
   - Update queries based on new threats
   - Share insights with team

4. **CI/CD Integration:**
   - Run SAST on every commit
   - Run dependency scans daily
   - Run DAST on staging weekly

---

## Troubleshooting

### Elasticsearch Connection Issues

```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check indices
curl http://localhost:9200/_cat/indices
```

### Loki Connection Issues

```bash
# Check Loki readiness
curl http://localhost:3100/ready

# Check labels
curl http://localhost:3100/loki/api/v1/labels
```

### GeoIP Database Issues

```bash
# Verify database file
file /path/to/GeoLite2-City.mmdb
# Should output: MaxMind DB binary

# Test lookup
node -e "const maxmind = require('maxmind'); maxmind.open('/path/to/GeoLite2-City.mmdb').then(db => console.log(db.get('8.8.8.8')))"
```

---

## References

- [ELK Stack Documentation](https://www.elastic.co/guide/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Semgrep](https://semgrep.dev/)
- [Trivy](https://aquasecurity.github.io/trivy/)
- [MaxMind GeoIP2](https://dev.maxmind.com/geoip/geoip2/geolite2/)

---

**Last Updated**: 2025  
**Maintained By**: Warmthly Security Team
