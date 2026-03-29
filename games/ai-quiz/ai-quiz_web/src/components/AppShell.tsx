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
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        {state.currentView === 'home' && <HomeScreen />}
        {state.currentView === 'study' && <StudyMode />}
        {state.currentView === 'quiz' && <QuizMode />}
        {state.currentView === 'results' && <ResultsScreen />}
        {state.currentView === 'review' && <ReviewMode />}
      </main>
    </>
  );
}
