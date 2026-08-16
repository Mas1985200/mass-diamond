import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the built PWA (dist/) into a native Android/iOS shell via
// Capacitor. This closes the "Android/iOS native packaging" gap noted
// in the README — the app is NOT natively rebuilt, it's the same web
// app running inside a native WebView with access to native APIs
// (camera, geolocation, push) where needed.
//
// Setup (after `npm run build`):
//   npm install -D @capacitor/core @capacitor/cli
//   npm install @capacitor/android @capacitor/ios
//   npx cap add android
//   npx cap add ios
//   npx cap sync
//   npx cap open android   # or: npx cap open ios
//
// This does NOT run automatically — it's an opt-in step once the web
// app is stable, per spec section 3 ("architecture clean enough that
// the application can later be packaged for Android and iOS").
const config: CapacitorConfig = {
  appId: "com.massdiamond.app",
  appName: "Mass Diamond",
  webDir: "dist",
  backgroundColor: "#060907",
  server: {
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      backgroundColor: "#060907",
      showSpinner: false
    }
  }
};

export default config;
