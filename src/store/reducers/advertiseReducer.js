import { UPDATE_ADVERTISE_STORE } from '../types';

const initialState = {
  bannerAds: [],
  lastBannerAd: null,
  lastBannerAdVisible: false,
  sponsoredAds: [],
  lastSponsoredAd: null,
  lastSponsoredAdVisible: false,
  paymentId: null,
  paymentType: null,
  paymentAd: null,
  selectedBannerAd: null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_ADVERTISE_STORE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}