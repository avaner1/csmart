import { getDbUser } from "./auth";

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  avatar: string;
}

export interface SlackReaction {
  name: string;
  count: number;
}

export interface SlackMessage {
  text: string;
  ts: string;
  user: string;
  replyCount: number;
  reactions: SlackReaction[];
  threadTs?: string;
}

export interface EnrichedMessage {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelId: string;
  channelName: string;
  replyCount: number;
  reactions: SlackReaction[];
  deepLink: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

export async function getSlackToken(): Promise<{
  token: string | null;
  userId: string | null;
  dbUserId: string | null;
  hiddenChannels: string[];
}> {
  const user = await getDbUser();
  if (!user) return { token: null, userId: null, dbUserId: null, hiddenChannels: [] };

  return {
    token: user.slackAccessToken ?? null,
    userId: user.id,
    dbUserId: user.id,
    hiddenChannels: (user.hiddenChannels ?? []) as string[],
  };
}

export async function slackApi<T>(
  token: string,
  method: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`https://slack.com/api/${method}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (data.error === "ratelimited") {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "3", 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!data.ok) {
      throw new Error(`Slack API error (${method}): ${data.error}`);
    }
    return data;
  }

  throw new Error(`Slack API rate limited after retries (${method})`);
}

export async function fetchUserProfile(
  token: string,
  userId: string
): Promise<SlackUser> {
  const cacheKey = `user:${userId}`;
  const cached = getCached<SlackUser>(cacheKey);
  if (cached) return cached;

  const data = await slackApi<{
    user: {
      id: string;
      name: string;
      real_name: string;
      profile: { image_48: string };
    };
  }>(token, "users.info", { user: userId });

  const profile: SlackUser = {
    id: data.user.id,
    name: data.user.name,
    realName: data.user.real_name,
    avatar: data.user.profile.image_48,
  };

  setCache(cacheKey, profile);
  return profile;
}

export async function fetchChannels(token: string) {
  const cacheKey = `channels:${token.slice(-8)}`;
  const cached = getCached<
    { id: string; name: string; isAmericasCs: boolean }[]
  >(cacheKey);
  if (cached) return cached;

  // Use users.conversations to get only channels the user is in (much faster, no pagination needed for most users)
  const memberChannels: { id: string; name: string }[] = [];
  let cursor = "";

  do {
    const params: Record<string, string> = {
      types: "public_channel,private_channel",
      limit: "200",
      exclude_archived: "true",
    };
    if (cursor) params.cursor = cursor;

    const data = await slackApi<{
      channels: { id: string; name: string }[];
      response_metadata?: { next_cursor?: string };
    }>(token, "users.conversations", params);

    memberChannels.push(...data.channels);
    cursor = data.response_metadata?.next_cursor ?? "";
  } while (cursor);

  const channels = memberChannels.map((c) => ({
    id: c.id,
    name: c.name,
    isAmericasCs: c.name === "americas-customer-success",
  }));

  setCache(cacheKey, channels);
  return channels;
}

export async function fetchMessages(
  token: string,
  channelId: string,
  limit = 20,
  oldest?: string
): Promise<SlackMessage[]> {
  const params: Record<string, string> = {
    channel: channelId,
    limit: String(limit),
  };
  if (oldest) params.oldest = oldest;

  const data = await slackApi<{
    messages: {
      text: string;
      ts: string;
      user?: string;
      reply_count?: number;
      reactions?: { name: string; count: number }[];
      thread_ts?: string;
      subtype?: string;
    }[];
  }>(token, "conversations.history", params);

  return data.messages
    .filter((m) => !m.subtype)
    .map((m) => ({
      text: m.text,
      ts: m.ts,
      user: m.user ?? "unknown",
      replyCount: m.reply_count ?? 0,
      reactions: m.reactions?.map((r) => ({ name: r.name, count: r.count })) ?? [],
      threadTs: m.thread_ts,
    }));
}

export async function fetchThreadReplies(
  token: string,
  channelId: string,
  threadTs: string
) {
  const data = await slackApi<{
    messages: {
      text: string;
      ts: string;
      user?: string;
      reactions?: { name: string; count: number }[];
    }[];
  }>(token, "conversations.replies", {
    channel: channelId,
    ts: threadTs,
    limit: "10",
  });

  // First message is the parent; rest are replies
  return data.messages.slice(1);
}

export async function enrichMessages(
  token: string,
  messages: SlackMessage[],
  channelId: string,
  channelName: string
): Promise<EnrichedMessage[]> {
  const userIds = Array.from(new Set(messages.map((m) => m.user)));
  const profiles = await Promise.all(
    userIds.map((id) => fetchUserProfile(token, id).catch(() => null))
  );
  const profileMap = new Map<string, SlackUser>();
  userIds.forEach((id, i) => {
    if (profiles[i]) profileMap.set(id, profiles[i]!);
  });

  return messages.map((m) => {
    const profile = profileMap.get(m.user);
    return {
      text: m.text,
      ts: m.ts,
      authorName: profile?.realName ?? profile?.name ?? "Unknown",
      authorAvatar: profile?.avatar ?? "",
      channelId,
      channelName,
      replyCount: m.replyCount,
      reactions: m.reactions,
      deepLink: `https://slack.com/app_redirect?channel=${channelId}&message=${m.ts}`,
    };
  });
}

export function makeDeepLink(channelId: string, messageTs: string): string {
  return `https://slack.com/app_redirect?channel=${channelId}&message=${messageTs}`;
}
