import { UPDATE_POST_STORE } from '../types';

const initialState = {
  keyword: '',
  posts: [],
  lastPost: null,
  lastPostVisible: false,
  userPosts: [],
  lastUserPost: null,
  lastUserPostVisible: false,
  sponsored: [],
  lastSponsored: null,
  lastSponsoredVisible : false,
  bannerAds: [],
  hashtags: [],
  myPosts: false,
  sort: 'recent',
  selectedTags: [],
  searchPosts: [],
  lastSearchPost: null,
  lastSearchPostVisible: false,
  isSearchMode: false,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_POST_STORE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}