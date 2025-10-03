/**
 * Toast Notification System
 * A comprehensive toast notification system for NutriTrack
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.maxToasts = 5;
    this.defaultDuration = 5000;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  /**
   * Show a toast notification
   * @param {Object} options - Toast configuration
   * @param {string} options.type - Toast type: 'success', 'error', 'warning', 'info'
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {number} options.duration - Auto-dismiss duration in ms (default: 5000)
   * @param {boolean} options.closable - Whether toast can be manually closed (default: true)
   * @param {string} options.icon - Custom icon class (optional)
   */
  show(options) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = this.defaultDuration,
      closable = true,
      icon = null
    } = options;

    // Remove oldest toast if we've reached the limit
    if (this.toasts.size >= this.maxToasts) {
      const oldestToast = this.toasts.values().next().value;
      this.remove(oldestToast.id);
    }

    const toastId = this.generateId();
    const toast = this.createToast(toastId, type, title, message, closable, icon);
    
    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Trigger show animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-dismiss if duration is set
    if (duration > 0) {
      this.startProgressBar(toast, duration);
      setTimeout(() => {
        this.remove(toastId);
      }, duration);
    }

    return toastId;
  }

  createToast(id, type, title, message, closable, icon) {
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `toast toast-${type}`;

    const defaultIcons = {
      success: 'ri-check-line',
      error: 'ri-close-line',
      warning: 'ri-alert-line',
      info: 'ri-information-line'
    };

    const iconClass = icon || defaultIcons[type] || defaultIcons.info;

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      ${closable ? `
        <button class="toast-close" onclick="toastManager.remove('${id}')">
          <i class="ri-close-line"></i>
        </button>
      ` : ''}
      <div class="toast-progress"></div>
    `;

    return toast;
  }

  startProgressBar(toast, duration) {
    const progressBar = toast.querySelector('.toast-progress');
    if (!progressBar) return;

    progressBar.style.width = '100%';
    progressBar.style.transition = `width ${duration}ms linear`;
    
    requestAnimationFrame(() => {
      progressBar.style.width = '0%';
    });
  }

  remove(toastId) {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    toast.classList.add('hide');
    toast.classList.remove('show');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(toastId);
    }, 300);
  }

  clear() {
    this.toasts.forEach((toast, id) => {
      this.remove(id);
    });
  }

  generateId() {
    return 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Convenience methods
  success(title, message, options = {}) {
    return this.show({ type: 'success', title, message, ...options });
  }

  error(title, message, options = {}) {
    return this.show({ type: 'error', title, message, ...options });
  }

  warning(title, message, options = {}) {
    return this.show({ type: 'warning', title, message, ...options });
  }

  info(title, message, options = {}) {
    return this.show({ type: 'info', title, message, ...options });
  }
}

// Create global instance
const toastManager = new ToastManager();

// Global functions for easy access
window.showToast = (options) => toastManager.show(options);
window.showSuccess = (title, message, options) => toastManager.success(title, message, options);
window.showError = (title, message, options) => toastManager.error(title, message, options);
window.showWarning = (title, message, options) => toastManager.warning(title, message, options);
window.showInfo = (title, message, options) => toastManager.info(title, message, options);
window.clearToasts = () => toastManager.clear();

// Toast system is now initialized

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
