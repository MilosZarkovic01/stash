import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { ListRow } from '../../src/ui/ListRow';
import { Screen } from '../../src/ui/Screen';
import { ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function AccountDetailScreen() {
  useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: api.accounts });
  const txs = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => api.transactions(id),
    enabled: Boolean(id),
  });
  const account = accounts.data?.find((row) => row.id === id);
  const [name, setName] = useState(account?.name ?? '');

  useEffect(() => {
    if (account) {
      setName(account.name);
    }
  }, [account]);

  const rename = useMutation({
    mutationFn: () => api.updateAccount(id, name),
    onSuccess: () => client.invalidateQueries({ queryKey: ['accounts'] }),
  });
  const remove = useMutation({
    mutationFn: () => api.deleteAccount(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    },
  });

  if (accounts.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (!account) {
    return (
      <Screen>
        <ErrorState message="Account not found" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={type.title}>{account.name}</Text>
      <Text style={type.heading}>
        {displayMoney(account.currentBalance, account.currency)}
      </Text>
      <Input label="Name" value={name} onChangeText={setName} />
      <Button label="Save name" onPress={() => rename.mutate()} />
      <Button label="Delete account" variant="secondary" onPress={() => remove.mutate()} />
      {remove.isError ? <Text style={type.muted}>{remove.error.message}</Text> : null}
      <Text style={type.heading}>Transactions</Text>
      {txs.data?.map((row) => (
        <ListRow
          key={row.id}
          title={row.description}
          subtitle={row.transactionDate}
          meta={displayMoney(row.amount, row.currency)}
          onPress={() => router.push(`/transaction/${row.id}` as Href)}
        />
      ))}
    </Screen>
  );
}
