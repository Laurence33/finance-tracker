import { use, useState } from 'react';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AppContext } from '@/context/AppContext';
import { FundSource } from '@/types/FundSource';
import { HttpClient } from '@/utils/httpClient';
import Money from '@/components/atoms/Money';
import FundSourceList from '@/components/molecules/FundSourceList';
import SummaryHeroCard from '@/components/molecules/SummaryHeroCard';
import FundSourceDialog from '@/components/organisms/FundSourceDialog';
import TransferDialog from '@/components/organisms/TransferDialog';
import TransferHistory from '@/components/organisms/TransferHistory';

export default function WalletPage() {
  const { fundSources, fetchFundSources, showSuccessSnackBar, showErrorSnackBar } =
    use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFundSource, setEditingFundSource] = useState<FundSource | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<FundSource | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  // The headline figure is cash only. It used to be `fundSources.reduce(...)`
  // over every source, which quietly nets a liability off an asset and yields a
  // number that is neither the money you hold nor what you owe (§3 "label
  // derived aggregates honestly"). `budget.tsx` already defines the cash-only
  // sum as "Cash you actually hold (exclude credit cards)"; this matches it, and
  // the hero's caption plus the `Card debt` stat carry the cards.
  const cashOnHand = fundSources
    .filter((fs) => !fs.isCreditCard)
    .reduce((sum, fs) => sum + fs.balance, 0);
  const hasCreditCards = fundSources.some((fs) => fs.isCreditCard);
  // What is owed, not the net of the card group: a card at -7,350 alongside one
  // prepaid at +500 is 7,350 of debt, not 6,850.
  const cardDebt = fundSources.reduce(
    (sum, fs) => sum + (fs.isCreditCard ? Math.max(0, -fs.balance) : 0),
    0,
  );

  const handleCreate = () => {
    setEditingFundSource(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (fundSource: FundSource) => {
    setEditingFundSource(fundSource);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingFundSource(undefined);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(`/fund-sources/${deleteTarget.name}`);
      showSuccessSnackBar('Fund source deleted successfully');
      fetchFundSources();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <FundSourceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fundSource={editingFundSource}
      />

      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
      />

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete fund source?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.displayText}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* pb: 12 is SpeedDial clearance and load-bearing — see §6. */}
      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        <SummaryHeroCard
          hue="primary"
          icon={<AccountBalanceWalletIcon />}
          eyebrow="Wallet"
          label="Cash on hand"
          // Rounded here, not in the hero — §3 leaves rounding to the caller.
          // Signed rather than negative, also §3: a cash account cannot go below
          // zero (the backend refuses it), but this is a derived sum and the
          // guarantee is not local, so the glyph must never end up ahead of a
          // minus.
          amount={Math.abs(Math.round(cashOnHand))}
          sign={cashOnHand < 0 ? '-' : undefined}
          caption={
            hasCreditCards
              ? 'cash accounts only · card balances not deducted'
              : 'sum of all account balances'
          }
          // One conditional stat, which §5 allows: a permanent `₱0 Card debt` on
          // a cash-only wallet would be noise. `component="span"` because
          // `SummaryHeroStat.value` renders inside a `<p>`, and no `sign` — the
          // label already says debt, so a minus would be the same fact twice.
          stats={
            cardDebt > 0
              ? [
                  {
                    value: (
                      <Money
                        component="span"
                        surface="onColor"
                        amount={Math.round(cardDebt)}
                      />
                    ),
                    label: 'Card debt',
                  },
                ]
              : []
          }
        />

        <FundSourceList
          fundSources={fundSources}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />

        <TransferHistory />
      </Container>

      <SpeedDial
        ariaLabel="Wallet actions"
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          slotProps={{ tooltip: { title: 'Add Fund Source' } }}
          onClick={handleCreate}
        />
        <SpeedDialAction
          icon={<SwapHorizIcon />}
          slotProps={{
            tooltip: { title: 'Transfer Between Accounts' },
            fab: { disabled: fundSources.length < 2 },
          }}
          onClick={() => setTransferOpen(true)}
        />
      </SpeedDial>
    </>
  );
}
