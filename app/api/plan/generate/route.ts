import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';
import { generateStudyPlan } from '../../../../lib/services/plannerService';

export async function POST(request: Request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { courseId, examDate, studyHoursPerWeek, targetGrade } = body;

    if (!courseId || !examDate || !studyHoursPerWeek || !targetGrade) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // 1. Fetch the generated Knowledge Map for this course
    const { data: mapRecord, error: mapError } = await supabase
      .from('course_knowledge_maps')
      .select('map_data')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    if (mapError || !mapRecord) {
      return NextResponse.json({ error: 'Knowledge Map not found. Please upload course materials first.' }, { status: 404 });
    }

    // 2. Run the Feasibility Algorithm
    const planResult = generateStudyPlan({
      knowledgeMap: mapRecord.map_data,
      examDate,
      studyHoursPerWeek: Number(studyHoursPerWeek),
      targetGrade
    });

    // 3. Save the generated plan to Supabase
    const { data: savedPlan, error: insertError } = await supabase
      .from('study_plans')
      .insert({
        course_id: courseId,
        user_id: user.id,
        exam_date: examDate,
        target_grade: targetGrade,
        study_hours_per_week: Number(studyHoursPerWeek),
        is_feasible: planResult.isFeasible,
        total_required_hours: planResult.totalRequiredHours,
        total_available_hours: planResult.totalAvailableHours,
        schedule_data: planResult.scheduleData
      })
      .select()
      .single();

    if (insertError) throw new Error("Failed to save study plan: " + insertError.message);

    return NextResponse.json({
      message: 'Study plan generated successfully.',
      data: savedPlan,
      metrics: planResult
    }, { status: 200 });

  } catch (error: any) {
    console.error("Plan Generation Error:", error);
    return NextResponse.json({ error: error.message || 'Server error during plan generation.' }, { status: 500 });
  }
}