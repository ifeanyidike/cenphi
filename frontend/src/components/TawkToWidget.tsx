// components/TawkToWidget.tsx
import { useEffect } from 'react';

/**
 * TawkToWidget - Conditionally loads Tawk.to chat widget only on relevant pages
 *
 * Shows on:
 * - Landing/marketing pages (where users need help getting started)
 * - Public showcase pages (where viewers might want to contact)
 * - Billing/subscription pages (where users need support)
 *
 * Hidden on:
 * - Dashboard/workspace pages (logged-in users working)
 * - Content hub (users actively creating)
 * - Studio pages (users actively processing)
 * - Settings pages (users configuring their account)
 */
export const TawkToWidget = () => {
  useEffect(() => {
    const shouldShowWidget = () => {
      const path = window.location.pathname;

      // Show on landing/marketing pages
      if (path === '/' || path === '/home') return true;

      // Show on public showcase pages
      if (path.startsWith('/public/')) return true;

      // Show on pricing/billing pages
      if (path.includes('/pricing') || path.includes('/billing')) return true;

      // Show on auth pages (login, signup, etc.)
      if (path.startsWith('/auth/') || path === '/login' || path === '/signup') return true;

      // Hide on all other pages (dashboard, content hub, studio, settings, etc.)
      return false;
    };

    const loadTawkTo = () => {
      if (typeof window === 'undefined') return;

      // Check if Tawk.to is already loaded
      if ((window as any).Tawk_API) {
        (window as any).Tawk_API.showWidget();
        return;
      }

      // Load Tawk.to script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://embed.tawk.to/67cbef58f6ba19190d84daa1/1ilq9tsiq';
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');

      script.onload = () => {
        console.log('Tawk.to widget loaded');
      };

      document.body.appendChild(script);
    };

    const hideTawkTo = () => {
      if (typeof window === 'undefined') return;
      if ((window as any).Tawk_API) {
        (window as any).Tawk_API.hideWidget();
      }
    };

    // Show or hide based on current route
    if (shouldShowWidget()) {
      loadTawkTo();
    } else {
      hideTawkTo();
    }

    // Track the current path to detect changes
    let currentPath = window.location.pathname;

    // Listen for navigation changes (for SPA routing)
    const handleRouteChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        currentPath = newPath;
        if (shouldShowWidget()) {
          loadTawkTo();
        } else {
          hideTawkTo();
        }
      }
    };

    // Listen to popstate (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Poll for route changes (for SPA navigation like React Router)
    // This is necessary because React Router doesn't trigger popstate on Link clicks
    const intervalId = setInterval(handleRouteChange, 500);

    // Cleanup on unmount
    return () => {
      hideTawkTo();
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(intervalId);
    };
  }, []);

  return null; // This component doesn't render anything
};
