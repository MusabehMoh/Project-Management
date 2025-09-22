import { title } from "@/components/primitives";
import { usePageTitle } from "@/hooks";

export default function DocsPage() {
  // Set page title
  usePageTitle("docs.title");
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Docs</h1>
      </div>
    </section>
  );
}
