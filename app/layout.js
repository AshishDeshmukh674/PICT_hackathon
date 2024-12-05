import { Outfit } from "next/font/google";
import "./globals.css";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
//import { Toaster } from "../../components/ui/toaster";


const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Ratnamukund HealthCare Foundation",
  description: "Dr. Bhat has served as a Senior Research Associate at the renowned John Hopkins University and has made significant contributions as an Assistant Professor of Medicine at Bharatratna Atalbihari Vajpayee Medical College, Pune. He has also shared his expertise as an Honorary Physician with Pune Municipal Corporation and as a consulting physician at Tata Motors, Pune",
  openGraph:{
    title: "Ratnamukund HealthCare Foundation",
    description: "Dr. Bhat has served as a Senior Research Associate at the renowned John Hopkins University and has made significant contributions as an Assistant Professor of Medicine at Bharatratna Atalbihari Vajpayee Medical College, Pune. He has also shared his expertise as an Honorary Physician with Pune Municipal Corporation and as a consulting physician at Tata Motors, Pune",
    type:"website",
    locale:"en_US",
    url:process.env.URL_LAYOUT_JS,
    siteName:"drbhatpune.com"
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <div className="md:px-20">
          <Header/>
          
          {children}
          {/* <Toaster/> */}
        </div>

        <Footer/>
       </body>
    </html>
  );
}
