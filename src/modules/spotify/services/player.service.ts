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
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (await deviceExists(accessToken, deviceId)) {
      return true;
    }

    await wait(250 * (attempt + 1));
  }

  return false;
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

async function playOnDevice(
  accessToken: string,
  trackId: string,
  deviceId: string,
) {
  await spotifySend(accessToken, '/me/player/play', {
    method: 'PUT',
    params: { device_id: deviceId },
    body: {
      uris: [`spotify:track:${trackId}`],
    },
  });
}

export async function startTrackPlayback(
  accessToken: string,
  trackId: string,
  deviceId: string,
) {
  await waitForDevice(accessToken, deviceId);
  await transferPlayback(accessToken, deviceId);
  await wait(200);

  try {
    await playOnDevice(accessToken, trackId, deviceId);
  } catch (error) {
    const missing =
      error instanceof SpotifyRequestError && error.status === 404;

    if (!missing) {
      throw error;
    }

    await wait(400);
    await transferPlayback(accessToken, deviceId);
    await playOnDevice(accessToken, trackId, deviceId);
  }
}
