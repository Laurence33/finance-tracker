import { IconButton, Stack } from '@mui/material';
import { MdDelete, MdEdit } from 'react-icons/md';
import { FundSource } from '@/types/FundSource';
import LedgerRow from '@/components/atoms/LedgerRow';

/**
 * Binds a fund source to the shared ledger row (§2 of `docs/ui-patterns.md`).
 * All the vocabulary lives here: what a negative balance means, and what the
 * supporting line says.
 *
 * **A negative balance is signed and coloured, never a bare negative number.**
 * `Money` formats with `toLocaleString()`, so `amount={-7350}` would render
 * `₱-7,350` with the glyph ahead of the minus (§3). The absolute value plus
 * `sign="-"` and `amountColor` is the treatment, and it is the only per-row
 * marking a card in debt gets — `FundSourceList`'s `Credit cards` header
 * already names the kind, so a `OWED` label in the value rail would be the same
 * fact twice, paid for in name width (§4).
 *
 * The kind is deliberately absent from the row: `FundSourceList` hoists it into
 * the group header, which is what pays for the action icons below.
 *
 * No leading avatar. `ExpenseIcon` keys off the fund source's *identifier*
 * (`bdo-savings`, `bpi-credit`) against a three-entry map, so on a real wallet
 * almost every row falls to the identical grey default — 40px plus a 12px gap
 * of fixed-width sibling hoisting nothing out of the name (§1). Measured at
 * 390px, dropping it takes the worst-case name column from 118px to 170px and
 * three of seven rows from 83px back to 63px — the avatar is what pushed those
 * names onto a second line. 170px is what lets the icons stay in `trailing`
 * rather than moving into a detail dialog the way the lendings row had to.
 */
export default function FundSourceItem({
  fundSource,
  onEdit,
  onDelete,
}: {
  fundSource: FundSource;
  onEdit: (fundSource: FundSource) => void;
  onDelete: (fundSource: FundSource) => void;
}) {
  const owed = fundSource.balance < 0;

  return (
    <LedgerRow
      name={fundSource.displayText}
      // The identifier, which is what the rest of the app refers to this source
      // by (transfer notes, expense records) and what disambiguates two
      // similarly named accounts.
      meta={fundSource.name}
      amount={Math.abs(fundSource.balance)}
      sign={owed ? '-' : undefined}
      amountColor={owed ? 'error.main' : undefined}
      trailing={
        <Stack direction="row" sx={{ flexShrink: 0 }}>
          <IconButton
            size="small"
            aria-label={`Edit ${fundSource.displayText}`}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(fundSource);
            }}
            sx={{
              p: 0.5,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <MdEdit fontSize="1.1rem" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Delete ${fundSource.displayText}`}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(fundSource);
            }}
            sx={{
              p: 0.5,
              color: 'text.secondary',
              '&:hover': { color: 'error.main' },
            }}
          >
            <MdDelete fontSize="1.1rem" />
          </IconButton>
        </Stack>
      }
    />
  );
}
