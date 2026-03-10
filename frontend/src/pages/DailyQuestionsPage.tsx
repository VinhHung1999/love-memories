import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, Send, History, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { dailyQuestionsApi } from '../lib/api';
import type { DailyQuestionHistoryItem } from '../types';
import { useModuleTour } from '../lib/useModuleTour';

const CATEGORY_EMOJI: Record<string, string> = {
  general: '💬',
  deep: '🌊',
  fun: '🎉',
  future: '🔮',
  memory: '💭',
  romantic: '💕',
  dream: '✨',
};

export default function DailyQuestionsPage() {
  const queryClient = useQueryClient();
  const [answer, setAnswer] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: today, isLoading } = useQuery({
    queryKey: ['daily-question-today'],
    queryFn: dailyQuestionsApi.getToday,
  });

  const { data: history } = useQuery({
    queryKey: ['daily-question-history', historyPage],
    queryFn: () => dailyQuestionsApi.getHistory(historyPage),
    enabled: showHistory,
  });

  const submitMutation = useMutation({
    mutationFn: () => dailyQuestionsApi.submitAnswer(today!.question.id, answer.trim()),
    onSuccess: () => {
      setAnswer('');
      queryClient.invalidateQueries({ queryKey: ['daily-question-today'] });
    },
  });

  const hasAnswered = !!today?.myAnswer;
  const categoryEmoji = today ? (CATEGORY_EMOJI[today.question.category] ?? '💬') : '💬';

  useModuleTour('daily-questions', [
    { popover: { title: '💬 Câu hỏi mỗi ngày', description: 'Mỗi ngày sẽ có một câu hỏi mới để hai bạn cùng trả lời. Trả lời trước rồi mới xem câu trả lời của người ấy nhé!' } },
    { element: '[data-tour="dq-question"]', popover: { title: '❓ Câu hỏi hôm nay', description: 'Câu hỏi sẽ thay đổi mỗi ngày. Mỗi cặp đôi sẽ nhận câu hỏi khác nhau.', side: 'bottom' } },
    { element: '[data-tour="dq-answer"]', popover: { title: '✍️ Trả lời', description: 'Viết câu trả lời của bạn. Sau khi gửi, bạn sẽ thấy câu trả lời của người ấy.', side: 'top' } },
    { element: '[data-tour="dq-history"]', popover: { title: '📜 Lịch sử', description: 'Xem lại những câu hỏi và câu trả lời trước đây.', side: 'top' } },
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircleHeart className="w-6 h-6 text-primary" />
        <h1 className="font-heading text-2xl font-bold">Câu hỏi mỗi ngày</h1>
      </div>

      {/* Today's Question */}
      {today && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
          data-tour="dq-question"
        >
          <div className="bg-gradient-to-br from-primary/8 via-secondary/5 to-accent/8 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{categoryEmoji}</span>
              <span className="text-xs font-medium text-text-light uppercase tracking-wide">
                {today.question.category}
              </span>
            </div>
            <p className="text-lg font-heading font-semibold text-text leading-relaxed">
              {today.question.textVi || today.question.text}
            </p>
            {today.question.textVi && (
              <p className="text-sm text-text-light mt-2 italic">
                {today.question.text}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Answer Section */}
      {today && !hasAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
          data-tour="dq-answer"
        >
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Viết câu trả lời của bạn..."
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px]"
              rows={4}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-text-light">
                <Lock className="w-3 h-3 inline mr-1" />
                Trả lời trước mới xem được câu trả lời đối phương
              </p>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={!answer.trim() || submitMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submitMutation.isPending ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Both answers revealed */}
      {today && hasAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-3"
        >
          {/* My answer */}
          <div className="bg-primary/5 rounded-2xl p-4">
            <p className="text-xs font-medium text-primary mb-1.5">Bạn trả lời</p>
            <p className="text-sm text-text">{today.myAnswer}</p>
          </div>

          {/* Partner answer */}
          <div className="bg-accent/5 rounded-2xl p-4">
            <p className="text-xs font-medium text-accent mb-1.5">
              {today.partnerName || 'Người ấy'} trả lời
            </p>
            {today.partnerAnswer ? (
              <p className="text-sm text-text">{today.partnerAnswer}</p>
            ) : (
              <p className="text-sm text-text-light italic">Chưa trả lời...</p>
            )}
          </div>
        </motion.div>
      )}

      {/* History Toggle */}
      <div data-tour="dq-history">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-text-light hover:text-text transition-colors"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử'}
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showHistory && history && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {history.items.length === 0 ? (
                <p className="text-center text-sm text-text-light py-6">Chưa có lịch sử.</p>
              ) : (
                <div className="space-y-3 pb-4">
                  {history.items.map((item: DailyQuestionHistoryItem) => (
                    <HistoryCard key={item.question.id} item={item} />
                  ))}

                  {/* Pagination */}
                  {history.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage <= 1}
                        className="text-sm text-primary disabled:text-text-light"
                      >
                        ← Trước
                      </button>
                      <span className="text-xs text-text-light">
                        {historyPage}/{history.totalPages}
                      </span>
                      <button
                        onClick={() => setHistoryPage((p) => Math.min(history.totalPages, p + 1))}
                        disabled={historyPage >= history.totalPages}
                        className="text-sm text-primary disabled:text-text-light"
                      >
                        Sau →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HistoryCard({ item }: { item: DailyQuestionHistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const emoji = CATEGORY_EMOJI[item.question.category] ?? '💬';

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-base">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text leading-snug">
            {item.question.textVi || item.question.text}
          </p>
          {item.myAnsweredAt && (
            <p className="text-xs text-text-light mt-1">
              {new Date(item.myAnsweredAt).toLocaleDateString('vi-VN')}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-light flex-shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-light flex-shrink-0 mt-0.5" />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
              <div className="bg-primary/5 rounded-lg p-2.5">
                <p className="text-xs font-medium text-primary mb-1">Bạn</p>
                <p className="text-sm text-text">{item.myAnswer || <span className="italic text-text-light">Chưa trả lời</span>}</p>
              </div>
              <div className="bg-accent/5 rounded-lg p-2.5">
                <p className="text-xs font-medium text-accent mb-1">{item.partnerName || 'Người ấy'}</p>
                <p className="text-sm text-text">{item.partnerAnswer || <span className="italic text-text-light">Chưa trả lời</span>}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
