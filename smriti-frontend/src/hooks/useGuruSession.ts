import { useCallback } from 'react';
import { startGuruSession, respondToGuru } from '@/api/guru';
import { useGuruStore } from '@/stores/guruStore';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';

export function useGuruSession() {
  const { session, setSession, updateSession, isStarting, setIsStarting, isSubmitting, setIsSubmitting,
    expertAnswer, setExpertAnswer, clearAnswer, displayedDebtScore, setDisplayedDebtScore } = useGuruStore();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const startSession = useCallback(async (assetId: string, expertName: string) => {
    setIsStarting(true);
    try {
      const result = await startGuruSession({ asset_id: assetId, expert_name: expertName });
      // The API returns { session_id, asset_id, expert_name, first_question, initial_debt_score }
      // We need to construct a session object
      const session = {
        session_id: result.session_id,
        asset_id: result.asset_id,
        expert_name: result.expert_name,
        started_at: new Date().toISOString(),
        messages: result.first_question
          ? [{ role: 'interviewer' as const, content: result.first_question, timestamp: new Date().toISOString(), embedded: false, item_id: null }]
          : [],
        questions_asked: result.first_question ? 1 : 0,
        knowledge_added: 0,
        initial_debt_score: result.initial_debt_score ?? 0,
        current_debt_score: result.initial_debt_score ?? 0,
        status: 'active' as const,
      };
      setSession(session);
      setDisplayedDebtScore(session.initial_debt_score);
      addToast({ variant: 'success', message: `Guru Mode started for ${assetId}` });
    } catch (err: any) {
      addToast({ variant: 'error', message: err?.message ?? 'Failed to start Guru Mode session' });
    } finally {
      setIsStarting(false);
    }
  }, [setSession, setIsStarting, setDisplayedDebtScore, addToast]);

  const submitAnswer = useCallback(async () => {
    if (!session || !expertAnswer.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await respondToGuru({
        session_id: session.session_id,
        answer: expertAnswer,
      });
      clearAnswer();
      updateSession({
        current_debt_score: result.current_debt_score,
        knowledge_added: (session.knowledge_added ?? 0) + result.knowledge_added,
        messages: result.session.messages,
        questions_asked: result.session.questions_asked,
      });
      // Animate score change
      setDisplayedDebtScore(result.current_debt_score);
      // Invalidate asset cache to refresh debt scores
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      if (result.current_debt_score < displayedDebtScore) {
        addToast({ variant: 'success', message: `Debt score reduced by ${displayedDebtScore - result.current_debt_score} points!` });
      }
    } catch (err: any) {
      addToast({ variant: 'error', message: err?.message ?? 'Failed to submit answer' });
    } finally {
      setIsSubmitting(false);
    }
  }, [session, expertAnswer, clearAnswer, updateSession, setDisplayedDebtScore, addToast, queryClient, displayedDebtScore]);

  const endSession = useCallback(() => {
    setSession(null);
    clearAnswer();
  }, [setSession, clearAnswer]);

  return {
    session,
    isStarting,
    isSubmitting,
    expertAnswer,
    setExpertAnswer,
    displayedDebtScore,
    startSession,
    submitAnswer,
    endSession,
  };
}
