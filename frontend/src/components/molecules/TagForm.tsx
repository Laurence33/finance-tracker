import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import { Tags } from '@/types/Tags';
import { Box, Button, InputAdornment, Stack, TextField } from '@mui/material';
import { use, useRef, useState } from 'react';

export default function TagForm({
  onClose,
  tag,
}: {
  onClose: () => void;
  tag?: Tags;
}) {
  const isEdit = !!tag;
  const { showErrorSnackBar, showSuccessSnackBar, fetchTags } = use(AppContext);
  const [tagName, setTagName] = useState(isEdit ? tag.name : '');
  const [budget, setBudget] = useState<number>(isEdit ? tag.budget ?? 0 : 0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const pos = input.selectionStart ?? 0;
    const raw = input.value;
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const charsRemoved = raw.length - sanitized.length;
    setTagName(sanitized);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.name;
      return next;
    });
    requestAnimationFrame(() => {
      const newPos = Math.max(0, pos - charsRemoved);
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    if (!tagName.trim()) {
      setFieldErrors({ name: 'Tag name is required.' });
      return;
    }
    if (budget < 0) {
      setFieldErrors({ budget: 'Budget must be 0 or greater.' });
      return;
    }

    try {
      if (isEdit) {
        await HttpClient.patch(`/tags/${tag.name}`, {
          name: tagName.trim(),
          budget,
        });
        showSuccessSnackBar('Tag updated successfully!');
      } else {
        await HttpClient.post('/tags', { name: tagName.trim(), budget });
        showSuccessSnackBar('Tag created successfully!');
      }
      fetchTags();
      onClose();
    } catch (error: any) {
      if (
        error instanceof HttpError &&
        Object.keys(error.fieldErrors).length > 0
      ) {
        const flattened: Record<string, string> = {};
        for (const [k, v] of Object.entries(error.fieldErrors)) {
          flattened[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
        setFieldErrors(flattened);
      } else {
        showErrorSnackBar(error.message || 'Failed to save tag.');
      }
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <Box sx={{ pt: 1 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            autoFocus
            fullWidth
            required
            size="small"
            label="Tag Name"
            variant="outlined"
            value={tagName}
            inputRef={inputRef}
            onChange={handleChange}
            error={!!fieldErrors.name}
            helperText={
              fieldErrors.name || 'Lowercase letters, numbers, and dashes only'
            }
            placeholder="e.g. groceries"
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Monthly Budget (optional)"
            variant="outlined"
            type="number"
            value={budget}
            onChange={(e) => {
              setBudget(parseFloat(e.target.value) || 0);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.budget;
                return next;
              });
            }}
            error={!!fieldErrors.budget}
            helperText={
              fieldErrors.budget || 'Set 0 to track without a target.'
            }
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Stack direction="row" justifyContent="end" sx={{ mt: 1, mb: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            sx={{ minWidth: 100 }}
          >
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
