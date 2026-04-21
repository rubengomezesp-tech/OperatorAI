import 'server-only';

export type VideoProvider = 'kling-v3' | 'kling-omni';
export type Priority = 'fast' | 'balanced' | 'exact';

export interface RouteDecision {
  provider: VideoProvider;
  model: string;
  mode: 'text_to_video' | 'image_to_video';
  supportsMultiRef: boolean;
  duration: number;
}

export function routeVideoModel(input: {
  refCount: number;
  duration: number;
  priority: Priority;
}): RouteDecision {
  const { refCount, duration, priority } = input;
  const dur = Math.min(Math.max(duration, 3), 15);

  // EXACT mode → Kling Omni (multi-reference, style transfer)
  if (priority === 'exact') {
    return {
      provider: 'kling-omni',
      model: 'kwaivgi/kling-v3-omni-video',
      mode: refCount > 0 ? 'image_to_video' : 'text_to_video',
      supportsMultiRef: true,
      duration: dur,
    };
  }

  // BALANCED + refs → Kling V3 image-to-video
  if (refCount >= 1) {
    return {
      provider: 'kling-v3',
      model: 'kwaivgi/kling-v3-video',
      mode: 'image_to_video',
      supportsMultiRef: false,
      duration: dur,
    };
  }

  // FAST or no refs → Kling V3 text-to-video
  return {
    provider: 'kling-v3',
    model: 'kwaivgi/kling-v3-video',
    mode: 'text_to_video',
    supportsMultiRef: false,
    duration: dur,
  };
}
