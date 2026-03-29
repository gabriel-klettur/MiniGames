import { useQuiz } from '../contexts/QuizContext';
import { useQuizPersistence } from '../hooks/useQuizPersistence';
import Header from './Header';
import HomeScreen from './Home/HomeScreen';
import StudyMode from './Study/StudyMode';
import QuizMode from './Quiz/QuizMode';
import ResultsScreen from './Results/ResultsScreen';
import ReviewMode from './Review/ReviewMode';

export default function AppShell() {
  const { state, dispatch } = useQuiz();
  useQuizPersistence(state, dispatch);

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Background gradient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-orb animate-glow-pulse absolute -left-32 top-1/4 h-[420px] w-[420px] bg-brand-600/[0.07]" />
        <div className="bg-orb animate-glow-pulse absolute -right-24 top-2/3 h-[350px] w-[350px] bg-purple-600/[0.05]" style={{ animationDelay: '1.5s' }} />
        <div className="bg-orb animate-glow-pulse absolute left-1/3 -top-20 h-[280px] w-[280px] bg-brand-400/[0.04]" style={{ animationDelay: '3s' }} />
      </div>

      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-8 sm:px-6">
        {state.currentView === 'home' && <HomeScreen />}
        {state.currentView === 'study' && <StudyMode />}
        {state.currentView === 'quiz' && <QuizMode />}
        {state.currentView === 'results' && <ResultsScreen />}
        {state.currentView === 'review' && <ReviewMode />}
      </main>
    </div>
  );
}
