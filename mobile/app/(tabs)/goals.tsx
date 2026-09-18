import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { ListRow } from '../../src/ui/ListRow';
import { Screen } from '../../src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

export default function GoalsScreen() {
  const client = useQueryClient();
  const goals = useQuery({ queryKey: ['goals'], queryFn: api.goals });
  const [name, setName] = useState('September');
  const [target, setTarget] = useState('500');
  const [currency, setCurrency] = useState<'RSD' | 'EUR'>('EUR');
  const now = new Date();
  const create = useMutation({
    mutationFn: () =>
      api.createGoal({
        name,
        target,
        currency,
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['goals'] }),
  });

  return (
    <Screen>
      <Text style={type.title}>Goals</Text>
      {goals.isLoading ? <LoadingState /> : null}
      {goals.isError ? <ErrorState message={goals.error.message} /> : null}
      {goals.data?.length === 0 ? (
        <EmptyState title="No savings goal" body="Set a monthly target to track remaining progress." />
      ) : null}
      {goals.data?.map((goal) => (
        <ListRow
          key={goal.id}
          title={goal.name}
          subtitle={`Progress ${displayMoney(goal.progress, goal.currency)} · remaining ${displayMoney(goal.remaining, goal.currency)}`}
          meta={displayMoney(goal.target, goal.currency)}
        />
      ))}
      <Text style={type.heading}>New monthly target</Text>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Target" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Input
        label="Currency (RSD or EUR)"
        value={currency}
        onChangeText={(value) => {
          if (value === 'RSD' || value === 'EUR') {
            setCurrency(value);
          }
        }}
        autoCapitalize="characters"
      />
      <Button label="Save goal" loading={create.isPending} onPress={() => create.mutate()} />
      {create.isError ? <Text style={type.muted}>{create.error.message}</Text> : null}
    </Screen>
  );
}
