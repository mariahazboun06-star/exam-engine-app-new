export interface PlannerParams {
  knowledgeMap: any;
  examDate: string;
  studyHoursPerWeek: number;
  targetGrade: string;
}

export function generateStudyPlan(params: PlannerParams) {
  const { knowledgeMap, examDate, studyHoursPerWeek, targetGrade } = params;

  // 1. Calculate time available
  const today = new Date();
  const exam = new Date(examDate);
  const daysUntilExam = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksUntilExam = daysUntilExam / 7;
  const totalAvailableHours = Math.floor(weeksUntilExam * studyHoursPerWeek);

  // 2. Calculate time required based on Knowledge Map complexity
  let totalConcepts = 0;
  let allConcepts: { topicName: string; conceptName: string }[] = [];

  if (knowledgeMap?.topics) {
    knowledgeMap.topics.forEach((topic: any) => {
      if (topic.concepts) {
        topic.concepts.forEach((concept: any) => {
          totalConcepts++;
          allConcepts.push({ topicName: topic.name, conceptName: concept.name });
        });
      }
    });
  }

  // Base requirement: ~2 hours per concept. 
  // Multiplier adjusts based on the desired depth of mastery (Target Grade).
  const gradeMultipliers: Record<string, number> = {
    'Pass': 1.0,
    'B': 1.2,
    'A': 1.5,
    'A+': 2.0
  };
  const multiplier = gradeMultipliers[targetGrade] || 1.2;
  const totalRequiredHours = Math.ceil(totalConcepts * 2 * multiplier);

  // 3. Determine Feasibility
  const isFeasible = totalAvailableHours >= totalRequiredHours;

  // 4. Generate a simplified schedule distribution (Chunking concepts into weeks)
  const scheduleData: any[] = [];
  const conceptsPerWeek = Math.ceil(totalConcepts / Math.max(1, Math.floor(weeksUntilExam)));
  
  let currentConceptIndex = 0;
  for (let w = 1; w <= Math.floor(weeksUntilExam); w++) {
    const weeklyConcepts = [];
    for (let i = 0; i < conceptsPerWeek; i++) {
      if (currentConceptIndex < allConcepts.length) {
        weeklyConcepts.push(allConcepts[currentConceptIndex]);
        currentConceptIndex++;
      }
    }
    
    if (weeklyConcepts.length > 0) {
      scheduleData.push({
        week: w,
        focus: weeklyConcepts
      });
    }
  }

  return {
    isFeasible,
    totalRequiredHours,
    totalAvailableHours,
    daysUntilExam,
    scheduleData
  };
}