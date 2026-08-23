import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId, isCorrect, currentLevel } = await request.json();

    // Spaced repetition logic: adjust level based on correctness
    let newLevel = isCorrect ? Math.min(5, (currentLevel || 0) + 1) : Math.max(1, (currentLevel || 1) - 1);
    
    // Calculate next review time based on the new mastery level
    const hoursToNextReview = [0, 12, 24, 72, 168, 336]; // L0=0h, L1=12h, L2=24h, L3=3d, L4=7d, L5=14d
    const nextDate = new Date();
    nextDate.setHours(nextDate.getHours() + hoursToNextReview[newLevel]);

    const { data, error } = await supabase
      .from('user_question_progress')
      .upsert({
        user_id: user.id,
        question_id: questionId,
        mastery_level: newLevel,
        next_review_date: nextDate.toISOString(),
        last_reviewed_at: new Date().toISOString()
      }, { onConflict: 'user_id, question_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Progress updated', data }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}