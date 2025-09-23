import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onPressAction,
}: EmptyStateProps): JSX.Element {
  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {description ? <ThemedText style={styles.description}>{description}</ThemedText> : null}
      {actionLabel && onPressAction ? (
        <Button label={actionLabel} variant="primary" onPress={onPressAction} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
  },
});
