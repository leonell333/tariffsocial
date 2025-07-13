import React, { useEffect, useState } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../firebase';

const ADSENSE_SLOT = 'ca-pub-4897128497430688';
const AD_SLOT_ID = "1602364811";

const AdSlot = () => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'ad_view', { 
        type: 'adsense',
        ad_slot: AD_SLOT_ID,
        ad_client: ADSENSE_SLOT
      });
    }

    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.setAttribute('data-ad-client', ADSENSE_SLOT);
      script.onerror = () => {
        console.warn('AdSense script failed to load');
        setAdError(true);
      };
      
      script.onload = () => {
        setAdLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setAdLoaded(true);
    }

    const timeout = setTimeout(() => {
      if (!adLoaded && !adError) {
        console.warn('AdSense loading timeout - ads may not display immediately');
        setAdError(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [adLoaded, adError]);

  useEffect(() => {
    if (adLoaded && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (error) {
        console.warn('Error pushing AdSense ads:', error);
        setAdError(true);
      }
    }
  }, [adLoaded]);

  const handleAdClick = () => {
    if (analytics) {
      logEvent(analytics, 'ad_click', { 
        type: 'adsense',
        ad_slot: AD_SLOT_ID,
        ad_client: ADSENSE_SLOT
      });
    }
  };

  return (
    <div className="w-full flex justify-center mb-2" onClick={handleAdClick}>
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={ADSENSE_SLOT}
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSlot;