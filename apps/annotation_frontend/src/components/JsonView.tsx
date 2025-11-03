export default function JsonView({ data }: { data: any }) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto text-xs font-mono scrollbar-thin max-h-96">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
