import React from 'react'
import CategoryList from './_components/CategoryList'

function layout({children}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className='hidden md:block md:w-64 md:fixed'>
        <CategoryList />
      </div>
      <div className='flex-1 md:ml-64 p-4 md:p-8'>
        {children}
      </div>
    </div>
  )
}

export default layout
