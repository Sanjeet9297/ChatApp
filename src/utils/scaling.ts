import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Guideline sizes are based on standard ~5" screen mobile device
 */
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Used for padding, margin, width, etc.
 * @param size size in pixels
 * @returns scaled size based on screen width
 */
const horizontalScale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * Used for height, icon size, etc.
 * @param size size in pixels
 * @returns scaled size based on screen height
 */
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * Used for font-size, border-radius, etc.
 * @param size size in pixels
 * @param factor resize factor (default 0.5)
 * @returns moderately scaled size
 */
const moderateScale = (size: number, factor = 0.5) => size + (horizontalScale(size) - size) * factor;

export { horizontalScale, verticalScale, moderateScale };
