import React, { useLayoutEffect } from 'react';

import { detailCardHorizontalPadding } from './detailCardLayout';
import { HeaderActionButton, HeaderActionGroup } from './HeaderActions';

const useDetailCardHeader = ({
  navigation,
  onBack,
  onShare,
  onChat,
  chatLoading = false,
  showChat = true,
  showShare = true,
}) => {
  useLayoutEffect(() => {
    if (!navigation) return;
    const headerLeftInset = detailCardHorizontalPadding;
    const headerRightInset = Math.max(detailCardHorizontalPadding - 2, 6);

    const hasRightActions = showChat || showShare;

    navigation.setOptions({
      headerLeftContainerStyle: { paddingLeft: headerLeftInset },
      headerRightContainerStyle: { paddingRight: headerRightInset },
      headerLeft: () => (
        <HeaderActionButton
          icon="chevron-back"
          onPress={onBack}
          style={{ marginLeft: -4 }}
        />
      ),
      headerRight: () => (
        hasRightActions ? (
          <HeaderActionGroup style={{ marginRight: -4 }}>
            {showChat && (
              <HeaderActionButton
                icon="chatbubble-ellipses-outline"
                onPress={onChat}
                loading={chatLoading}
                style={{ marginRight: 4 }}
              />
            )}
            {showShare && <HeaderActionButton icon="share-outline" onPress={onShare} />}
          </HeaderActionGroup>
        ) : null
      ),
    });
  }, [navigation, onBack, onShare, onChat, chatLoading, showChat, showShare]);
};

export default useDetailCardHeader;
