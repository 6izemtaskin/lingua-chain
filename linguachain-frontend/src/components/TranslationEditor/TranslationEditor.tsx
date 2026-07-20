import { useMemo } from "react";
import styles from "./TranslationEditor.module.css";

export interface TranslationEditorProps {
  /** The passage to be translated, shown on the verso (left) page. */
  sourceText: string;
  /** Label for the source language, e.g. "Latin". */
  sourceLanguageLabel: string;
  /** Label for the target language, e.g. "English". */
  targetLanguageLabel: string;
  /** Current value of the translation, controlled by the parent. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the reader submits their translation for certification. */
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  /** Short framing line above the spread, e.g. the work being translated. */
  prompt?: string;
}

/**
 * A translation workspace styled as an open bilingual edition: the source
 * sits on the verso page, the reader's translation on the recto, divided
 * by a printed spine — rather than a source/target form pair.
 */
export function TranslationEditor({
  sourceText,
  sourceLanguageLabel,
  targetLanguageLabel,
  value,
  onChange,
  onSubmit,
  isSubmitting = false,
  error = null,
  prompt,
}: TranslationEditorProps) {
  const wordCount = useMemo(
    () => (value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length),
    [value]
  );

  const canSubmit = wordCount > 0 && !isSubmitting;

  return (
    <section className={styles.editor} aria-label="Translation editor">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            {sourceLanguageLabel} → {targetLanguageLabel}
          </span>
          {prompt && <h2 className={styles.prompt}>{prompt}</h2>}
        </div>
      </header>

      <div className={styles.spread}>
        <div className={styles.page}>
          <span className={styles.pageLabel}>Original — {sourceLanguageLabel}</span>
          <p className={styles.sourceText}>{sourceText}</p>
        </div>

        <div className={styles.spine} aria-hidden="true" />

        <div className={styles.page}>
          <span className={styles.pageLabel}>
            Your translation — {targetLanguageLabel}
          </span>
          <textarea
            className={styles.textarea}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Begin your translation here…"
            disabled={isSubmitting}
            aria-label={`Translation into ${targetLanguageLabel}`}
          />
        </div>
      </div>

      <div className={styles.colophon}>
        <span className={styles.wordCount}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>

        {isSubmitting ? (
          <span className={styles.status}>Recording on-chain…</span>
        ) : (
          <button
            type="button"
            className={styles.submit}
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            Submit for certification
          </button>
        )}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
