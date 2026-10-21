import { useState } from 'react'
import { Box, useMediaQuery } from '@mui/material'
import { Route, Routes, Navigate } from 'react-router'

import Header from './components/Header'
import Menu from './components/Menu'

import Publications from './pages/Publications'
import Gallery from './pages/Gallery'
import Clients from './pages/Clients'
import Skills from './pages/Skills'
import Settings from './pages/Settings'

import './app.css'

function App() {
  const mobile = useMediaQuery('(max-width:600px)')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Header
        showMenuButton={mobile}
        onMenuClick={() => setOpen(true)}
      />

      <Box className="app-body">
        <Menu
          mobile={mobile}
          open={open}
          onClose={() => setOpen(false)}
        />

        <Box component="main" className="main-content">
          <div className="main-content-inner">
            <Routes>
              <Route path="/" element={<Navigate to="/publications" replace />} />
              <Route path="/publications" element={<Publications />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </Box>
      </Box>
    </>
  )
}

export default App