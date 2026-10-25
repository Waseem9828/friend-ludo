import * as types from '../actionTypes';

const initialState = {
  users: [],
  selectedUser: null,
  totalUsers: 0,
  loading: false,
  error: null
};

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case types.GET_CUSTOMERS_REQUEST:
    case types.GET_USER_DETAILS_REQUEST:
      return { ...state, loading: true, error: null };
    case types.GET_CUSTOMERS_SUCCESS:
      return {
        ...state,
        loading: false,
        users: action.payload.users || action.payload,
        totalUsers: action.payload.total || (action.payload.users ? action.payload.users.length : 0)
      };
    case types.GET_USER_DETAILS_SUCCESS:
      return { ...state, loading: false, selectedUser: action.payload };
    case types.GET_CUSTOMERS_ERROR:
    case types.GET_USER_DETAILS_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
