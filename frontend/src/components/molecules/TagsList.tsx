import { Box, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Tags } from '@/types/Tags';
import LedgerGroupCard from '@/components/molecules/LedgerGroupCard';
import TagItem from '../atoms/TagItem';

/**
 * 0 = over budget, 1 = within budget, 2 = no budget. Budgeted tags come first
 * because they own the meter and the `/ budget` reference, so clustering them
 * keeps the numeric column readable; over-budget ones lead, the way §2 puts
 * active records first within a group.
 */
function rankTag(tag: Tags, spent: number): number {
  const budget = tag.budget ?? 0;
  if (budget <= 0) return 2;
  return spent > budget ? 0 : 1;
}

export default function TagsList({
  tags,
  spentByTag,
  periodLabel,
  onTap,
}: {
  tags: Tags[];
  spentByTag?: Map<string, number>;
  /**
   * The month the spend figures cover, hoisted into the group header. Every row
   * would otherwise have to restate it — the pre-ledger row literally rendered
   * "₱340 spent this month" per tag, which is §8 anti-pattern 4.
   */
  periodLabel: string;
  onTap: (tag: Tags) => void;
}) {
  if (tags.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LocalOfferIcon
          sx={{ fontSize: 56, color: 'action.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 0.5 }}>
          No tags yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
          Tap the + button to create your first tag
        </Typography>
      </Box>
    );
  }

  // `sort` is stable, so source order survives inside each rank — re-sorting by
  // value would hide the order the user created their tags in (§2).
  const ordered = [...tags].sort(
    (a, b) =>
      rankTag(a, spentByTag?.get(a.name) ?? 0) -
      rankTag(b, spentByTag?.get(b.name) ?? 0),
  );

  // One card, not several. Nothing else on a tag repeats across rows, and
  // splitting "budgeted" from "no budget" would add a header that hoists no
  // field out of the row and restates a count the hero already carries (§8.8).
  return (
    <LedgerGroupCard label={periodLabel} count={tags.length}>
      {ordered.map((tag) => (
        <TagItem
          key={tag.name}
          tag={tag}
          spent={spentByTag?.get(tag.name) ?? 0}
          onTap={onTap}
        />
      ))}
    </LedgerGroupCard>
  );
}
