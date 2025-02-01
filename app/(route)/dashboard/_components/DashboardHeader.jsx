"use client"
import { LogoutLink, useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import React from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';

function DashboardHeader() {
    const { user } = useKindeBrowserClient();
    const router = useRouter();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const handleHomeClick = () => {
        router.push(baseUrl || 'http://localhost:3000');
    };

    return user && (
        <div className='p-4 px-10'>
            <div>
                <DropdownMenu>
                    <DropdownMenuTrigger className='flex items-center float-right'>
                        <Image src={user?.picture} alt='logo'
                            width={40}
                            height={40}
                            className='rounded-full'
                        />
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleHomeClick}>
                            <div className="flex items-center gap-2">
                                <span>Home</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <LogoutLink>Logout</LogoutLink>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

export default DashboardHeader