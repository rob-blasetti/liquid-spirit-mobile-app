import FastImage from 'react-native-fast-image';
import { Image } from 'react-native';
import { resolveMediaUrl } from './resolveMediaUrl';
import { fetchPostDetails } from '../services/PostService';
import { navigateWithinMainTabs } from './navigateWithTabs';

const aspectCache = new Map();

export const getPostImageAspect = (postId, mediaUrl) => {
  if (postId && aspectCache.has(postId)) return aspectCache.get(postId);
  if (mediaUrl && aspectCache.has(mediaUrl)) return aspectCache.get(mediaUrl);
  return null;
};

export const cachePostImageAspect = (postId, mediaUrl, value) => {
  if (!value) return;
  if (postId) aspectCache.set(postId, value);
  if (mediaUrl) aspectCache.set(mediaUrl, value);
};

/**
 * Navigate to PostDetailCard while priming image cache and fetching latest data.
 */
export const navigateToPostDetail = async ({
  navigation,
  post,
  postId,
  imageAspect,
  token,
  isTokenExpired,
}) => {
  if (!navigation) return;

  const id = post?._id || post?.id || postId;
  if (!post && !id) return;

  const mediaUrl = resolveMediaUrl(post);

  let aspect = imageAspect || post?.imageAspect || getPostImageAspect(id, mediaUrl);

  const resolvedPost = post ? { ...post } : undefined;
  if (resolvedPost && aspect) {
    resolvedPost.imageAspect = aspect;
  }

  if (aspect) {
    cachePostImageAspect(id, mediaUrl, aspect);
  }

  const baseParams = { postId: id };
  if (resolvedPost) baseParams.postPreload = resolvedPost;
  if (aspect) baseParams.imageAspect = aspect;

  if (mediaUrl) {
    try {
      FastImage.preload([{ uri: mediaUrl }]);
    } catch (error) {
      if (__DEV__) console.warn('FastImage preload failed', error);
    }
  }

  const { usedFallback, targetNavigation } = navigateWithinMainTabs({
    navigation,
    tab: 'Feed',
    screen: 'PostDetailCard',
    params: baseParams,
  });

  const resolveAspectAsync = () => {
    if (aspect || !mediaUrl || !targetNavigation) return;
    Image.getSize(
      mediaUrl,
      (width, height) => {
        if (!width || !height) return;
        const ratio = width / height;
        cachePostImageAspect(id, mediaUrl, ratio);
        targetNavigation.navigate({
          name: 'PostDetailCard',
          params: {
            imageAspect: ratio,
            ...(resolvedPost ? { postPreload: { ...resolvedPost, imageAspect: ratio } } : {}),
          },
          merge: true,
        });
      },
      () => {},
    );
  };

  resolveAspectAsync();

  if (!id || !token || (typeof isTokenExpired === 'function' && isTokenExpired(token))) {
    return;
  }

  if (usedFallback || !targetNavigation) {
    return;
  }

  try {
    const detailed = await fetchPostDetails(id, token);
    if (detailed) {
      if ((aspectCache.has(id) || aspectCache.has(mediaUrl)) && !detailed.imageAspect) {
        detailed.imageAspect = getPostImageAspect(id, mediaUrl);
      }
      targetNavigation.navigate({
        name: 'PostDetailCard',
        params: { postPreload: detailed },
        merge: true,
      });
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Prefetch post detail failed', error);
    }
  }
};
