import { use, useMemo, useState } from 'react';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { format } from 'date-fns';
import { AppContext } from '@/context/AppContext';
import { Tags } from '@/types/Tags';
import { HttpClient } from '@/utils/httpClient';
import { getSpentByTag } from '@/utils/budget-helpers';
import SummaryHeroCard from '@/components/molecules/SummaryHeroCard';
import TagsList from '@/components/molecules/TagsList';
import TagDialog from '@/components/organisms/TagDialog';

export default function TagsPage() {
  const {
    tags,
    expenses,
    selectedMonth,
    showSuccessSnackBar,
    showErrorSnackBar,
    invalidate,
  } = use(AppContext);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tags | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Tags | null>(null);

  const spentByTag = useMemo(() => getSpentByTag(expenses), [expenses]);

  const { budgetedCount, overCount, budgetedSpend } = useMemo(() => {
    let budgeted = 0;
    let over = 0;
    let spend = 0;
    for (const tag of tags) {
      const budget = tag.budget ?? 0;
      if (budget <= 0) continue;
      const spent = spentByTag.get(tag.name) ?? 0;
      budgeted += 1;
      spend += spent;
      if (spent > budget) over += 1;
    }
    return { budgetedCount: budgeted, overCount: over, budgetedSpend: spend };
  }, [tags, spentByTag]);

  // `expenses` is fetched per `selectedMonth`, so every figure on this screen is
  // scoped to that month. Naming it once in the group header is what lets the
  // rows drop the "spent this month" they used to repeat.
  const periodLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return 'This month';
    // Built from parts, not parsed: `new Date('2026-07')` is UTC-based and lands
    // in the previous month anywhere west of Greenwich.
    return format(new Date(year, month - 1, 1), 'MMMM yyyy');
  }, [selectedMonth]);

  const handleCreate = () => {
    setEditingTag(undefined);
    setDialogOpen(true);
  };

  const handleTap = (tag: Tags) => {
    setEditingTag(tag);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTag(undefined);
  };

  // §2 — close the current dialog before opening the next or they stack.
  const handleDeleteFromDialog = (tag: Tags) => {
    handleDialogClose();
    setDeleteTarget(tag);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await HttpClient.delete(`/tags/${encodeURIComponent(deleteTarget.name)}`);
      showSuccessSnackBar('Tag deleted successfully');
      invalidate.afterTagWrite();
    } catch (error: any) {
      showErrorSnackBar(error.message);
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <TagDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        tag={editingTag}
        onDelete={handleDeleteFromDialog}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete tag?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>
            ? Existing expenses with this tag will not be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
        <SummaryHeroCard
          hue="primary"
          icon={<LocalOfferIcon />}
          eyebrow="Tags"
          label="Spent against budgets"
          // Rounded here, not in the hero — §3 leaves rounding to the caller.
          amount={Math.round(budgetedSpend)}
          caption="budgeted tags only · multi-tag expenses count once per tag"
          stats={[
            { value: budgetedCount, label: 'Budgeted' },
            ...(overCount > 0
              ? [{ value: overCount, label: 'Over' }]
              : []),
          ]}
        />

        <TagsList
          tags={tags}
          spentByTag={spentByTag}
          periodLabel={periodLabel}
          onTap={handleTap}
        />
      </Container>

      <Fab
        color="primary"
        aria-label="add tag"
        onClick={handleCreate}
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>
    </>
  );
}
