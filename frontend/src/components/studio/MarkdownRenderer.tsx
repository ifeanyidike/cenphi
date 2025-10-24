import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  CheckCircle2,
  Circle,
  Quote,
} from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6 pb-2 border-b-2 border-slate-200 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-slate-900 mb-3 mt-5 pb-2 border-b border-slate-100">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-4">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold text-slate-900 mb-2 mt-3">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-sm font-semibold text-slate-900 mb-2 mt-3">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="text-sm font-semibold text-slate-700 mb-2 mt-3">
            {children}
          </h6>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-none space-y-2 mb-4 ml-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-2 mb-4 ml-2 marker:text-slate-600 marker:font-medium">
            {children}
          </ol>
        ),
        li: ({ children }) => {
          // Check if this is a task list item
          const isTaskList = React.Children.toArray(children).some(
            (child) =>
              React.isValidElement(child) &&
              child.type === 'input' &&
              (child.props as any).type === 'checkbox'
          );

          if (isTaskList) {
            const checked = React.Children.toArray(children).some(
              (child) =>
                React.isValidElement(child) &&
                child.type === 'input' &&
                (child.props as any).checked
            );

            return (
              <li className="flex items-start gap-2 text-sm">
                {checked ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                )}
                <span className={checked ? 'text-slate-500 line-through' : 'text-slate-700'}>
                  {React.Children.toArray(children).filter(
                    (child) => !(React.isValidElement(child) && child.type === 'input')
                  )}
                </span>
              </li>
            );
          }

          return (
            <li className="text-sm text-slate-700">
              {children}
            </li>
          );
        },

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 pr-4 py-3 mb-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm text-slate-700 italic">
                {children}
              </div>
            </div>
          </blockquote>
        ),

        // Code blocks
        code: ({ inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          return !inline && match ? (
            <CodeBlock language={language}>{String(children).replace(/\n$/, '')}</CodeBlock>
          ) : (
            <code
              className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-200"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
          >
            {children}
          </a>
        ),

        // Images
        img: ({ src, alt }) => (
          <div className="my-4">
            <img
              src={src}
              alt={alt}
              className="rounded-lg border border-slate-200 max-w-full h-auto"
            />
            {alt && (
              <p className="text-xs text-slate-600 text-center mt-2 italic">
                {alt}
              </p>
            )}
          </div>
        ),

        // Tables
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto">
            <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-slate-50 border-b border-slate-200">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-slate-200">
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-slate-50 transition-colors">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-900">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-slate-700">
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-6 border-t-2 border-slate-200" />
        ),

        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-slate-900">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-700">
            {children}
          </em>
        ),

        // Strikethrough
        del: ({ children }) => (
          <del className="line-through text-slate-500">
            {children}
          </del>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Separate CodeBlock component to handle dynamic imports
interface CodeBlockProps {
  language: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  const [Highlighter, setHighlighter] = React.useState<any>(null);
  const [style, setStyle] = React.useState<any>(null);

  React.useEffect(() => {
    // Dynamically import to avoid TypeScript issues
    import('react-syntax-highlighter').then((mod) => {
      setHighlighter(() => mod.Prism);
    });
    import('react-syntax-highlighter/dist/esm/styles/prism').then((mod) => {
      setStyle(mod.oneDark);
    });
  }, []);

  if (!Highlighter || !style) {
    // Fallback while loading
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
        <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 font-medium border-b border-slate-700">
          {language}
        </div>
        <pre className="p-4 text-slate-300 text-xs overflow-x-auto">
          <code>{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-slate-200">
      <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 font-medium border-b border-slate-700">
        {language}
      </div>
      <Highlighter
        language={language}
        style={style}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.813rem',
          lineHeight: '1.5',
          background: '#1e293b',
        }}
      >
        {children}
      </Highlighter>
    </div>
  );
};
