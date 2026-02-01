    -- Test if we can insert chat
    -- Run in Neon SQL Editor

    -- Check users exist
    SELECT id, email, username FROM "user";

    -- Test manual chat insert with your user ID
    -- Copy your user ID from above query, then uncomment and modify this:
    -- INSERT INTO "Chat" (id, "createdAt", "userId", title, visibility)
    -- VALUES (gen_random_uuid(), NOW(), 'PASTE-YOUR-USER-ID-HERE', 'Test Chat', 'private')
    -- RETURNING *;
