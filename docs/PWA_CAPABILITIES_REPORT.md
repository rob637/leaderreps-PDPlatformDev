# PWA Implementation Report: LeaderReps PD Platform

This report documents the Progressive Web App (PWA) architecture used in the LeaderReps PD Platform. It is designed to serve as a blueprint for replicating these capabilities in other applications.

## 1. Technology Stack

*   **Framework:** React (v18.3.1)
*   **Build Tool:** Vite (v5.4.20)
*   **PWA Plugin:** `vite-plugin-pwa` (v1.1.0)
*   **Service Worker Logic:** Workbox (via `vite-plugin-pwa`)

## 2. Core Configuration (`vite.config.mjs`)

The PWA configuration is centralized in the `vite.config.mjs` file using the `VitePWA` plugin.

### Key Settings:

*   **Strategy:** `generateSW` (Automatically generates the service worker file).
*   **Registration:** `injectRegister: 'auto'` (Automatically injects the registration script into `index.html`).
*   **Manifest:** `manifest: false` (We provide our own `public/manifest.webmanifest` instead of generating one from config).

### Caching Strategy (Workbox):

The application uses a sophisticated caching strategy to ensure offline capability while keeping critical data fresh.

1.  **Firestore API:** `NetworkFirst`
    *   Ensures users always see the latest data if online.
        *   Falls back to cached data if offline.
            *   Timeout: 10 seconds.
            2.  **Firebase Auth:** `NetworkOnly`
                *   Security critical: Never cache auth tokens or states.
                3.  **Google Fonts (CSS):** `StaleWhileRevalidate`
                    *   Loads cached CSS immediately, updates in background.
                    4.  **Google Fonts (Files):** `CacheFirst`
                        *   Font files rarely change; cache for 1 year.
                        5.  **Images:** `CacheFirst`
                            *   Cache for 30 days.
                            6.  **App Navigation:** `NetworkFirst`
                                *   Ensures the app shell is fresh but works offline.

                                ### Update Behavior:

                                *   **`skipWaiting: false`**: The new service worker waits in a "waiting" state until the user explicitly accepts the update. This prevents the app from breaking in the middle of a user session.
                                *   **`clientsClaim: true`**: Once activated, the new service worker takes control immediately.

                                ### Version Injection:

                                We inject the app version from `package.json` into the build to manage updates intelligently.

                                ```javascript
                                // vite.config.mjs
                                define: {
                                  '__APP_VERSION__': JSON.stringify(packageJson.version),
                                  },
                                  plugins: [
                                    {
                                        name: 'generate-version-json',
                                            writeBundle() {
                                                  if (!fs.existsSync('build')) fs.mkdirSync('build');
                                                        fs.writeFileSync('build/version.json', JSON.stringify({ version: packageJson.version }));
                                                            }
                                                              },
                                                                // ...
                                                                ]
                                                                ```

                                                                ## 3. User Experience (`UpdateNotification.jsx`)

                                                                We implemented a custom "New Version Available" notification that is non-intrusive but reliable.

                                                                ### Features:

                                                                1.  **Version Checking:**
                                                                    *   When the Service Worker detects an update (`needRefresh` becomes true), the component fetches `/version.json`.
                                                                        *   It compares the running version (`__APP_VERSION__`) with the server version.
                                                                            *   **Crucial:** The popup *only* appears if the version numbers differ. This prevents false alarms caused by minor build artifacts.

                                                                            2.  **Safety Mechanism:**
                                                                                *   When the user clicks "Update Now", we trigger `updateServiceWorker(true)`.
                                                                                    *   **Fail-safe:** We set a 3-second timeout. If the update process hangs (common in some browsers), the page force-reloads automatically.

                                                                                    ```javascript
                                                                                    // UpdateNotification.jsx (Simplified)
                                                                                    const handleUpdate = async () => {
                                                                                      setIsUpdating(true);
                                                                                        
                                                                                          // Safety timeout
                                                                                            setTimeout(() => {
                                                                                                window.location.reload();
                                                                                                  }, 3000);

                                                                                                    try {
                                                                                                        await updateServiceWorker(true);
                                                                                                          } catch (error) {
                                                                                                              console.error('Update failed', error);
                                                                                                                }
                                                                                                                };
                                                                                                                ```

                                                                                                                ## 4. Web App Manifest (`public/manifest.webmanifest`)

                                                                                                                The manifest ensures the app is installable and looks like a native app.

                                                                                                                *   **`display: "standalone"`**: Removes browser UI (URL bar, navigation buttons).
                                                                                                                *   **`categories`**: Helps with app store discovery ("education", "productivity").
                                                                                                                *   **`shortcuts`**: Provides quick actions on the home screen icon (e.g., "Daily Practice").
                                                                                                                *   **`screenshots`**: Richer install UI on Android/Desktop.

                                                                                                                ## 5. Best Practices for Replication

                                                                                                                To build a similar PWA, ensure the following:

                                                                                                                1.  **Don't rely on default `skipWaiting: true`**: It causes "content mismatch" errors where the old app tries to load new assets that don't exist yet. Always use `skipWaiting: false` and a user prompt.
                                                                                                                2.  **Implement Version Checking**: Service workers are sensitive. They might detect a change in a single byte. verifying against a semantic version number (`package.json`) ensures you only interrupt users for meaningful updates.
                                                                                                                3.  **Handle Auth Persistence**: Use `localPersistence` for Firebase Auth. `sessionPersistence` can conflict with PWA caching strategies, leading to login loops.
                                                                                                                4.  **Clean Caches**: Use `cleanupOutdatedCaches: true` in Workbox config to prevent storage bloat on user devices.
                                                                                                                