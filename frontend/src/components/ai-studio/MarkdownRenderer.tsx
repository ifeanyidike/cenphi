// components/ai-studio/MarkdownRenderer.tsx
const MarkdownRenderer: React.FC<{
  content: string;
  isStreaming?: boolean;
}> = ({ content, isStreaming = false }) => {
  const renderMarkdown = (text: string) => {
    let html = text
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold text-gray-800 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>'
      )
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 rounded-lg p-3 my-3 overflow-x-auto border"><code class="text-sm font-mono text-gray-800">$1</code></pre>'
      )
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 border">$1</code>'
      )
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-gray-700">$1</li>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>'
      )
      .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-3">')
      .replace(/\n/g, "<br>");

    if (
      !html.includes("<p>") &&
      !html.includes("<h1>") &&
      !html.includes("<h2>")
    ) {
      html = `<p class="text-gray-700 leading-relaxed mb-3">${html}</p>`;
    }

    return html;
  };

  return (
    <div className="prose prose-sm max-w-none">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
      {isStreaming && (
        <div className="inline-flex items-center ml-1">
          <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm"></div>
        </div>
      )}
    </div>
  );
};

export default MarkdownRenderer;
