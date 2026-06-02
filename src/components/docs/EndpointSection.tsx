interface FieldDoc {
  name: string;
  desc: string;
}

interface Props {
  method: "GET" | "POST" | "DELETE";
  path: string;
  title: string;
  description: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  multipart?: boolean;
  fields?: FieldDoc[];
}

const METHOD_TONE: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  POST: "bg-green-500/15 text-green-300 border-green-500/30",
  DELETE: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function EndpointSection({
  method, path, title, description, request, response, multipart, fields,
}: Props) {
  return (
    <div className="mb-6 rounded-xl bg-[#111118] border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${METHOD_TONE[method]}`}>
          {method}
        </span>
        <code className="text-xs font-mono text-white">{path}</code>
        <span className="text-xs text-gray-500 ml-auto">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-300">{description}</p>

        {multipart && fields && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Form-data alanları</p>
            <ul className="space-y-1">
              {fields.map((f) => (
                <li key={f.name} className="text-xs flex gap-3">
                  <code className="font-mono text-emerald-300 flex-shrink-0">{f.name}</code>
                  <span className="text-gray-400">{f.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {request && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">İstek (JSON)</p>
            <pre className="p-3 rounded-lg bg-[#0a0a10] border border-white/5 text-[12px] font-mono text-gray-300 overflow-x-auto">
              <code>{JSON.stringify(request, null, 2)}</code>
            </pre>
          </div>
        )}

        {response && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Cevap (200 OK)</p>
            <pre className="p-3 rounded-lg bg-[#0a0a10] border border-emerald-500/15 text-[12px] font-mono text-emerald-200 overflow-x-auto">
              <code>{JSON.stringify(response, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
