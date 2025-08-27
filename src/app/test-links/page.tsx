import { redirect } from 'next/navigation'

export default function TestLinksPage() {
  // Redirect to the new test-deeplinks route
  redirect('/test-deeplinks')
}
