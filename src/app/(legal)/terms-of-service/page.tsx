"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'phosphor-react'

export default function TermsOfService() {
  const effectiveDate = "January 6, 2025"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft weight="regular" className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Effective Date: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Soundflare.ai ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p>
              Soundflare.ai provides voice AI agent analytics and observability tools. We help you monitor,
              analyze, and optimize your voice AI applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide accurate account information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Service are owned by Soundflare.ai and are
              protected by intellectual property laws. You retain ownership of any data you submit to the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. Soundflare.ai shall not be
              liable for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Termination</h2>
            <p>
              We may terminate or suspend your access to the Service at any time, with or without cause.
              You may also terminate your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material
              changes. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:mingx@trillet.ai" className="text-orange-600 hover:text-orange-700">
                mingx@trillet.ai
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-orange-600">Privacy Policy</Link>
            <span>|</span>
            <span>Soundflare.ai</span>
          </div>
        </div>
      </div>
    </div>
  )
}
