/**
 * Toast Helper Functions
 * Utility functions for easy toast notification integration
 */

// Helper function to show toast from server-side data
function showToastFromData(toastData) {
  if (toastData && toastData.type && toastData.message) {
    toastManager.show({
      type: toastData.type,
      title: toastData.title || (toastData.type === 'success' ? 'Success' : 
                                 toastData.type === 'error' ? 'Error' : 
                                 toastData.type === 'warning' ? 'Warning' : 'Info'),
      message: toastData.message,
      duration: 5000
    });
  }
}

// Helper function to show toast from URL parameters
function showToastFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const toastType = urlParams.get('toast');
  const toastTitle = urlParams.get('toastTitle');
  const toastMessage = urlParams.get('toastMessage');

  if (toastType && toastMessage) {
    const title = toastTitle || (toastType === 'success' ? 'Success' : 
                   toastType === 'error' ? 'Error' : 
                   toastType === 'warning' ? 'Warning' : 'Info');
    
    toastManager.show({
      type: toastType,
      title: title,
      message: toastMessage,
      duration: 5000
    });

    // Clean up URL parameters
    const url = new URL(window.location);
    url.searchParams.delete('toast');
    url.searchParams.delete('toastTitle');
    url.searchParams.delete('toastMessage');
    window.history.replaceState({}, '', url);
  }
}

// Helper function to show success toast
function showSuccessToast(title, message) {
  return toastManager.success(title, message);
}

// Helper function to show error toast
function showErrorToast(title, message) {
  return toastManager.error(title, message);
}

// Helper function to show warning toast
function showWarningToast(title, message) {
  return toastManager.warning(title, message);
}

// Helper function to show info toast
function showInfoToast(title, message) {
  return toastManager.info(title, message);
}

// Auto-initialize toasts from URL parameters when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  showToastFromURL();
});

// Export functions for global access
window.showToastFromData = showToastFromData;
window.showToastFromURL = showToastFromURL;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showWarningToast = showWarningToast;
window.showInfoToast = showInfoToast;
