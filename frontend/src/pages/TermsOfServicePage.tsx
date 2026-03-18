import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <span className="font-heading text-base font-semibold text-text">Terms of Service</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        <div>
          <h1 className="font-heading text-2xl font-bold text-text mb-1">Terms of Service</h1>
          <p className="text-sm text-text-light">Last updated: March 13, 2026</p>
        </div>

        <p className="text-sm text-text leading-relaxed">
          These Terms of Service ("Terms") govern your use of the Memoura application ("the App").
          By creating an account or using the App, you agree to these Terms. Please read them carefully.
        </p>

        {/* Section 1 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">1. Service Description</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-text-light leading-relaxed mb-3">
              Memoura is a personal couples application that provides:
            </p>
            <ul className="space-y-2">
              {[
                'Shared memory storage — Moments, photos, voice memos, and Love Letters.',
                'Food Spot tracking with an interactive map.',
                'Shared goal management via Scrum-style Sprints.',
                'Recipe collection and meal planning (What to Eat).',
                'Date planning and shared calendar features.',
                'Daily Q&A prompts to strengthen your connection.',
                'Monthly and weekly recap summaries.',
                'Photo Booth with couple frames.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-text-light leading-relaxed mt-3">
              The App is intended for personal, non-commercial use by couples (two people in a shared couple account).
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">2. Acceptable Use</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">You may:</h3>
              <ul className="space-y-1.5">
                {[
                  'Use the App for personal couple memories and organization.',
                  'Invite exactly one partner to share your couple account.',
                  'Share content within the App using the share link feature.',
                  'Export or back up your own data.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">You may not:</h3>
              <ul className="space-y-1.5">
                {[
                  'Use the App for any commercial, business, or public-facing purpose.',
                  'Upload illegal content including CSAM, copyrighted material without permission, or content promoting violence.',
                  'Attempt to access, modify, or disrupt the App\'s backend infrastructure.',
                  'Create multiple couple accounts to circumvent free tier limits.',
                  'Share your account credentials with anyone outside your couple.',
                  'Use the App to harass, stalk, or harm your partner or others.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">3. User Content & Ownership</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-text-light leading-relaxed">
              <span className="font-medium text-text">You own your content.</span> All photos, voice memos,
              letters, recipes, and other content you create in the App remain your property.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              By uploading content, you grant Memoura a limited, non-exclusive license to store,
              process, and display that content solely for the purpose of providing the App's features to you
              and your partner. We do not claim ownership of, or any rights to, your content beyond what is
              necessary to operate the App.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              You are solely responsible for the content you upload. You confirm that you have the right to
              share any photos or recordings you add to the App.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">4. Subscription & Pricing</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Free Tier</h3>
              <p className="text-sm text-text-light leading-relaxed">
                The Free tier includes limited access to core App features with the following caps:
              </p>
              <ul className="mt-2 space-y-1.5">
                {[
                  'Up to 10 Moments',
                  'Up to 3 active Sprints',
                  'Up to 10 Food Spots',
                  'Up to 5 Recipes',
                  'Up to 10 Love Letters',
                  'Up to 20 Expenses',
                  'Basic Photo Booth (2 frames)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <span className="text-text-light/50 mt-0.5 flex-shrink-0">–</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-2">Memoura Plus</h3>
              <p className="text-sm text-text-light leading-relaxed">
                The Plus subscription unlocks unlimited access to all features, higher storage limits,
                premium Photo Booth frames, and priority support. Subscription terms:
              </p>
              <ul className="mt-2 space-y-1.5">
                {[
                  'Billed monthly or annually (pricing shown in-app at time of purchase).',
                  'Subscriptions are managed through the App Store or Google Play via RevenueCat.',
                  'Cancellations take effect at the end of the current billing period.',
                  'No refunds are provided for partial subscription periods, except where required by law.',
                  'Pricing may change with 30 days\' notice.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-light">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">5. Termination & Account Deletion</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-text-light leading-relaxed">
              <span className="font-medium text-text">You may delete your account at any time</span> from
              the More / Settings page. Deletion permanently removes all your data and cannot be undone.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms, including
              uploading illegal content, attempting to hack or misuse the App, or engaging in abusive behavior.
              We will notify you by email before suspension except in cases of serious violations.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              Upon termination (by you or us), your license to use the App ends immediately. Sections 3
              (Content Ownership), 6 (Limitation of Liability), and 7 (Governing Law) survive termination.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">6. Limitation of Liability</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
            <p className="text-sm text-text-light leading-relaxed">
              The App is provided "as is" without warranties of any kind. We do not guarantee uninterrupted
              availability, data loss prevention, or that all features will function perfectly at all times.
            </p>
            <p className="text-sm text-text-light leading-relaxed">
              To the maximum extent permitted by law, Memoura shall not be liable for any indirect,
              incidental, or consequential damages arising from your use of the App, including loss of
              data or memories.
            </p>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm text-text-light leading-relaxed">
                <span className="font-medium text-text">We strongly recommend</span> keeping personal
                backups of photos and content that are important to you, as no cloud service can guarantee
                100% data durability.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">7. Governing Law</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-text-light leading-relaxed">
              These Terms are governed by the laws of Vietnam. Any disputes arising from your use of the
              App shall be resolved through good-faith negotiation first. If a resolution cannot be reached,
              disputes shall be submitted to the competent courts of Ho Chi Minh City, Vietnam.
            </p>
          </div>
        </section>

        {/* Section 8 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">8. Changes to These Terms</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-text-light leading-relaxed">
              We may update these Terms from time to time. When we do, we will update the "Last updated"
              date above and notify you via the App or email. Continued use of the App after changes
              constitutes acceptance of the updated Terms.
            </p>
          </div>
        </section>

        {/* Section 9 */}
        <section>
          <h2 className="font-heading text-lg font-semibold text-text mb-3">9. Contact</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-text-light leading-relaxed mb-3">
              Questions about these Terms or the App? Contact us at:
            </p>
            <div className="bg-primary/5 rounded-xl p-4">
              <p className="text-sm font-medium text-text">Memoura App</p>
              <p className="text-sm text-primary mt-1">support@memoura.app</p>
              <p className="text-sm text-text-light mt-1">
                We aim to respond to all inquiries within 5 business days.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <div className="flex items-center justify-center gap-1.5 text-text-light/50 text-xs">
            <Heart className="w-3 h-3 text-primary/40" />
            <span>Memoura — Made with love</span>
            <Heart className="w-3 h-3 text-primary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
