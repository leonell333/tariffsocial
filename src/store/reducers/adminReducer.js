import { UPDATE_ADMIN_STORE } from '../types';

const initialState = {
    user: [],
    lastUser: null,
    lastUserVisible: false,
    totalUser: 0,
    post: [],
    lastPost: null,
    lastPostVisible: false,
    totalPost: 0,
    advertise: [],
    lastAd: null,
    adsPagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
    totalAd: 0,
    sponsored: [],
    lastSponsored: null,
    lastSponsoredVisible: false,
    totalSponsored: 0,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0,
    },
};

export default function adminReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_ADMIN_STORE:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}