// components/layout/Menu.tsx

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import PushPinIcon from '@mui/icons-material/PushPin'
import ImageIcon from '@mui/icons-material/Image'
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter'
import BubbleChartIcon from '@mui/icons-material/BubbleChart'
import SettingsIcon from '@mui/icons-material/Settings'
import { NavLink } from 'react-router'
import './menu.css'

// Menu items for the navigation drawer
const menuItems = [
  { label: 'Publications', icon: <PushPinIcon />, path: '/publications' },
  { label: 'Assets', icon: <ImageIcon />, path: '/gallery' },
  { label: 'Clients', icon: <BusinessCenterIcon />, path: '/clients' },
  { label: 'Skills', icon: <BubbleChartIcon />, path: '/skills' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings', disabled: true },
]

// Menu component
function Menu({
  open,
  onClose,
  mobile,
}: {
  open: boolean
  onClose: () => void
  mobile: boolean
}) {
  return (
    <Drawer
      className={`menu-drawer ${mobile ? 'mobile' : 'desktop'}`}
      variant={mobile ? 'temporary' : 'permanent'}
      open={mobile ? open : true}
      onClose={onClose}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              disabled={item.disabled}
              onClick={mobile ? onClose : undefined}
              className="menu-item"
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Menu