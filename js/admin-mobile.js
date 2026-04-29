/**
 * Mobile-First Admin Dashboard - Visual Feedback & Toast Notifications
 * Provides instant feedback for all user actions
 */

// ================================================================
// TOAST NOTIFICATION SYSTEM
// ================================================================

let toastContainer = null;

function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'admin-toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = initToastContainer();

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;

  // Create icon SVG safely
  const icon = document.createElement('span');
  icon.appendChild(getToastIcon(type));

  // Create message text safely
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(messageSpan);
  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 250ms ease-out forwards';
    setTimeout(() => toast.remove(), 250);
  }, duration);

  return toast;
}

function getToastIcon(type) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');

  const icons = {
    success: () => {
      svg.style.color = 'var(--admin-success)';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M22 11.08V12a10 10 0 1 1-5.93-9.14');
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '22 4 12 14.01 9 11.01');
      svg.appendChild(path);
      svg.appendChild(polyline);
    },
    error: () => {
      svg.style.color = 'var(--admin-error)';
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '15');
      line1.setAttribute('y1', '9');
      line1.setAttribute('x2', '9');
      line1.setAttribute('y2', '15');
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '9');
      line2.setAttribute('y1', '9');
      line2.setAttribute('x2', '15');
      line2.setAttribute('y2', '15');
      svg.appendChild(circle);
      svg.appendChild(line1);
      svg.appendChild(line2);
    },
    warning: () => {
      svg.style.color = 'var(--admin-warning)';
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z');
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('y1', '9');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y2', '13');
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('y1', '17');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y2', '17');
      svg.appendChild(path);
      svg.appendChild(line1);
      svg.appendChild(line2);
    },
    info: () => {
      svg.style.color = 'var(--admin-info)';
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', '12');
      line1.setAttribute('y1', '16');
      line1.setAttribute('x2', '12');
      line1.setAttribute('y2', '12');
      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', '12');
      line2.setAttribute('y1', '8');
      line2.setAttribute('x2', '12.01');
      line2.setAttribute('y2', '8');
      svg.appendChild(circle);
      svg.appendChild(line1);
      svg.appendChild(line2);
    }
  };

  const iconFn = icons[type] || icons.info;
  iconFn();

  return svg;
}

// ================================================================
// BUTTON LOADING STATES
// ================================================================

function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.classList.add('loading');
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = button.dataset.loadingText || 'Saving...';
  } else {
    button.classList.remove('loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

// ================================================================
// SAVE WITH FEEDBACK WRAPPER
// ================================================================

async function saveWithFeedback(saveFunction, options = {}) {
  const {
    button = null,
    successMessage = 'Saved successfully!',
    errorMessage = 'Failed to save. Please try again.',
    loadingText = 'Saving...'
  } = options;

  try {
    // Show loading state
    if (button) {
      button.dataset.loadingText = loadingText;
      setButtonLoading(button, true);
    }

    // Execute save function
    const result = await saveFunction();

    // Show success feedback
    showToast(successMessage, 'success');
    triggerHaptic('success');

    return result;
  } catch (error) {
    console.error('[admin] Save error:', error);
    showToast(errorMessage, 'error');
    triggerHaptic('error');
    throw error;
  } finally {
    // Remove loading state
    if (button) {
      setButtonLoading(button, false);
    }
  }
}

// ================================================================
// HAPTIC FEEDBACK (iOS/Android)
// ================================================================

function triggerHaptic(type = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [30, 50, 30]
    };
    navigator.vibrate(patterns[type] || patterns.light);
  }
}

// ================================================================
// ENHANCED BUTTON INTERACTIONS
// ================================================================

function enhanceButton(button) {
  button.addEventListener('touchstart', () => {
    triggerHaptic('light');
  }, { passive: true });

  button.addEventListener('click', (e) => {
    // Add ripple effect
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      transform: scale(0);
      animation: ripple 600ms ease-out;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
}

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
  @keyframes toastSlideOut {
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// ================================================================
// AUTO-ENHANCE ALL BUTTONS ON PAGE LOAD
// ================================================================

function initMobileEnhancements() {
  // Enhance all admin buttons
  document.querySelectorAll('.btn-admin, .admin-nav-btn-mobile').forEach(enhanceButton);

  // Add haptic feedback to nav buttons
  document.querySelectorAll('.admin-nav-btn-mobile').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic('light');
    });
  });

  console.log('[admin-mobile] Mobile enhancements initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileEnhancements);
} else {
  initMobileEnhancements();
}

// ================================================================
// EXPORT FOR USE IN admin.js
// ================================================================

window.adminMobile = {
  showToast,
  setButtonLoading,
  saveWithFeedback,
  triggerHaptic,
  enhanceButton
};
