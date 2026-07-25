import { Box } from '@mui/material';
import { Transfer } from '@/types/Transfer';
import LedgerRow from '@/components/atoms/LedgerRow';
import Money from '@/components/atoms/Money';
import {
  transactionDateHeading,
  transactionDateKey,
  transactionTime,
} from '@/utils/transaction-display';

/**
 * Binds a transfer to the shared ledger row (§2 of `docs/ui-patterns.md`).
 *
 * The route is the row's name, joined with a plain `→`: `LedgerRow`'s `name`
 * renders inside a `Typography` (a `<p>`) and takes text or inline nodes only,
 * and the character costs ~10px against `ArrowRightAltIcon`'s 18px plus two
 * flex gaps.
 *
 * No leading avatar. The old card gave every transfer the same 40px filled
 * `SwapHorizIcon` — identical on every row, so it hoisted nothing and spent 52px
 * of the route's width (§1). `TransferHistory`'s group header names the section
 * instead.
 *
 * Timestamps go through the transactions ledger's helpers rather than
 * `new Date(...)`: the backend stores wall-clock strings with no zone, so
 * parsing them re-interprets the reading in the viewer's zone and can shift a
 * transfer onto the neighbouring day.
 */
export default function TransferItem({
  transfer,
  sourceLabel,
  destinationLabel,
}: {
  transfer: Transfer;
  sourceLabel: string;
  destinationLabel: string;
}) {
  const when = [
    transactionDateHeading(transactionDateKey(transfer.timestamp)),
    transactionTime(transfer.timestamp),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <LedgerRow
      name={`${sourceLabel} → ${destinationLabel}`}
      meta={[when, transfer.note?.trim()].filter(Boolean).join(' · ')}
      amount={transfer.amount}
      // Only some transfers carry a fee, so it is a second value line rather
      // than a column. `₱25 fee` matches the lendings row's `₱500 paid`.
      secondaryValue={
        transfer.fee > 0 ? (
          <Box component="span">
            <Money component="span" surface="inherit" amount={transfer.fee} /> fee
          </Box>
        ) : undefined
      }
    />
  );
}
