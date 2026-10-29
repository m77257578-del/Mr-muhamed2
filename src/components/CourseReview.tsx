import React, { useState, useEffect } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '../services/api';

interface CourseReviewProps {
  courseId: string;
  studentName?: string;
  onReviewSubmitted: () => void;
}

export const CourseReview: React.FC<CourseReviewProps> = ({ courseId, studentName, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  const loadReviews = async () => {
    try {
      const data = await apiRequest<any[]>('student', `/api/student/reviews/${courseId}`);
      setReviews(data);
    } catch (e) {
      console.error('Failed to load reviews', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest('student', '/api/student/reviews', {
        courseId,
        rating,
        comment,
        studentName
      });
      setComment('');
      setRating(5);
      onReviewSubmitted();
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 p-4 bg-[#111f36] rounded-xl border border-blue-500/20">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-white">تقييمات الكورس ({averageRating} ⭐)</h4>
        <span className="text-xs text-slate-400">{reviews.length} تقييم</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`p-1 ${rating >= star ? 'text-amber-400' : 'text-slate-600'}`}
            >
              <Star className="w-6 h-6 fill-current" />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="اكتب رأيك في الكورس..."
          className="w-full bg-[#0a1220] border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-400"
          rows={3}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-2 text-xs font-bold flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>إرسال التقييم</span>
        </button>
      </form>

      <div className="space-y-2 mt-4">
        {reviews.map((r: any) => (
          <div key={r.id} className="p-3 bg-[#0c1626] rounded-lg text-xs text-slate-300">
            <div className="flex justify-between font-bold text-white mb-1">
              <span>{r.studentName}</span>
              <span className="text-amber-400">{r.rating} ⭐</span>
            </div>
            <p>{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
