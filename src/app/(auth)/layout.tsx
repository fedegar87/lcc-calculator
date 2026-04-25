import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center bg-muted/40 px-4">
        {children}
      </div>
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/visuals/auth_cover.png"
          alt="Architects collaborating on digital blueprint"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
