import { useEffect, useRef, useState } from 'react'
import { useToast } from '../../hooks/useToast'

interface KlipyGifPickerProps {
  query: string
  page?: number
  limit?: number
  noteId?: number | string
  onSelect: (gifUrl: string, gifSlug?: string) => void
  onClose: () => void
  onNextPage?: () => void
  onPrevPage?: () => void
}

export default function KlipyGifPicker({ query, page = 1, limit = 8, noteId, onSelect, onClose, onNextPage, onPrevPage }: KlipyGifPickerProps) {
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false);
  const toast = useToast()

  // Debounce search and prevent too many requests
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchId = useRef(0);

  useEffect(() => {
    if (!query) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      const fetchId = ++lastFetchId.current;
      const endpoint = `/notes/gifs/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      fetch(endpoint)
        .then(async res => {
          if (fetchId !== lastFetchId.current) return; // Ignore outdated responses
          if (res.status === 429) {
            setError('GIF search rate limit exceeded. Please wait and try again.');
            setGifs([]);
            setLoading(false);
            setHasMore(false);
            toast.error('GIF Search Rate Limit', 'You are searching too quickly. Please wait a moment before trying again.', 8000);
            return;
          }
          if (!res.ok) {
            const msg = `GIF search failed (API error ${res.status})`;
            setError(msg);
            setGifs([]);
            setLoading(false);
            setHasMore(false);
            toast.error('GIF Search Failed', msg);
            return;
          }
          const data = await res.json();
          if (!data || !data.data) {
            setError('GIF search failed: Invalid response from server.');
            setGifs([]);
            setLoading(false);
            setHasMore(false);
            toast.error('GIF Search Failed', 'Invalid response from server.');
            return;
          }
          const gifs = data.data || [];
          setGifs(gifs.slice(0, limit));
          setLoading(false);
          setHasMore(gifs.length === limit);
          // Always clear error on valid fetch
          if (error) setError(null);
          if (gifs.length === 0) {
            toast.info('No GIFs found', 'Try a different keyword or check your spelling.', 10000);
          }
        })
        .catch(() => {
          if (fetchId !== lastFetchId.current) return;
          setError('Network error: Could not load GIFs. Please check your connection or try again later.');
          setGifs([]);
          setLoading(false);
          setHasMore(false);
          toast.error('GIF Search Failed', 'Network error: Could not load GIFs. Please check your connection or try again later.');
        });
    }, 500); // 500ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, noteId, page, limit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#232325] rounded-xl p-6 w-full max-w-2xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-[#aaa] hover:text-white text-xl">×</button>
        <h3 className="text-lg text-white mb-4">Klipy GIFs for "{query}"</h3>
        {loading && <div className="text-[#aaa]">Loading...</div>}
        {error && <div className="text-red-400">{error}</div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
          {gifs.slice(0, limit).map(gif => {
            const src = gif.url || gif.preview;
            // Try to get the slug from gif.slug, gif.id, or gif.slug_id (depending on API)
            const slug = gif.slug || gif.id || gif.slug_id;
            const handleSelect = () => {
              toast.success('GIF Selected', 'You have selected a GIF.');
              onSelect(src, slug);
            };
            return (
              <div key={gif.id} className="flex flex-col items-center">
                <img
                  src={src}
                  alt={gif.title}
                  className="rounded-lg cursor-pointer hover:scale-105 transition-transform max-h-32"
                  onClick={handleSelect}
                />
                {(!gif.url || !src) && (
                  <span className="text-xs text-red-400 break-all">No main url</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-4">
          {onPrevPage && page > 1 && (
            <button onClick={onPrevPage} className="px-3 py-1 rounded bg-[#333] text-white hover:bg-[#444]">Previous</button>
          )}
          {onNextPage && hasMore && (
            <button onClick={onNextPage} className="px-3 py-1 rounded bg-[#333] text-white hover:bg-[#444] ml-auto">Next</button>
          )}
        </div>
        {(!loading && gifs.length === 0 && !error) && (
          <div className="text-[#aaa] mt-4">No GIFs found.</div>
        )}
      </div>
    </div>
  )
}



