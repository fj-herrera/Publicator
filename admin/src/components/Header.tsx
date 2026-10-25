// components/Header.tsx

import { AppBar, Toolbar, IconButton, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import './header.css'

function Header({
  onMenuClick,
  showMenuButton,
}: {
  onMenuClick: () => void
  showMenuButton: boolean
}) {
  return (
    <AppBar position="fixed" className="header">
      <Toolbar className="header-toolbar">
        {showMenuButton && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            className="header-menu-button"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography variant="h6" component="div">
          Publicator
        </Typography>
      </Toolbar>
    </AppBar>
  )
}

export default Header