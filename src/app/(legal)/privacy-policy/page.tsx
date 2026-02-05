"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'phosphor-react'

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Effective Date: {effectiveDate}</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              Soundflare.ai ("we", "our", or "us") respects your privacy and is committed to protecting
              your personal data. This Privacy Policy explains how we collect, use, and safeguard your
              information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account information (email address, name)</li>
              <li>Usage data and analytics</li>
              <li>Technical information (IP address, browser type, device information)</li>
              <li>Any data you choose to upload or share through our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and maintain our Service</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates and support</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share your information with trusted third-party
              service providers who assist us in operating our Service, subject to confidentiality obligations.
              We may also disclose information if required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data
              against unauthorized access, alteration, disclosure, or destruction. However, no method of
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes for which
              it was collected, or as required by law. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies</h2>
            <p>
              We use essential cookies to operate our Service. These cookies are necessary for basic
              functionality such as authentication and session management.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the effective date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:mingx@trillet.ai" className="text-orange-600 hover:text-orange-700">
                mingx@trillet.ai
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/terms-of-service" className="hover:text-orange-600">Terms of Service</Link>
            <span>|</span>
            <span>Soundflare.ai</span>
          </div>
        </div>
      </div>
    </div>
  )
}
