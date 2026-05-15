/**
 * TracingCanvas Component
 *
 * Renders the drawing area with guide and overlay
 *
 * Vendored from EduApp `frontend/src/ui/metaTemplates/tracing/TracingCanvas.tsx`
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TRACING_CONSTANTS } from './constants';

interface TracingCanvasProps {
  svgPath: string;
  viewBox: string;
  canvasWidth: number;
  canvasHeight: number;
  paths: Array<{ path: string; points: Array<{ x: number; y: number }> }>;
  currentPath: string;
  isCompleted: boolean;
  showGuide: boolean;
  guideOpacity: Animated.Value;
  drawingEnabled: boolean;
  showIncorrect?: boolean;
  strokeColor?: 'default' | 'incorrect' | 'complete';
  shakeAnimation?: Animated.Value;
  onDrawingStart: (event: any) => void;
  onDrawingActive: (event: any) => void;
  onDrawingEnd: () => void;
  validateTouchStart?: (x: number, y: number) => boolean;
}

export function TracingCanvas({
  svgPath,
  viewBox,
  canvasWidth,
  canvasHeight,
  paths,
  currentPath,
  isCompleted: _isCompleted,
  showGuide,
  guideOpacity,
  drawingEnabled,
  showIncorrect = false,
  strokeColor = 'default',
  shakeAnimation,
  onDrawingStart,
  onDrawingActive,
  onDrawingEnd,
  validateTouchStart,
}: TracingCanvasProps) {
  const getStrokeColor = () => {
    if (strokeColor === 'complete') return TRACING_CONSTANTS.STROKE.COLOR_COMPLETE;
    if (strokeColor === 'incorrect') return TRACING_CONSTANTS.STROKE.COLOR_INCORRECT;
    return TRACING_CONSTANTS.STROKE.COLOR;
  };

  const strokeColorValue = getStrokeColor();
  const shakeTransform = shakeAnimation
    ? {
        transform: [{ translateX: shakeAnimation }],
      }
    : {};

  return (
    <Animated.View
      style={[
        styles.canvasContainer,
        {
          backgroundColor: TRACING_CONSTANTS.BACKGROUND.COLOR,
          width: canvasWidth,
          height: canvasHeight,
        },
        shakeTransform,
      ]}
    >
      {showGuide && (
        <Animated.View style={[styles.guideContainer, { opacity: guideOpacity }]}>
          <Svg width={canvasWidth} height={canvasHeight} viewBox={viewBox}>
            <Path
              d={svgPath}
              stroke={TRACING_CONSTANTS.GUIDE.COLOR}
              strokeWidth={TRACING_CONSTANTS.GUIDE.WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      )}

      <View
        style={[styles.drawingCanvas, { width: canvasWidth, height: canvasHeight }]}
        pointerEvents={drawingEnabled ? 'auto' : 'none'}
        onStartShouldSetResponder={evt => {
          if (!drawingEnabled) return false;
          if (validateTouchStart) {
            const { locationX, locationY } = evt.nativeEvent;
            if (
              typeof locationX !== 'number' ||
              typeof locationY !== 'number' ||
              !isFinite(locationX) ||
              !isFinite(locationY) ||
              locationX < 0 ||
              locationX > canvasWidth ||
              locationY < 0 ||
              locationY > canvasHeight
            ) {
              return false;
            }
            return validateTouchStart(locationX, locationY);
          }
          return true;
        }}
        onMoveShouldSetResponder={evt => {
          if (!drawingEnabled) return false;

          const { locationX, locationY } = evt.nativeEvent;
          if (
            typeof locationX !== 'number' ||
            typeof locationY !== 'number' ||
            !isFinite(locationX) ||
            !isFinite(locationY) ||
            locationX < 0 ||
            locationX > canvasWidth ||
            locationY < 0 ||
            locationY > canvasHeight
          ) {
            return false;
          }

          return true;
        }}
        onResponderGrant={evt => {
          if (!drawingEnabled) return;

          const { locationX, locationY } = evt.nativeEvent;
          if (
            typeof locationX !== 'number' ||
            typeof locationY !== 'number' ||
            !isFinite(locationX) ||
            !isFinite(locationY) ||
            locationX < 0 ||
            locationX > canvasWidth ||
            locationY < 0 ||
            locationY > canvasHeight
          ) {
            return;
          }

          onDrawingStart(evt);
        }}
        onResponderMove={drawingEnabled ? onDrawingActive : undefined}
        onResponderRelease={() => {
          if (drawingEnabled) {
            onDrawingEnd();
          }
        }}
        onResponderTerminate={() => {
          if (drawingEnabled) {
            onDrawingEnd();
          }
        }}
        onResponderReject={() => {
          if (drawingEnabled) {
            onDrawingEnd();
          }
        }}
      >
        <Svg width={canvasWidth} height={canvasHeight} viewBox={viewBox}>
          {paths.map((pathItem, index) => (
            <Path
              key={index}
              d={pathItem.path}
              stroke={strokeColorValue}
              strokeWidth={TRACING_CONSTANTS.STROKE.WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={strokeColorValue}
              strokeWidth={TRACING_CONSTANTS.STROKE.WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvasContainer: {
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  guideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawingCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
