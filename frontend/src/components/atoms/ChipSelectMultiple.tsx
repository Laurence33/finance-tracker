import * as React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 340,
    },
  },
};

function getStyles(name: string, selected: readonly string[], theme: Theme) {
  return {
    fontWeight: selected.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

export default function ChipSelectMultiple({
  label,
  list,
  selectedItems,
  setSelectedItems,
  required = false,
}: {
  list: string[];
  label: string;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  required?: boolean;
}) {
  const theme = useTheme();
  const [selected, setSelected] = React.useState<string[]>(selectedItems);

  const handleChange = (event: SelectChangeEvent<typeof selected>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const selectValue = typeof value === 'string' ? value.split(',') : value;
    setSelected(selectValue);
    setSelectedItems(selectValue);
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: '340px' }}>
      <InputLabel id="demo-multiple-chip-label">{label}</InputLabel>
      <Select
        labelId="demo-multiple-chip-label"
        id="demo-multiple-chip"
        multiple
        required={required}
        value={selected}
        onChange={handleChange}
        input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {list.map((item) => (
          <MenuItem
            key={item}
            value={item}
            style={getStyles(item, selected, theme)}
          >
            {item}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
