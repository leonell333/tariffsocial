import React, { useEffect, useState, useRef } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../firebase';

const ADSENSE_SLOT = 'ca-pub-4897128497430688';
const AD_SLOT_ID = "1602364811";

const AdSlot = () => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adRendered, setAdRendered] = useState(false);
  const adRef = useRef(null);

  const dispatchErrorEvent = () => {
    const event = new CustomEvent('adsense-network-error', {
      detail: {
        timestamp: Date.now(),
        adSlot: AD_SLOT_ID,
        adClient: ADSENSE_SLOT
      }
    });
    window.dispatchEvent(event);
  };

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
        dispatchErrorEvent();
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
        dispatchErrorEvent();
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [adLoaded, adError]);

  useEffect(() => {
    if (adLoaded && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
        
        // Check if ad actually rendered after a delay
        const renderTimeout = setTimeout(() => {
          if (adRef.current) {
            const adElement = adRef.current;
            const hasContent = adElement.children.length > 0 || 
                              adElement.innerHTML.trim().length > 0 ||
                              adElement.offsetHeight > 0;
            
            if (!hasContent) {
              console.warn('AdSense ad failed to render content');
              setAdError(true);
              dispatchErrorEvent();
            } else {
              setAdRendered(true);
            }
          }
        }, 5000); // Wait 5 seconds for ad to render

        return () => clearTimeout(renderTimeout);
      } catch (error) {
        console.warn('Error pushing AdSense ads:', error);
        setAdError(true);
        dispatchErrorEvent();
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

  if (adError) {
    return null;
  }

  return (
    <div className="w-full max-h-[220px] flex justify-center mb-2 bg-white rounded-xl" onClick={handleAdClick}>
      <ins 
        ref={adRef}
        className="adsbygoogle"
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