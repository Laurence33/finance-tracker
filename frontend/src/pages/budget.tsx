import { use, useMemo, useState } from 'react';
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
import { AppContext } from '@/context/AppContext';
import { HttpClient } from '@/utils/httpClient';
import {
  AVAILABLE_FRAMEWORKS,
  FRAMEWORK_TEMPLATES,
} from '@/types/Budget';
import {
  computeAllocations,
  sumAllocations,
} from '@/utils/budget-helpers';

const peso = (n: number) =>
  `₱${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BudgetPage() {
  const theme = useTheme();
  const {
    budgetEnabled,
    budgetFramework,
    buckets,
    fetchBudget,
    fundSources,
    showSuccessSnackBar,
    showErrorSnackBar,
  } = use(AppContext);

  // ---- setup (disabled) state ----
  // Buckets persist after a disable, so a non-empty list means we're *re-enabling*
  // an existing framework rather than setting one up for the first time.
  const hasExistingBuckets = buckets.length > 0;
  const [selectedFramework, setSelectedFramework] = useState<string>(
    budgetFramework?.id ?? 'JARS'
  );
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

  const template = FRAMEWORK_TEMPLATES[selectedFramework];
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

  const bucketLabelPlural = budgetFramework?.bucketLabelPlural ?? 'Buckets';
  const seedSum = sumAllocations(seedAllocations);
  const totalAllocated = useMemo(
    () => buckets.reduce((sum, b) => sum + b.balance, 0),
    [buckets]
  );

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* Header */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha('#ffffff', 0.2),
              }}
            >
              <SavingsIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
              {budgetEnabled && budgetFramework
                ? `${budgetFramework.label} • Allocated`
                : 'Budgeting'}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {budgetEnabled ? peso(totalAllocated) : 'Off'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

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
                        <Typography variant="caption" color="text.secondary">
                          Target {bucket.percentage}%
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: bucket.balance < 0 ? 'error.main' : 'text.primary',
                        }}
                      >
                        {peso(bucket.balance)}
                      </Typography>
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
                {AVAILABLE_FRAMEWORKS.map((fw) => (
                  <MenuItem key={fw.id} value={fw.id}>
                    {fw.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
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
                    Allocate my current available balance ({peso(availableBalance)})
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
                          startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                        },
                      }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total to seed
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {peso(seedSum)}
                  </Typography>
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
            {totalAllocated !== 0 ? ` (currently ${peso(totalAllocated)})` : ''}.
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
