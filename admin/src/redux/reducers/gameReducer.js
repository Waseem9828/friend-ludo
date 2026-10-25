import * as types from '../actionTypes';

const initialState = {
  holdGames: [],
  resolvedGames: [],
  totalGames: [],
  loading: false,
  error: null
};

export default function gameReducer(state = initialState, action) {
  switch (action.type) {
    case types.GET_HOLD_GAMES_REQUEST:
    case types.GET_RESOLVED_GAMES_REQUEST:
    case types.GET_TOTAL_GAMES_REQUEST:
      return { ...state, loading: true, error: null };
    case types.GET_HOLD_GAMES_SUCCESS:
      return { ...state, loading: false, holdGames: action.payload };
    case types.GET_RESOLVED_GAMES_SUCCESS:
      return { ...state, loading: false, resolvedGames: action.payload };
    case types.GET_TOTAL_GAMES_SUCCESS:
      return { ...state, loading: false, totalGames: action.payload };
    case types.GET_HOLD_GAMES_ERROR:
    case types.GET_RESOLVED_GAMES_ERROR:
    case types.GET_TOTAL_GAMES_ERROR:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}
