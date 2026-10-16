import { NextResponse } from 'next/server';
// Import your Supabase client setup. Adjust the path if your lib folder is elsewhere.
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Ensure your env variables are set correctly)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_INTERVALS = {
  1: 1,   // Day 1
  2: 3,   // Day 3
  3: 7,   // Day 7
  4: 14,  // Day 14
  5: 30,  // Day 30
};

/**
 * Calculates the next review date dynamically based on exam proximity.
 */
function calculateDynamicSpacedRepetition(
  currentLevel: number, 
  isCorrect: boolean, 
  examDateString: string
) {
  let newLevel = currentLevel;

  // 1. Adjust mastery level
  if (isCorrect) {
    newLevel = Math.min(5, currentLevel + 1);
  } else {
    newLevel = Math.max(1, currentLevel - 1);
  }

  // 2. Calculate days until the exam
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(examDateString);
  examDate.setHours(0, 0, 0, 0);
  
  const timeDiff = examDate.getTime() - today.getTime();
  const daysUntilExam = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  // 3. Determine the compression scaling factor (Target timeline is 30 days)
  const targetTimeline = 30; 
  const scaleFactor = Math.min(1, daysUntilExam / targetTimeline);

  // 4. Calculate dynamic days to add
  const baseDays = BASE_INTERVALS[newLevel as keyof typeof BASE_INTERVALS] || 1;
  let dynamicDaysToAdd = Math.round(baseDays * scaleFactor);
  
  // Cap the interval so it never schedules AFTER the exam, and never less than 1 day
  dynamicDaysToAdd = Math.max(1, Math.min(dynamicDaysToAdd, daysUntilExam - 1));

  // 5. Set the exact next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + dynamicDaysToAdd);

  return {
    newLevel,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, questionId, currentLevel, isCorrect, examDate } = body;

    // Validate inputs
    if (!userId || !questionId || currentLevel === undefined || isCorrect === undefined || !examDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate the new level and next review date
    const { newLevel, nextReviewDate } = calculateDynamicSpacedRepetition(
      currentLevel,
      isCorrect,
      examDate
    );

    // Upsert the progress into the user_question_progress table
    const { data, error } = await supabase
      .from('user_question_progress')
      .upsert({
        user_id: userId,
        question_id: questionId,
        mastery_level: newLevel,
        next_review_date: nextReviewDate,
        last_reviewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id, question_id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating progress:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      newLevel, 
      nextReviewDate,
      data
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}