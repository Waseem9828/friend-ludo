import * as types from '../actionTypes';

const initialState = {
  data: {},
  loading: false,
  error: null
};

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case types.GET_DASHBOARD_REQUEST:
      return { ...state, loading: true, error: null };
    case types.GET_DASHBOARD_SUCCESS:
      return { ...state, loading: false, data: action.payload };
    case types.GET_DASHBOARD_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
