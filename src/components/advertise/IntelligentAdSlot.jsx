
import React, {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {logEvent} from 'firebase/analytics';
import {analytics} from '../../firebase';
import AdsSlick from './adsSlick';
import AdSlot from './AdSlot';

const IntelligentAdSlot = ({ position = 'main' }) => {
  const user = useSelector(state => state.user);
  const { bannerAds } = useSelector(state => state.post);
  const [adType, setAdType] = useState('direct');
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const selectAdType = () => {
      let shouldShowDirect = true;
      if (bannerAds.length === 0) {
        shouldShowDirect = false;
      }
      if (Math.random() < 0.1) {
        shouldShowDirect = false;
      }
      setAdType(shouldShowDirect ? 'direct' : 'adsense');
      if (analytics) {
        logEvent(analytics, 'ad_type_selected', {
          position,
          ad_type: shouldShowDirect ? 'direct' : 'adsense',
          user_id: user.id,
          direct_ads_available: bannerAds.length
        });
      }
    };
    selectAdType();
  }, [bannerAds.length, user.id, position]);

  useEffect(() => {
    const handleNetworkError = () => {
      setNetworkError(true);
    };
    window.addEventListener('adsense-network-error', handleNetworkError);
    return () => {
      window.removeEventListener('adsense-network-error', handleNetworkError);
    };
  }, [position]);

  const handleAdClick = (adType, adId = null) => {
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