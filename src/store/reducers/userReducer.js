import { UPDATE_USER_STORE, SET_AUTHENTICATED, SET_UNAUTHENTICATED, LOADING_USER, } from '../types';

const initialState = {
  admin: false,
  authenticated: false,
  role: null,
  isVerified: false,
  id: "",
  email: '',
  username: '',
  photoUrl: '',
  country: null,
  information: "",
  description: "",
  skills: [],
  services: [],
  tags: [],
  colleagueCount: 0,
  followCount: 0,
  follows: [],
  followerCount: 0,
  postCount: 0,
  adCount: 0,
  sponsoreCount: 0,
  imageUpdated: 0,
  selectedUser: null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_AUTHENTICATED:
      return {
        ...state,
        authenticated: true
      };
    case SET_UNAUTHENTICATED:
      return { ...initialState, authenticated: false, };
      
    case UPDATE_USER_STORE:
      return {
        ...state,
        ...action.payload,
        authenticated: true,
      };
    case LOADING_USER:
      return {
        ...state,
      };
    default:
      return state;
  }
}
