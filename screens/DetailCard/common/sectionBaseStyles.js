import themeVariables from '../../../styles/theme';

// Shared base styling for detail card sections across Event, Activity, and Post
const sectionBaseStyles = {
  sectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    color: themeVariables.blackColor,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
};

export default sectionBaseStyles;
