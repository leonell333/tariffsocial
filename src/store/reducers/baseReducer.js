import { UPDATE_BASE_STORE, } from '../types';

const initialState = {
  loading: false,
  messageModal: false,
  tags: [],
  unReadMessagesCount: 0,
  unReadNotificationCount: 0,
  unReadNotifications: [],

  notifications: [],
  lastNotification: null,
  lastNotificationVisible: false,
  bannerAdsModal: false,
  sponsoredModal: false,
  sponsoredUpdateModal: false,
  paymentModal: false,
  paymentData: {},
  numberOfaffilliations: 0,
  captureCamera: false,
  capturedImage: "",
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_BASE_STORE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}