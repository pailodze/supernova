const INVITE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export type InviteResult = { ok: true; url: string } | { ok: false; error: string }

/**
 * Mints the private-channel invite an applicant gets after applying.
 *
 * Preferred: a bot creates a single-use invite per applicant, so a link that
 * leaks can't be passed around. Fallback: one shared DISCORD_INVITE_URL, which
 * is enough to launch with and needs no bot at all.
 */
export async function createDiscordInvite(): Promise<InviteResult> {
  const botToken = process.env.DISCORD_BOT_TOKEN
  const channelId = process.env.DISCORD_CHANNEL_ID
  const staticUrl = process.env.DISCORD_INVITE_URL

  if (botToken && channelId) {
    try {
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_age: INVITE_MAX_AGE_SECONDS,
          max_uses: 1,
          unique: true,
          temporary: false,
        }),
      })

      if (response.ok) {
        const invite = (await response.json()) as { code?: string }
        if (invite.code) return { ok: true, url: `https://discord.gg/${invite.code}` }
        return { ok: false, error: 'Discord returned no invite code' }
      }

      const detail = (await response.text()).slice(0, 200)
      // A misconfigured bot shouldn't cost someone their application.
      if (staticUrl) {
        console.error(`[discord] invite failed (${response.status}: ${detail}); using DISCORD_INVITE_URL`)
        return { ok: true, url: staticUrl }
      }
      return { ok: false, error: `discord ${response.status}: ${detail}` }
    } catch (error) {
      if (staticUrl) return { ok: true, url: staticUrl }
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  if (staticUrl) return { ok: true, url: staticUrl }
  return { ok: false, error: 'Discord is not configured' }
}
