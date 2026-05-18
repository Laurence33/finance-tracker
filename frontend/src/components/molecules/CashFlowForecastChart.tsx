import dynamic from 'next/dynamic';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ForecastDataPoint } from '@/types/Forecast';

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
                tickFormatter={(v) => `₱${Number(v).toLocaleString()}`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                formatter={(value, name) => {
                  const label =
                    name === 'best'
                      ? 'Best Case'
                      : name === 'worst'
                        ? 'Worst Case'
                        : 'Expected';
                  return [`₱${Number(value).toLocaleString()}`, label];
                }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
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
        <Box sx={{ width: '100%', height: 250 }}>
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
