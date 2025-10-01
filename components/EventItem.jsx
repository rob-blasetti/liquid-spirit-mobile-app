import React from 'react';
import resolveImageSource from '../utils/imageSource';
import ListItem from './ListItem';

const EventItem = ({ item, onPress, nextUp }) => {
  const imageSource = resolveImageSource(item.imageUrl, {
    priority: 'high',
    fallback: '/img/events/Event_Placeholder.png',
  });
  // Use the event's startTime first to display correct time, fall back to date if missing
  const rawDate = item.startTime || item.date;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const formattedDate = dateObj ? dateObj.toLocaleDateString() : 'N/A';
  // Format time in the user's local timezone (stored in UTC in DB)
  const formattedTime = dateObj
    ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : undefined;

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title || item.name}
      content={item.description || item.venue}
      date={formattedDate}
      time={formattedTime}
      commentCount={item.attendees?.length ?? 0}
      countLabel="Attendees"
      chipText={nextUp ? 'Next Up' : null}
      onPress={onPress}
    />
  );
};

export default EventItem;
