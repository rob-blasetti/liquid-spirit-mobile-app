import React, {createContext, useContext, useReducer, useEffect} from 'react';
import usePersistedState from '../hooks/usePersistedState';

const EventsContext = createContext();

const FETCH_START = 'FETCH_START';
const FETCH_SUCCESS = 'FETCH_SUCCESS';
const ADD_EVENT = 'ADD_EVENT';
const REMOVE_EVENT = 'REMOVE_EVENT';

const reducer = (state, action) => {
  switch (action.type) {
    case FETCH_START:
      return {...state, loading: true};
    case FETCH_SUCCESS:
      return {...state, loading: false, events: action.events || []};
    case ADD_EVENT:
      return {...state, events: [...state.events, action.event]};
    case REMOVE_EVENT:
      return {...state, events: state.events.filter(e => e.id !== action.id)};
    default:
      return state;
  }
};

export const EventsProvider = ({children}) => {
  const [savedEvents, setSavedEvents] = usePersistedState('events', []);
  const initialState = {events: savedEvents, loading: false};
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    setSavedEvents(state.events);
  }, [state.events, setSavedEvents]);

  const fetchEvents = async () => {
    dispatch({type: FETCH_START});
    try {
      // TODO: API call
      const data = [];
      dispatch({type: FETCH_SUCCESS, events: data});
    } catch (e) {
      dispatch({type: FETCH_SUCCESS, events: []});
    }
  };

  const createEvent = async event => {
    // TODO: API call
    dispatch({type: ADD_EVENT, event});
  };

  const removeEvent = id => dispatch({type: REMOVE_EVENT, id});

  return (
    <EventsContext.Provider value={{...state, fetchEvents, createEvent, removeEvent}}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEventsContext = () => useContext(EventsContext);
