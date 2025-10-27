// import React from 'react';
// import { User, Sparkles } from 'lucide-react';
// import ReactMarkdown from 'react-markdown';

// interface ChatMessageProps {
//   message: {
//     id: string;
//     role: 'user' | 'assistant';
//     content: string;
//     timestamp: Date;
//   };
//   isStreaming?: boolean;
// }

// export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming = false }) => {
//   const isUser = message.role === 'user';

//   return (
//     <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} group mb-8`}>
//       {!isUser && (
//         <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
//           <Sparkles className="w-5 h-5 text-white" />
//         </div>
//       )}

//       <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
//         <div
//           className={`
//             rounded-2xl px-6 py-4 shadow-sm
//             ${isUser
//               ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white ml-auto'
//               : 'bg-white border border-gray-200'
//             }
//             ${isStreaming ? 'opacity-75' : ''}
//           `}
//         >
//           {isUser ? (
//             <p className="text-sm leading-relaxed">{message.content}</p>
//           ) : (
//             <div className="prose prose-sm max-w-none prose-gray">
//               <ReactMarkdown
//                 // Disable automatic table parsing for ASCII-style tables
//                 remarkPlugins={[]}
//                 rehypePlugins={[]}
//                 components={{
//                   // Custom components for better styling
//                   p: ({ children }) => {
//                     // Filter out lines that are just table separators (dashes, pipes, etc.)
//                     if (typeof children === 'string' && /^[\s\-\|\+\=\_\*]+$/.test(children.trim())) {
//                       return null;
//                     }
//                     return <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>;
//                   },
//                   ul: ({ children }) => <ul className="text-sm space-y-2 mb-3 last:mb-0 pl-4 list-disc">{children}</ul>,
//                   ol: ({ children }) => <ol className="text-sm space-y-2 mb-3 last:mb-0 pl-4 list-decimal">{children}</ol>,
//                   li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
//                   h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>,
//                   h2: ({ children }) => <h2 className="text-base font-semibold mb-3 text-gray-900">{children}</h2>,
//                   h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 text-gray-900">{children}</h3>,
//                   h4: ({ children }) => <h4 className="text-sm font-medium mb-2 text-gray-800">{children}</h4>,
//                   code: ({ children }) => <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-mono">{children}</code>,
//                   pre: ({ children }) => <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto mb-3 border border-gray-200">{children}</pre>,
//                   blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-300 pl-4 text-sm italic text-gray-600 mb-3 bg-indigo-50/50 py-2">{children}</blockquote>,
//                   strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
//                   em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
//                   hr: () => <hr className="border-t border-gray-200 my-4" />,
//                   br: () => <br className="my-1" />,

//                   // Enhanced table handling - only for proper markdown tables
//                   table: ({ children }) => (
//                     <div className="overflow-x-auto mb-4 border border-gray-200 rounded-xl shadow-sm bg-white">
//                       <table className="min-w-full text-sm">{children}</table>
//                     </div>
//                   ),
//                   thead: ({ children }) => <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">{children}</thead>,
//                   tbody: ({ children }) => <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>,
//                   tr: ({ children }) => <tr className="hover:bg-gray-50/50 transition-colors">{children}</tr>,
//                   th: ({ children }) => (
//                     <th className="px-6 py-4 text-left font-bold text-gray-900 text-sm border-b border-gray-200">
//                       {children}
//                     </th>
//                   ),
//                   td: ({ children }) => (
//                     <td className="px-6 py-4 text-gray-700 text-sm border-b border-gray-100">
//                       {children}
//                     </td>
//                   ),
//                 }}
//               >
//                 {message.content}
//               </ReactMarkdown>
//             </div>
//           )}
//           {isStreaming && !isUser && (
//             <div className="flex items-center gap-1 mt-2">
//               <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//               <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//               <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//             </div>
//           )}
//         </div>

//         <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
//           {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//         </div>
//       </div>

