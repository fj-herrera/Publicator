// components/layout/Menu.tsx

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { NavLink } from 'react-router'
import './menu.css'

// Menu items for the navigation drawer
const menuItems = [
  { label: 'Publications', path: '/publications' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Clients', path: '/clients' },
  { label: 'Skills', path: '/skills' },
  { label: 'Settings', path: '/settings' },
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
              onClick={mobile ? onClose : undefined}
              className="menu-item"
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Menu