import React, {createContext, useContext, useReducer, useEffect} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const ActivitiesContext = createContext();

const FETCH_START = 'FETCH_START';
const FETCH_SUCCESS = 'FETCH_SUCCESS';
const ADD_ACTIVITY = 'ADD_ACTIVITY';
const REMOVE_ACTIVITY = 'REMOVE_ACTIVITY';

const reducer = (state, action) => {
  switch (action.type) {
    case FETCH_START:
      return {...state, loading: true};
    case FETCH_SUCCESS:
      return {...state, loading: false, activities: action.activities || []};
    case ADD_ACTIVITY:
      return {...state, activities: [...state.activities, action.activity]};
    case REMOVE_ACTIVITY:
      return {...state, activities: state.activities.filter(a => a.id !== action.id)};
    default:
      return state;
  }
};

export const ActivitiesProvider = ({children}) => {
  const [savedActivities, setSavedActivities] = usePersistedState('activities', []);
  const initialState = {activities: savedActivities, loading: false};
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    setSavedActivities(state.activities);
  }, [state.activities, setSavedActivities]);

  const fetchActivities = async () => {
    dispatch({type: FETCH_START});
    try {
      // TODO: API call
      const data = [];
      dispatch({type: FETCH_SUCCESS, activities: data});
    } catch (e) {
      dispatch({type: FETCH_SUCCESS, activities: []});
    }
  };

  const createActivity = async activity => {
    // TODO: API call
    dispatch({type: ADD_ACTIVITY, activity});
  };

  const removeActivity = id => dispatch({type: REMOVE_ACTIVITY, id});

  return (
    <ActivitiesContext.Provider value={{...state, fetchActivities, createActivity, removeActivity}}>
      {children}
    </ActivitiesContext.Provider>
  );
};

export const useActivitiesContext = () => useContext(ActivitiesContext);
