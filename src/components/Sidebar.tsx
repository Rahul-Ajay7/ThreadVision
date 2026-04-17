import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Scan, 
  History, 
  AlertTriangle, 
  Settings,
  HelpCircle,
  FileVideo,
  Users
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

const mainMenuItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: Scan, label: 'Detection', path: '/detection' },
  { icon: History, label: 'Detection Logs', path: '/logs' },
]

const categoryItems = [
  { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
  { icon: Users, label: 'Person Detection', path: '/person' },
  { icon: FileVideo, label: 'Bag Detection', path: '/bags' },
]

const bottomMenuItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help', path: '/help' },
]

export default function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside className={`fixed left-0 top-14 bottom-0 bg-[#0F0F0F] border-r border-[#272727] transition-all duration-300 z-40 ${isOpen ? 'w-60' : 'w-16'}`}>
      <div className="overflow-y-auto h-full py-3">
        <div className="space-y-1 px-2">
          {mainMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item flex items-center gap-4 px-3 py-2.5 rounded-lg ${
                  isActive ? 'bg-[#272727]' : ''
                }`
              }
            >
              <item.icon className="w-6 h-6 min-w-6" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        {isOpen && (
          <>
            <div className="my-4 mx-4 border-t border-[#272727]" />
            
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-wider">Categories</h3>
            </div>
            
            <div className="space-y-1 px-2">
              {categoryItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-item flex items-center gap-4 px-3 py-2.5 rounded-lg ${
                      isActive ? 'bg-[#272727]' : ''
                    }`
                  }
                >
                  <item.icon className="w-6 h-6 min-w-6" />
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-[#272727]">
          <div className="space-y-1">
            {bottomMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-item flex items-center gap-4 px-3 py-2.5 rounded-lg ${
                    isActive ? 'bg-[#272727]' : ''
                  }`
                }
              >
                <item.icon className="w-6 h-6 min-w-6" />
                {isOpen && <span className="text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
