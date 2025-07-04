import React from 'react';
import { API_URL } from '../config';
import localImages from '../utils/localImages';
import ListItem from './ListItem';

const ActivityItem = ({ item, onPress, nextUp }) => {
  let imageSource;
  const uri = item.imageUrl;
  if (uri) {
    if (localImages[uri]) {
      imageSource = localImages[uri];
    } else if (!uri.startsWith('http')) {
      imageSource = { uri: `${API_URL}/${uri}` };
    } else {
      imageSource = { uri };
    }
  }
  // Determine next upcoming session from sessions array
  const now = new Date();
  let sessionDisplay = 'Not yet set';
  if (Array.isArray(item.sessions) && item.sessions.length > 0) {
    // Parse session dates and filter to upcoming
    const upcoming = item.sessions
      // sessions array contains objects with a date field
      .map(s => new Date(s.date || s))
      .filter(d => d > now)
      .sort((a, b) => a - b);
    const next = upcoming.length > 0 ? upcoming[0] : null;
    if (next) {
      const dateStr = next.toLocaleDateString();
      // Use activity's configured time for sessions, format to 12h with AM/PM
      const rawGroupTime = item.groupDetails?.time;
      let displayTime = null;
      if (rawGroupTime) {
        const parts = rawGroupTime.split(':');
        if (parts.length >= 2) {
          let h = parseInt(parts[0], 10);
          const m = parts[1].padStart(2, '0');
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          displayTime = `${h}:${m} ${ampm}`;
        }
      }
      sessionDisplay = displayTime
        ? `${displayTime} • ${dateStr}`
        : dateStr;
    }
  }

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title || item.name}
      content={item.description}
      commentCount={sessionDisplay}
      countLabel="Next Session"
      chipText={nextUp ? 'Next Up' : null}
      onPress={onPress}
    />
  );
};

export default ActivityItem;
