import { use } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { AppContext } from '@/context/AppContext';

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TransferHistory() {
  const { transfers, fundSources } = use(AppContext);

  const displayTextFor = (name: string) =>
    fundSources.find((fs) => fs.name === name)?.displayText ?? name;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}
      >
        Transfer History
      </Typography>

      {transfers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <SwapHorizIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1.5 }} />
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            No transfers yet
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {transfers.map((transfer) => (
            <Card key={`${transfer.timestamp}-${transfer.sourceFundSource}`}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                  >
                    <SwapHorizIcon sx={{ fontSize: 22, color: 'white' }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.5}
                      sx={{ flexWrap: 'wrap' }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {displayTextFor(transfer.sourceFundSource)}
                      </Typography>
                      <ArrowRightAltIcon
                        sx={{ fontSize: 18, color: 'text.secondary' }}
                      />
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, color: 'text.primary' }}
                      >
                        {displayTextFor(transfer.destinationFundSource)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatTimestamp(transfer.timestamp)}
                    </Typography>
                    {transfer.note && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.disabled', display: 'block' }}
                      >
                        {transfer.note}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, color: 'text.primary' }}
                    >
                      ₱{transfer.amount.toLocaleString()}
                    </Typography>
                    {transfer.fee > 0 && (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Fee ₱{transfer.fee.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
