-- Study tags on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_tags text[] DEFAULT '{}';

-- Village chat messages
CREATE TABLE IF NOT EXISTS messages (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  village_id    uuid REFERENCES villages(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_name   text NOT NULL,
  content       text NOT NULL,
  message_type  text DEFAULT 'text' CHECK (message_type IN ('text', 'code', 'link')),
  reply_to_id   uuid REFERENCES messages(id) ON DELETE SET NULL,
  reply_preview text,
  is_pinned     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_village_idx ON messages(village_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Village members can read messages
CREATE POLICY "village_members_read_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM village_members vm
      WHERE vm.village_id = messages.village_id
        AND vm.user_id = auth.uid()
    )
  );

-- Village members can insert their own messages
CREATE POLICY "village_members_insert_messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM village_members vm
      WHERE vm.village_id = messages.village_id
        AND vm.user_id = auth.uid()
    )
  );

-- Any village member can pin/unpin (village is a collaborative space)
CREATE POLICY "village_members_update_messages" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM village_members vm
      WHERE vm.village_id = messages.village_id
        AND vm.user_id = auth.uid()
    )
  );

-- Enable realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
