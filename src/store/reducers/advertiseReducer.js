import { UPDATE_ADVERTISE_STORE } from '../types';

const initialState = {
  bannerAds: [],
  myAds: [],
  lastAd: null,
  lastAdVisible: false,
  // Add more fields as needed for ad management
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
