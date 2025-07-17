import {UPDATE_COLLEAGUE_STORE} from '../types';

const initialState = {
  newColleagues: [],
  topFollowers: [],
  colleagues: [],
  lastColleague: null,
  lastColleagueVisible: false,
  followers: [],
  lastFollower: null,
  lastFollowerVisible: false,
  follows: [],
  lastFollow: null,
  lastFollowVisible: false,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_COLLEAGUE_STORE:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}