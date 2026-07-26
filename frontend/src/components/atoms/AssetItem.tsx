import RowActions from './RowActions';
import { use } from 'react';
import { Asset } from '@/types/Asset';
import { AppContext } from '@/context/AppContext';
import LedgerRow from '@/components/atoms/LedgerRow';

/**
 * Binds an asset to the shared ledger row. All the vocabulary — how a fund
 * source is named, how provenance and notes read — lives here; `LedgerRow`
 * knows none of it.
 *
 * Two things are deliberate:
 *
 * - **No category.** `AssetsList` groups by it, and hoisting it out of the row
 *   is what returns the chip's ~65px plus its 8px gap to the name column (§1 of
 *   `docs/ui-patterns.md`). That refund is what pays for the action icons.
 * - **The action icons stay** in `trailing`, because with the chip gone the name
 *   measures 183px at 390px in the worst case (a 7-digit amount) across a
 *   two-line clamp, rather than the ~20px that forces the lendings row to move
 *   its icons into a detail dialog. No detail dialog here, and none needed.
 *   `trailing` costs the row its `<button>` element, so the handlers stop
 *   propagation themselves per `LedgerRow`'s contract.
 */
export default function AssetItem({
  asset,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}) {
  const { fundSources } = use(AppContext);
  const fundSourceLabel = asset.fundSource
    ? fundSources.find((fs) => fs.name === asset.fundSource)?.displayText ??
      asset.fundSource
    : '';

  // Notes and provenance were two stacked captions, which made an asset that
  // has both ~19px taller than one that has neither. One dense line instead —
  // trimmed, because both fields are non-optional strings and arrive as `''`,
  // and left `undefined` when empty so the row omits the line rather than
  // reserving dead space for it.
  const meta =
    [
      asset.notes?.trim(),
      fundSourceLabel ? `Funded from ${fundSourceLabel}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || undefined;

  return (
    <LedgerRow
      name={asset.name}
      meta={meta}
      amount={asset.value}
      trailing={
        <RowActions
          onEdit={() => onEdit(asset)}
          onDelete={() => onDelete(asset)}
          editLabel={`Edit ${asset.name}`}
          deleteLabel={`Delete ${asset.name}`}
        />
      }
    />
  );
}
