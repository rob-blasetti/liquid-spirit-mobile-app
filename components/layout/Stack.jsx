import React from 'react';
import { View } from 'react-native';

const buildSpacedChildren = (children, gap, isRow) => {
  const items = React.Children.toArray(children);
  return items.map((child, index) => {
    if (!React.isValidElement(child)) return child;
    const spacerStyle = isRow
      ? { marginLeft: index === 0 ? 0 : gap }
      : { marginTop: index === 0 ? 0 : gap };
    return React.cloneElement(child, {
      style: [child.props?.style, spacerStyle],
    });
  });
};

export const Stack = ({
  direction = 'column',
  gap = 0,
  align = 'stretch',
  justify = 'flex-start',
  wrap = false,
  style,
  children,
}) => {
  const isRow = direction === 'row';
  const spacedChildren = gap ? buildSpacedChildren(children, gap, isRow) : children;

  return (
    <View
      style={[
        {
          flexDirection: direction,
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {spacedChildren}
    </View>
  );
};

export const Row = (props) => <Stack direction="row" {...props} />;

export default Stack;

