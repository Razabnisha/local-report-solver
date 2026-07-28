
CREATE POLICY "Report images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-images');

CREATE POLICY "Users can upload their own report images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own report images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own report images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
