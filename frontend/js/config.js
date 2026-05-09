/* ============================================
   MockBee - Central API Configuration
   ============================================
   AUTO-DETECTS environment:
   - Local dev  → http://127.0.0.1:8001
   - Live site  → https://mockbee.onrender.com
   ============================================ */

const _isLocal = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === ''
);

const API_BASE = _isLocal
    ? 'http://127.0.0.1:8001'
    : 'https://mockbee.onrender.com';
