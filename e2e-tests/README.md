# E2E Automated Tests

This directory contains automated E2E tests using Playwright that mirror the Manual Test Scripts.

## 📁 Test Structure

```
e2e-tests/
├── auth.setup.js           # Authentication setup (saves state for reuse)
├── auth.spec.js            # Authentication tests (06-authentication.md)
├── smoke.spec.js           # Critical Path Smoke Test (00-smoke-test.md)
├── daily-practice.spec.js  # AM/PM Bookend tests (02, 03 manual scripts)
├── admin.spec.js           # Admin Portal tests
└── utils/
    └── test-helpers.js     # Shared utilities and selectors
```

## 🚀 Running Tests

### Prerequisites

1. **Set environment variables** for test credentials:
   ```bash
   export E2E_ADMIN_EMAIL="admin@example.com"
   export E2E_ADMIN_PASSWORD="your-password"
   export E2E_USER_EMAIL="user@example.com"
   export E2E_USER_PASSWORD="user-password"
   ```

2. **Install Playwright browsers** (first time only):
   ```bash
   npx playwright install chromium
   ```

### Quick Commands

```bash
# Run all E2E tests
npm run e2e

# Run with visible browser
npm run e2e:headed

# Run with Playwright UI (interactive debugging)
npm run e2e:ui

# Run specific test suites
npm run e2e:smoke          # Critical path smoke tests
npm run e2e:auth           # Authentication tests
npm run e2e:admin          # Admin portal tests
npm run e2e:daily          # Daily practice tests

# Run against different environments
npm run e2e:local          # http://localhost:5173
npm run e2e:test           # https://leaderreps-test.web.app
npm run e2e:prod           # https://leaderreps-prod.web.app

# View test report
npm run e2e:report
```

### Advanced Options

```bash
# Run specific test file
npx playwright test smoke.spec.js

# Run tests matching pattern
npx playwright test -g "login"

# Run in debug mode
npx playwright test --debug

# Update snapshots
npx playwright test --update-snapshots

# Generate HTML report
npx playwright test --reporter=html
```

## 📊 Test Coverage Mapping

| Manual Test Script | Automated Test File | Scenarios |
|-------------------|---------------------|-----------|
| 00-smoke-test.md | smoke.spec.js | 36 |
| 01-prep-phase.md | (planned) | 14 |
| 02-dev-am-bookend.md | daily-practice.spec.js | 20 |
| 03-dev-pm-bookend.md | daily-practice.spec.js | 18 |
| 04-content-library.md | smoke.spec.js (partial) | 22 |
| 05-post-phase.md | (planned) | 12 |
| 06-authentication.md | auth.spec.js | 16 |

## 🔧 Configuration

Edit `playwright.config.js` to customize:

- **Target environments**: local, test, prod
- **Browser projects**: chromium, mobile, admin
- **Timeouts**: Global and per-test timeouts
- **Reporters**: HTML, JSON, console
- **Screenshots/Videos**: On failure capture

## 📝 Writing New Tests

### Test Naming Convention

Use the manual test script ID as a prefix:
```javascript
test('CROSS-AUTH-001: should login with valid credentials', async ({ page }) => {
  // Test implementation
});
```

### Using Test Helpers

```javascript
import { 
  SELECTORS, 
  URLS, 
  waitForPageLoad, 
  login 
} from './utils/test-helpers.js';

test('example', async ({ page }) => {
  await page.goto(URLS.dashboard);
  await waitForPageLoad(page);
  
  // Use common selectors
  await page.locator(SELECTORS.loginButton).click();
});
```

### Handling Authentication

Tests that require authentication use stored state:
```javascript
// In playwright.config.js, projects use storageState
{
  name: 'chromium',
  use: { 
    storageState: 'playwright/.auth/user.json',
  },
}
```

## 🐛 Debugging Failed Tests

1. **Run with UI mode**:
   ```bash
   npm run e2e:ui
   ```

2. **Check screenshots** in `test-results/screenshots/`

3. **View HTML report**:
   ```bash
   npm run e2e:report
   ```

4. **Enable trace** on retries (automatic in config)

## 🤖 CI/CD Integration

The tests are configured for CI with:
- Single worker for stability
- Retry on failure
- No `test.only` allowed
- JSON output for parsing

Example GitHub Actions:
```yaml
- name: Run E2E Tests
  env:
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
  run: npm run e2e:test
```

## 📈 Test Results

Results are saved to:
- `playwright-report/` - HTML report
- `test-results/` - Screenshots, videos, traces
- `test-results/results.json` - JSON results

---

**Note**: These automated tests complement but don't replace manual testing. 
Run both for full coverage before deployments.
