import dynamic from 'next/dynamic';
import { Card, CardContent, Typography, Box, Paper, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Money from '@/components/atoms/Money';
import { formatMoney } from '@/utils/money';
import { ForecastDataPoint } from '@/types/Forecast';

const SERIES_LABELS: Record<string, string> = {
  best: 'Best Case',
  worst: 'Worst Case',
  expected: 'Expected',
};

/**
 * An axis tick has to be a string, so `Money`'s sign handling is repeated here:
 * a projected balance can go negative and `₱${v.toLocaleString()}` would put the
 * glyph ahead of the minus (§3). Rounds because the series carries centavos.
 */
function formatAxisTick(value: number): string {
  const rounded = Math.round(value);
  return rounded < 0 ? `-${formatMoney(-rounded)}` : formatMoney(rounded);
}

/**
 * Recharts' default tooltip takes a string from `formatter`, which cannot carry
 * the de-emphasised glyph or tabular numerals. These are the most-compared
 * figures on the page, so the tooltip renders `<Money>` instead (§3).
 */
function ForecastTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: unknown;
  // Recharts' payload item type is generic over its value; this component only
  // reads `dataKey` and `value`.
  payload?: readonly any[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <Paper elevation={3} sx={{ px: 1.25, py: 1, borderRadius: 2 }}>
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          mb: 0.5,
        }}
      >
        {String(label ?? '')}
      </Typography>
      <Stack spacing={0.25}>
        {payload.map((item) => {
          const key = String(item?.dataKey ?? '');
          const amount = Math.round(Number(item?.value ?? 0));
          const negative = amount < 0;
          return (
            <Stack
              key={key}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
            >
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                {SERIES_LABELS[key] ?? key}
              </Typography>
              <Money
                amount={Math.abs(amount)}
                sign={negative ? '-' : undefined}
                // A negative balance is coloured, so its glyph follows the
                // digits instead of sitting grey against red.
                surface={negative ? 'inherit' : 'default'}
                sx={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: negative ? 'error.main' : 'text.primary',
                }}
              />
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
}

const ChartContent = dynamic(
  () =>
    import('recharts').then((recharts) => {
      const {
        AreaChart,
        Area,
        XAxis,
        YAxis,
        Tooltip,
        ReferenceLine,
        ResponsiveContainer,
      } = recharts;

      return function InnerChart({
        data,
        successColor,
        errorColor,
        primaryColor,
        showDangerLine,
      }: {
        data: ForecastDataPoint[];
        successColor: string;
        errorColor: string;
        primaryColor: string;
        showDangerLine: boolean;
      }) {
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="bestGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={successColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={successColor} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="worstGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={errorColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={errorColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="weekDate"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatAxisTick(Number(v))}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                content={(props) => (
                  <ForecastTooltip
                    active={props.active}
                    label={props.label}
                    payload={props.payload}
                  />
                )}
                wrapperStyle={{ outline: 'none' }}
              />
              {showDangerLine && (
                <ReferenceLine
                  y={0}
                  stroke={errorColor}
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}
              <Area
                type="monotone"
                dataKey="best"
                stroke={successColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="url(#bestGradient)"
              />
              <Area
                type="monotone"
                dataKey="worst"
                stroke={errorColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="url(#worstGradient)"
              />
              <Area
                type="monotone"
                dataKey="expected"
                stroke={primaryColor}
                strokeWidth={2.5}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      };
    }),
  { ssr: false },
);

export default function CashFlowForecastChart({
  data,
}: {
  data: ForecastDataPoint[];
}) {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Card>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Projected Balance
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}
          >
            No data to forecast
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const showDangerLine = data.some(
    (d) => d.worst <= 0 || d.expected <= 0,
  );

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Projected Balance
        </Typography>
        {/*
          `font-variant-numeric` is an inherited CSS property and applies to SVG
          <text>, so one declaration here gives every axis tick tabular
          numerals — it is not a valid SVG presentation attribute, so passing it
          through `tick={{ … }}` would silently do nothing (§3).
        */}
        <Box
          sx={{ width: '100%', height: 250, fontVariantNumeric: 'tabular-nums' }}
        >
          <ChartContent
            data={data}
            successColor={theme.palette.success.main}
            errorColor={theme.palette.error.main}
            primaryColor={theme.palette.primary.main}
            showDangerLine={showDangerLine}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
