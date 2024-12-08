//npx shadcn-ui@latest add tabs
"use client"

import React, { useState, useEffect } from 'react'; // Include useEffect
import {useKindeBrowserClient} from '@kinde-oss/kinde-auth-nextjs'; // Make sure this import is'@kinde-oss/kinde-auth-nextjs' correct

import { Tabs, TabsContent, TabsList, TabsTrigger } from "/components/ui/tabs.jsx"
import BookingList from '/app/(route)/my-booking/_components/BookingList.jsx'
import GlobalApi  from '/app/_utils/GlobalApi.jsx';

function MyBooking(){
    const {user}=useKindeBrowserClient();
    const [bookingList,setbookingList]=useState([]);

    useEffect(()=>{
     user&&getUserBookingList();
    },[user])
    const getUserBookingList=()=>{
        GlobalApi.getUserBookingList(user?.email).then(resp=>{
         console.log(resp.data.data)
         setbookingList(resp.data.data);
        }
        )
    }
    /**Used to filter user boooking
     * 
     * @param {} type 
     * @returns 
     */
    const filterUserBooking=(type)=>{
        const result=bookingList.filter(item=>
           type=='upcoming'? new Date(item.attributes.Date)>=new Date()
           :new Date(item.attributes.Date)<=new Date()
        )
        console.log(result)
        return result;
    }
    return(
        <div className='px-4 sm:px-10 mt-10'>
            <h2 className='font-bold text-2xl'>My Booking</h2>
            <Tabs defaultValue="upcoming" className="w-full mt-5">
  <TabsList className='w-full justify-start'>
    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
    <TabsTrigger value="expired">Expired</TabsTrigger>
  </TabsList>
  <TabsContent value="upcoming">
    <BookingList bookingList={filterUserBooking('upcoming')}
    expired={false}/>
  </TabsContent>
  <TabsContent value="expired">
    <BookingList bookingList={filterUserBooking('expired')}
    expired={true}/>
    </TabsContent>
</Tabs>

        </div>
    )
}
export default MyBooking