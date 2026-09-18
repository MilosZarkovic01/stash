import { useQuery } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { ListRow } from '../../src/ui/ListRow';
import { Screen } from '../../src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

export default function ActivityScreen() {
  const router = useRouter();
  const txs = useQuery({ queryKey: ['transactions'], queryFn: () => api.transactions() });

  return (
    <Screen>
      <Text style={type.title}>Activity</Text>
      <Button label="Add" onPress={() => router.push('/transaction/new' as Href)} />
      {txs.isLoading ? <LoadingState /> : null}
      {txs.isError ? <ErrorState message={txs.error.message} /> : null}
      {txs.data?.length === 0 ? (
        <EmptyState title="No transactions" body="Add an expense, income, or transfer." />
      ) : null}
      {txs.data?.map((row) => (
        <ListRow
          key={row.id}
          title={row.description}
          subtitle={`${row.type} · ${row.transactionDate}`}
          meta={displayMoney(row.amount, row.currency)}
          onPress={() => router.push(`/transaction/${row.id}` as Href)}
        />
      ))}
    </Screen>
  );
}
