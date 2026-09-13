import { supabase } from "@/lib/supabaseClient";

export interface ExamHeader {
  id: string;
  year: number;
  term: string;
}

export interface TopicMatrixRow {
  topicId: string;
  topicTitle: string;
  appearancePercentage: number;
  isMandatory: boolean; // נושא שמופיע כמעט בכל המבחנים (>= 80%)
  totalQuestionsCount: number;
  examQuestionsMap: Record<string, number[]>; // examId -> [questionNumbers]
}

export interface MatrixAnalyticsResult {
  exams: ExamHeader[];
  matrixRows: TopicMatrixRow[];
}

export async function getCourseMatrixAndAnalytics(courseId: string): Promise<MatrixAnalyticsResult> {
  // 1. שליפת כל מועדי המבחנים של הקורס
  const { data: examsData, error: examsErr } = await supabase
    .from("exams")
    .select("id, year, term")
    .eq("course_id", courseId)
    .order("year", { ascending: false });

  if (examsErr) throw examsErr;

  const exams: ExamHeader[] = (examsData || []).map((e) => ({
    id: e.id,
    year: e.year,
    term: e.term,
  }));

  // 2. שליפת הנושאים והשאלות המסווגות
  const [{ data: topics }, { data: questions }] = await Promise.all([
    supabase.from("course_topics").select("id, title").eq("course_id", courseId),
    supabase.from("exam_questions").select("id, topic_id, exam_id, question_number").eq("course_id", courseId),
  ]);

  const totalExamsCount = exams.length;

  // 3. בניית המטריצה וחישוב סטטיסטיקת מועדים
  const matrixRows: TopicMatrixRow[] = (topics || []).map((topic) => {
    const examQuestionsMap: Record<string, number[]> = {};
    const examsWithTopicSet = new Set<string>();
    let totalQuestionsCount = 0;

    (questions || []).forEach((q) => {
      if (q.topic_id === topic.id && q.exam_id) {
        if (!examQuestionsMap[q.exam_id]) {
          examQuestionsMap[q.exam_id] = [];
        }
        examQuestionsMap[q.exam_id].push(q.question_number);
        examsWithTopicSet.add(q.exam_id);
        totalQuestionsCount++;
      }
    });

    const examsAppearedCount = examsWithTopicSet.size;
    const appearancePercentage = totalExamsCount > 0 
      ? Number(((examsAppearedCount / totalExamsCount) * 100).toFixed(1))
      : 0;

    return {
      topicId: topic.id,
      topicTitle: topic.title,
      appearancePercentage,
      isMandatory: appearancePercentage >= 80, // נושא חובה קבוע
      totalQuestionsCount,
      examQuestionsMap,
    };
  });

  // מיון לפי שכיחות (נושאי החובה בראש)
  matrixRows.sort((a, b) => b.appearancePercentage - a.appearancePercentage);

  return { exams, matrixRows };
}