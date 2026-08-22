import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { use, useMemo } from 'react';
import { useSWRConfig } from 'swr';
import { AppContext } from '@/context/AppContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { buildPageRefresh } from '@/utils/page-refresh';

/**
 * The pull-down affordance. Renders nothing until the user starts pulling, so
 * it costs no layout on a page at rest — the sheet slides out of the app bar
 * rather than pushing content down.
 */
export default function PullToRefresh() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { selectedMonth } = use(AppContext);

  const refresh = useMemo(
    () => buildPageRefresh(mutate, router.pathname, selectedMonth),
    [mutate, router.pathname, selectedMonth],
  );

  const { distance, refreshing, armed, progress } = usePullToRefresh({ onRefresh: refresh });

  const visible = distance > 0 || refreshing;
  if (!visible) return null;

  // Pinned to the middle of the viewport rather than sliding down from the top,
  // so the pull drives how the indicator *looks* rather than where it sits.
  return (
    <Box
      aria-live="polite"
      aria-label={refreshing ? 'Refreshing' : 'Pull to refresh'}
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        zIndex: 1200,
        // Never intercepts the gesture that summoned it.
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        bgcolor: 'background.paper',
        boxShadow: 3,
        // Grows into place as the pull arms, so the gesture still feels
        // connected to something even though the position is fixed.
        transform: `translate(-50%, -50%) scale(${refreshing ? 1 : 0.7 + progress * 0.3})`,
        opacity: refreshing ? 1 : Math.max(0.35, progress),
        transition: refreshing ? 'transform 140ms ease-out, opacity 140ms ease-out' : 'none',
      }}
    >
      <CircularProgress
        size={24}
        thickness={4}
        // Determinate while the finger is down so the ring fills as the gesture
        // arms, then a real spinner once it fires.
        variant={refreshing ? 'indeterminate' : 'determinate'}
        value={refreshing ? undefined : progress * 100}
        sx={{ color: armed || refreshing ? 'primary.main' : 'text.disabled' }}
      />
    </Box>
  );
}
