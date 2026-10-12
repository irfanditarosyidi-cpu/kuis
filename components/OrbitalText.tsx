import { Fragment } from "react";
import { describeOrbitalDiagram, parseOrbitalText } from "@/lib/orbital";

export function OrbitalText({ text, className = "" }: { text: string; className?: string }) {
  const segments = parseOrbitalText(text);
  const diagramCount = segments.filter((segment) => segment.type === "diagram").length;
  const standalone = diagramCount === 1 && segments.every((segment) =>
    segment.type === "diagram" || !segment.value.trim(),
  );

  return (
    <span className={`orbital-text ${className}`.trim()}>
      {segments.map((segment, segmentIndex) => segment.type === "text" ? (
        <Fragment key={`text-${segmentIndex}`}>{segment.value}</Fragment>
      ) : (
        <span
          className={`orbital-diagram${standalone ? " orbital-diagram-standalone" : ""}`}
          key={`diagram-${segmentIndex}`}
          role="img"
          aria-label={describeOrbitalDiagram(segment.orbitals)}
          title={segment.source}
        >
          {segment.orbitals.map((orbital, orbitalIndex) => (
            <span className="orbital-box" key={`${orbital}-${orbitalIndex}`} aria-hidden="true">
              <span className="orbital-electrons">
                {[...orbital].map((electron, electronIndex) => (
                  <span className="orbital-electron" key={`${electron}-${electronIndex}`}>{electron}</span>
                ))}
              </span>
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
