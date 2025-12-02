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
}) => {
  useLayoutEffect(() => {
    if (!navigation) return;
    const headerLeftInset = detailCardHorizontalPadding;
    const headerRightInset = Math.max(detailCardHorizontalPadding - 2, 6);

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
        <HeaderActionGroup style={{ marginRight: -4 }}>
          {showChat && (
            <HeaderActionButton
              icon="chatbubble-ellipses-outline"
              onPress={onChat}
              loading={chatLoading}
              style={{ marginRight: 4 }}
            />
          )}
          <HeaderActionButton icon="share-outline" onPress={onShare} />
        </HeaderActionGroup>
      ),
    });
  }, [navigation, onBack, onShare, onChat, chatLoading, showChat]);
};

export default useDetailCardHeader;
