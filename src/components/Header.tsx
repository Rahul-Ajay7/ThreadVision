import { Search, Bell, Menu, Shield, Mic } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0F0F0F] border-b border-[#272727] z-50 flex items-center px-4 justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-[#272727] rounded-full transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <a href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight">ThreadVision</span>
        </a>
      </div>

      <div className="flex-1 max-w-2xl mx-8">
        <div className="flex items-center">
          <div className="flex-1 flex items-center bg-[#121212] border border-[#303030] rounded-l-full px-4 py-2 focus-within:border-blue-500 transition-colors">
            <Search className="w-5 h-5 text-[#9E9E9E] mr-3" />
            <input
              type="text"
              placeholder="Search detections..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button className="bg-[#303030] hover:bg-[#3D3D3D] border border-l-0 border-[#303030] rounded-r-full px-5 py-2 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="ml-3 p-2 hover:bg-[#272727] rounded-full transition-colors">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-[#272727] rounded-full transition-colors relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>
        
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
          TV
        </div>
      </div>
    </header>
  )
}
