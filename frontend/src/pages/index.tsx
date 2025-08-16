import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';


export default function Home() {
  return (
    <>
      <Box component="div" sx={{ p: 2 }}>
        <Button variant="contained">Click Me!</Button>
      </Box>
    </>
  );
}
