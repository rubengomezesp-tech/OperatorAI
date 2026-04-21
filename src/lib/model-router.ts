import 'server-only';

export type VideoProvider = 'kling-v3' | 'kling-omni' | 'veo';
export type Priority = 'fast' | 'balanced' | 'exact';

export interface RouteDecision {
  provider: VideoProvider;
  model: string;
  mode: 'text_to_video' | 'image_to_video';
  duration: number;
  needsComposition: boolean;
}

export function routeVideoModel(input: {
  refCount: number;
  duration: number;
  priority: Priority;
  hasProduct: boolean;
}): RouteDecision {
  const { refCount, duration, priority } = input;

  // Exact + multiple refs → Kling Omni (best consistency)
  if (priority === 'exact' && refCount > 1) {
    return {
      provider: 'kling-omni',
      model: 'kwaivgi/kling-v3-omni-video',
      mode: 'image_to_video',
      duration: Math.min(duration, 15),
      needsComposition: false,
    };
  }

  // Has reference image → Kling V3 image-to-video
  if (refCount >= 1) {
    return {
      provider: 'kling-v3',
      model: 'kwaivgi/kling-v3-video',
      mode: 'image_to_video',
      duration: Math.min(duration, 15),
      needsComposition: false,
    };
  }

  // No refs → text-to-video with Kling
  return {
    provider: 'kling-v3',
    model: 'kwaivgi/kling-v3-video',
    mode: 'text_to_video',
    duration: Math.min(duration, 15),
    needsComposition: false,
  };
}
