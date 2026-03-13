import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-text" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="font-heading text-base font-semibold text-text">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <div>
          <h1 className="font-heading text-2xl font-bold text-text mb-1">Privacy Policy</h1>
          <p className="text-sm text-text-light">Last updated: March 13, 2026</p>
        </div>

        <p className="text-sm text-text leading-relaxed">
          Love Memories ("the App") is a personal couples application designed to help you and your partner
          preserve memories, track shared experiences, and stay connected. This Privacy Policy explains what
          data we collect, how we use it, and your rights regarding your information.
        </p>

        {/* Section 1 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">1. Data We Collect</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Account Information</h3>
              <p className="text-sm text-text-light leading-relaxed">
                Your name, email address, and optionally your Google account identifier when you sign in with Google.
                A profile photo if you choose to upload one.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Moments & Photos</h3>
              <p className="text-sm text-text-light leading-relaxed">
                Photos, voice memos, and text content you add to Moments, Love Letters, and Recipes.
                These are stored securely and associated with your couple account only.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Location Data</h3>
              <p className="text-sm text-text-light leading-relaxed">
                Geographic coordinates and place names you save for Food Spots and Date Plans.
                Location is only collected when you explicitly pin a spot — we do not track your
                real-time location in the background.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Couple Profile</h3>
              <p className="text-sm text-text-light leading-relaxed">
                Your couple name, anniversary date, shared goals (Sprints), Daily Q&A responses,
                expenses, and any other content you and your partner create together in the App.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Technical Data</h3>
              <p className="text-sm text-text-light leading-relaxed">
                Device type, browser version, and anonymous usage logs used to diagnose errors and
                improve performance. We do not use tracking pixels, fingerprinting, or cross-site identifiers.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">2. How We Use Your Data</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-text-light leading-relaxed">Your data is used exclusively to:</p>
            <ul className="space-y-2">
              {[
                'Provide and personalize the App experience for you and your partner.',
                'Store and display your memories, letters, food spots, and shared content.',
                'Send push notifications (Daily Q&A reminders, letter deliveries) if you grant permission.',
                'Process subscription payments via RevenueCat.',
                'Generate weekly and monthly recap summaries shown within the App.',
                'Diagnose bugs and improve App stability.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 bg-primary/5 rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">We never sell your data.</p>
              <p className="text-sm text-text-light leading-relaxed">
                Your personal information is never sold to, shared with, or monetized by third parties
                for advertising or any other commercial purpose.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">3. Third-Party Services</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-sm text-text-light leading-relaxed">
              The App uses the following third-party services, each with their own privacy policies:
            </p>
            <div className="space-y-3">
              {[
                {
                  name: 'Google OAuth',
                  purpose: 'Optional sign-in with your Google account. Only your Google ID, name, and email are received. No Google data is shared beyond authentication.',
                },
                {
                  name: 'RevenueCat',
                  purpose: 'Subscription management and in-app purchase processing. RevenueCat processes payment data according to their privacy policy. We receive only subscription status.',
                },
                {
                  name: 'Cloudflare',
                  purpose: 'CDN and network infrastructure for media storage (photos, voice memos) and tunneling. Cloudflare may log IP addresses for security and performance.',
                },
                {
                  name: 'Mapbox',
                  purpose: 'Interactive maps and geocoding (place name search) for Food Spots and Date Plans. Mapbox may process map tile requests and search queries.',
                },
              ].map((service) => (
                <div key={service.name} className="border border-border rounded-xl p-3">
                  <p className="text-sm font-semibold text-text mb-1">{service.name}</p>
                  <p className="text-sm text-text-light leading-relaxed">{service.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">4. Data Retention & Deletion</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-text-light leading-relaxed">
              Your data is retained for as long as your account exists. You may delete your account at any
              time from the More / Settings page of the App.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              When you delete your account, all associated couple data is permanently removed from our
              servers — including moments, photos, voice memos, letters, recipes, food spots, goals,
              expenses, and your profile. This action is irreversible.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              If your partner deletes their account while you remain active, the couple link is severed
              but your account data is preserved unless you also choose to delete.
            </p>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-sm text-amber-700 leading-relaxed">
                <span className="font-medium">Note:</span> Media files on Cloudflare CDN may take up to
                30 days to be fully purged from caches after account deletion.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">5. Your Rights</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
            {[
              'Access the data we hold about you by contacting us.',
              'Correct inaccurate profile information directly in the App.',
              'Delete your account and all associated data at any time.',
              'Withdraw consent for push notifications via device settings.',
              'Request a data export by contacting us (see Section 6).',
            ].map((right) => (
              <div key={right} className="flex items-start gap-2 text-sm text-text-light">
                <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                <span className="leading-relaxed">{right}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">6. Contact</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-text-light leading-relaxed mb-3">
              For any privacy-related questions, data requests, or concerns, please contact us at:
            </p>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm font-medium text-text">Love Memories App</p>
              <p className="text-sm text-primary mt-1">privacy@love-memories.app</p>
              <p className="text-sm text-text-light mt-1">
                We aim to respond to all privacy inquiries within 5 business days.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="flex items-center justify-center gap-1.5 text-text-light/50 text-xs">
            <Heart className="w-3 h-3 text-primary/40" />
            <span>Love Memories — Made with love</span>
            <Heart className="w-3 h-3 text-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
