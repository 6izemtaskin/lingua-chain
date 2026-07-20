import { useId } from "react";
import styles from "./CertificateCard.module.css";

export interface CertificateCardProps {
  id: number;
  owner: string;
  score: number;
  issuedAt: number;
  reference: string;
  explorerUrl?: string;
  status?: "confirmed" | "pending";
}

function truncateMiddle(value: string, headTail = 4): string {
  if (value.length <= headTail * 2 + 3) return value;
  return `${value.slice(0, headTail)}…${value.slice(-headTail)}`;
}

function formatIssuedDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CertificateCard({
  id,
  owner,
  score,
  issuedAt,
  reference,
  explorerUrl,
  status = "confirmed",
}: CertificateCardProps) {
  const ringPathId = useId();
  const ringLabel = `CERT · ${truncateMiddle(reference, 5).toUpperCase()} ·`;

  return (
    <article className={styles.card} aria-label={`Certificate ${id}`}>
      <div>
        <span className={styles.eyebrow}>Certificate of Translation</span>
        <h3 className={styles.title}>No. {String(id).padStart(4, "0")}</h3>

        <dl className={styles.metaList}>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Issued to</dt>
            <dd className={styles.metaValue}>{truncateMiddle(owner, 6)}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Issued on</dt>
            <dd className={styles.metaValue}>{formatIssuedDate(issuedAt)}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Reference</dt>
            <dd className={styles.metaValue} style={{ fontSize: "0.6rem", wordBreak: "break-all" }}>{reference}</dd>
          </div>
        </dl>

        <div>
          <span className={styles.score}>{score}</span>
          <span className={styles.scoreUnit}>/ 100</span>
        </div>

        {explorerUrl && (
          <>
            <hr className={styles.footRule} />
            <a
              className={styles.explorerLink}
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              View on StellarChain.io
            </a>
          </>
        )}
      </div>

      <svg
        className={styles.seal}
        viewBox="0 0 100 100"
        role="img"
        aria-label={
          status === "confirmed"
            ? "On-chain verification seal, confirmed"
            : "On-chain verification seal, pending confirmation"
        }
      >
        <defs>
          <path
            id={ringPathId}
            d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
          />
        </defs>

        <circle
          className={styles.sealRing}
          cx="50"
          cy="50"
          r="46"
          opacity={status === "confirmed" ? 1 : 0.35}
        />
        <circle
          className={`${styles.sealDisc} ${
            status === "pending" ? styles.sealPending : ""
          }`}
          cx="50"
          cy="50"
          r="38"
        />
        <text className={styles.sealRingText}>
          <textPath href={`#${ringPathId}`} startOffset="0%">
            {ringLabel.repeat(2)}
          </textPath>
        </text>
        <text
          className={styles.sealGlyph}
          x="50"
          y="58"
          textAnchor="middle"
        >
          {status === "confirmed" ? "L" : "…"}
        </text>
      </svg>
    </article>
  );
}