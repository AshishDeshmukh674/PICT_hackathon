import MeetingHeader from '../_components/MeetingHeader'
import MeetingHero from '../_components/MeetingHero'

export const metadata = {
  title: "Meetings - Ratnamukund HealthCare Foundation",
  description: "Schedule your meetings effortlessly...",
};

export default function MeetingsPage() {
  return (
    <main className="min-h-screen">
      <MeetingHeader />
      <MeetingHero />
    </main>
  )
} 