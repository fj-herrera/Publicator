import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App.tsx'

const theme = createTheme({
  components: {
    MuiMenuItem: {
      styleOverrides: {
        root: { fontSize: 13 },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        option: { fontSize: 13 },
        noOptions: { fontSize: 13 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#fff' },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 400,
        leaveDelay: 0,
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
