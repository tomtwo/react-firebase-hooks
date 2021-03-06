import { firestore } from 'firebase';
import { useEffect } from 'react';
import { snapshotToData } from './helpers';
import { LoadingHook, useIsEqualRef, useLoadingValue } from '../util';

export type CollectionHook = LoadingHook<firestore.QuerySnapshot, Error>;
export type CollectionDataHook<T> = LoadingHook<T[], Error>;

export const useCollection = (
  query?: firestore.Query | null,
  options?: {
    snapshotListenOptions?: firestore.SnapshotListenOptions;
  }
): CollectionHook => {
  const { error, loading, reset, setError, setValue, value } = useLoadingValue<
    firestore.QuerySnapshot,
    Error
  >();
  const ref = useIsEqualRef(query, reset);

  useEffect(
    () => {
      if (!ref.current) {
        setValue(undefined);
        return;
      }
      const listener =
        options && options.snapshotListenOptions
          ? ref.current.onSnapshot(
              options.snapshotListenOptions,
              setValue,
              setError
            )
          : ref.current.onSnapshot(setValue, setError);

      return () => {
        listener();
      };
    },
    [ref.current]
  );

  return [value, loading, error];
};

export const useCollectionData = <T>(
  query?: firestore.Query | null,
  options?: {
    idField?: string;
    snapshotListenOptions?: firestore.SnapshotListenOptions;
  }
): CollectionDataHook<T> => {
  const idField = options ? options.idField : undefined;
  const snapshotListenOptions = options
    ? options.snapshotListenOptions
    : undefined;
  const [value, loading, error] = useCollection(query, {
    snapshotListenOptions,
  });
  return [
    (value
      ? value.docs.map(doc => snapshotToData(doc, idField))
      : undefined) as T[],
    loading,
    error,
  ];
};
