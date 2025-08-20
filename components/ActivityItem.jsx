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
    // Parse session dates and filter to upcoming; treat YYYY-MM-DD as local
    const rawTime = item?.groupDetails?.time;
    const [th, tm] = (rawTime || '').split(':').map(Number);
    const hasGroupTime = Number.isInteger(th) && Number.isInteger(tm);
    const upcoming = item.sessions
      .map(s => {
        const ds = (s && s.date) || s;
        if (!ds || typeof ds !== 'string') return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
          const [y, m, d] = ds.split('-').map(Number);
          if (hasGroupTime) return new Date(y, m - 1, d, th, tm);
          return new Date(y, m - 1, d, 0, 0, 0);
        }
        return new Date(ds);
      })
      .filter(d => d instanceof Date && !isNaN(d) && d > now)
      .sort((a, b) => a - b);
    const next = upcoming.length > 0 ? upcoming[0] : null;
    if (next) {
      const dateStr = next.toLocaleDateString();
      // Use activity's configured time for sessions, format to 12h with AM/PM
      let displayTime = null;
      if (rawTime) {
        const parts = rawTime.split(':');
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
