import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXComponents } from "mdx/types";
import remarkGfm from "remark-gfm";

const components: MDXComponents = {
  h2: (props) => <h2 className="font-display mt-8 mb-2" style={{ fontSize: "var(--fs-h2)" }} {...props} />,
  h3: (props) => <h3 className="font-display mt-6 mb-2 font-medium" style={{ fontSize: "18px" }} {...props} />,
  p: (props) => <p className="mt-3" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }} {...props} />,
  ul: (props) => <ul className="mt-3 ml-5 list-disc space-y-1.5" style={{ fontSize: "var(--fs-body)" }} {...props} />,
  ol: (props) => <ol className="mt-3 ml-5 list-decimal space-y-1.5" style={{ fontSize: "var(--fs-body)" }} {...props} />,
  li: (props) => <li {...props} />,
  table: (props) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border-b-2 px-3 py-2 text-left tracked-caps text-xs" style={{ borderColor: "var(--ink)" }} {...props} />
  ),
  td: (props) => <td className="border-b px-3 py-2" style={{ borderColor: "var(--line)" }} {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  a: (props) => <a className="underline hover:opacity-70" {...props} />,
};

export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
    />
  );
}
