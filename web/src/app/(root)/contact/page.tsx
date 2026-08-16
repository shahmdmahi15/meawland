"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      toast.success(
        "Thank you! Your message has been received. Our team will contact you within 24 hours.",
      );
    }, 800);
  };

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Header */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            24/7 Dedicated Support
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Get in Touch with{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              MEAWLAND
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-lg mx-auto">
            Have questions about an order, need sizing advice for pet clothes,
            or looking for product guidance? We&apos;re always here for you and
            your pets.
          </p>
        </div>
      </section>

      {/* Main Form & Info Grid */}
      <div className="container max-w-6xl px-4 sm:px-6 md:px-8 mx-auto mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Direct Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Contact Information
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                Reach out directly via WhatsApp, phone, or email. We typically
                respond within 1–2 hours during business hours.
              </p>
            </div>

            {/* Direct Cards */}
            <div className="space-y-4">
              {/* WhatsApp Card */}
              <a
                href="https://wa.me/8801886070809"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F8FF] hover:bg-emerald-50 border border-[#D4EEFC] hover:border-emerald-200 transition-all shadow-2xs group"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-[#D4EEFC] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">
                    Live Chat on WhatsApp
                  </span>
                  <span className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors">
                    +880 1886-070809
                  </span>
                </div>
              </a>

              {/* Phone Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F8FF] border border-[#D4EEFC] shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#D4EEFC] text-[#56C8D8] flex items-center justify-center shrink-0 shadow-2xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">
                    Direct Phone Helpline
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    +880 1886-070809
                  </span>
                </div>
              </div>

              {/* Email Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F8FF] border border-[#D4EEFC] shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#D4EEFC] text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">
                    Email Inquiries
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    support@meawland.com
                  </span>
                </div>
              </div>

              {/* Address Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F8FF] border border-[#D4EEFC] shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#D4EEFC] text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">
                    Headquarters
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    Dhaka, Bangladesh
                  </span>
                </div>
              </div>

              {/* Hours Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F0F8FF] border border-[#D4EEFC] shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#D4EEFC] text-purple-500 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 block uppercase">
                    Operating Hours
                  </span>
                  <span className="text-xs font-black text-gray-800">
                    Sat – Thu: 9:00 AM – 10:00 PM (Friday: 2:00 PM – 10:00 PM)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7 bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl md:rounded-[2.5rem] p-6 sm:p-10 shadow-xs">
            {isSent ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-sm mx-auto">
                  Thank you for reaching out. A pet-care specialist has received
                  your message and will contact you shortly.
                </p>
                <Button
                  onClick={() => {
                    setIsSent(false);
                    setName("");
                    setEmail("");
                    setPhone("");
                    setSubject("");
                    setMessage("");
                  }}
                  variant="outline"
                  className="rounded-full font-bold border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold">
                    Fill out the form below and we&apos;ll get back to you
                    promptly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mahir Ahmed"
                      required
                      className="bg-white rounded-xl text-xs h-10 border-gray-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      required
                      className="bg-white rounded-xl text-xs h-10 border-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +880 1812-345678"
                      className="bg-white rounded-xl text-xs h-10 border-gray-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      Subject
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Sizing Advice / Order Query"
                      className="bg-white rounded-xl text-xs h-10 border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or order details..."
                    required
                    className="bg-white rounded-xl text-xs border-gray-200"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl py-3 shadow-md cursor-pointer border-0 mt-2 gap-2"
                >
                  {isSubmitting ? (
                    <span>Sending Message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
