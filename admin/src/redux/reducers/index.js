import { combineReducers } from 'redux';
import authReducer from './authReducer';
import dashboardReducer from './dashboardReducer';
import userReducer from './userReducer';
import gameReducer from './gameReducer';
import settingReducer from './settingReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  users: userReducer,
  games: gameReducer,
  settings: settingReducer
});

export default rootReducer;
