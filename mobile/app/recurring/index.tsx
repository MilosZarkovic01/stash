import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney, todayIsoDate } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { ListRow } from '../../src/ui/ListRow';
import { Screen } from '../../src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function RecurringScreen() {
  useRequireAuth();
  const client = useQueryClient();
  const recurrences = useQuery({ queryKey: ['recurring'], queryFn: api.recurring });
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: api.accounts });
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const [name, setName] = useState('Rent');
  const [amount, setAmount] = useState('');
  const accountId = accounts.data?.[0]?.id ?? '';
  const categoryId =
    categories.data?.find((row) => row.slug === 'rent')?.id ??
    categories.data?.[0]?.id ??
    '';
  const currency = accounts.data?.[0]?.currency ?? 'RSD';

  const create = useMutation({
    mutationFn: () =>
      api.createRecurring({
        name,
        amount,
        currency,
        accountId,
        categoryId,
        nextOccurrence: todayIsoDate(),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['recurring'] }),
  });
  const generate = useMutation({
    mutationFn: api.generateRecurring,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['recurring'] });
      void client.invalidateQueries({ queryKey: ['transactions'] });
      void client.invalidateQueries({ queryKey: ['status'] });
    },
  });

  return (
    <Screen>
      <Text style={type.title}>Recurring</Text>
      <Text style={type.muted}>Monthly obligations used in expected spending.</Text>
      {recurrences.isLoading ? <LoadingState /> : null}
      {recurrences.isError ? <ErrorState message={recurrences.error.message} /> : null}
      {recurrences.data?.length === 0 ? (
        <EmptyState title="None yet" body="Add rent, internet, or subscriptions." />
      ) : null}
      {recurrences.data?.map((row) => (
        <ListRow
          key={row.id}
          title={`${row.name}${row.active ? '' : ' (inactive)'}`}
          subtitle={`Next ${row.nextOccurrence}`}
          meta={displayMoney(row.amount, row.currency)}
          onPress={() => {
            void api.deactivateRecurring(row.id).then(() =>
              client.invalidateQueries({ queryKey: ['recurring'] }),
            );
          }}
        />
      ))}
      <Text style={type.heading}>New monthly item</Text>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Button
        label="Add"
        loading={create.isPending}
        onPress={() => create.mutate()}
        disabled={!accountId || !categoryId}
      />
      {create.isError ? <Text style={type.muted}>{create.error.message}</Text> : null}
      <Button
        label="Generate due expenses"
        variant="secondary"
        loading={generate.isPending}
        onPress={() => generate.mutate()}
      />
    </Screen>
  );
}
