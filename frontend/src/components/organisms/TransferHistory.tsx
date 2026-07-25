import { use } from 'react';
import { Box, Typography } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AppContext } from '@/context/AppContext';
import TransferItem from '@/components/atoms/TransferItem';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';

/**
 * The wallet's second list. One `LedgerGroupCard`, not one per day: the
 * transactions ledger groups by date because it holds twenty-odd records a
 * month, whereas transfers are sparse enough that day groups would mostly be
 * one-row cards — a header per row is chrome (§2).
 *
 * The card's header **replaces** the `Typography variant="subtitle1"` section
 * heading this component used to render above the list, so it is not a header
 * that hoists nothing: it is the section title, and it carries the count the
 * heading never showed.
 */
export default function TransferHistory() {
  const { transfers, fundSources } = use(AppContext);

  const displayTextFor = (name: string) =>
    fundSources.find((fs) => fs.name === name)?.displayText ?? name;

  return (
    <Box sx={{ mt: 3 }}>
      {transfers.length === 0 ? (
        <>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
          >
            Transfer History
          </Typography>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SwapHorizIcon
              sx={{ fontSize: 48, color: 'action.disabled', mb: 1.5 }}
            />
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              No transfers yet
            </Typography>
          </Box>
        </>
      ) : (
        <LedgerGroupCard label="Transfer history" count={transfers.length}>
          {transfers.map((transfer) => (
            <TransferItem
              key={`${transfer.timestamp}-${transfer.sourceFundSource}`}
              transfer={transfer}
              sourceLabel={displayTextFor(transfer.sourceFundSource)}
              destinationLabel={displayTextFor(transfer.destinationFundSource)}
            />
          ))}
        </LedgerGroupCard>
      )}
    </Box>
  );
}
