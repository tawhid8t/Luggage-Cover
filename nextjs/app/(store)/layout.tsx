import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ToastContainer } from "@/components/ui/toast";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden max-w-full">
      <Navbar />
      <main className="overflow-x-hidden">{children}</main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
