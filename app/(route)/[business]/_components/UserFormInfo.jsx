import { Input } from '........componentsuiinput'
import React from 'react'

function UserFormInfo({setUserName,setUserEmail,setUserNote}) {
  return (
    div className='p-4 px-8 flex flex-col gap-3'
        h2 className='font-bold text-xl'Enter Detailsh2
        div
            h2Name h2
            Input onChange={(event)=setUserName(event.target.value)} 
        div
        div
            h2Email h2
            Input onChange={(event)=setUserEmail(event.target.value)}
        div
        div
            h2Share any Notes h2
            Input onChange={(event)=setUserNote(event.target.value)}
        div
        div
            h2 className='text-xs text-gray-400'By Proceeding, you confirm that you read and agree Tubeguruji terms and conditionh2
           
        div
    div
  )
}

export default UserFormInfo
