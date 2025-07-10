
import { UPDATE_CHAT_STORE, INITIAL_CHAT_STORE } from '../types';

const initialState = {
  selectedUsers: [],
  selectedUserId: "",
  unReadMessages: [],
  messages: [],
  lastMessage: null,
  lastMessageVisible: false,
  users: [],
  lastUser: null,
  lastUserVisible: false,
  searchUsers: [],
  lastSearchUser: null,
  lastSearchUserVisible: false,
  totalUserCount: 0,
  dms: [],
  lastDms: null,
  lastDmsVisible: false,
  dmsCount: 0,
  pendingDms: [],
  lastPendingDms: null,
  lastPendingDmsVisible: false,
  pendingDmsCount: 0,
  blocks: [],
  lastBlocks: null,
  lastBlocksVisible: false,
  selectedMessages: [],
  replyTo: null,
  forwardMessage: null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_CHAT_STORE:
      return {
        ...state,
        ...action.payload
      };
    case INITIAL_CHAT_STORE:
      return { ...initialState, };
    default:
      return state;
  }
}