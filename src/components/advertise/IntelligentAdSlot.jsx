import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../firebase';
import AdsSlick from './adsSlick';
import AdSlot from './AdSlot';

const IntelligentAdSlot = ({ position = 'main' }) => {
  const user = useSelector(state => state.user);
  const { bannerAds } = useSelector(state => state.post);
  const [adType, setAdType] = useState('direct'); // 'direct' or 'adsense'
  const [adPerformance, setAdPerformance] = useState({});
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    // AI-based ad selection logic
    const selectAdType = () => {
      // Check if user has seen too many direct ads recently
      const recentDirectAds = localStorage.getItem('recentDirectAds') || '[]';
      const recentAds = JSON.parse(recentDirectAds);
      const now = Date.now();
      const recentDirectAdCount = recentAds.filter(ad => 
        ad.type === 'direct' && (now - ad.timestamp) < 300000 // 5 minutes
      ).length;

      // Check if user has clicked on direct ads recently
      const recentClicks = localStorage.getItem('recentAdClicks') || '[]';
      const clicks = JSON.parse(recentClicks);
      const recentClickCount = clicks.filter(click => 
        click.type === 'direct' && (now - click.timestamp) < 900000 // 15 minutes
      ).length;

      // AI decision logic
      let shouldShowDirect = true;
      
      // If user has seen too many direct ads recently, show AdSense
      if (recentDirectAdCount >= 3) {
        shouldShowDirect = false;
      }
      
      // If user has low engagement with direct ads, show AdSense
      if (recentClickCount === 0 && recentDirectAdCount >= 2) {
        shouldShowDirect = false;
      }
      
      // If no direct ads available, show AdSense
      if (bannerAds.length === 0) {
        shouldShowDirect = false;
      }

      // Random factor for A/B testing (10% chance to show AdSense even if direct ads available)
      if (Math.random() < 0.1) {
        shouldShowDirect = false;
      }

      // Check for network issues - if there are recent AdSense errors, prefer direct ads
      const recentErrors = localStorage.getItem('adsenseErrors') || '[]';
      const errors = JSON.parse(recentErrors);
      const recentErrorCount = errors.filter(error => 
        (now - error.timestamp) < 300000 // 5 minutes
      ).length;
      
      if (recentErrorCount >= 2) {
        shouldShowDirect = true; // Prefer direct ads if AdSense is having issues
      }

      setAdType(shouldShowDirect ? 'direct' : 'adsense');
      
      // Log the decision for analytics
      if (analytics) {
        logEvent(analytics, 'ad_type_selected', {
          position,
          ad_type: shouldShowDirect ? 'direct' : 'adsense',
          user_id: user.id,
          direct_ads_available: bannerAds.length,
          recent_direct_views: recentDirectAdCount,
          recent_clicks: recentClickCount,
          network_errors: recentErrorCount
        });
      }

      // Record this ad view
      const newAdView = {
        type: shouldShowDirect ? 'direct' : 'adsense',
        timestamp: now,
        position
      };
      recentAds.push(newAdView);
      
      // Keep only last 10 ad views
      if (recentAds.length > 10) {
        recentAds.shift();
      }
      
      localStorage.setItem('recentDirectAds', JSON.stringify(recentAds));
    };

    selectAdType();
  }, [bannerAds.length, user.id, position]);

  // Listen for network errors from AdSlot
  useEffect(() => {
    const handleNetworkError = () => {
      setNetworkError(true);
      // Record the error for future decisions
      const recentErrors = localStorage.getItem('adsenseErrors') || '[]';
      const errors = JSON.parse(recentErrors);
      errors.push({
        timestamp: Date.now(),
        position
      });
      
      // Keep only last 5 errors
      if (errors.length > 5) {
        errors.shift();
      }
      
      localStorage.setItem('adsenseErrors', JSON.stringify(errors));
    };

    // Listen for custom network error events
    window.addEventListener('adsense-network-error', handleNetworkError);
    
    return () => {
      window.removeEventListener('adsense-network-error', handleNetworkError);
    };
  }, [position]);

  const handleAdClick = (adType, adId = null) => {
    // Record click for AI optimization
    const recentClicks = localStorage.getItem('recentAdClicks') || '[]';
    const clicks = JSON.parse(recentClicks);
    const newClick = {
      type: adType,
      timestamp: Date.now(),
      position,
      ad_id: adId
    };
    clicks.push(newClick);
    
    // Keep only last 20 clicks
    if (clicks.length > 20) {
      clicks.shift();
    }
    
    localStorage.setItem('recentAdClicks', JSON.stringify(clicks));

    // Log analytics
    if (analytics) {
      logEvent(analytics, 'ad_click', {
        ad_type: adType,
        position,
        ad_id: adId,
        user_id: user.id
      });
    }
  };

  const handleAdView = (adType, adId = null) => {
    // Log view for analytics
    if (analytics) {
      logEvent(analytics, 'ad_view', {
        ad_type: adType,
        position,
        ad_id: adId,
        user_id: user.id
      });
    }
  };

  // If there are network errors and we have direct ads, force direct ads
  if (networkError && bannerAds.length > 0) {
    return (
      <div onClick={() => handleAdClick('direct')} onLoad={() => handleAdView('direct')}>
        <AdsSlick ads={bannerAds} />
      </div>
    );
  }

  // Render the appropriate ad type
  if (adType === 'direct' && bannerAds.length > 0) {
    return (
      <div onClick={() => handleAdClick('direct')} onLoad={() => handleAdView('direct')}>
        <AdsSlick ads={bannerAds} />
      </div>
    );
  } else {
    return (
      <div onClick={() => handleAdClick('adsense')} onLoad={() => handleAdView('adsense')}>
        <AdSlot />
      </div>
    );
  }
};

export default IntelligentAdSlot; 