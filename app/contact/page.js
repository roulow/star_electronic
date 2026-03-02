/** @format */

import StarBackground from "@/components/StarBackground";
import ContactForm from "../../components/ContactForm";

export const metadata = { title: "Contact - Star Electronic" };

export default function ContactPage() {
  return (
    <>
          <StarBackground />
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Contact us</h1>
      <p className="text-muted-foreground mb-8">
        Tell us about your needs and we’ll respond within one business day.
      </p>
      <ContactForm />
    </div>
    </>
  );
}
