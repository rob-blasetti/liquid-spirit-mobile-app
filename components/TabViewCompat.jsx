import React from 'react';
import { I18nManager, Platform, StyleSheet, View } from 'react-native';
import { PanResponderAdapter as Pager } from 'react-native-tab-view/lib/module/PanResponderAdapter';
import { SceneView } from 'react-native-tab-view/lib/module/SceneView';

const NativeTabView = Platform.OS === 'ios' ? require('react-native-tab-view').TabView : null;

const renderLazyPlaceholderDefault = () => null;

const AndroidTabView = ({
  onIndexChange,
  onTabSelect,
  navigationState,
  renderScene,
  initialLayout,
  keyboardDismissMode = 'auto',
  lazy = false,
  lazyPreloadDistance = 0,
  onSwipeStart,
  onSwipeEnd,
  renderLazyPlaceholder = renderLazyPlaceholderDefault,
  renderTabBar,
  pagerStyle,
  style,
  direction = I18nManager.getConstants().isRTL ? 'rtl' : 'ltr',
  swipeEnabled = true,
  tabBarPosition = 'top',
  animationEnabled = true,
  overScrollMode,
  options: sceneOptions,
  commonOptions,
}) => {
  const [layout, setLayout] = React.useState({
    width: 0,
    height: 0,
    ...initialLayout,
  });

  const effectiveRenderTabBar = renderTabBar || (() => null);

  const jumpToIndex = index => {
    if (index !== navigationState.index) {
      onIndexChange(index);
    }
  };

  const handleLayout = e => {
    const { height, width } = e.nativeEvent.layout;

    setLayout(prevLayout => {
      if (prevLayout.width === width && prevLayout.height === height) {
        return prevLayout;
      }

      return { height, width };
    });
  };

  const options = Object.fromEntries(
    navigationState.routes.map(route => [
      route.key,
      {
        ...commonOptions,
        ...sceneOptions?.[route.key],
      },
    ])
  );

  return (
    <View onLayout={handleLayout} style={[styles.pager, style]}>
      <Pager
        layout={layout}
        navigationState={navigationState}
        keyboardDismissMode={keyboardDismissMode}
        swipeEnabled={swipeEnabled}
        onSwipeStart={onSwipeStart}
        onSwipeEnd={onSwipeEnd}
        onIndexChange={jumpToIndex}
        onTabSelect={onTabSelect}
        animationEnabled={animationEnabled}
        overScrollMode={overScrollMode}
        style={pagerStyle}
        layoutDirection={direction}
      >
        {({ position, render, addEnterListener, jumpTo }) => {
          const sceneRendererProps = {
            position,
            layout,
            jumpTo,
          };

          return (
            <>
              {tabBarPosition === 'top'
                ? effectiveRenderTabBar({
                    ...sceneRendererProps,
                    options,
                    navigationState,
                  })
                : null}
              {render(
                navigationState.routes.map((route, index) => {
                  const { sceneStyle } = options?.[route.key] ?? {};
                  const shouldLazyLoad = typeof lazy === 'function' ? lazy({ route }) : lazy;

                  return (
                    <SceneView
                      key={route.key}
                      {...sceneRendererProps}
                      addEnterListener={addEnterListener}
                      index={index}
                      lazy={shouldLazyLoad}
                      lazyPreloadDistance={lazyPreloadDistance}
                      navigationState={navigationState}
                      style={sceneStyle}
                    >
                      {({ loading }) =>
                        loading
                          ? renderLazyPlaceholder({ route })
                          : renderScene({
                              ...sceneRendererProps,
                              route,
                            })
                      }
                    </SceneView>
                  );
                })
              )}
              {tabBarPosition === 'bottom'
                ? effectiveRenderTabBar({
                    ...sceneRendererProps,
                    options,
                    navigationState,
                  })
                : null}
            </>
          );
        }}
      </Pager>
    </View>
  );
};

const TabViewCompat = props => {
  if (Platform.OS === 'ios') {
    return <NativeTabView {...props} />;
  }

  return <AndroidTabView {...props} />;
};

export default TabViewCompat;

const styles = StyleSheet.create({
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
});
