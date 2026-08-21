import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { use, useCallback, useMemo } from 'react';
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

  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const { distance, refreshing, armed } = usePullToRefresh({ onRefresh });

  const visible = distance > 0 || refreshing;
  if (!visible) return null;

  return (
    <Box
      aria-live="polite"
      aria-label={refreshing ? 'Refreshing' : 'Pull to refresh'}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: refreshing ? 56 : Math.max(0, distance),
        pointerEvents: 'none',
        transition: refreshing ? 'height 120ms ease-out' : 'none',
      }}
    >
      <CircularProgress
        size={24}
        thickness={4}
        // Determinate while the finger is down so the ring fills as the
        // gesture arms, then a real spinner once it fires.
        variant={refreshing ? 'indeterminate' : 'determinate'}
        value={refreshing ? undefined : Math.min(100, (distance / 35) * 100)}
        sx={{ color: armed || refreshing ? 'primary.main' : 'text.disabled' }}
      />
    </Box>
  );
}
