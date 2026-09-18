import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function TransactionDetailScreen() {
  useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const txs = useQuery({ queryKey: ['transactions'], queryFn: () => api.transactions() });
  const row = txs.data?.find((item) => item.id === id);
  const [description, setDescription] = useState(row?.description ?? '');
  const [amount, setAmount] = useState(row?.amount ?? '');

  useEffect(() => {
    if (row) {
      setDescription(row.description);
      setAmount(row.amount);
    }
  }, [row]);

  const update = useMutation({
    mutationFn: () => api.updateTransaction(id, { description, amount }),
    onSuccess: () => {
      void client.invalidateQueries();
      router.back();
    },
  });
  const remove = useMutation({
    mutationFn: () => api.deleteTransaction(id),
    onSuccess: () => {
      void client.invalidateQueries();
      router.back();
    },
  });

  if (txs.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (!row) {
    return (
      <Screen>
        <ErrorState message="Transaction not found" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={type.title}>{row.type}</Text>
      <Text style={type.muted}>{row.transactionDate}</Text>
      <Input label="Description" value={description} onChangeText={setDescription} />
      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      {update.isError ? <Text style={type.muted}>{update.error.message}</Text> : null}
      <Button label="Save" loading={update.isPending} onPress={() => update.mutate()} />
      <Button label="Delete" variant="secondary" onPress={() => remove.mutate()} />
    </Screen>
  );
}
