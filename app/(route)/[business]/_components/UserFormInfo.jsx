import { Input } from '../../../../components/ui/input'
import React from 'react'

function UserFormInfo({setUserName, setUserEmail, setUserNote}) {
  return (
    <div className='p-4 px-8 flex flex-col gap-3'>
        <h2 className='font-bold text-xl'>Enter Details</h2>
        <div>
            <h2>Name</h2>
            <Input 
                placeholder="Enter your name"
                onChange={(event) => setUserName(event.target.value)} 
            />
        </div>
        <div>
            <h2>Email</h2>
            <Input 
                placeholder="Enter your email"
                onChange={(event) => setUserEmail(event.target.value)}
            />
        </div>
        <div>
            <h2>Share any Notes</h2>
            <Input 
                placeholder="Add any notes"
                onChange={(event) => setUserNote(event.target.value)}
            />
        </div>
        <div>
            <h2 className='text-xs text-gray-400'>
                By Proceeding, you confirm that you read and agree to our terms and conditions
            </h2>
        </div>
    </div>
  )
}

export default UserFormInfo
