import { useQuery } from '@tanstack/react-query';
import { Href, Link, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { api } from '../../src/lib/api';
import { displayMoney } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { Screen } from '../../src/ui/Screen';
import { ErrorState, LoadingState } from '../../src/ui/states';
import { type } from '../../src/ui/theme';

export default function HomeScreen() {
  const router = useRouter();
  const status = useQuery({ queryKey: ['status'], queryFn: api.status });

  if (status.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (status.isError) {
    return (
      <Screen>
        <ErrorState message={status.error.message} />
      </Screen>
    );
  }

  const data = status.data;
  if (!data) {
    return (
      <Screen>
        <ErrorState message="No financial status yet" />
      </Screen>
    );
  }
  return (
    <Screen>
      <Text style={type.title}>Home</Text>
      <Text style={type.muted}>
        {data.month}/{data.year} · guidance, not a guarantee
      </Text>
      {data.balances.map((row) => (
        <View key={row.currency}>
          <Text style={type.caption}>Balance {row.currency}</Text>
          <Text style={type.heading}>{displayMoney(row.total, row.currency)}</Text>
        </View>
      ))}
      {data.currencies.map((row) => (
        <View key={row.currency} style={{ gap: 4 }}>
          <Text style={type.heading}>{row.currency} this month</Text>
          <Text style={type.body}>Income {displayMoney(row.income, row.currency)}</Text>
          <Text style={type.body}>Expenses {displayMoney(row.expenses, row.currency)}</Text>
          <Text style={type.body}>
            Recurring due {displayMoney(row.expectedRecurring, row.currency)}
          </Text>
          <Text style={type.body}>
            Savings target {displayMoney(row.savingsTarget, row.currency)}
          </Text>
          <Text style={type.body}>
            Flexible {displayMoney(row.flexibleSpending, row.currency)}
          </Text>
          <Text style={type.muted}>
            ≈ {displayMoney(row.dailyAllowance, row.currency)} / day · {row.remainingDays} days left
          </Text>
        </View>
      ))}
      <Button label="Add expense" onPress={() => router.push('/transaction/new' as Href)} />
      <Link href={'/accounts' as Href} asChild>
        <Pressable accessibilityRole="button">
          <Text style={type.body}>Accounts</Text>
        </Pressable>
      </Link>
      <Link href={'/recurring' as Href} asChild>
        <Pressable accessibilityRole="button">
          <Text style={type.body}>Recurring expenses</Text>
        </Pressable>
      </Link>
      <Link href={'/settings' as Href} asChild>
        <Pressable accessibilityRole="button">
          <Text style={type.body}>Profile / Settings</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
