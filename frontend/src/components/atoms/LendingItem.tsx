import { Box } from '@mui/material';
import { Lending } from '@/types/Lending';
import { LendingGroup, getLendingGroup } from '@/utils/lending-helpers';
import LedgerRow from '@/components/atoms/LedgerRow';
import Money from '@/components/atoms/Money';

/**
 * Exception labels, deliberately short. They sit in the row's value rail, which
 * is `flexShrink: 0` — its widest child sets the rail's width, so every extra
 * character here is taken straight out of the borrower's name. `PARTIALLY PAID`
 * would cost ~87px against `PARTIAL`'s ~48px.
 *
 * `active` is absent on purpose: it is the majority state, so it gets no badge
 * at all (§4). The group header already names it.
 */
const EXCEPTION: Partial<
  Record<LendingGroup, { label: string; color: string }>
> = {
  overdue: { label: 'Overdue', color: 'error.main' },
  partially_paid: { label: 'Partial', color: 'text.disabled' },
  paid: { label: 'Paid', color: 'text.disabled' },
};

/**
 * Binds a lending to the shared ledger row. All the vocabulary — which state is
 * an exception, how it is coloured, what the meta line says — lives here;
 * `LedgerRow` knows none of it.
 *
 * Deliberately has no row-level action icons: three of them cost ~83px of a
 * ~326px budget and left the borrower's name ~85px. Pay, edit and delete live
 * in `LendingDetailDialog`'s title bar instead (§2, "Row actions").
 */
export default function LendingItem({
  lending,
  onTap,
}: {
  lending: Lending;
  onTap: (lending: Lending) => void;
}) {
  const group = getLendingGroup(lending);
  const settled = lending.status === 'paid';
  // Overdue is urgent, so it keeps full contrast; a partial or settled lending
  // recedes instead.
  const muted = group === 'partially_paid' || group === 'paid';

  return (
    <LedgerRow
      name={lending.borrower}
      meta={`Due ${new Date(lending.promisedDate).toLocaleDateString()} · ${lending.fundSource}`}
      muted={muted}
      amount={lending.amount}
      // Suppressed once settled: the amount and the `PAID` label already say it,
      // and dropping it keeps the value rail narrower.
      secondaryValue={
        lending.totalPaid > 0 && !settled ? (
          <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
            <Money component="span" amount={lending.totalPaid} /> paid
          </Box>
        ) : undefined
      }
      exception={EXCEPTION[group]}
      onTap={() => onTap(lending)}
    />
  );
}
