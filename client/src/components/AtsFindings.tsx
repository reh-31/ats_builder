import { useState } from "react";
import type { AtsKeywords } from "../types";

interface Props {
  jdKeywords: string[];
  before: AtsKeywords | null;
  after: AtsKeywords;
}

function StatusDot({ found }: { found: boolean }) {
  return (
    <span className={found ? "status found" : "status missing-status"}>
      <span className="dot" />
      {found ? "Found" : "Missing"}
    </span>
  );
}

const PREVIEW_COUNT = 12;

export function AtsFindings({ jdKeywords, before, after }: Props) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? jdKeywords : jdKeywords.slice(0, PREVIEW_COUNT);

  return (
    <div className="findings">
      <table className="findings-table">
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Base CV</th>
            <th>Tailored</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((kw) => (
            <tr key={kw}>
              <td className="kw">{kw}</td>
              <td>{before ? <StatusDot found={before.matched.includes(kw)} /> : "—"}</td>
              <td>
                <StatusDot found={after.matched.includes(kw)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {jdKeywords.length > PREVIEW_COUNT && (
        <button type="button" className="ghost wide" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show fewer" : `View all ${jdKeywords.length} keywords`}
        </button>
      )}
    </div>
  );
}
