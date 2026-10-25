import * as types from '../actionTypes';

const initialState = {
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case types.ADMIN_LOGIN_REQUEST:
      return { ...state, loading: true, error: null };
    case types.ADMIN_LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token || action.payload);
      localStorage.setItem('isAuthenticated', 'true');
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        token: action.payload.token || action.payload,
        user: action.payload.user || null
      };
    case types.ADMIN_LOGIN_ERROR:
      return { ...state, loading: false, error: action.payload };
    case types.LOGOUT_REQUEST:
    case types.AUTOMATIC_LOGOUT_REQUEST:
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      return { ...state, token: null, isAuthenticated: false, user: null, loading: false };
    default:
      return state;
  }
}
