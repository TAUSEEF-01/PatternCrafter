export default function JsonView({ data }: { data: any }) {
  return (
    <pre className="bg-gray-50 border rounded p-3 overflow-auto text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
