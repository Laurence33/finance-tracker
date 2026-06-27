import { AppContext } from '@/context/AppContext';
import { HttpClient, HttpError } from '@/utils/httpClient';
import {
  Box,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from '@mui/material';
import { use, useState } from 'react';
import { Asset } from '@/types/Asset';
import { useFormSubmit } from '@/hooks/useFormSubmit';

type AssetFormData = {
  name: string;
  value: number;
  category: string;
  notes: string;
};

const initialFormData: AssetFormData = {
  name: '',
  value: 0,
  category: '',
  notes: '',
};

type FieldErrors = Record<string, string[]>;

export default function AssetForm({
  onClose,
  asset,
}: {
  onClose: () => void;
  asset?: Asset;
}) {
  const isEdit = !!asset;
  const { showErrorSnackBar, showSuccessSnackBar, fetchAssets } = use(AppContext);

  const [formData, setFormData] = useState<AssetFormData>(
    isEdit
      ? {
          name: asset.name,
          value: asset.value,
          category: asset.category,
          notes: asset.notes,
        }
      : initialFormData,
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const onChangeHandler = (value: any, field: string) => {
    if (field === 'value') {
      value = parseFloat(value);
      if (isNaN(value)) value = 0;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const { submitting, handleSubmit } = useFormSubmit(async () => {
    setFieldErrors({});
    try {
      if (isEdit) {
        await HttpClient.patch(
          `/assets?timestamp=${encodeURIComponent(asset.timestamp)}`,
          formData,
        );
        showSuccessSnackBar('Asset updated successfully!');
      } else {
        await HttpClient.post('/assets', formData);
        showSuccessSnackBar('Asset created successfully!');
      }
      setFormData(initialFormData);
      fetchAssets();
      onClose();
    } catch (error: any) {
      if (error instanceof HttpError && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showErrorSnackBar(error.message || 'Failed to save asset.');
      }
    }
  });

  const getError = (field: string) => fieldErrors[field]?.join(', ') || '';

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ pt: 1 }}>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Name"
            variant="outlined"
            value={formData.name}
            onChange={(e) => onChangeHandler(e.target.value, 'name')}
            placeholder="e.g. BPI Savings"
            error={!!fieldErrors.name}
            helperText={getError('name')}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Value"
            variant="outlined"
            type="number"
            value={formData.value || ''}
            onChange={(e) => onChangeHandler(e.target.value, 'value')}
            error={!!fieldErrors.value}
            helperText={getError('value')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              },
              htmlInput: { min: 0, step: 'any' },
            }}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Category"
            variant="outlined"
            value={formData.category}
            onChange={(e) => onChangeHandler(e.target.value, 'category')}
            placeholder="e.g. Cash, Investment, Property"
            error={!!fieldErrors.category}
            helperText={getError('category')}
          />
        </Box>
        <Box sx={{ mb: 2.5 }}>
          <TextField
            fullWidth
            size="small"
            label="Notes"
            variant="outlined"
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => onChangeHandler(e.target.value, 'notes')}
            placeholder="Optional notes"
          />
        </Box>
        <Stack direction="row" justifyContent="end" sx={{ mt: 1, mb: 1 }}>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={submitting}
            sx={{ minWidth: 100 }}
          >
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </Stack>
      </Box>
    </form>
  );
}
