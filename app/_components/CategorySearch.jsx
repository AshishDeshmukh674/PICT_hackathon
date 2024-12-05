// "use client";
// import React, { useEffect, useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Search } from 'lucide-react';
// import GlobalApi from '../_utils/GlobalApi';
// import Image from 'next/image';
// import Link from 'next/link';

// function CategorySearch() {
//   const [categoryList, setCategoryList] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredCategories, setFilteredCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     getCategoryList();
//   }, []);

//   useEffect(() => {
//     setFilteredCategories(
//       categoryList.filter((item) =>
//         item.attributes.Name.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, categoryList]);

//   const getCategoryList = async () => {
//     try {
//       const resp = await GlobalApi.getCategory();
//       setCategoryList(resp.data.data);
//       setFilteredCategories(resp.data.data);
//       setLoading(false);
//     } catch (err) {
//       console.error("Error fetching categories:", err.response ? err.response.data : err.message);
//       setError("Failed to load categories");
//       setLoading(false);
//     }
//   };

//   const getImageUrl = (url) => {
//     if (url && (url.startsWith('/') || url.startsWith('http'))) {
//       return url;
//     }
//     return '/default-icon.png';
//   };

//   return (
//     <div id="category-search" className='flex flex-col items-center px-4 justify-center'>
//       <h2 className='font-bold text-3xl tracking-wide text-center mb-4'>
//         Search <span className='text-primary'>Category</span>
//       </h2>
//       <h2 className='text-gray-500 text-lg text-center mb-4'>
//         Search Your Doctor and Book Appointment
//       </h2>

//       <div className="flex w-full max-w-sm items-center space-x-2">
//         <Input 
//           type="text" 
//           placeholder="Search..." 
//           value={searchTerm} 
//           onChange={(e) => setSearchTerm(e.target.value)} 
//         />
//         <Button type="submit">
//           <Search className='h-4 w-4 mr-2' />Search
//         </Button>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : error ? (
//         <p>{error}</p>
//       ) : (
//         <div className='w-full flex justify-center mt-16 mb-24'>
//           <div className='flex gap-8 overflow-x-auto'>
//             {filteredCategories.length > 0 ? filteredCategories.map((item, index) => (
//               <Link href={'/search/' + item.attributes.Name}
//                 key={index} 
//                 className='flex-shrink-0 flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer'
//                 style={{ width: '150px', height: '150px' }} // Square shape
//               >
//                 <Image 
//                   src={getImageUrl(item.attributes?.Icon?.data[0]?.attributes?.url)} 
//                   alt={item.attributes?.Icon?.data[0]?.attributes?.alternativeText || 'icon'} 
//                   width={80} 
//                   height={80} 
//                   className='mb-2 rounded-full border border-gray-200 transition-transform duration-300 ease-in-out hover:scale-110' 
//                 />
//                 <label className='text-blue-600 text-sm pt-4' style={{ height: '20px', lineHeight: '20px' }}>
//                   {item.attributes?.Name}
//                 </label>
//               </Link>
//             )) : (
//               <p>No categories found</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default CategorySearch;


import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search } from 'lucide-react';
import GlobalApi from '../_utils/GlobalApi';
import Image from 'next/image';
import Link from 'next/link';

function CategorySearch() {
  const [categoryList, setCategoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategoryList();
  }, []);

  useEffect(() => {
    setFilteredCategories(
      categoryList.filter((item) =>
        item.attributes.Name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, categoryList]);

  const getCategoryList = async () => {
    try {
      const resp = await GlobalApi.getCategory();
      setCategoryList(resp.data.data);
      setFilteredCategories(resp.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching categories:", err.response ? err.response.data : err.message);
      setError("Failed to load categories");
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (url && (url.startsWith('/') || url.startsWith('http'))) {
      return url;
    }
    return '/default-icon.png';
  };

  return (
    <div id="category-search" className='flex flex-col items-center px-4 justify-center'>
      <h2 className='font-bold text-3xl tracking-wide text-center mb-4'>
        Search <span className='text-primary'>Category</span>
      </h2>
      <h2 className='text-gray-500 text-lg text-center mb-4'>
        Search Your Doctor and Book Appointment
      </h2>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <Button type="submit">
          <Search className='h-4 w-4 mr-2' />Search
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className='w-full flex justify-center mt-16 mb-24'>
          <div className='flex gap-8 overflow-x-auto custom-scroll'>
            {filteredCategories.length > 0 ? filteredCategories.map((item, index) => (
              <Link href={'/search/' + item.attributes.Name}
                key={index} 
                className='flex-shrink-0 flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer'
                style={{ width: '150px', height: '150px' }} // Square shape
              >
                <Image 
                  src={getImageUrl(item.attributes?.Icon?.data[0]?.attributes?.url)} 
                  alt={item.attributes?.Icon?.data[0]?.attributes?.alternativeText || 'icon'} 
                  width={80} 
                  height={80} 
                  className='mb-2 rounded-full border border-gray-200 transition-transform duration-300 ease-in-out hover:scale-110' 
                />
                <label className='text-blue-600 text-sm pt-4' style={{ height: '20px', lineHeight: '20px' }}>
                  {item.attributes?.Name}
                </label>
              </Link>
            )) : (
              <p>No categories found</p>
            )}
          </div>
        </div>
      )}

      {/* Custom Scrollbar CSS */}
      <style jsx>{`
        .custom-scroll {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: #1d4ed8 transparent; /* Scrollbar thumb and track color (blue-700) */
        }

        .custom-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #1d4ed8; /* blue-700 color */
          border-radius: 10px;
          transition: background-color 0.3s ease;
        }

        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #1e40af; /* Darker shade of blue */
        }
      `}</style>
    </div>
  );
}

export default CategorySearch;
