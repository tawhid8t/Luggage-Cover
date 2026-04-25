import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-7xl mb-6">🧳</div>
        <h1 className="font-heading text-4xl font-black text-brand-navy mb-4">
          Product Not Found
        </h1>
        <p className="text-text-muted mb-8 max-w-md">
          This product doesn&apos;t exist or may have been removed from our catalog.
        </p>
        <Link href="/shop">
          <Button variant="primary" size="lg">
            🛍️ Browse All Designs
          </Button>
        </Link>
      </div>
    </div>
  );
}
