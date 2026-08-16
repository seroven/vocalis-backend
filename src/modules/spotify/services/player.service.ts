import {
  SpotifyRequestError,
  spotifyFetch,
  spotifySend,
} from '../../auth/services/spotify.service.js';

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function deviceExists(accessToken: string, deviceId: string) {
  const payload = await spotifyFetch<{ devices?: Array<{ id: string | null }> }>(
    accessToken,
    '/me/player/devices',
  );

  return (payload.devices ?? []).some((device) => device.id === deviceId);
}

async function waitForDevice(accessToken: string, deviceId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await deviceExists(accessToken, deviceId)) {
      return;
    }

    await wait(300 * (attempt + 1));
  }
}

async function transferPlayback(accessToken: string, deviceId: string) {
  try {
    await spotifySend(accessToken, '/me/player', {
      method: 'PUT',
      body: {
        device_ids: [deviceId],
        play: false,
      },
    });
  } catch (error) {
    if (!(error instanceof SpotifyRequestError) || error.status !== 404) {
      throw error;
    }
  }
}

export async function startTrackPlayback(
  accessToken: string,
  trackId: string,
  deviceId: string,
) {
  await waitForDevice(accessToken, deviceId);
  await transferPlayback(accessToken, deviceId);
  await wait(250);

  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await spotifySend(accessToken, '/me/player/play', {
        method: 'PUT',
        params: { device_id: deviceId },
        body: {
          uris: [`spotify:track:${trackId}`],
        },
      });
      return;
    } catch (error) {
      lastError = error;
      const missing =
        error instanceof SpotifyRequestError && error.status === 404;

      if (!missing || attempt === 3) {
        throw error;
      }

      await waitForDevice(accessToken, deviceId);
      await transferPlayback(accessToken, deviceId);
      await wait(400 * (attempt + 1));
    }
  }

  throw lastError;
}
