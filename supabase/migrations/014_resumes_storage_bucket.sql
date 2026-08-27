-- =========================================================
-- 014_resumes_storage_bucket.sql
-- Private Storage bucket for resume files (Sprint 4). Objects are
-- stored at path "{user_id}/{resume_id}/original.{ext}" within the
-- bucket -- owner-only access via storage.foldername(name)[1] matching
-- auth.uid(), same owner-only pattern used everywhere else in the schema.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

create policy "resumes_bucket_owner_select" on storage.objects
  for select using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_bucket_owner_insert" on storage.objects
  for insert with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_bucket_owner_update" on storage.objects
  for update using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes_bucket_owner_delete" on storage.objects
  for delete using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
