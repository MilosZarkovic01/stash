import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney } from '../../src/lib/format';
import { ListRow } from '../../src/ui/ListRow';
import { Screen } from '../../src/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

export default function InsightsScreen() {
  const insights = useQuery({ queryKey: ['insights'], queryFn: api.insights });

  if (insights.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (insights.isError) {
    return (
      <Screen>
        <ErrorState message={insights.error.message} />
      </Screen>
    );
  }
  const data = insights.data;
  if (!data?.spendingByCategory.length && !data?.topExpenses.length) {
    return (
      <Screen>
        <Text style={type.title}>Insights</Text>
        <EmptyState title="No spending yet" body="Expenses this month will show up here." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={type.title}>Insights</Text>
      <Text style={type.muted}>
        {data.month}/{data.year}
      </Text>
      <Text style={type.heading}>By category</Text>
      {data.spendingByCategory.map((row) => (
        <ListRow
          key={`${row.currency}-${row.category}`}
          title={row.category}
          subtitle={`${(Number(row.share) * 100).toFixed(0)}% of ${row.currency} spend`}
          meta={displayMoney(row.amount, row.currency)}
        />
      ))}
      <Text style={type.heading}>This month vs last</Text>
      {data.vsPreviousMonth.map((row) => (
        <ListRow
          key={row.category}
          title={row.category}
          subtitle={`Previous ${row.previous}`}
          meta={row.current}
        />
      ))}
      <Text style={type.heading}>Top expenses</Text>
      {data.topExpenses.map((row) => (
        <ListRow
          key={row.id}
          title={row.description}
          subtitle={`${row.category} · ${row.transactionDate}`}
          meta={displayMoney(row.amount, row.currency)}
        />
      ))}
      <Text style={type.heading}>Over time</Text>
      {data.spendingOverTime.map((row) => (
        <View key={`${row.currency}-${row.date}`}>
          <ListRow
            title={row.date}
            subtitle={row.currency}
            meta={displayMoney(row.amount, row.currency)}
          />
        </View>
      ))}
    </Screen>
  );
}
