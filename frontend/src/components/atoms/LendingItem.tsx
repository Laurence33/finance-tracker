import { Box } from '@mui/material';
import { Lending } from '@/types/Lending';
import { getLendingGroup } from '@/utils/lending-helpers';
import LedgerRow from '@/components/atoms/LedgerRow';
import Money from '@/components/atoms/Money';

/**
 * No per-row state label at all. Every lending renders inside a group card whose
 * header already names its state, and `LENDING_GROUPS` is exhaustive over
 * `LendingGroup`, so a row can never appear outside its own group — which is
 * precisely the case §4 says drop the label: "the same fact twice, paid for in
 * name width".
 *
 * What survives is the part the header cannot carry: a settled or partly-settled
 * lending recedes (`muted`), and an overdue one puts the urgency in its amount's
 * colour. Colour is free; a label costs the borrower's name up to ~87px.
 */
const OVERDUE_AMOUNT_COLOR = 'error.main';

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
      amountColor={group === 'overdue' ? OVERDUE_AMOUNT_COLOR : undefined}
      // Suppressed once settled: the Paid group header already says it, and
      // dropping it keeps the value rail narrower.
      secondaryValue={
        lending.totalPaid > 0 && !settled ? (
          <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
            <Money component="span" surface="inherit" amount={lending.totalPaid} />{' '}
            paid
          </Box>
        ) : undefined
      }
      onTap={() => onTap(lending)}
    />
  );
}
