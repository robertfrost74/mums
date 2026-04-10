-- Allow authenticated users to look up families by invite_code (for joining)
CREATE POLICY "Authenticated users can view family by invite_code"
  ON public.families FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert themselves as a member when joining via invite
CREATE POLICY "Users can join a family"
  ON public.family_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
