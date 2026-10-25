import * as types from '../actionTypes';

const initialState = {
  settings: {},
  loading: false,
  error: null
};

export default function settingReducer(state = initialState, action) {
  switch (action.type) {
    case types.GET_SETTINGS_REQUEST:
    case types.ADD_SETTINGS_REQUEST:
      return { ...state, loading: true, error: null };
    case types.GET_SETTINGS_SUCCESS:
    case types.ADD_SETTINGS_SUCCESS:
      return { ...state, loading: false, settings: action.payload };
    case types.GET_SETTINGS_ERROR:
    case types.ADD_SETTINGS_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
