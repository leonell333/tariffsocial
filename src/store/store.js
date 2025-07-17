import {applyMiddleware, combineReducers, compose, createStore} from 'redux';
import {thunk} from 'redux-thunk';

import baseReducer from './reducers/baseReducer';
import userReducer from './reducers/userReducer';
import chatReducer from './reducers/chatReducer';
import postReducer from './reducers/postReducer';
import colleagueReducer from './reducers/colleagueReducer';
import advertiseReducer from './reducers/advertiseReducer';

const initialState = {};
const middleware = [thunk];

const reducers = combineReducers({
    base: baseReducer,
    user: userReducer,
    chat: chatReducer,
    colleague: colleagueReducer,
    post: postReducer,
    advertise: advertiseReducer,
});

const composeEnhancers =
    typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
        : compose;

const enhancer = composeEnhancers(applyMiddleware(...middleware));
const store = createStore(reducers, initialState, enhancer);

export default store;
