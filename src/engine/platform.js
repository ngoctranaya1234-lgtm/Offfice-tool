// Platform & OS Recognition Engine for Offfice tool
class PlatformEngine {
  constructor() {
    this.detectedOS = this._detect();
    this.currentMode = localStorage.getItem('offfice_platform_mode') || 'auto';
    this.applyMode(this.currentMode);
  }

  _detect() {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    
    // Check iOS
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      return 'ios';
    }
    // Check Android
    if (/android/i.test(ua)) {
      return 'android';
    }
    // Desktop
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
    localStorage.setItem('offfice_platform_mode', mode);
    
    const effective = this.getEffectivePlatform();
    const root = document.documentElement;
    
    root.classList.remove('platform-ios', 'platform-android', 'platform-desktop');
    root.classList.add(`platform-${effective}`);
    
    // Trigger custom event for UI updates
    window.dispatchEvent(new CustomEvent('platformChanged', { 
      detail: { mode: this.currentMode, effective: effective } 
    }));
    
    return effective;
  }
}

window.platform = new PlatformEngine();