//       {isUser && (
//         <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center order-1">
//           <User className="w-5 h-5 text-gray-600" />
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useState } from "react";
import { User, Sparkles, Copy, Download, Check, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  };
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-response-${message.timestamp.getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    try {
      const filename = `chat-response-${message.timestamp.getTime()}.pdf`;

      // Parse markdown to HTML
      const htmlContent = await marked.parse(message.content);

      // Create a temporary container with the rendered content
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "800px";
      tempDiv.style.padding = "40px";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      tempDiv.style.color = "#1e293b";
      tempDiv.innerHTML = `
        <div>
          <div style="margin-bottom: 32px; border-bottom: 3px solid #6366f1; padding-bottom: 16px;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a;">AI Assistant Response</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Generated on ${message.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div style="font-size: 14px; line-height: 1.8; color: #334155;">
            ${htmlContent}
          </div>
        </div>
      `;

      // Apply comprehensive CSS styling for all markdown elements
      const style = document.createElement('style');
      style.textContent = `
        #pdf-chat-container h1 { font-size: 24px; font-weight: 700; margin: 28px 0 14px 0; color: #0f172a; line-height: 1.3; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        #pdf-chat-container h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #1e293b; line-height: 1.3; }
        #pdf-chat-container h3 { font-size: 17px; font-weight: 600; margin: 20px 0 10px 0; color: #334155; line-height: 1.3; }
        #pdf-chat-container h4 { font-size: 15px; font-weight: 600; margin: 16px 0 8px 0; color: #475569; line-height: 1.3; }
        #pdf-chat-container h5 { font-size: 14px; font-weight: 600; margin: 14px 0 7px 0; color: #64748b; line-height: 1.3; }
        #pdf-chat-container h6 { font-size: 13px; font-weight: 600; margin: 12px 0 6px 0; color: #64748b; line-height: 1.3; }
        #pdf-chat-container p { margin: 12px 0; line-height: 1.8; color: #334155; }
        #pdf-chat-container ul { margin: 12px 0; padding-left: 24px; list-style-type: disc; }
        #pdf-chat-container ol { margin: 12px 0; padding-left: 24px; list-style-type: decimal; }
        #pdf-chat-container li { margin: 6px 0; line-height: 1.7; color: #334155; }
        #pdf-chat-container li > ul, #pdf-chat-container li > ol { margin: 4px 0; }
        #pdf-chat-container strong { font-weight: 600; color: #0f172a; }
        #pdf-chat-container em { font-style: italic; color: #475569; }
        #pdf-chat-container a { color: #6366f1; text-decoration: underline; }
        #pdf-chat-container code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'Courier New', monospace; color: #be185d; }
        #pdf-chat-container pre { background-color: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; }
        #pdf-chat-container pre code { background-color: transparent; padding: 0; color: #e2e8f0; }
        #pdf-chat-container blockquote { border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; background-color: #eef2ff; padding: 12px 16px; border-radius: 4px; }
        #pdf-chat-container table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px; }
        #pdf-chat-container th { background-color: #6366f1; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
        #pdf-chat-container td { border: 1px solid #e2e8f0; padding: 8px 12px; }
        #pdf-chat-container tr:nth-child(even) { background-color: #f8fafc; }
        #pdf-chat-container hr { border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; }
      `;
      tempDiv.id = 'pdf-chat-container';
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // Wait for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(tempDiv);
      document.head.removeChild(style);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        canvas.width / 2,
        canvas.height / 2
      );
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };


  return (
    <div
      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"} group mb-8`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        <div
          className={`
            rounded-2xl px-6 py-4 shadow-sm
            ${
              isUser
                ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white ml-auto"
                : "bg-white border border-gray-200"
            }
            ${isStreaming ? "opacity-75" : ""}
          `}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm max-w-none prose-gray">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                  // Paragraphs with better spacing
                  p: ({ children }) => {
                    const content = String(children);
                    // Skip rendering lines that are just table separators
                    if (/^[\s\-\|\+\=\_\*]+$/.test(content.trim())) {
                      return null;
                    }
                    return (
                      <p className="text-sm leading-relaxed mb-4 last:mb-0 text-gray-700">
                        {children}
                      </p>
                    );
                  },

                  // Lists with improved styling
                  ul: ({ children }) => (
                    <ul className="text-sm space-y-2 mb-4 last:mb-0 pl-5 list-disc marker:text-indigo-500">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-sm space-y-2 mb-4 last:mb-0 pl-5 list-decimal marker:text-indigo-500 marker:font-semibold">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed text-gray-700 pl-1">
                      {children}
                    </li>
                  ),

                  // Headers with hierarchy
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0 text-gray-900 border-b-2 border-indigo-200 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mb-3 mt-5 first:mt-0 text-gray-900 border-b border-gray-200 pb-1">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mb-2 mt-4 first:mt-0 text-gray-900">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-gray-800">
                      {children}
                    </h4>
                  ),
                  h5: ({ children }) => (
                    <h5 className="text-sm font-medium mb-2 mt-3 first:mt-0 text-gray-800">
                      {children}
                    </h5>
                  ),
                  h6: ({ children }) => (
                    <h6 className="text-sm font-medium mb-2 mt-2 first:mt-0 text-gray-700">
                      {children}
                    </h6>
                  ),

                  // Inline code with better visibility
                  code: ({ inline, className, children }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeContent = String(children).replace(/\n$/, "");

                    return !inline && match ? (
                      <CodeBlock language={match[1]}>{codeContent}</CodeBlock>
                    ) : (
                      <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono border border-indigo-100">
                        {children}
                      </code>
                    );
                  },

                  // Pre blocks for code
                  pre: ({ children }) => (
                    <div className="my-4 rounded-lg overflow-hidden">
                      {children}
                    </div>
                  ),

                  // Blockquotes for customer testimonials
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-400 pl-4 pr-4 py-3 text-sm italic text-gray-700 mb-4 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 rounded-r-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-400 text-2xl leading-none mt-1">
                          "
                        </span>
                        <div className="flex-1">{children}</div>
                      </div>
                    </blockquote>
                  ),

                  // Enhanced emphasis
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-700">{children}</em>
                  ),

                  // Dividers
                  hr: () => <hr className="border-t border-gray-300 my-6" />,

                  // Line breaks
                  br: () => <br className="my-1" />,

                  // Enhanced markdown table support with GFM
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm">
                      <table className="min-w-full text-sm border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children, ...props }) => {
                    const isHeaderRow =
                      props.node?.tagName === "tr" &&
                      props.node?.position?.start.line ===
                        props.node?.position?.end.line;
                    return (
                      <tr
                        className={`${!isHeaderRow ? "hover:bg-indigo-50/30 transition-colors duration-150" : ""}`}
                      >
                        {children}
                      </tr>
                    );
                  },
                  th: ({ children, style }) => (
                    <th
                      className="px-6 py-3 text-left font-bold text-gray-900 text-xs uppercase tracking-wider border-b-2 border-indigo-200"
                      style={style}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, style }) => (
                    <td
                      className="px-6 py-4 text-gray-700 text-sm border-b border-gray-100"
                      style={style}
                    >
                      {children}
                    </td>
                  ),

                  // Links with better styling
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 underline decoration-indigo-300 hover:decoration-indigo-500 transition-colors"
                    >
                      {children}
                    </a>
                  ),

                  // Images with responsive styling
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="max-w-full h-auto rounded-lg shadow-md my-4"
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {isStreaming && !isUser && (
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
              <div
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
              <span className="text-xs text-gray-400 ml-2">
                Analyzing testimonials...
              </span>
            </div>
          )}
        </div>

        <div
          className={`mt-2 flex items-center ${isUser ? "justify-end" : "justify-between"}`}
        >
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Download className="h-3 w-3 mr-1" />
                MD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <FileDown className="h-3 w-3 mr-1" />
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center order-1 shadow-sm">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      )}
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  children: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
  // ALL hooks must be at the top, before any conditional returns
  const [Highlighter, setHighlighter] = React.useState<any>(null);
  const [style, setStyle] = React.useState<any>(null);

  React.useEffect(() => {
    // Dynamically import to avoid TypeScript issues
    import("react-syntax-highlighter").then((mod) => {
      setHighlighter(() => mod.Prism);
    });
  }, []);

  React.useEffect(() => {
    import("react-syntax-highlighter/dist/esm/styles/prism").then((mod) => {
      setStyle(mod.vscDarkPlus);
    });
  }, []);

  if (!Highlighter) {
    // Fallback while loading
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-900">
        <div className="bg-gray-800 px-4 py-2 text-xs text-gray-300 font-mono border-b border-gray-700">
          {language}
        </div>
        <pre className="p-4 text-gray-300 text-xs overflow-x-auto">
          <code>{children}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-300 font-mono border-b border-gray-700">
        {language}
      </div>
      <Highlighter
        language={language}
        style={style || {}}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.813rem",
          lineHeight: "1.5",
          background: "#1e1e1e",
        }}
        children={children}
      />
    </div>
  );
};
