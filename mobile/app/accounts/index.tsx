import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
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

import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function AccountsScreen() {
  useRequireAuth();
  const router = useRouter();
  const client = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: api.accounts });
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'RSD' | 'EUR'>('RSD');
  const [initialBalance, setInitialBalance] = useState('0');
  const create = useMutation({
    mutationFn: () => api.createAccount({ name, currency, initialBalance }),
    onSuccess: () => {
      setName('');
      void client.invalidateQueries({ queryKey: ['accounts'] });
      void client.invalidateQueries({ queryKey: ['status'] });
    },
  });

  return (
    <Screen>
      <Text style={type.title}>Accounts</Text>
      {accounts.isLoading ? <LoadingState /> : null}
      {accounts.isError ? <ErrorState message={accounts.error.message} /> : null}
      {accounts.data?.length === 0 ? (
        <EmptyState title="No accounts" body="Create an RSD or EUR account to start tracking." />
      ) : null}
      {accounts.data?.map((account) => (
        <ListRow
          key={account.id}
          title={account.name}
          subtitle={account.currency}
          meta={displayMoney(account.currentBalance, account.currency)}
          onPress={() => router.push(`/accounts/${account.id}` as Href)}
        />
      ))}
      <Text style={type.heading}>New account</Text>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input
        label="Currency (RSD or EUR)"
        value={currency}
        autoCapitalize="characters"
        onChangeText={(value) => {
          if (value === 'RSD' || value === 'EUR') {
            setCurrency(value);
          }
        }}
      />
      <Input
        label="Initial balance"
        value={initialBalance}
        onChangeText={setInitialBalance}
        keyboardType="decimal-pad"
      />
      <Button label="Create account" loading={create.isPending} onPress={() => create.mutate()} />
      {create.isError ? <Text style={type.muted}>{create.error.message}</Text> : null}
    </Screen>
  );
}
