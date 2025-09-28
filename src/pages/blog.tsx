import { title } from "@/components/primitives";
import { usePageTitle } from "@/hooks";

export default function BlogPage() {
  // Set page title
  usePageTitle("blog.title");

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>Blog</h1>
      </div>
    </section>
  );
}
