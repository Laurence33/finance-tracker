import { RecurringExpense } from '@/types/RecurringExpense';
import { getRecurringAmount } from '@/utils/recurring-helpers';
import LedgerRow from '@/components/atoms/LedgerRow';

const STATUS_LABEL: Record<RecurringExpense['status'], string> = {
  active: '',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Binds a recurring expense to the shared ledger row. All the vocabulary —
 * which status counts as an exception, how it is coloured, what the meta line
 * says — lives here; `LedgerRow` knows none of it.
 */
export default function RecurringExpenseItem({
  recurringExpense,
  onTap,
}: {
  recurringExpense: RecurringExpense;
  onTap: (re: RecurringExpense) => void;
}) {
  const isActive = recurringExpense.status === 'active';
  const statusLabel = STATUS_LABEL[recurringExpense.status];

  return (
    <LedgerRow
      name={recurringExpense.displayName}
      meta={recurringExpense.tags.join(' · ')}
      muted={!isActive}
      amount={getRecurringAmount(recurringExpense)}
      exception={
        statusLabel
          ? {
              label: statusLabel,
              color:
                recurringExpense.status === 'cancelled'
                  ? 'error.main'
                  : 'text.disabled',
            }
          : undefined
      }
      onTap={() => onTap(recurringExpense)}
    />
  );
}
