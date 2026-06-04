import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DashboardRange, RANGE_LABELS } from '@/utils/dashboard-helpers';

const RANGES: DashboardRange[] = ['1M', '3M', '6M', 'YTD'];

export default function DashboardTimeRangeSelector({
  range,
  onChange,
}: {
  range: DashboardRange;
  onChange: (range: DashboardRange) => void;
}) {
  return (
    <ToggleButtonGroup
      value={range}
      exclusive
      onChange={(_, val) => val && onChange(val)}
      size="small"
      fullWidth
      sx={{ mb: 2 }}
    >
      {RANGES.map((r) => (
        <ToggleButton key={r} value={r} sx={{ fontSize: 12, py: 0.5 }}>
          {RANGE_LABELS[r]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
