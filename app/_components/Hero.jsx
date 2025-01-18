import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

function Hero() {
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState('');

  const slides = [
    {
      id: 3,
      image: '/advice.png',
      title: ['Dr. Shreepad Bhat',
        'MBBS MD Medicine (B.J.Medical College Pune)'
      ],
      profession: 'Consultant Physician',
      description: [
        '20+ years of professional experience in diabetes care and internal medicine',
        'Senior Professor of Medicine at Bharat Ratna Atal Bihari Vajpayee Medical College, Pune',
        'Postgraduate Teacher MUHS, Nasik',
        'Consultant Physician at Shashwat Hospital Karve Road',
        'Honorary Physician Pune Municipal Corporation',
        'Panel Consultant Tata Motors',
        'Visiting Faculty Tilak Maharashtra Vidyapeeth'
      ],
      moreInfo: 'Dr. Shreepad Bhat is a distinguished consultant physician with a strong academic and clinical background in internal medicine. He earned his MBBS from the prestigious B.J. Medical College in Pune and pursued his MD in Medicine at Sasoon Medical College, Pune. With a deep specialization in coronary artery disease, Dr. Bhat’s research on Young Coronary Artery Disease and its preventive factors has been recognized internationally.',
      showMoreInfoButton: true,
    },
    {
      id: 4,
      image: '/advice.png',
      title: ['Dr. Shilpa Bhat',
        'MBBS, MD (Obstetrics & Gynaecology)'
      ],
      profession: 'Obstetrician and Gynecologist',
      description: ['M.B.B.S - Govt. Medical College, Aurangabad',
        'Resident Dept. of Obst & Gynac B J Medical, Pune',
        'M.D. Obst & Gynac - Govt. Medical College, Miraj',
        'Former Associate Professor S.K.N.M.C, Pune',
        'Thesis: Study of obstetric referrals to Teaching Institute',
        'Best Family Planning Service Award - Govt. of Maharashtra 2013-14',
        'Pioneer work in postpartum intrauterine contraceptive device',
        'Published paper in Elsevier International Journal on postpartum intrauterine contraceptive device'], // Ensure this is an array
      moreInfo: ['Dr. Bhat has previously held the position of Associate Professor in Obstetrics and Gynaecology at S.K.N. Medical College, Pune. Her dedication to women’s health earned her the Best Family Planning Service Award in Maharashtra in 2013. She has published multiple papers in international journals on IUCD and other critical aspects of gynecological care.'],
      showMoreInfoButton: true,
    },
  ];

  const handleMoreInfoClick = () => {
    setShowMoreInfo(!showMoreInfo);
  };

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setSlideDirection('right');
      setTimeout(() => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        setSlideDirection('');
      }, 500);
    }, 12000);

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  const currentData = slides[currentSlide];

  return (
    <section>
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="relative overflow-hidden">
          <div
            className={`grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 transition-transform duration-500 ${
              slideDirection === 'right' ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="relative h-64 overflow-hidden rounded-lg sm:h-80 lg:order-last lg:h-full">
              <Image
                alt={currentData.title}
                src={currentData.image}
                width={800}
                height={800}
                className="absolute inset-0 h-full w-full object-cover rounded-3xl"
              />
            </div>

            <div className="lg:py-24">
              <h2 className="text-4xl font-bold sm:text-4xl text-primary">
                {currentData.title.map((line, index) => (
                  <React.Fragment key={index}>
                    <span className={index === 0 ? 'text-4xl font-bold' : 'text-xl font-light'}>
                      {line}
                    </span>
                    <br />
                  </React.Fragment>
                ))}
              </h2>

              <div className="mt-4 py-1 px-3 bg-slate-200 text-black font-medium rounded-full inline-block text-sm">
                {currentData.profession}
              </div>

              <ul className="mt-4 list-disc pl-5 text-gray-600">
                {(Array.isArray(currentData.description) && currentData.description.length) ? (
                  currentData.description.map((item, index) => (
                    <li key={index} className="mb-1">{item}</li>  // Add margin between items
                  ))
                ) : (
                  <li>No description available.</li>
                )}
              </ul>

              {currentData.showMoreInfoButton && (
                <>
                  <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    {/* More Info Button */}
                    <Button
                      className='py-2 px-4 bg-primary text-white text-sm rounded-full sm:w-auto w-full text-center transition-colors duration-300 hover:bg-blue-700'
                      onClick={handleMoreInfoClick}
                    >
                      More Info
                    </Button>

                    {/* Book Now Button */}
                    <Link href={'/details/' + currentData.id}>
                      <Button
                        className='mt-4 sm:mt-0 py-2 px-4 bg-primary text-white text-sm rounded-full w-full sm:w-auto text-center transition-colors duration-300 hover:bg-blue-700'
                      >
                        Book Appointment
                      </Button>
                    </Link>
                  </div>

                  {/* More Info Content */}
                  <div
                    className={`mt-4 p-4 bg-gray-100 rounded-lg overflow-hidden transition-all duration-500 ease-in-out ${
                      showMoreInfo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-gray-700">
                      {currentData.moreInfo}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
