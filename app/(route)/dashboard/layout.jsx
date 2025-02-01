import React from 'react'
import SideNavBar from './_components/SideNavBar'
import DashboardHeader from './_components/DashboardHeader'
import { Toaster } from '../../../components/ui/sonner'

function DashboardLayout({children}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className='md:w-64 md:fixed h-screen bg-slate-50'>
        <SideNavBar/>
      </div>
      <div className='flex-1 md:ml-64'>
        <DashboardHeader/>
        <Toaster />
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout