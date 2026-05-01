import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import { Tags } from '@/types/Tags';
import { Box, TextField, Button, Stack } from '@mui/material';
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
  const [fieldError, setFieldError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const pos = input.selectionStart ?? 0;
    const raw = input.value;
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const charsRemoved = raw.length - sanitized.length;
    setTagName(sanitized);
    setFieldError('');
    requestAnimationFrame(() => {
      const newPos = Math.max(0, pos - charsRemoved);
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError('');

    if (!tagName.trim()) {
      setFieldError('Tag name is required.');
      return;
    }

    try {
      if (isEdit) {
        await HttpClient.patch(`/tags/${tag.name}`, {
          name: tagName.trim(),
        });
        showSuccessSnackBar('Tag updated successfully!');
      } else {
        await HttpClient.post('/tags', { name: tagName.trim() });
        showSuccessSnackBar('Tag created successfully!');
      }
      fetchTags();
      onClose();
    } catch (error: any) {
      if (
        error instanceof HttpError &&
        Object.keys(error.fieldErrors).length > 0
      ) {
        setFieldError(Object.values(error.fieldErrors).flat().join(', '));
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
            error={!!fieldError}
            helperText={fieldError || 'Lowercase letters, numbers, and dashes only'}
            placeholder="e.g. groceries"
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
