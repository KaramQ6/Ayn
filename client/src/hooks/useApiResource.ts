import { useCallback, useEffect, useReducer, useState } from 'react';
import { apiGet } from '../lib/api';

type ResourceState<T> = {
  data: T;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
};

type InternalState<T> = Omit<ResourceState<T>, 'refetch'>;

type ResourceAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'error'; error: string };

function resourceReducer<T>(state: InternalState<T>, action: ResourceAction<T>): InternalState<T> {
  switch (action.type) {
    case 'start':
      return { ...state, error: null, isLoading: true };
    case 'success':
      return { data: action.data, error: null, isLoading: false };
    case 'error':
      return { ...state, error: action.error, isLoading: false };
    default:
      return state;
  }
}

export function useApiResource<T>(path: string, initialData: T): ResourceState<T> {
  const [state, dispatch] = useReducer(resourceReducer<T>, {
    data: initialData,
    error: null,
    isLoading: true,
  });
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => {
    dispatch({ type: 'start' });
    setRequestVersion(version => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'start' });

    apiGet<T>(path, controller.signal)
      .then(data => dispatch({ type: 'success', data }))
      .catch(errorValue => {
        if (!controller.signal.aborted) {
          dispatch({
            type: 'error',
            error: errorValue instanceof Error ? errorValue.message : 'Request failed',
          });
        }
      });

    return () => controller.abort();
  }, [path, requestVersion]);

  return { ...state, refetch };
}
