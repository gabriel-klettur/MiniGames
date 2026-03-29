import { useI18n } from '../../i18n';

interface Props {
  isCorrect: boolean;
  explanation: string;
}

export default function QuestionFeedback({ isCorrect, explanation }: Props) {
  const { t } = useI18n();

  return (
    <div
      className={`animate-slide-up mt-4 rounded-card border p-4 backdrop-blur-sm ${
        isCorrect
          ? 'border-success-500/20 bg-success-500/[0.06] shadow-glow-success'
          : 'border-error-500/20 bg-error-500/[0.06] shadow-glow-error'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {isCorrect ? (
          <span className="text-sm font-semibold text-success-400">{t('feedback_correct')}</span>
        ) : (
          <span className="text-sm font-semibold text-error-400">{t('feedback_incorrect')}</span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-gray-400">{explanation}</p>
    </div>
  );
}
