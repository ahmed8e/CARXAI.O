import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type ReactionType = 'relate' | 'powerful' | 'respect';

export interface ReactionCounts {
  [key: string]: number;
}

export function useStoryReactions(storyId: string) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ReactionCounts>({
    'relate': 0,
    'powerful': 0,
    'respect': 0
  });
  const [totalEngaged, setTotalEngaged] = useState(0);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [topReaction, setTopReaction] = useState<ReactionType | null>(null);

  // Persistent anonymous session ID logic
  const getSessionId = useCallback(() => {
    if (typeof window === 'undefined') return '';
    let sid = localStorage.getItem('car_safety_story_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('car_safety_story_session_id', sid);
    }
    return sid;
  }, []);

  const fetchReactions = useCallback(async () => {
    try {
      // Guard against missing Supabase credentials or initialization failure
      if (!supabase || (supabase as any).supabaseUrl?.includes('placeholder')) {
        setLoading(false);
        return;
      }

      // 1. Fetch aggregated reaction counts from the unified view (baseline + real)
      const { data: totalsData, error: totalsError } = await supabase
        .from('view_story_reaction_totals' as any)
        .select('*')
        .eq('story_id', storyId);

      if (totalsError) throw totalsError;

      const newCounts: ReactionCounts = {
        'relate': 0,
        'powerful': 0,
        'respect': 0
      };

      let total = 0;
      totalsData?.forEach((r: any) => {
        if (newCounts[r.reaction_type] !== undefined) {
          newCounts[r.reaction_type] = r.total_count;
          total += r.total_count;
        }
      });

      setCounts(newCounts);
      setTotalEngaged(total);

      // Determine top reaction
      let max = -1;
      let top: ReactionType | null = null;
      Object.entries(newCounts).forEach(([type, count]) => {
        if (count > max && count > 0) {
          max = count;
          top = type as ReactionType;
        }
      });
      setTopReaction(top);

      // 2. Fetch current user/session's reaction
      const sessionId = getSessionId();
      const { data: userData, error: userError } = await (user 
        ? supabase.from('story_reactions').select('reaction_type').eq('story_id', storyId).eq('user_id', user.id).maybeSingle()
        : sessionId 
          ? supabase.from('story_reactions').select('reaction_type').eq('story_id', storyId).eq('session_id', sessionId).maybeSingle()
          : { data: null, error: null }
      );

      if (userError) throw userError;
      if (userData && 'reaction_type' in (userData as any)) {
        setUserReaction((userData as any).reaction_type as ReactionType);
      } else {
        setUserReaction(null);
      }

    } catch (err) {
      console.error('Error fetching story reactions:', err);
    } finally {
      setLoading(false);
    }
  }, [storyId, user, getSessionId]);

  const submitReaction = async (reactionType: ReactionType) => {
    const sessionId = getSessionId();
    
    // Determine which conflict constraint to use
    const conflictCols = user ? 'story_id,user_id' : 'story_id,session_id';
    
    const payload: any = {
      story_id: storyId,
      reaction_type: reactionType,
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
    };

    try {
      const { error } = await supabase
        .from('story_reactions')
        .upsert(payload, { 
          onConflict: conflictCols 
        });

      if (error) throw error;

      // Optimistic update for UI feel
      setCounts(prev => ({
        ...prev,
        [reactionType]: prev[reactionType] + (userReaction ? 0 : 1)
      }));
      if (!userReaction) setTotalEngaged(prev => prev + 1);
      setUserReaction(reactionType);

      // Re-fetch to ensure sync
      await fetchReactions();
    } catch (err) {
      console.error('Error submitting reaction:', err);
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  return {
    counts,
    totalEngaged,
    userReaction,
    submitReaction,
    loading,
    topReaction
  };
}
