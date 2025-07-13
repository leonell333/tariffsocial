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
    const selectAdType = () => {
      const recentDirectAds = localStorage.getItem('recentDirectAds') || '[]';
      const recentAds = JSON.parse(recentDirectAds);
      const now = Date.now();
      const recentDirectAdCount = recentAds.filter(ad => 
        ad.type === 'direct' && (now - ad.timestamp) < 300000 // 5 minutes
      ).length;

      const recentClicks = localStorage.getItem('recentAdClicks') || '[]';
      const clicks = JSON.parse(recentClicks);
      const recentClickCount = clicks.filter(click => 
        click.type === 'direct' && (now - click.timestamp) < 900000 // 15 minutes
      ).length;
      let shouldShowDirect = true;
      if (recentDirectAdCount >= 3) {
        shouldShowDirect = false;
      }
      if (recentClickCount === 0 && recentDirectAdCount >= 2) {
        shouldShowDirect = false;
      }
      if (bannerAds.length === 0) {
        shouldShowDirect = false;
      }
      if (Math.random() < 0.1) {
        shouldShowDirect = false;
      }
      const recentErrors = localStorage.getItem('adsenseErrors') || '[]';
      const errors = JSON.parse(recentErrors);
      const recentErrorCount = errors.filter(error => 
        (now - error.timestamp) < 300000
      ).length;
      
      if (recentErrorCount >= 2) {
        shouldShowDirect = true;
      }
      setAdType(shouldShowDirect ? 'direct' : 'adsense');
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
      const newAdView = {
        type: shouldShowDirect ? 'direct' : 'adsense',
        timestamp: now,
        position
      };
      recentAds.push(newAdView);
      if (recentAds.length > 10) {
        recentAds.shift();
      }
      localStorage.setItem('recentDirectAds', JSON.stringify(recentAds));
    };
    selectAdType();
  }, [bannerAds.length, user.id, position]);
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
      if (errors.length > 5) {
        errors.shift();
      }
      localStorage.setItem('adsenseErrors', JSON.stringify(errors));
    };
    window.addEventListener('adsense-network-error', handleNetworkError);
    return () => {
      window.removeEventListener('adsense-network-error', handleNetworkError);
    };
  }, [position]);

  const handleAdClick = (adType, adId = null) => {
    const recentClicks = localStorage.getItem('recentAdClicks') || '[]';
    const clicks = JSON.parse(recentClicks);
    const newClick = {
      type: adType,
      timestamp: Date.now(),
      position,
      ad_id: adId
    };
    clicks.push(newClick);
    if (clicks.length > 20) {
      clicks.shift();
    }
    localStorage.setItem('recentAdClicks', JSON.stringify(clicks));
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
    if (analytics) {
      logEvent(analytics, 'ad_view', {
        ad_type: adType,
        position,
        ad_id: adId,
        user_id: user.id
      });
    }
  };

  if (networkError && bannerAds.length > 0) {
    return (
      <div onClick={() => handleAdClick('direct')} onLoad={() => handleAdView('direct')}>
        <AdsSlick ads={bannerAds} />
      </div>
    );
  }

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