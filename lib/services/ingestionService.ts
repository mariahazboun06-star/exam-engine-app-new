import { supabase } from '../supabaseClient';

export interface UploadBatchPayload {
  userId: string;
  courseId: string;
  syllabus: File;
  textbook: File;
  exams: {
    file: File;
    hasSolutions: boolean;
    currentLecturer: boolean;
  }[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateIngestionBatch(examsCount: number, syllabusPresent: boolean, textbookPresent: boolean): ValidationResult {
  const errors: string[] = [];

  if (!syllabusPresent) {
    errors.push("A course syllabus is required.");
  }
  if (!textbookPresent) {
    errors.push("A course textbook is required.");
  }
  if (examsCount < 20) {
    errors.push(`A minimum of 20 past exams is required. Currently uploaded: ${examsCount}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function uploadCourseBatch(payload: UploadBatchPayload) {
  const { userId, courseId, syllabus, textbook, exams } = payload;

  const validation = validateIngestionBatch(exams.length, !!syllabus, !!textbook);
  if (!validation.valid) {
    throw new Error(`Ingestion validation failed: ${validation.errors.join(" ")}`);
  }

  const uploadedRecords = [];

  const processUpload = async (file: File, fileType: 'syllabus' | 'textbook' | 'exam', hasSolutions = false, currentLecturer = true) => {
    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${userId}/${courseId}/${fileType}s/${cleanFileName}`;

    const { error: storageError } = await supabase.storage
      .from('course-materials')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (storageError) throw new Error(`Storage upload failed for ${file.name}: ${storageError.message}`);

    const { data: dbData, error: dbError } = await supabase
      .from('course_files')
      .insert({
        user_id: userId,
        course_id: courseId,
        file_type: fileType,
        file_name: file.name,
        storage_path: storagePath,
        file_size_bytes: file.size,
        has_solutions: hasSolutions,
        current_lecturer: currentLecturer,
        ingestion_status: 'pending'
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database record creation failed for ${file.name}: ${dbError.message}`);

    return dbData;
  };

  uploadedRecords.push(await processUpload(syllabus, 'syllabus'));
  uploadedRecords.push(await processUpload(textbook, 'textbook'));

  for (const examItem of exams) {
    const record = await processUpload(examItem.file, 'exam', examItem.hasSolutions, examItem.currentLecturer);
    uploadedRecords.push(record);
  }

  return uploadedRecords;
}