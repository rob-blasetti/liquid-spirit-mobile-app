import { getThemeVariables } from '../styles/theme';
import { getColors } from '../styles/colours';

describe('theme support', () => {
  it('returns dark palette when dark scheme is provided', () => {
    const theme = getThemeVariables('dark');
    const colors = getColors('dark');

    expect(theme.screenBackgroundColor).toBe('#121212');
    expect(theme.whiteColor).toBe('#1f1f1f');
    expect(theme.blackColor).toBe('#f1f4ff');
    expect(colors.background).toBe('#0b1220');
    expect(colors.text).toBe('#f8fafc');
  });

  it('returns light palette when light scheme is provided', () => {
    const theme = getThemeVariables('light');
    const colors = getColors('light');

    expect(theme.screenBackgroundColor).toBe('#ffffff');
    expect(theme.whiteColor).toBe('#ffffff');
    expect(theme.blackColor).toBe('#000000');
    expect(colors.background).toBe('#ecf0f1');
    expect(colors.text).toBe('#2c3e50');
  });
});
