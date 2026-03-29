interface Props {
  isCorrect: boolean;
  explanation: string;
}

export default function QuestionFeedback({ isCorrect, explanation }: Props) {
  return (
    <div
      className={`animate-slide-up mt-4 rounded-card border p-4 ${
        isCorrect
          ? 'border-success-500/30 bg-success-50/5'
          : 'border-error-500/30 bg-error-50/5'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {isCorrect ? (
          <span className="text-lg text-success-400">✓ ¡Correcto!</span>
        ) : (
          <span className="text-lg text-error-400">✗ Incorrecto</span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-gray-300">{explanation}</p>
    </div>
  );
}
