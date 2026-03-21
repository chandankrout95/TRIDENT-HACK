import pkg from 'agora-token';
const { RtcTokenBuilder, RtcRole } = pkg;

/**
 * POST /api/agora/token
 * Body: { channelName, uid (optional) }
 * Returns: { token, appId, channelName, uid }
 */
export const generateAgoraToken = async (req, res) => {
  try {
    const { channelName, uid = 0 } = req.body;

    if (!channelName) {
      return res.status(400).json({ error: 'channelName is required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ error: 'Agora credentials not configured' });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      expirationTimeInSeconds,
      privilegeExpiredTs
    );

    res.json({
      token,
      appId,
      channelName,
      uid,
    });
  } catch (err) {
    console.error('Agora token error:', err);
    res.status(500).json({ error: 'Failed to generate Agora token' });
  }
};
