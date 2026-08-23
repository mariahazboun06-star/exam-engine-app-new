-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Table to manage metadata for all uploaded course documents
CREATE TABLE IF NOT EXISTS public.course_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('syllabus', 'textbook', 'exam')),
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    has_solutions BOOLEAN DEFAULT false,
    current_lecturer BOOLEAN DEFAULT true,
    ingestion_status TEXT NOT NULL DEFAULT 'pending' CHECK (ingestion_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload their own course files" 
ON public.course_files FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own course files" 
ON public.course_files FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course files" 
ON public.course_files FOR DELETE 
USING (auth.uid() = user_id);

-- Storage RLS Policies
CREATE POLICY "Authenticated users can upload course assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own course assets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'course-materials' AND (storage.foldername(name))[1] = auth.uid()::text);