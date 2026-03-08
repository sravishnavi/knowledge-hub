
-- Create storage bucket for article attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('article-attachments', 'article-attachments', true);

-- Allow anyone to view attachments
CREATE POLICY "Anyone can view attachments" ON storage.objects FOR SELECT USING (bucket_id = 'article-attachments');

-- Authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-attachments' AND auth.role() = 'authenticated');

-- Users can delete their own uploads
CREATE POLICY "Users can delete own attachments" ON storage.objects FOR DELETE USING (bucket_id = 'article-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachments column to articles
ALTER TABLE public.articles ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
