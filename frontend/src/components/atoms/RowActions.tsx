import { IconButton, Stack } from '@mui/material';
import { MdDelete, MdEdit } from 'react-icons/md';

/**
 * The edit/delete rail for a `LedgerRow`'s `trailing` slot.
 *
 * This exists because `LedgerRow` documents a contract it cannot enforce: a row
 * carrying its own buttons gives up the `<button>` element, so every handler in
 * the rail has to stop propagation itself or a tap on an icon also taps the row.
 * Four item components were each reproducing that, which is one copy per chance
 * to forget it. The rail owns it now.
 *
 * Costs ~55px of the name's width budget — see §1 and §2 "Row actions" before
 * adding it to a row whose name column is already tight.
 */
export default function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  /** Accessible name, e.g. `Edit ${asset.name}` — not just "Edit". */
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
      {onEdit ? (
        <IconButton
          size="small"
          aria-label={editLabel}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          sx={{
            p: 0.5,
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <MdEdit fontSize="1.1rem" />
        </IconButton>
      ) : null}
      {onDelete ? (
        <IconButton
          size="small"
          aria-label={deleteLabel}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          sx={{
            p: 0.5,
            color: 'text.secondary',
            '&:hover': { color: 'error.main' },
          }}
        >
          <MdDelete fontSize="1.1rem" />
        </IconButton>
      ) : null}
    </Stack>
  );
}
