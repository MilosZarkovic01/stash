import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api } from '../../src/lib/api';
import { todayIsoDate } from '../../src/lib/format';
import { Button } from '../../src/ui/Button';
import { Input } from '../../src/ui/Input';
import { Screen } from '../../src/ui/Screen';
import { type as textStyle } from '../../src/ui/theme';

import { useRequireAuth } from '../../src/lib/use-require-auth';

export default function NewTransactionScreen() {
  useRequireAuth();
  const router = useRouter();
  const client = useQueryClient();
  const accounts = useQuery({ queryKey: ['accounts'], queryFn: api.accounts });
  const categories = useQuery({ queryKey: ['categories'], queryFn: api.categories });
  const [txType, setTxType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [nl, setNl] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.data?.find((row) => row.id === (accountId || accounts.data[0]?.id)),
    [accounts.data, accountId],
  );
  const resolvedAccountId = selectedAccount?.id ?? '';

  const save = useMutation({
    mutationFn: () =>
      api.createTransaction({
        type: txType,
        amount,
        currency: selectedAccount?.currency,
        description,
        categoryId: txType === 'TRANSFER' ? undefined : categoryId || undefined,
        accountId: resolvedAccountId,
        destinationAccountId: txType === 'TRANSFER' ? destinationAccountId : undefined,
        transactionDate: date,
      }),
    onSuccess: () => {
      void client.invalidateQueries();
      router.back();
    },
    onError: (err: Error) => setError(err.message),
  });

  async function parseNl() {
    setError(null);
    const parsed = await api.parseExpense(nl);
    if (parsed.amount) {
      setAmount(parsed.amount);
    }
    setDescription(parsed.description);
    const match = categories.data?.find((row) => row.slug === parsed.category);
    if (match) {
      setCategoryId(match.id);
    }
    setConfidence(parsed.confidence);
    setTxType('EXPENSE');
  }

  return (
    <Screen>
      <Text style={textStyle.title}>Add</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((item) => (
          <Pressable key={item} onPress={() => setTxType(item)} accessibilityRole="button">
            <Text style={[textStyle.body, txType === item && { fontWeight: '700' }]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      {txType === 'EXPENSE' ? (
        <>
          <Input label="Fast entry" placeholder="1200 taxi do grada" value={nl} onChangeText={setNl} />
          <Button label="Parse" variant="secondary" onPress={() => void parseNl()} />
          {confidence !== null ? (
            <Text style={textStyle.muted}>
              Suggested category confidence {confidence < 0.6 ? 'low — confirm or pick' : confidence.toFixed(2)}
            </Text>
          ) : null}
        </>
      ) : null}
      <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Input label="Description" value={description} onChangeText={setDescription} />
      <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <Text style={textStyle.caption}>Account</Text>
      {accounts.data?.map((account) => (
        <Pressable key={account.id} onPress={() => setAccountId(account.id)} accessibilityRole="button">
          <Text style={[textStyle.body, resolvedAccountId === account.id && { fontWeight: '700' }]}>
            {account.name} ({account.currency})
          </Text>
        </Pressable>
      ))}
      {txType === 'TRANSFER' ? (
        <>
          <Text style={textStyle.caption}>Destination</Text>
          {accounts.data?.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => setDestinationAccountId(account.id)}
              accessibilityRole="button"
            >
              <Text style={[textStyle.body, destinationAccountId === account.id && { fontWeight: '700' }]}>
                {account.name}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
      {txType !== 'TRANSFER' ? (
        <>
          <Text style={textStyle.caption}>Category</Text>
          {categories.data?.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              accessibilityRole="button"
            >
              <Text style={[textStyle.body, categoryId === category.id && { fontWeight: '700' }]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
      {error ? <Text style={textStyle.muted}>{error}</Text> : null}
      <Button label="Save" loading={save.isPending} onPress={() => save.mutate()} />
    </Screen>
  );
}
