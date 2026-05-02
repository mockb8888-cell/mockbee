/* ============================================
   MockBee - Central API Configuration
   ============================================
   AUTO-DETECTS environment:
   - Local dev  → http://127.0.0.1:8080
   - Live site  → https://mockbee.onrender.com
   ============================================ */

const _isLocal = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
);

const API_BASE = _isLocal
    ? 'http://127.0.0.1:8080'
    : 'https://mockbee.onrender.com';
