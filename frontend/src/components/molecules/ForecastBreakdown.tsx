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
import Money from '@/components/atoms/Money';
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
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, ...(specificEvents.length === 0 && { mb: 1 }) }}
        >
          Projected Events
        </Typography>
        {/*
          §3: these are projections, not scheduled facts — a range expense is
          shown at the midpoint of its range, so the caption says so rather than
          letting an exact-looking figure imply an exact amount. Omitted when the
          list is empty; there is no derivation to explain.
        */}
        {specificEvents.length > 0 && (
          <Typography
            sx={{ fontSize: '0.6875rem', color: 'text.secondary', mb: 1 }}
          >
            projected · range amounts shown at midpoint
          </Typography>
        )}
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
                  sx={{
                    color: 'text.secondary',
                    minWidth: 52,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}
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
                {/*
                  §2 row spec: the name is the only flexible element, so it
                  needs `minWidth: 0` for the ellipsis to fire inside a flex
                  row, and the value block stays fixed and right-aligned.
                */}
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {event.label}
                </Typography>
                {/*
                  Both directions carry an explicit sign: which direction is in
                  the majority here depends on the horizon and on how many
                  lendings fall inside it, so there is no stable majority for §4
                  to leave unsigned. `Math.round` because a range expense's
                  midpoint is fractional and `Money` does not round (§3).
                */}
                <Money
                  variant="body2"
                  amount={Math.round(Math.abs(event.amount))}
                  sign={event.amount >= 0 ? '+' : '-'}
                  surface="inherit"
                  sx={{
                    fontWeight: 600,
                    color: event.amount >= 0 ? 'success.main' : 'error.main',
                    flexShrink: 0,
                    textAlign: 'right',
                  }}
                />
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
