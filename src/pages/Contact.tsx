import { SiteNav } from "@/components/SiteNav";
import { Link } from "react-router";
import { Mail, MapPin, Clock, Phone } from "lucide-react";
import { ContactForm } from "@/components/ui/contact-form";

export default function Contact() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <section className="ow-page-hero px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-medium text-blue-100">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-4xl">Get in touch</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-50">
            We usually reply within one business day. For support, feature requests, or anything else, send a message through the form below.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-slate-50 p-6">
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <Mail className="size-5 shrink-0 text-[#0066cc]" />
                  <div>
                    <p className="font-medium">Support email</p>
                    <p>support@openworlds.dk</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="size-5 shrink-0 text-[#0066cc]" />
                  <div>
                    <p className="font-medium">Mailing address</p>
                    <p>OpenWorlds Community<br />Copenhagen, Denmark</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="size-5 shrink-0 text-[#0066cc]" />
                  <div>
                    <p className="font-medium">Response time</p>
                    <p>Usually within one business day</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="size-5 shrink-0 text-[#0066cc]" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>To be added once an official phone line exists.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold">Frequently asked questions</h2>
              <p className="mt-1 text-sm text-slate-600">Common support topics and short answers.</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-900">How do I report a bug?</dt>
                  <dd className="mt-1 text-sm text-slate-600">Use the contact form above and include your operating system, browser, and steps to reproduce.</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Can you help me with a role application?</dt>
                  <dd className="mt-1 text-sm text-slate-600">Application support is handled through the open careers pages.</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Where can I play the game?</dt>
                  <dd className="mt-1 text-sm text-slate-600">Official downloads and platforms are listed on the Downloads page.</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">How do I stay updated?</dt>
                  <dd className="mt-1 text-sm text-slate-600">Follow the official Discord and YouTube channels.</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 border-t-2 border-t-[#7651c9] bg-gradient-to-br from-white to-slate-50 p-6 sm:p-7">
            <h2 className="font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your message is delivered to the support team at <a href="mailto:support@openworlds.dk" className="text-[#0066cc] hover:underline">support@openworlds.dk</a>. We only use it to respond to your question.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-5 text-center text-sm text-slate-500">
        OpenWorlds © 2026 · All rights reserved.
      </footer>
    </main>
  );
}
