-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table (Customized for App + NextAuth Adapter)
create table if not exists "user" (
  "id" uuid primary key default uuid_generate_v4(),
  "name" text,
  "email" text unique not null,
  "emailVerified" timestamp,
  "image" text,
  "password" text, -- Custom field for Credentials provider
  "role" text default 'user' not null, -- Custom field
  "isPro" boolean default false not null, -- Custom field
  "limitCount" integer default 0 not null, -- Custom field
  "proExpiresAt" timestamp, -- Custom field
  "createdAt" timestamp default now() not null,
  "updatedAt" timestamp default now() not null
);

-- ACCOUNTS Table (NextAuth Standard)
create table if not exists "account" (
  "userId" uuid not null references "user"("id") on delete cascade,
  "type" text not null,
  "provider" text not null,
  "providerAccountId" text not null,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
 
  primary key ("provider", "providerAccountId")
);

-- SESSIONS Table (NextAuth Standard)
create table if not exists "session" (
  "sessionToken" text primary key,
  "userId" uuid not null references "user"("id") on delete cascade,
  "expires" timestamp not null
);

-- VERIFICATION TOKENS Table (NextAuth Standard)
create table if not exists "verificationToken" (
  "identifier" text not null,
  "token" text not null,
  "expires" timestamp not null,
 
  primary key ("identifier", "token")
);

-- AUTHENTICATORS Table (Optional NextAuth Standard)
create table if not exists "authenticator" (
  "credentialID" text not null,
  "userId" uuid not null references "user"("id") on delete cascade,
  "providerAccountId" text not null,
  "credentialPublicKey" text not null,
  "counter" integer not null,
  "credentialDeviceType" text not null,
  "credentialBackedUp" boolean not null,
  "transports" text,
 
  primary key ("userId", "credentialID")
);

-- CHAT Table
create table if not exists "Chat" (
  "id" uuid primary key default uuid_generate_v4(),
  "createdAt" timestamp not null default now(),
  "title" text not null,
  "userId" uuid not null references "user"("id") on delete cascade,
  "visibility" text default 'private' not null
);

-- MESSAGE Table
create table if not exists "Message_v2" (
  "id" uuid primary key default uuid_generate_v4(),
  "chatId" uuid not null references "Chat"("id") on delete cascade,
  "role" text not null,
  "parts" jsonb not null,
  "attachments" jsonb not null,
  "createdAt" timestamp not null default now()
);

-- VOTE Table
create table if not exists "Vote_v2" (
  "chatId" uuid not null references "Chat"("id") on delete cascade,
  "messageId" uuid not null references "Message_v2"("id") on delete cascade,
  "isUpvoted" boolean not null,
  primary key ("chatId", "messageId")
);

-- DOCUMENT Table
create table if not exists "Document" (
  "id" uuid default uuid_generate_v4(),
  "createdAt" timestamp not null default now(),
  "title" text not null,
  "content" text,
  "kind" text default 'text' not null,
  "userId" uuid not null references "user"("id") on delete cascade,
  primary key ("id", "createdAt")
);

-- SUGGESTION Table
create table if not exists "Suggestion" (
  "id" uuid primary key default uuid_generate_v4(),
  "documentId" uuid not null,
  "documentCreatedAt" timestamp not null,
  "originalText" text not null,
  "suggestedText" text not null,
  "description" text,
  "isResolved" boolean default false not null,
  "userId" uuid not null references "user"("id") on delete cascade,
  "createdAt" timestamp not null default now(),
  foreign key ("documentId", "documentCreatedAt") references "Document"("id", "createdAt") on delete cascade
);

-- REDEEM CODES Table
create table if not exists "redeem_codes" (
  "id" uuid primary key default uuid_generate_v4(),
  "code" varchar(50) unique not null,
  "type" varchar(20) not null, -- 'PRO' or 'CREDIT'
  "value" integer default 0,
  "durationMonths" integer default 0,
  "isUsed" boolean default false not null,
  "usedBy" uuid references "user"("id"),
  "usedAt" timestamp,
  "expiresAt" timestamp,
  "createdAt" timestamp default now() not null
);
