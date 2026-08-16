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

export function ContactView() {
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
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      toast.success(
        "Thank you! Your message has been received. Our team will contact you shortly.",
      );
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Banner */}
      <section className="w-full pt-28 sm:pt-32 md:pt-36 pb-10 bg-linear-to-b from-[#ddf0fb] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[3.5rem] flex items-center justify-center overflow-hidden px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            24/7 Dedicated Support
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Contact{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Us
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-lg mx-auto">
            Have questions about cat food, sizes, or your delivery? We are here
            to help your pets stay happy and healthy.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="container max-w-6xl px-4 sm:px-6 md:px-8 mx-auto mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Get in Touch
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  Reach out to us through any of our official communication
                  channels.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                  <div className="p-2.5 rounded-xl bg-[#56C8D8]/10 text-[#56C8D8] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                      Call & WhatsApp
                    </span>
                    <a
                      href="tel:+8801700000000"
                      className="text-sm font-black text-gray-900 hover:text-[#56C8D8] transition-colors"
                    >
                      +880 1700-000000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                  <div className="p-2.5 rounded-xl bg-[#56C8D8]/10 text-[#56C8D8] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                      Email Support
                    </span>
                    <a
                      href="mailto:support@meawland.com"
                      className="text-sm font-black text-gray-900 hover:text-[#56C8D8] transition-colors"
                    >
                      support@meawland.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                  <div className="p-2.5 rounded-xl bg-[#56C8D8]/10 text-[#56C8D8] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                      Our Location
                    </span>
                    <p className="text-sm font-black text-gray-900">
                      House #12, Road #4, Dhanmondi, Dhaka 1205
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs">
                  <div className="p-2.5 rounded-xl bg-[#56C8D8]/10 text-[#56C8D8] shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                      Support Hours
                    </span>
                    <p className="text-sm font-black text-gray-900">
                      Saturday – Thursday: 9:00 AM – 10:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-xs font-black text-emerald-950">
                      Fastest response on WhatsApp
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Usually replies within 15 minutes
                    </p>
                  </div>
                </div>
                <a
                  href="https://wa.me/8801700000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Chat Now
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Form Card */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Fill out the form below and we will get back to you promptly.
              </p>
            </div>

            {isSent ? (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-black text-emerald-950">
                  Message Sent Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 font-medium max-w-sm mx-auto">
                  Thank you for reaching out. A customer support specialist will
                  respond via email or phone within 2 hours.
                </p>
                <Button
                  onClick={() => setIsSent(false)}
                  className="mt-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="rounded-xl border-gray-200 text-xs sm:text-sm h-11"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. tanvir@example.com"
                      className="rounded-xl border-gray-200 text-xs sm:text-sm h-11"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Phone / WhatsApp Number
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01712345678"
                      className="rounded-xl border-gray-200 text-xs sm:text-sm h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Inquiry Topic
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Product Inquiry / Order Status"
                      className="rounded-xl border-gray-200 text-xs sm:text-sm h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help you and your pet..."
                    className="rounded-xl border-gray-200 text-xs sm:text-sm"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 rounded-full bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs uppercase tracking-wider h-11 shadow-md gap-2 border-0 cursor-pointer"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
