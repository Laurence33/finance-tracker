import { use, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Money from '@/components/atoms/Money';
import SummaryHeroCard from '@/components/molecules/SummaryHeroCard';
import { AppContext } from '@/context/AppContext';
import { HttpClient } from '@/utils/httpClient';
import {
  computeAllocations,
  sumAllocations,
} from '@/utils/budget-helpers';
import { CURRENCY_GLYPH, formatMoneyLong } from '@/utils/money';

/**
 * §3's numeric treatment for the figures that are *not* money — the bucket
 * target percentages and the framework picker's split column. Both are
 * repeating numeric columns, and `Money` is peso-only, so the tabular numerals
 * and tightened tracking are applied directly here.
 */
const PERCENT_SX = {
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
} as const;

export default function BudgetPage() {
  const theme = useTheme();
  const {
    budgetEnabled,
    budgetFramework,
    buckets,
    fetchBudget,
    frameworks,
    fundSources,
    showSuccessSnackBar,
    showErrorSnackBar,
  } = use(AppContext);

  // ---- setup (disabled) state ----
  // Buckets persist after a disable, so a non-empty list means we're *re-enabling*
  // an existing framework rather than setting one up for the first time.
  const hasExistingBuckets = buckets.length > 0;
  const [selectedFramework, setSelectedFramework] = useState<string>('');

  // The framework list arrives async from the backend: follow the configured
  // framework when one exists (the selector is locked to it on re-enable),
  // otherwise default to the first available one.
  useEffect(() => {
    if (budgetFramework?.id) {
      setSelectedFramework(budgetFramework.id);
    } else if (frameworks.length) {
      setSelectedFramework((prev) =>
        prev && frameworks.some((f) => f.id === prev) ? prev : frameworks[0].id
      );
    }
  }, [frameworks, budgetFramework]);
  const [seedFromBalance, setSeedFromBalance] = useState<boolean>(false);
  const [resetBalances, setResetBalances] = useState<boolean>(false);
  const [seedAllocations, setSeedAllocations] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Cash you actually hold (exclude credit cards) — the basis for seeding.
  const availableBalance = useMemo(
    () => fundSources.filter((fs) => !fs.isCreditCard).reduce((sum, fs) => sum + fs.balance, 0),
    [fundSources]
  );

  const template = frameworks.find((fw) => fw.id === selectedFramework);
  // For seeding math, prefer the live buckets (they carry the real percentages) on
  // re-enable, otherwise fall back to the framework template.
  const seedBasis = hasExistingBuckets ? buckets : template?.buckets ?? [];
  // The seed section is offered on first-time setup, or on re-enable once the user
  // opts to reset balances.
  const showSeedSection = !hasExistingBuckets || resetBalances;

  const handleToggleSeed = (checked: boolean) => {
    setSeedFromBalance(checked);
    if (checked && seedBasis.length) {
      setSeedAllocations(computeAllocations(availableBalance, seedBasis));
    } else {
      setSeedAllocations({});
    }
  };

  const handleToggleReset = (checked: boolean) => {
    setResetBalances(checked);
    if (!checked) {
      setSeedFromBalance(false);
      setSeedAllocations({});
    }
  };

  const handleSeedChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setSeedAllocations((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  const handleEnable = async () => {
    setSubmitting(true);
    try {
      // On re-enable, only touch existing balances when the user asked to reset.
      const applySeed = showSeedSection;
      await HttpClient.put('/budget', {
        enabled: true,
        framework: selectedFramework,
        ...(hasExistingBuckets && resetBalances ? { reseed: true } : {}),
        ...(applySeed && seedFromBalance ? { initialAllocations: seedAllocations } : {}),
      });
      showSuccessSnackBar('Budgeting framework enabled!');
      setSeedFromBalance(false);
      setResetBalances(false);
      setSeedAllocations({});
      await fetchBudget();
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to enable framework.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setSubmitting(true);
    try {
      await HttpClient.put('/budget', { enabled: false });
      showSuccessSnackBar('Budgeting framework disabled.');
      setDisableConfirm(false);
      await fetchBudget();
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to disable framework.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await HttpClient.delete('/budget');
      showSuccessSnackBar('Budgeting framework deleted.');
      setDeleteConfirm(false);
      await fetchBudget();
    } catch (error: any) {
      showErrorSnackBar(error.message || 'Failed to delete framework.');
    } finally {
      setSubmitting(false);
    }
  };

  const bucketLabel = budgetFramework?.bucketLabel ?? 'bucket';
  const bucketLabelPlural = budgetFramework?.bucketLabelPlural ?? 'Buckets';
  const seedSum = sumAllocations(seedAllocations);
  const totalAllocated = useMemo(
    () => buckets.reduce((sum, b) => sum + b.balance, 0),
    [buckets]
  );

  /**
   * §5's honesty caption. The figure is an exact sum of the balances listed
   * below it, but those balances are *cumulative* — every income allocates into
   * them and only tagged spending draws them down, so the total deliberately
   * diverges from the cash in your accounts. Saying "allocated" alone would
   * invite reading it as a balance, hence the second clause.
   *
   * Off with buckets still on file is its own honest statement: the balances are
   * not zero, they are simply not moving.
   */
  const heroCaption = budgetEnabled
    ? `sum of ${bucketLabel.toLowerCase()} balances · cumulative, not cash on hand`
    : hasExistingBuckets
      ? `${bucketLabelPlural.toLowerCase()} keep their balances while it's off`
      : undefined;

  // §6's page container. No FAB on this screen, but pb: 12 is the shared
  // clearance every page keeps above the bottom nav.
  return (
    <Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>
      <SummaryHeroCard
        hue="primary"
        icon={<SavingsIcon />}
        eyebrow="Budget"
        label={
          budgetEnabled && budgetFramework
            ? `${budgetFramework.label} · allocated`
            : 'Framework'
        }
        // Rounded here, not in the hero — §3 leaves rounding to the caller.
        // `figure` carries the off state, which is not a money amount.
        amount={budgetEnabled ? Math.round(totalAllocated) : undefined}
        figure="Off"
        caption={heroCaption}
      />

      {budgetEnabled ? (
        <>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
          >
            Your {bucketLabelPlural}
          </Typography>
          <Stack spacing={1.5}>
            {buckets.map((bucket) => {
              const share = totalAllocated > 0 ? (bucket.balance / totalAllocated) * 100 : 0;
              // A bucket can be overdrawn, so the figure needs §3's sign
              // treatment — `abs` + `sign` gives `-₱1,241`, where passing the
              // negative straight through would put the glyph ahead of the
              // minus (`₱-1,241`).
              const overdrawn = bucket.balance < 0;
              return (
                <Card key={bucket.key}>
                  <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {bucket.displayLabel}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={PERCENT_SX}
                        >
                          Target {bucket.percentage}%
                        </Typography>
                      </Box>
                      <Money
                        variant="h6"
                        amount={Math.round(Math.abs(bucket.balance))}
                        sign={overdrawn ? '-' : undefined}
                        // Overdrawn digits carry a semantic colour, so the glyph
                        // inherits it rather than sitting grey against red (§3).
                        surface={overdrawn ? 'inherit' : 'default'}
                        sx={{
                          fontWeight: 700,
                          color: overdrawn ? 'error.main' : 'text.primary',
                        }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.max(share, 0), 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          <Button
            fullWidth
            variant="outlined"
            color="error"
            sx={{ mt: 3 }}
            onClick={() => setDisableConfirm(true)}
          >
            Disable framework
          </Button>

          <Dialog open={disableConfirm} onClose={() => setDisableConfirm(false)}>
            <DialogTitle>Disable budgeting framework?</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Your {bucketLabelPlural.toLowerCase()} and their balances are kept. New income and
                expenses simply won&apos;t allocate while it&apos;s off, and you can re-enable
                anytime to resume.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDisableConfirm(false)} sx={{ color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button
                onClick={handleDisable}
                variant="contained"
                color="error"
                disabled={submitting}
              >
                Disable
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {hasExistingBuckets ? 'Re-enable budgeting' : 'Set up a budgeting framework'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Split every income across purpose-based {template?.bucketLabelPlural.toLowerCase()} and
              track how much is available for each.
            </Typography>

            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel id="framework-label">Framework</InputLabel>
              <Select
                labelId="framework-label"
                label="Framework"
                value={selectedFramework}
                // Lock to the existing framework on re-enable (buckets already exist for it).
                disabled={hasExistingBuckets}
                onChange={(e) => {
                  setSelectedFramework(e.target.value);
                  setSeedFromBalance(false);
                  setSeedAllocations({});
                }}
              >
                {frameworks.map((fw) => (
                  <MenuItem key={fw.id} value={fw.id}>
                    {fw.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {template?.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: -1.5, mb: 2 }}
              >
                {template.description}
              </Typography>
            )}

            {hasExistingBuckets && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Your {template?.bucketLabelPlural.toLowerCase()} are kept with their current
                  balances. Re-enabling resumes allocating from where you left off.
                </Typography>
              </Box>
            )}

            {hasExistingBuckets && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={resetBalances}
                    onChange={(e) => handleToggleReset(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Reset balances and start fresh
                  </Typography>
                }
              />
            )}

            {template && (
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {template.buckets.map((b) => (
                  <Stack key={b.key} direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {b.displayLabel}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, ...PERCENT_SX }}
                    >
                      {b.percentage}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}

            {showSeedSection && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={seedFromBalance}
                    onChange={(e) => handleToggleSeed(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Allocate my current available balance (
                    {/* A `Money` inside a `Typography` must be a span — a
                        nested <p> is invalid and React warns. */}
                    <Money
                      component="span"
                      variant="body2"
                      amount={Math.round(availableBalance)}
                      sx={{ fontWeight: 600 }}
                    />
                    )
                  </Typography>
                }
              />
            )}

            {showSeedSection && seedFromBalance && template && (
              <Box sx={{ mt: 1.5, mb: 1 }}>
                <Stack spacing={1.5}>
                  {template.buckets.map((b) => (
                    <TextField
                      key={b.key}
                      size="small"
                      type="number"
                      label={`${b.displayLabel} (${b.percentage}%)`}
                      value={seedAllocations[b.key] ?? 0}
                      onChange={(e) => handleSeedChange(b.key, e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              {CURRENCY_GLYPH}
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total to seed
                  </Typography>
                  <Money
                    variant="caption"
                    amount={Math.round(seedSum)}
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={handleEnable}
              disabled={submitting || !selectedFramework}
            >
              Enable {template?.bucketLabelPlural ?? 'framework'}
            </Button>

            {hasExistingBuckets && (
              <Button
                fullWidth
                variant="text"
                color="error"
                sx={{ mt: 1 }}
                onClick={() => setDeleteConfirm(true)}
              >
                Delete framework &amp; all balances
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" /> Delete framework permanently?
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            This <strong>permanently deletes</strong> all your{' '}
            {(budgetFramework?.bucketLabelPlural ?? template?.bucketLabelPlural ?? 'buckets').toLowerCase()}{' '}
            and their accumulated balances
            {/* Dialog prose is a string, not a rendered figure — that is what
                `formatMoneyLong` in `utils/money` exists for (§3). */}
            {totalAllocated !== 0
              ? ` (currently ${formatMoneyLong(Math.round(totalAllocated))})`
              : ''}
            .
            <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5 }}>
              <li>This cannot be undone.</li>
              <li>Your income and expense records are kept, but their saved allocations stop tracking against any {(budgetFramework?.bucketLabel ?? 'bucket').toLowerCase()}.</li>
              <li>If you only want to pause, use Disable instead — that keeps your balances.</li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={submitting}>
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
