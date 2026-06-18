Supabase bucket query

```sql
-- 1. Bikin Bucket untuk Profile Images (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_profile_images', 'user_profile_images', true);

-- 2. Bikin Bucket untuk Attachments (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true);

-- 3. Policy: Semua orang bisa LIHAT foto profil
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING ( bucket_id = 'user_profile_images' );

CREATE POLICY "Public Access Attachments" ON storage.objects FOR SELECT 
USING ( bucket_id = 'attachments' );

-- 4. Policy: Cuma user login yang bisa UPLOAD
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id IN ('user_profile_images', 'attachments') );

-- 5. Policy: Cuma user login yang bisa HAPUS file
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id IN ('user_profile_images', 'attachments') );
```