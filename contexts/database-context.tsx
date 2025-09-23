import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Database, openDatabase } from '@/lib/database';

const DatabaseContext = createContext<Database | null>(null);

export function DatabaseProvider({ children }: PropsWithChildren): JSX.Element {
  const [database, setDatabase] = useState<Database | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const db = await openDatabase();
        if (isMounted) {
          setDatabase(db);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text accessibilityRole="alert">Não foi possível carregar os dados locais.</Text>
      </View>
    );
  }

  if (!database) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): Database {
  const db = useContext(DatabaseContext);

  if (!db) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }

  return db;
}
