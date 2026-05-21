import React from "react";
import CodeBlock from "./CodeBlock";

interface ResponseShapeProps {
  accepted: Record<string, unknown>;
  rejected: Record<string, unknown>;
}

const ResponseShape: React.FC<ResponseShapeProps> = ({ accepted, rejected }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
            Accepted
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">200 OK</span>
        </div>
        <CodeBlock
          code={JSON.stringify(accepted, null, 2)}
          language="json"
          testId="response-accepted"
          ariaLabel="Accepted response example"
        />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
            Rejected
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">200 OK</span>
        </div>
        <CodeBlock
          code={JSON.stringify(rejected, null, 2)}
          language="json"
          testId="response-rejected"
          ariaLabel="Rejected response example"
        />
      </div>
    </div>
  );
};

export default ResponseShape;
