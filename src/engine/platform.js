// Platform & OS Recognition Engine for Offfice tool
// Auto-detects Android (Material You 3), iOS (Cupertino HIG), and Desktop PC
class PlatformEngine {
  constructor() {
    this.detectedOS = this._detect();
    this.currentMode = localStorage.getItem('offfice_platform_mode') || 'auto';
    this.applyMode(this.currentMode);

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.syncUI());
      } else {
        this.syncUI();
      }
    }
  }

  _detect() {
    if (typeof navigator === 'undefined') return 'desktop';

    // 1. Modern Chromium Client Hints (Android Chrome, Edge Android, Samsung Internet)
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      const p = (navigator.userAgentData.platform || '').toLowerCase();
      if (p.includes('android')) return 'android';
      if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'ios';
      if (navigator.userAgentData.mobile) return 'android';
    }

    const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
    const platform = (navigator.platform || '').toLowerCase();

    // 2. Android detection (User Agent, platform strings, webview signatures)
    if (
      ua.includes('android') ||
      platform.includes('android') ||
      ua.includes('linux; u;') ||
      (ua.includes('mobile') && ua.includes('linux'))
    ) {
      return 'android';
    }

    // 3. Apple iOS detection (iPhone, iPad, iPod, Mac touch devices)
    if (
      /ipad|iphone|ipod/.test(ua) ||
      (platform === 'macintel' && navigator.maxTouchPoints > 1) ||
      (ua.includes('macintosh') && 'ontouchend' in document)
    ) {
      return 'ios';
    }

    // 4. Mobile screen touch fallback (screens <= 820px with touch)
    if (typeof window !== 'undefined' && window.innerWidth <= 820) {
      const hasTouch = (navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
      if (hasTouch) {
        if (/iphone|ipad|ipod|mac/.test(ua) || /mac/.test(platform)) {
          return 'ios';
        }
        return 'android'; // Default mobile touch to Android Material
      }
    }

    // 5. Desktop default
    return 'desktop';
  }

  getEffectivePlatform() {
    if (this.currentMode === 'auto') {
      return this.detectedOS;
    }
    return this.currentMode;
  }

  applyMode(mode) {
    this.currentMode = mode;
    try {
      localStorage.setItem('offfice_platform_mode', mode);
    } catch (e) {}

    const effective = this.getEffectivePlatform();
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('platform-ios', 'platform-android', 'platform-desktop');
      root.classList.add(`platform-${effective}`);

      // Apply mobile viewport class if small screen
      if (window.innerWidth <= 768) {
        root.classList.add('is-mobile-screen');
      } else {
        root.classList.remove('is-mobile-screen');
      }
    }

    this.syncUI();

    // Trigger custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('platformChanged', {
        detail: { mode: this.currentMode, effective: effective, detected: this.detectedOS }
      }));
    }

    return effective;
  }

  syncUI() {
    if (typeof document === 'undefined') return;
    const selector = document.getElementById('platform-selector');
    if (!selector) return;

    // Update select value
    if (selector.value !== this.currentMode) {
      selector.value = this.currentMode;
    }

    // Dynamically update the 'auto' option text so the user instantly sees Android/iOS detected!
    const autoOpt = selector.querySelector('option[value="auto"]');
    if (autoOpt) {
      if (this.detectedOS === 'android') {
        autoOpt.textContent = '🤖 Android (Tự động)';
      } else if (this.detectedOS === 'ios') {
        autoOpt.textContent = '🍏 iOS (Tự động)';
      } else {
        autoOpt.textContent = '💻 PC (Tự động)';
      }
    }
  }
}

window.platform = new PlatformEngine();
