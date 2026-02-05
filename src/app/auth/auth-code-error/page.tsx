import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="mt-4">There was an error signing you in.</p>
      <Link href="/sign-in" className="mt-4 text-orange-500 hover:underline">
        Go back to Sign In
      </Link>
    </div>
  )
}