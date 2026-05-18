import { useState } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import RepeatIcon from '@mui/icons-material/Repeat';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { ForecastEvent } from '@/types/Forecast';

const EVENT_ICONS = {
  recurring: <RepeatIcon sx={{ fontSize: 18 }} />,
  lending_repayment: <HandshakeIcon sx={{ fontSize: 18 }} />,
  income: <TrendingUpIcon sx={{ fontSize: 18 }} />,
} as const;

const INITIAL_LIMIT = 15;

export default function ForecastBreakdown({
  events,
}: {
  events: ForecastEvent[];
}) {
  const [showAll, setShowAll] = useState(false);

  // Filter out generic weekly income entries, keep only specific events
  const specificEvents = events.filter(
    (e) => e.type !== 'income',
  );

  const displayed = showAll
    ? specificEvents
    : specificEvents.slice(0, INITIAL_LIMIT);

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Upcoming Events
        </Typography>
        {specificEvents.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}
          >
            No projected events
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {displayed.map((event, i) => (
              <Stack
                key={`${event.date}-${event.label}-${i}`}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ py: 0.5 }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', minWidth: 52, flexShrink: 0 }}
                >
                  {event.date}
                </Typography>
                <Stack
                  sx={{
                    color: event.amount >= 0 ? 'success.main' : 'error.main',
                  }}
                >
                  {EVENT_ICONS[event.type]}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {event.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: event.amount >= 0 ? 'success.main' : 'error.main',
                    flexShrink: 0,
                  }}
                >
                  {event.amount >= 0 ? '+' : ''}₱{Math.abs(event.amount).toLocaleString()}
                </Typography>
              </Stack>
            ))}
            {specificEvents.length > INITIAL_LIMIT && (
              <Button
                size="small"
                onClick={() => setShowAll(!showAll)}
                sx={{ mt: 0.5, textTransform: 'none' }}
              >
                {showAll
                  ? 'Show Less'
                  : `Show All (${specificEvents.length})`}
              </Button>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
