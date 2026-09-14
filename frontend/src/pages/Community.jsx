import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Footer from '../components/Footer';

export default function Community() {
  const { t } = useTranslation();
  const { user, isGuest } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  useEffect(() => { fetchPosts(); }, [page]);

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/community?page=${page}&limit=10`);
      setPosts(res.data.posts);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption.trim());
      const res = await api.post('/community', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts(prev => [res.data.post, ...prev]);
      setCaption('');
      setShowCreate(false);
    } catch (err) {
      console.error('Create post failed:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.post(`/community/${postId}/comments`, { text: text.trim() });
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: [...(p.comments || []), res.data.comment] }
          : p
      ));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('community.title')}</h1>
          {!isGuest && user && (
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
              {t('community.create_post')}
            </button>
          )}
        </div>

        {isGuest && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {t('community.login_required')}
          </div>
        )}

        {showCreate && (
          <form onSubmit={handleCreatePost} className="card mb-6">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('community.caption_placeholder')}
              className="input-field resize-none mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={posting} className="btn-primary text-sm">
                {posting ? t('common.loading') : t('common.submit')}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="card text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="card text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-lg">{t('community.empty')}</p>
          </div>
        )}

        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 dark:text-primary-400 font-bold text-sm">
                    {post.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{post.user?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(post.created_at)}</p>
                </div>
                {post.disease_name && (
                  <span className="ml-auto text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full">
                    {post.disease_name.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {post.caption && (
                <p className="text-gray-700 dark:text-gray-300 mb-3">{post.caption}</p>
              )}

              {post.confidence && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  {t('community.ai_confidence')} {(post.confidence * 100).toFixed(1)}%
                </p>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('community.comments')} ({post.comments?.length || 0})
                </p>
                {post.comments?.map(c => (
                  <div key={c.id} className="flex gap-2 mb-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{c.user?.name}:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{c.text}</span>
                  </div>
                ))}

                {user && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <input
                      type="text"
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder={t('community.add_comment')}
                      className="input-field text-sm py-1.5 flex-1 min-w-0"
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={submittingComment[post.id]}
                      className="btn-primary text-sm py-1.5 px-3 shrink-0"
                    >
                      {t('common.submit')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm"
            >
              {t('common.back')}
            </button>
            <span className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm"
            >
              {t('common.view_all')}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
