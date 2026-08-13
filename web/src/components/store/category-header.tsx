import { PawPrint } from "lucide-react";

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
}

export function CategoryHeader({ title }: CategoryHeaderProps) {
  return (
    <section className="relative w-full min-h-48 md:min-h-56 bg-linear-to-b from-[#ddf0fb] to-[#F0F8FF] flex items-center justify-center overflow-hidden rounded-b-[2rem] md:rounded-b-[3.5rem]">
      {/* Decorative Paw Print SVGs */}
      <PawPrint
        className="absolute -right-8 top-4 text-[#B2E2FF] opacity-40 rotate-12 pointer-events-none"
        style={{ width: "180px", height: "180px" }}
      />
      <PawPrint
        className="absolute left-4 bottom-2 text-[#B2E2FF] opacity-20 -rotate-12 pointer-events-none"
        style={{ width: "120px", height: "120px" }}
      />
      <PawPrint
        className="absolute right-1/3 bottom-0 text-[#B2E2FF] opacity-10 pointer-events-none"
        style={{ width: "220px", height: "220px" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 md:py-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>
      </div>
    </section>
  );
}
