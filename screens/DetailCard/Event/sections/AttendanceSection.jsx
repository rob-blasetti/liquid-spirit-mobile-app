import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UserBadgeCell from '../../../../components/UserBadgeCell';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../../../../styles/theme';
import DetailSection from '../../common/DetailSection';

const ATTENDEE_PREVIEW_LIMIT = 4;

const AttendanceSection = ({
  attendees = [],
  styles,
  onJoin,
  hasJoined,
  onShowAll,
}) => (
  <DetailSection
    title={`Attendees (${attendees.length})`}
    titleStyle={styles.mapTitle}
    rightContent={
      hasJoined ? (
        <View
          style={[
            styles.attendeesHeaderBadge,
            styles.attendeesHeaderBadgeJoined,
          ]}>
          <Text
            style={[
              styles.attendeesHeaderBadgeText,
              styles.attendeesHeaderBadgeTextJoined,
            ]}>
            You're attending
          </Text>
        </View>
      ) : onJoin ? (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={onJoin}
          activeOpacity={0.8}>
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={themeVariables.whiteColor}
          />
          <Text style={styles.requestButtonText}>Attend</Text>
        </TouchableOpacity>
      ) : null
    }
    bodyStyle={
      attendees.length > 0
        ? styles.attendeesCard
        : styles.attendeesEmptyCard || styles.attendeesCard
    }>
      {hasJoined || attendees.length > 0 ? (
        <Text style={styles.attendeesSummaryText}>
          {hasJoined
            ? attendees.length > 1
              ? `You and ${attendees.length - 1} other${attendees.length - 1 === 1 ? '' : 's'} are attending.`
              : 'You are the first attendee so far.'
            : `${attendees.length} ${attendees.length === 1 ? 'person is' : 'people are'} attending so far.`}
        </Text>
      ) : null}
      <View style={styles.attendeeList}>
        {Array.isArray(attendees) && attendees.length > 0 ? (
          attendees.slice(0, ATTENDEE_PREVIEW_LIMIT).map((a, idx) => (
            <UserBadgeCell
              key={a._id || a.id || a.refId || idx}
              user={a.details || a}
              type={a.details?.type || a.type}
              memberStatus={
                a.details?.memberStatus ||
                a.details?.status ||
                a.memberStatus ||
                a.status
              }
              userCertifications={a.certifications || a.details?.certifications}
              contained
              containerStyle={styles.attendeeItem}
            />
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIconWrap}>
              <Ionicons
                name="people-outline"
                size={22}
                color={themeVariables.primaryColor}
              />
            </View>
            <Text style={styles.emptyStateTitle}>No attendees yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              People who join this event will appear here.
            </Text>
          </View>
        )}
      </View>
      {attendees.length > ATTENDEE_PREVIEW_LIMIT && onShowAll ? (
        <TouchableOpacity
          style={styles.seeMoreTrigger}
          onPress={onShowAll}
          activeOpacity={0.7}>
          <Ionicons
            name="ellipsis-horizontal-circle-outline"
            size={18}
            style={styles.seeMoreTriggerIcon}
          />
          <Text style={styles.seeMoreTriggerText}>See more</Text>
        </TouchableOpacity>
      ) : null}
  </DetailSection>
);

export default AttendanceSection;
