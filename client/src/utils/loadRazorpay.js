/**
 * Dynamically loads the official Razorpay Checkout SDK script
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // If already loaded in window
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script from CDN.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
